import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../utils/api';
import { formatDuration, secsToHours, shortDay, getDomainFavicon, getWeekStart } from '../utils/format';
import styles from './DashboardPage.module.css';

const CATEGORY_COLORS = {
  productive: '#00d4aa',
  unproductive: '#ff5252',
  neutral: '#636b88',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [catData, setCatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart] = useState(getWeekStart());

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, catRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/categories')
      ]);
      setData(dashRes.data);
      setCatData(catRes.data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <p>Loading your analytics…</p>
      </div>
    );
  }

  const current = data?.current || {};
  const previous = data?.previous || {};
  const topSites = data?.topWebsites || [];
  const daily = current.dailyBreakdown || [];

  const chartData = daily.map(d => ({
    day: shortDay(d.date),
    Productive: parseFloat(secsToHours(d.productive).toFixed(2)),
    Distracting: parseFloat(secsToHours(d.unproductive).toFixed(2)),
    Neutral: parseFloat(secsToHours(d.neutral).toFixed(2)),
  }));

  const scoreDiff = current.productivityScore - (previous.productivityScore || 0);
  const totalDiff = (current.totalDuration || 0) - (previous.totalDuration || 0);
  const prodDiff = (current.productiveDuration || 0) - (previous.productiveDuration || 0);
  const unprodDiff = (current.unproductiveDuration || 0) - (previous.unproductiveDuration || 0);

  const maxCatDuration = catData[0]?.duration || 1;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Weekly Productivity</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateBadge}>
            <CalIcon />
            <span>{formatWeekRange(weekStart)}</span>
          </div>
          <button className={styles.exportBtn} onClick={() => exportReport(data, catData)}>
            <DownloadIcon /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          icon={<TargetIcon />}
          label="Productivity Score"
          value={`${current.productivityScore || 0}%`}
          diff={scoreDiff}
          diffLabel="from last week"
          positive={scoreDiff > 0}
        />
        <KpiCard
          icon={<ClockIcon />}
          label="Total Tracked Time"
          value={formatDuration(current.totalDuration || 0)}
          diff={totalDiff}
          diffLabel={Math.abs(totalDiff) < 600 ? 'Consistent with average' : null}
          positive={totalDiff > 0}
          isTime
        />
        <KpiCard
          icon={<BriefIcon />}
          label="Productive Time"
          value={formatDuration(current.productiveDuration || 0)}
          diff={prodDiff}
          diffLabel="from last week"
          positive={prodDiff > 0}
          isTime
          accent="productive"
        />
        <KpiCard
          icon={<PhoneIcon />}
          label="Unproductive Time"
          value={formatDuration(current.unproductiveDuration || 0)}
          diff={unprodDiff}
          diffLabel="from last week"
          positive={unprodDiff < 0}
          isTime
          accent="unproductive"
        />
      </div>

      {/* Chart + Categories */}
      <div className={styles.midRow}>
        {/* Activity Chart */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h2>Activity Overview</h2>
            <span className={styles.badge}>Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={22} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend content={<CustomLegend />} />
              <Bar dataKey="Productive" stackId="a" fill="#00d4aa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Distracting" stackId="a" fill="#ff5252" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories */}
        <div className={styles.catCard}>
          <div className={styles.cardHeader}>
            <h2>Top Categories</h2>
          </div>
          <div className={styles.catList}>
            {catData.slice(0, 6).map(cat => (
              <div key={cat.label} className={styles.catRow}>
                <div className={styles.catInfo}>
                  <span className={styles.catLabel}>{cat.label}</span>
                  <span className={styles.catTime}>{formatDuration(cat.duration)}</span>
                </div>
                <div className={styles.catBar}>
                  <div
                    className={styles.catFill}
                    style={{
                      width: `${(cat.duration / maxCatDuration) * 100}%`,
                      background: CATEGORY_COLORS[cat.category] || 'var(--text-3)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Websites */}
      <div className={styles.sitesCard}>
        <div className={styles.cardHeader}>
          <h2>Most Visited Websites</h2>
          <span className={styles.badge}>This Week</span>
        </div>
        <div className={styles.sitesTable}>
          <div className={styles.sitesHeader}>
            <span>Website</span>
            <span>Category</span>
            <span>Time Spent</span>
            <span>Share</span>
          </div>
          {topSites.map((site, i) => {
            const pct = current.totalDuration ? Math.round((site.duration / current.totalDuration) * 100) : 0;
            return (
              <div key={site.domain} className={styles.siteRow}>
                <div className={styles.siteName}>
                  <span className={styles.siteRank}>{i + 1}</span>
                  <img
                    src={getDomainFavicon(site.domain)}
                    alt=""
                    className={styles.favicon}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span className={styles.siteDomain}>{site.domain}</span>
                </div>
                <span className={`${styles.catChip} ${styles[site.category]}`}>
                  {site.categoryLabel}
                </span>
                <span className={styles.siteTime}>{formatDuration(site.duration)}</span>
                <div className={styles.shareBar}>
                  <div
                    className={styles.shareFill}
                    style={{
                      width: `${pct}%`,
                      background: CATEGORY_COLORS[site.category]
                    }}
                  />
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
          {topSites.length === 0 && (
            <div className={styles.empty}>No browsing data yet. Install the extension and start browsing!</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, diff, diffLabel, positive, isTime, accent }) {
  const showDiff = diff !== undefined && diff !== 0;
  return (
    <div className={`${styles.kpiCard} ${accent ? styles[`kpi_${accent}`] : ''}`}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiIcon}>{icon}</span>
      </div>
      <div className={styles.kpiValue}>{value}</div>
      {diffLabel && !showDiff && (
        <div className={styles.kpiMeta}>
          <span className={styles.neutral}>— {diffLabel}</span>
        </div>
      )}
      {showDiff && (
        <div className={styles.kpiMeta}>
          <span className={positive ? styles.up : styles.down}>
            {positive ? '↑' : '↓'} {isTime ? formatDuration(Math.abs(diff)) : `${Math.abs(diff)}%`} {diffLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', color: p.fill, marginBottom: 2 }}>
          <span>●</span><span>{p.name}: {p.value}h</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', paddingTop: 12 }}>
      {payload?.map(p => (
        <div key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.value}
        </div>
      ))}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatWeekRange(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function exportReport(data, catData) {
  const lines = [
    'FocusTrack Weekly Report',
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    `Productivity Score: ${data?.current?.productivityScore || 0}%`,
    `Total Time: ${formatDuration(data?.current?.totalDuration || 0)}`,
    `Productive: ${formatDuration(data?.current?.productiveDuration || 0)}`,
    `Unproductive: ${formatDuration(data?.current?.unproductiveDuration || 0)}`,
    '',
    'Top Categories:',
    ...catData.slice(0, 10).map(c => `  ${c.label}: ${formatDuration(c.duration)}`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'focustrack-report.txt'; a.click();
  URL.revokeObjectURL(url);
}

// Icons
function TargetIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function ClockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function BriefIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function PhoneIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>; }
function CalIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
