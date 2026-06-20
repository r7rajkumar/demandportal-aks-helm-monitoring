import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/stats`),
      axios.get(`${API}/api/requests`)
    ]).then(([s, r]) => {
      setStats(s.data);
      setRecent(r.data.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Overview of all infrastructure requests</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{stats.total || 0}</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending || 0}</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{stats.approved || 0}</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats.rejected || 0}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Recent Requests</h2>
          <Link to="/new" className="btn btn-primary btn-sm">+ New Request</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No requests yet. <Link to="/new">Create your first request</Link></div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Resource Type</th>
                  <th>Requester</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td><Link to={`/requests/${r.id}`} className="table-link">{r.title}</Link></td>
                    <td><span className="resource-tag">{r.resource_type}</span></td>
                    <td>{r.requester_name}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {recent.length > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Link to="/requests" className="btn btn-outline btn-sm">View All Requests →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
