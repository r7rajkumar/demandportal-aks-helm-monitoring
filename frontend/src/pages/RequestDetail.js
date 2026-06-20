import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [approverName, setApproverName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/requests/${id}`)
      .then(r => { setReq(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAction = async (status) => {
    if (!approverName) { alert('Please enter your name as approver'); return; }
    setActionLoading(true);
    try {
      await axios.put(`${API}/api/requests/${id}`, { status, approved_by: approverName, notes });
      setReq({ ...req, status, approved_by: approverName, notes });
      setSuccess(`Request ${status} successfully`);
    } catch {
      alert('Action failed. Please try again.');
    }
    setActionLoading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!req) return <div className="loading">Request not found</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/requests" className="btn btn-outline btn-sm">← Back</Link>
          <h1 className="page-title">{req.title}</h1>
          <span className={`badge badge-${req.status}`}>{req.status}</span>
        </div>
        <p className="page-sub">Request ID: {req.id}</p>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}

      <div className="detail-grid">
        <div>
          <div className="card">
            <h2 className="card-title">Request Details</h2>
            {[
              ['Resource Type', <span className="resource-tag">{req.resource_type}</span>],
              ['Description', req.description || '—'],
              ['Requester', req.requester_name],
              ['Email', req.requester_email],
              ['Submitted', new Date(req.created_at).toLocaleString()],
              ['Last Updated', new Date(req.updated_at).toLocaleString()],
              req.approved_by && ['Actioned By', req.approved_by],
              req.notes && ['Notes', req.notes],
            ].filter(Boolean).map(([label, value]) => (
              <div className="detail-row" key={label}>
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {req.status === 'pending' && (
            <div className="card">
              <h2 className="card-title">Take Action</h2>
              <div className="form-group">
                <label className="form-label">Your Name (Approver) *</label>
                <input className="form-input" value={approverName}
                  onChange={e => setApproverName(e.target.value)} placeholder="Admin name" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add approval notes or reason for rejection..."
                  style={{ minHeight: 80 }} />
              </div>
              <div className="action-buttons">
                <button className="btn btn-success" onClick={() => handleAction('approved')} disabled={actionLoading}>
                  ✓ Approve
                </button>
                <button className="btn btn-danger" onClick={() => handleAction('rejected')} disabled={actionLoading}>
                  ✗ Reject
                </button>
              </div>
            </div>
          )}

          {req.status !== 'pending' && (
            <div className="card">
              <h2 className="card-title">Status</h2>
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                  {req.status === 'approved' ? '✅' : '❌'}
                </div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{req.status}</div>
                {req.approved_by && <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>by {req.approved_by}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
