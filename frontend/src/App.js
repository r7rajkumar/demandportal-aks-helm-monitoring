import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import RequestList from './pages/RequestList';
import RequestDetail from './pages/RequestDetail';
import './App.css';

function Nav() {
  const location = useLocation();
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/requests', label: 'All Requests' },
    { to: '/new', label: '+ New Request' },
  ];
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">☁</span>
        <span className="brand-name">CloudRequest</span>
        <span className="brand-sub">Infrastructure Portal</span>
      </div>
      <div className="nav-links">
        {links.map(l => (
          <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app">
        <Nav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/requests" element={<RequestList />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/new" element={<NewRequest />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>CloudRequest — Self-Service Infrastructure Portal © 2024</p>
        </footer>
      </div>
    </Router>
  );
}
