import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDuration, getDomainFavicon } from '../utils/format';
import styles from './ActivityLogPage.module.css';

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    setLoading(true);
    api.get(`/activity/range?start=${dateRange.start}&end=${dateRange.end}`)
      .then(res => setActivities(res.data.activities || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateRange]);

  const filtered = activities.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (search && !a.domain.toLowerCase().includes(search.toLowerCase()) &&
        !(a.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc, act) => {
    const date = new Date(act.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(act);
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Activity Log</h1>
        <p className={styles.sub}>Detailed record of your browsing activity</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search websites or page titles…"
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filterTabs}>
          {['all', 'productive', 'unproductive', 'neutral'].map(f => (
            <button
              key={f}
              className={`${styles.tab} ${filter === f ? styles.activeTab : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.dateRange}>
          <input type="date" className={styles.dateInput} value={dateRange.start}
            onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))} />
          <span>–</span>
          <input type="date" className={styles.dateInput} value={dateRange.end}
            onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))} />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadWrap}><div className={styles.spinner} /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className={styles.empty}>No activity found for the selected range and filters.</div>
      ) : (
        Object.entries(grouped).map(([date, acts]) => (
          <div key={date} className={styles.dayGroup}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>{date}</span>
              <span className={styles.dayTotal}>{formatDuration(acts.reduce((s, a) => s + a.duration, 0))}</span>
            </div>
            <div className={styles.actList}>
              {acts.map(act => (
                <ActivityRow key={act._id} act={act} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ActivityRow({ act }) {
  return (
    <div className={styles.actRow}>
      <img src={getDomainFavicon(act.domain)} alt="" className={styles.favicon}
        onError={e => { e.target.style.display = 'none'; }} />
      <div className={styles.actInfo}>
        <span className={styles.actDomain}>{act.domain}</span>
        {act.title && <span className={styles.actTitle}>{act.title}</span>}
      </div>
      <span className={`${styles.catChip} ${styles[act.category]}`}>{act.categoryLabel}</span>
      <span className={styles.actTime}>
        {new Date(act.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className={styles.actDuration}>{formatDuration(act.duration)}</span>
    </div>
  );
}
