import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const RESOURCE_TYPES = ['EC2 Instance', 'S3 Bucket', 'RDS Database', 'IAM Role', 'VPC', 'Lambda Function', 'Other'];

export default function NewRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', resource_type: '', requester_name: '', requester_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.resource_type || !form.requester_name || !form.requester_email) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/requests`, form);
      navigate(`/requests/${res.data.id}`);
    } catch {
      setError('Failed to submit request. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Infrastructure Request</h1>
        <p className="page-sub">Submit a request for cloud infrastructure provisioning</p>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Request Title *</label>
            <input className="form-input" name="title" value={form.title}
              onChange={handleChange} placeholder="e.g. Production EC2 for API Server" />
          </div>

          <div className="form-group">
            <label className="form-label">Resource Type *</label>
            <select className="form-select" name="resource_type" value={form.resource_type} onChange={handleChange}>
              <option value="">Select resource type...</option>
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" value={form.description}
              onChange={handleChange} placeholder="Describe the purpose, specifications, and any requirements..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input className="form-input" name="requester_name" value={form.requester_name}
                onChange={handleChange} placeholder="John Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Your Email *</label>
              <input className="form-input" type="email" name="requester_email" value={form.requester_email}
                onChange={handleChange} placeholder="john@company.com" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : '✓ Submit Request'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
