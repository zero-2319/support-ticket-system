import React, { useState, useEffect, useCallback } from 'react';
import { fetchTickets, updateTicket } from '../api';

const CATEGORIES = ['', 'billing', 'technical', 'account', 'general'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'];
const STATUS_FLOW = ['open', 'in_progress', 'resolved', 'closed'];

const PRIORITY_COLORS = {
  low: '#6c757d',
  medium: '#0d6efd',
  high: '#fd7e14',
  critical: '#dc3545',
};

const STATUS_COLORS = {
  open: '#198754',
  in_progress: '#0d6efd',
  resolved: '#6c757d',
  closed: '#212529',
};

function truncate(str, n = 120) {
  return str.length > n ? str.slice(0, n) + '...' : str;
}

export default function TicketList({ refreshTrigger }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const searchTimeout = React.useRef(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const data = await fetchTickets(params);
      setTickets(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets, refreshTrigger]);

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val }));
    }, 400);
  };

  const handleStatusChange = async (ticket, newStatus) => {
    try {
      const updated = await updateTicket(ticket.id, { status: newStatus });
      setTickets(ts => ts.map(t => t.id === updated.id ? updated : t));
    } catch {
      // ignore
    }
  };

  const nextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  return (
    <div className="card">
      <h2>All Tickets</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search title or description..."
          value={searchInput}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.filter(Boolean).map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty">No tickets found.</div>
      ) : (
        <div className="ticket-list">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-item">
              <div className="ticket-header">
                <span className="ticket-title">{ticket.title}</span>
                <span className="ticket-id">#{ticket.id}</span>
              </div>
              <div className="ticket-description">{truncate(ticket.description)}</div>
              <div className="ticket-meta">
                <span className="badge" style={{ background: PRIORITY_COLORS[ticket.priority] }}>
                  {ticket.priority}
                </span>
                <span className="badge badge-outline">{ticket.category}</span>
                <span className="badge" style={{ background: STATUS_COLORS[ticket.status] }}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="ticket-date">{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
              {nextStatus(ticket.status) && (
                <div className="ticket-actions">
                  <button
                    className="btn-small"
                    onClick={() => handleStatusChange(ticket, nextStatus(ticket.status))}
                  >
                    Mark as {nextStatus(ticket.status).replace('_', ' ')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
