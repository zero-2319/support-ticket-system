import React, { useState, useRef } from 'react';
import { createTicket, classifyTicket } from '../api';

const CATEGORIES = ['billing', 'technical', 'account', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function TicketForm({ onTicketCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const classifyTimeout = useRef(null);

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    setClassified(false);

    if (classifyTimeout.current) clearTimeout(classifyTimeout.current);

    if (val.trim().length > 20) {
      classifyTimeout.current = setTimeout(async () => {
        setClassifying(true);
        try {
          const result = await classifyTicket(val);
          if (result && result.suggested_category && result.suggested_priority) {
            setCategory(result.suggested_category);
            setPriority(result.suggested_priority);
            setClassified(true);
          }
        } catch {
          // Silently fail
        } finally {
          setClassifying(false);
        }
      }, 800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const ticket = await createTicket({ title, description, category, priority });
      setSuccess('Ticket submitted successfully!');
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      setClassified(false);
      onTicketCreated(ticket);
    } catch (err) {
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>Submit a Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            required
            placeholder="Brief summary of the issue"
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            required
            rows={4}
            placeholder="Describe your issue in detail..."
          />
          {classifying && <div className="hint classifying">🤖 AI is classifying your ticket...</div>}
          {classified && !classifying && <div className="hint classified">✅ AI suggested category and priority below</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category {classified && <span className="ai-tag">AI suggested</span>}</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority {classified && <span className="ai-tag">AI suggested</span>}</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
