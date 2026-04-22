import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <ClockIcon />
          <span>FocusTrack</span>
        </div>
        <div className={styles.hero}>
          <h1>Start understanding<br />your habits today.</h1>
          <p>Join thousands of professionals using FocusTrack to build better digital habits.</p>
        </div>
        <ul className={styles.features}>
          <li><span className={styles.check}>✓</span> Real-time tab monitoring</li>
          <li><span className={styles.check}>✓</span> Automatic site classification</li>
          <li><span className={styles.check}>✓</span> Weekly productivity reports</li>
          <li><span className={styles.check}>✓</span> Custom category rules</li>
        </ul>
      </div>
      <div className={styles.right}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h2>Create account</h2>
          <p className={styles.sub}>Free forever, no credit card needed</p>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Sarah Jenkins"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <span className={styles.btnSpinner} /> : 'Create Account'}
          </button>
          <p className={styles.switchLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
