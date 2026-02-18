from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from .models import Ticket
from .serializers import TicketSerializer
import os
import json


@api_view(['GET', 'POST'])
def ticket_list_create(request):
    if request.method == 'GET':
        queryset = Ticket.objects.all()

        category = request.query_params.get('category')
        priority = request.query_params.get('priority')
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
def ticket_detail(request, pk):
    try:
        ticket = Ticket.objects.get(pk=pk)
    except Ticket.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = TicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def ticket_stats(request):
    from django.db.models import Count, FloatField, ExpressionWrapper
    from django.db.models.functions import TruncDate

    total = Ticket.objects.count()
    open_tickets = Ticket.objects.filter(status='open').count()

    # Avg tickets per day using DB aggregation
    daily_counts = (
        Ticket.objects
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .aggregate(
            total_days=Count('date'),
            total_counted=Count('id')
        )
    )
    total_days = daily_counts['total_days'] or 1
    avg_per_day = round(total / total_days, 1) if total else 0.0

    priority_qs = Ticket.objects.values('priority').annotate(count=Count('id'))
    priority_breakdown = {p: 0 for p in ['low', 'medium', 'high', 'critical']}
    for item in priority_qs:
        priority_breakdown[item['priority']] = item['count']

    category_qs = Ticket.objects.values('category').annotate(count=Count('id'))
    category_breakdown = {c: 0 for c in ['billing', 'technical', 'account', 'general']}
    for item in category_qs:
        category_breakdown[item['category']] = item['count']

    return Response({
        'total_tickets': total,
        'open_tickets': open_tickets,
        'avg_tickets_per_day': avg_per_day,
        'priority_breakdown': priority_breakdown,
        'category_breakdown': category_breakdown,
    })


@api_view(['POST'])
def classify_ticket(request):
    description = request.data.get('description', '').strip()
    if not description:
        return Response({'error': 'description is required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    print(f"DEBUG: API_KEY exists: {bool(api_key)}")
    print(f"DEBUG: API_KEY length: {len(api_key)}")
    if not api_key:
        print("DEBUG: No API key, returning defaults")
        return Response({
            'suggested_category': 'general',
            'suggested_priority': 'medium',
            'warning': 'LLM not configured, using defaults',
        })

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        prompt = """You are a support ticket classification assistant. Given a support ticket description, you must return ONLY a JSON object with two fields:
- "suggested_category": one of exactly ["billing", "technical", "account", "general"]
- "suggested_priority": one of exactly ["low", "medium", "high", "critical"]

Classification guidelines:
- billing: payment issues, invoice questions, subscription management, refunds
- technical: bugs, errors, performance issues, feature not working, integration problems
- account: login issues, password reset, profile settings, permissions, access
- general: general questions, feature requests, feedback, anything else

Priority guidelines:
- critical: system down, data loss, security breach, complete inability to use service
- high: major feature broken, significant business impact, many users affected
- medium: partial functionality issue, workaround exists, moderate impact
- low: minor inconvenience, cosmetic issue, general question, feature request

Respond ONLY with valid JSON, no explanation, no markdown, no code fences."""

        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=100,
            system=prompt,
            messages=[
                {'role': 'user', 'content': f'Classify this support ticket:\n\n{description}'}
            ],
        )

        content = response.content[0].text.strip()
        if content.startswith('```'):
            content = content.split('\n', 1)[-1]
            content = content.rsplit('```', 1)[0]

        result = json.loads(content)
        suggested_category = result.get('suggested_category', 'general')
        suggested_priority = result.get('suggested_priority', 'medium')

        if suggested_category not in ['billing', 'technical', 'account', 'general']:
            suggested_category = 'general'
        if suggested_priority not in ['low', 'medium', 'high', 'critical']:
            suggested_priority = 'medium'

        return Response({
            'suggested_category': suggested_category,
            'suggested_priority': suggested_priority,
        })

    except Exception as e:
        print(f"DEBUG: Exception in classify_ticket: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'suggested_category': 'general',
            'suggested_priority': 'medium',
            'warning': 'LLM classification unavailable, using defaults',
        })