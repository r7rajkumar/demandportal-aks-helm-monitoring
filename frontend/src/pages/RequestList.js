import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function RequestList() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = filter === 'all' ? `${API}/api/requests` : `${API}/api/requests?status=${filter}`;
    axios.get(url).then(r => { setRequests(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">All Requests</h1>
          <p className="page-sub">{requests.length} request{requests.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/new" className="btn btn-primary">+ New Request</Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No {filter !== 'all' ? filter : ''} requests found</div>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td><Link to={`/requests/${r.id}`} className="table-link">{r.title}</Link></td>
                    <td><span className="resource-tag">{r.resource_type}</span></td>
                    <td>
                      <div>{r.requester_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.requester_email}</div>
                    </td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td><Link to={`/requests/${r.id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
