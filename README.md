# 🎫 Support Ticket System

A full-stack support ticket management system with AI-powered auto-categorization using Anthropic Claude.

---

## ✨ Features

- **AI Classification** — Claude automatically suggests category and priority as you type
- **Full CRUD** — Create, view, filter, search, and update tickets
- **Stats Dashboard** — Live metrics with priority and category breakdowns
- **Graceful Degradation** — Works fully even without an API key
- **One-command setup** — Fully containerized with Docker

---

## 🚀 Quick Start

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DJANGO_SECRET_KEY=any-random-string-here
DEBUG=1
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com)

### 3. Run
```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 15 |
| Frontend | React 18 (hooks + functional components) |
| AI | Anthropic Claude (`claude-haiku-4-5-20251001`) |
| Infrastructure | Docker + Docker Compose |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets/` | Create a ticket |
| `GET` | `/api/tickets/` | List all tickets |
| `PATCH` | `/api/tickets/<id>/` | Update a ticket |
| `GET` | `/api/tickets/stats/` | Aggregated statistics |
| `POST` | `/api/tickets/classify/` | AI classification |

### Filters (combinable)
```
GET /api/tickets/?category=billing&priority=high&status=open&search=login
```

---

## 🤖 LLM Integration

Claude classifies tickets into:

**Categories:** `billing` · `technical` · `account` · `general`

**Priorities:** `low` · `medium` · `high` · `critical`

### Why Claude?
- Reliable structured JSON output with zero post-processing needed
- Strong instruction-following — stays within defined categories
- Fast response times suitable for real-time suggestions
- Graceful fallback — if unavailable, defaults to `general` / `medium`

---

## 🏗 Architecture & Design Decisions

### Backend
- **DB-level constraints** — `CheckConstraint` on category, priority, status fields
- **ORM aggregation** — Stats endpoint uses `annotate()` + `aggregate()`, no Python loops
- **Isolated LLM logic** — Classification in its own endpoint, swappable without touching business logic
- **Auto-migrations** — `entrypoint.sh` runs `migrate` before server starts

### Frontend
- **Centralized API layer** — All fetch calls in `api.js`
- **Debounced classification** — 800ms debounce on description input
- **Optimistic UI** — Ticket list updates without page reload
- **Auto-refresh** — Dashboard refreshes after every new ticket

### Infrastructure
- Services start in dependency order: `db` → `backend` → `frontend`
- All secrets via environment variables — nothing hardcoded
- Single command brings up the entire stack

---

## 🗂 Project Structure

```
support-ticket-system/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh        # Auto-runs migrations
│   ├── requirements.txt
│   ├── config/              # Django settings, URLs
│   └── tickets/
│       ├── models.py        # Ticket model + DB constraints
│       ├── serializers.py
│       ├── views.py         # All endpoints + LLM classify
│       ├── urls.py
│       └── migrations/
└── frontend/
    ├── Dockerfile
    └── src/
        ├── api.js           # Centralized API calls
        ├── App.js
        └── components/
            ├── TicketForm.js      # Submit + AI suggestions
            ├── TicketList.js      # Filter, search, status update
            └── StatsDashboard.js  # Metrics + charts
```

---

## 🛑 Stopping

```bash
# Stop containers
docker-compose down

# Stop and wipe database
docker-compose down -v
```