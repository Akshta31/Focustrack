import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
          <h1>Track your focus,<br />own your time.</h1>
          <p>Real-time productivity analytics that help you understand where your hours actually go.</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}><span className={styles.big}>78%</span><span>avg productivity score</span></div>
          <div className={styles.statItem}><span className={styles.big}>2.4x</span><span>focus improvement</span></div>
        </div>
      </div>
      <div className={styles.right}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className={styles.sub}>Sign in to your account</p>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <span className={styles.btnSpinner} /> : 'Sign In'}
          </button>
          <p className={styles.switchLink}>
            Don't have an account? <Link to="/register">Create one</Link>
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
