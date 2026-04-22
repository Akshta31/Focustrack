import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    productivityGoal: user?.productivityGoal || 6,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(''); setError('');
    try {
      await updateUser(form);
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Settings</h1>
        <p className={styles.sub}>Manage your account and preferences</p>
      </div>

      <div className={styles.grid}>
        {/* Profile */}
        <section className={styles.card}>
          <h2>Profile</h2>
          <p className={styles.cardSub}>Your personal information</p>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.avatarRow}>
              <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div className={styles.avatarName}>{user?.name}</div>
                <div className={styles.avatarEmail}>{user?.email}</div>
              </div>
            </div>
            <div className={styles.field}>
              <label>Display Name</label>
              <input
                className={styles.input} type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input className={styles.input} type="email" value={user?.email} disabled />
            </div>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Productivity Goal */}
        <section className={styles.card}>
          <h2>Productivity Goal</h2>
          <p className={styles.cardSub}>Set your daily productive hours target</p>
          <div className={styles.goalSection}>
            <div className={styles.goalDisplay}>
              <span className={styles.goalNumber}>{form.productivityGoal}</span>
              <span className={styles.goalUnit}>hours/day</span>
            </div>
            <input
              type="range" min="1" max="14" step="0.5"
              value={form.productivityGoal}
              onChange={e => setForm(f => ({ ...f, productivityGoal: parseFloat(e.target.value) }))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>1h</span><span>7h</span><span>14h</span>
            </div>
            <div className={styles.goalHints}>
              {[3, 6, 8, 10].map(g => (
                <button key={g} className={`${styles.goalPreset} ${form.productivityGoal === g ? styles.goalPresetActive : ''}`}
                  type="button" onClick={() => setForm(f => ({ ...f, productivityGoal: g }))}>
                  {g}h
                </button>
              ))}
            </div>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Update Goal'}
            </button>
          </div>
        </section>

        {/* Extension Info */}
        <section className={styles.card}>
          <h2>Chrome Extension</h2>
          <p className={styles.cardSub}>Connection status and extension settings</p>
          <div className={styles.extStatus}>
            <div className={styles.extRow}>
              <span className={styles.extDot} />
              <div>
                <div className={styles.extLabel}>Extension Status</div>
                <div className={styles.extValue}>Active & Tracking</div>
              </div>
            </div>
          </div>
          <div className={styles.infoBox}>
            <p><strong>To install the extension:</strong></p>
            <ol>
              <li>Open Chrome and go to <code>chrome://extensions</code></li>
              <li>Enable "Developer mode" (top right toggle)</li>
              <li>Click "Load unpacked" and select the <code>extension/</code> folder</li>
              <li>The FocusTrack icon will appear in your toolbar</li>
            </ol>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className={styles.card}>
          <h2>Data & Privacy</h2>
          <p className={styles.cardSub}>Manage your data</p>
          <div className={styles.dataActions}>
            <div className={styles.dataRow}>
              <div>
                <div className={styles.dataLabel}>Export Your Data</div>
                <div className={styles.dataSub}>Download all your activity data as JSON</div>
              </div>
              <button className={styles.outlineBtn}>Export</button>
            </div>
            <div className={styles.dataRow}>
              <div>
                <div className={styles.dataLabel}>Member Since</div>
                <div className={styles.dataSub}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
