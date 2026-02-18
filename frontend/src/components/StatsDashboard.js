import React, { useState, useEffect } from 'react';
import { fetchStats } from '../api';

export default function StatsDashboard({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) return <div className="card"><div className="loading">Loading stats...</div></div>;
  if (!stats) return null;

  const priorityColors = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };
  const categoryIcons = { billing: '💳', technical: '🔧', account: '👤', general: '📋' };

  return (
    <div className="card stats-card">
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-value">{stats.total_tickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#198754' }}>{stats.open_tickets}</div>
          <div className="stat-label">Open Tickets</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.avg_tickets_per_day}</div>
          <div className="stat-label">Avg / Day</div>
        </div>
      </div>

      <div className="breakdown-section">
        <h3>Priority Breakdown</h3>
        <div className="breakdown-list">
          {Object.entries(stats.priority_breakdown).map(([key, val]) => (
            <div key={key} className="breakdown-item">
              <span className="badge" style={{ background: priorityColors[key] }}>{key}</span>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: stats.total_tickets ? `${(val / stats.total_tickets) * 100}%` : '0%',
                    background: priorityColors[key],
                  }}
                />
              </div>
              <span className="breakdown-count">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="breakdown-section">
        <h3>Category Breakdown</h3>
        <div className="breakdown-list">
          {Object.entries(stats.category_breakdown).map(([key, val]) => (
            <div key={key} className="breakdown-item">
              <span className="breakdown-label">{categoryIcons[key]} {key}</span>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: stats.total_tickets ? `${(val / stats.total_tickets) * 100}%` : '0%',
                    background: '#0d6efd',
                  }}
                />
              </div>
              <span className="breakdown-count">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
