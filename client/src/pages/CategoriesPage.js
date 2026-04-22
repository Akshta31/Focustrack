import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import styles from './CategoriesPage.module.css';

const DEFAULT_CATEGORIES = [
  { domain: 'github.com', category: 'productive', label: 'Software Development' },
  { domain: 'stackoverflow.com', category: 'productive', label: 'Software Development' },
  { domain: 'figma.com', category: 'productive', label: 'Design Tools' },
  { domain: 'notion.so', category: 'productive', label: 'Productivity' },
  { domain: 'youtube.com', category: 'unproductive', label: 'Entertainment' },
  { domain: 'twitter.com', category: 'unproductive', label: 'Social Media' },
  { domain: 'instagram.com', category: 'unproductive', label: 'Social Media' },
  { domain: 'netflix.com', category: 'unproductive', label: 'Entertainment' },
  { domain: 'mail.google.com', category: 'neutral', label: 'Communication' },
  { domain: 'slack.com', category: 'neutral', label: 'Communication' },
];

const CATEGORY_LABELS = ['Software Development', 'Design Tools', 'Productivity', 'Learning', 'Communication', 'Social Media', 'Entertainment', 'News', 'Shopping', 'Other'];

export default function CategoriesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ domain: '', category: 'productive', label: 'Software Development' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/categories')
      .then(res => setRules(res.data.rules || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.domain.trim()) { setError('Domain is required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/categories', form);
      setRules(r => {
        const existing = r.findIndex(x => x.domain === res.data.rule.domain);
        if (existing >= 0) { const updated = [...r]; updated[existing] = res.data.rule; return updated; }
        return [res.data.rule, ...r];
      });
      setSuccess(`Rule saved for ${form.domain}`);
      setForm(f => ({ ...f, domain: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setRules(r => r.filter(x => x._id !== id));
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  const applyDefault = async (def) => {
    setForm({ domain: def.domain, category: def.category, label: def.label });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Website Categories</h1>
        <p className={styles.sub}>Customize how websites are classified for your productivity tracking</p>
      </div>

      <div className={styles.grid}>
        {/* Add Rule Form */}
        <div className={styles.formCard}>
          <h2>Add Custom Rule</h2>
          <p className={styles.formSub}>Override the default classification for any website</p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.field}>
              <label>Domain</label>
              <input
                type="text"
                placeholder="e.g. reddit.com"
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value.toLowerCase().trim() }))}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <div className={styles.catButtons}>
                {['productive', 'neutral', 'unproductive'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.catBtn} ${form.category === cat ? styles[`active_${cat}`] : ''}`}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                  >
                    {cat === 'productive' ? '✓ Productive' : cat === 'unproductive' ? '✗ Distracting' : '○ Neutral'}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label>Label</label>
              <select
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className={styles.input}
              >
                {CATEGORY_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Saving…' : '+ Add Rule'}
            </button>
          </form>

          <div className={styles.quickAdd}>
            <p className={styles.quickLabel}>Quick-add common sites:</p>
            <div className={styles.quickList}>
              {DEFAULT_CATEGORIES.map(d => (
                <button key={d.domain} className={styles.quickBtn} onClick={() => applyDefault(d)}>
                  {d.domain}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rules List */}
        <div className={styles.rulesCard}>
          <div className={styles.rulesHeader}>
            <h2>Your Custom Rules</h2>
            <span className={styles.count}>{rules.length} rules</span>
          </div>

          {loading ? (
            <div className={styles.loadWrap}><div className={styles.spinner} /></div>
          ) : rules.length === 0 ? (
            <div className={styles.empty}>
              <p>No custom rules yet.</p>
              <p>Add rules to override the default classification of websites.</p>
            </div>
          ) : (
            <div className={styles.rulesList}>
              {rules.map(rule => (
                <div key={rule._id} className={styles.ruleRow}>
                  <div className={styles.ruleDomain}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${rule.domain}&sz=32`}
                      alt=""
                      className={styles.favicon}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <span className={styles.ruleDomainText}>{rule.domain}</span>
                      <span className={styles.ruleLabel}>{rule.label}</span>
                    </div>
                  </div>
                  <span className={`${styles.catChip} ${styles[rule.category]}`}>
                    {rule.category}
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(rule._id)}
                    title="Remove rule"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Default Rules Reference */}
      <div className={styles.defaultCard}>
        <h2>Default Classifications</h2>
        <p className={styles.formSub}>These are the built-in classifications. Add a custom rule above to override any of them.</p>
        <div className={styles.defaultGrid}>
          {DEFAULT_CATEGORIES.map(d => (
            <div key={d.domain} className={styles.defaultRow}>
              <img src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=32`} alt="" className={styles.favicon}
                onError={e => { e.target.style.display = 'none'; }} />
              <span className={styles.defaultDomain}>{d.domain}</span>
              <span className={`${styles.catChip} ${styles[d.category]}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
