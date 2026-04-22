import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../utils/api';
import { formatDuration, secsToHours, shortDay, getWeekStart } from '../utils/format';
import styles from './WeeklyReportsPage.module.css';

export default function WeeklyReportsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState(null);
  const [catData, setCatData] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekStart = getWeekOffset(weekOffset);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/analytics/weekly?start=${weekStart.toISOString()}`),
      api.get(`/analytics/categories?start=${weekStart.toISOString()}&end=${getWeekEnd(weekStart).toISOString()}`)
    ]).then(([wRes, cRes]) => {
      setData(wRes.data);
      setCatData(cRes.data.categories || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [weekOffset]);

  if (loading) return <div className={styles.loadWrap}><div className={styles.spinner} /></div>;

  const daily = data?.dailyBreakdown || [];
  const totalSecs = data?.totalDuration || 0;
  const prodSecs = data?.productiveDuration || 0;
  const unprodSecs = data?.unproductiveDuration || 0;
  const score = data?.productivityScore || 0;

  const barData = daily.map(d => ({
    day: shortDay(d.date),
    Productive: parseFloat(secsToHours(d.productive).toFixed(2)),
    Distracting: parseFloat(secsToHours(d.unproductive).toFixed(2)),
    Neutral: parseFloat(secsToHours(d.neutral).toFixed(2)),
  }));

  const lineData = daily.map(d => ({
    day: shortDay(d.date),
    Score: d.total > 0 ? Math.round((d.productive / d.total) * 100) : 0,
  }));

  const pieData = [
    { name: 'Productive', value: prodSecs, color: '#00d4aa' },
    { name: 'Unproductive', value: unprodSecs, color: '#ff5252' },
    { name: 'Neutral', value: Math.max(0, totalSecs - prodSecs - unprodSecs), color: '#636b88' },
  ].filter(d => d.value > 0);

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = isCurrentWeek ? 'This Week' : weekOffset === -1 ? 'Last Week' : formatWeekLabel(weekStart);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Weekly Reports</h1>
          <p className={styles.sub}>Your productivity breakdown, week by week</p>
        </div>
        <div className={styles.weekNav}>
          <button className={styles.navBtn} onClick={() => setWeekOffset(o => o - 1)}>
            ← Prev
          </button>
          <span className={styles.weekLabel}>{weekLabel}</span>
          <button
            className={styles.navBtn}
            onClick={() => setWeekOffset(o => o + 1)}
            disabled={weekOffset >= 0}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className={styles.kpiRow}>
        <div className={styles.scoreCard}>
          <div className={styles.scoreRing}>
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-3)" strokeWidth="8"/>
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={score >= 70 ? '#00d4aa' : score >= 40 ? '#ffc857' : '#ff5252'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="46" textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="700" fontFamily="DM Mono">{score}%</text>
              <text x="50" y="62" textAnchor="middle" fill="var(--text-3)" fontSize="10">Score</text>
            </svg>
          </div>
          <div>
            <div className={styles.scoreTitle}>Productivity Score</div>
            <div className={styles.scoreHint}>
              {score >= 70 ? '🔥 Great week!' : score >= 40 ? '📈 Keep going' : '💡 Room to improve'}
            </div>
          </div>
        </div>
        <StatBox label="Total Hours" value={formatDuration(totalSecs)} color="var(--blue)" />
        <StatBox label="Productive" value={formatDuration(prodSecs)} color="var(--accent)" />
        <StatBox label="Distracting" value={formatDuration(unprodSecs)} color="var(--red)" />
        <StatBox label="Avg / Day" value={formatDuration(Math.round(totalSecs / 7))} color="var(--yellow)" />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Stacked bar */}
        <div className={styles.chartCard}>
          <h2>Daily Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Productive" stackId="a" fill="#00d4aa" />
              <Bar dataKey="Distracting" stackId="a" fill="#ff5252" />
              <Bar dataKey="Neutral" stackId="a" fill="#636b88" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score trend */}
        <div className={styles.chartCard}>
          <h2>Daily Score Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="Score" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className={styles.pieCard}>
          <h2>Time Split</h2>
          <PieChart width={160} height={160}>
            <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className={styles.pieLegend}>
            {pieData.map(d => (
              <div key={d.name} className={styles.pieLegendRow}>
                <span className={styles.pieDot} style={{ background: d.color }} />
                <span>{d.name}</span>
                <span className={styles.pieTime}>{formatDuration(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories breakdown */}
      <div className={styles.catCard}>
        <h2>Category Breakdown</h2>
        <div className={styles.catGrid}>
          {catData.slice(0, 8).map(cat => {
            const pct = totalSecs ? Math.round((cat.duration / totalSecs) * 100) : 0;
            const color = cat.category === 'productive' ? 'var(--accent)' : cat.category === 'unproductive' ? 'var(--red)' : 'var(--text-3)';
            return (
              <div key={cat.label} className={styles.catItem}>
                <div className={styles.catHeader}>
                  <span className={styles.catName}>{cat.label}</span>
                  <span className={styles.catTime}>{formatDuration(cat.duration)}</span>
                </div>
                <div className={styles.catBar}>
                  <div className={styles.catFill} style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className={styles.catPct} style={{ color }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className={styles.statBox}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color }}>{value}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill, marginBottom: 2 }}>{p.name}: {p.value}h</div>
      ))}
    </div>
  );
}

function getWeekOffset(offset) {
  const start = getWeekStart();
  start.setDate(start.getDate() + offset * 7);
  return start;
}

function getWeekEnd(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatWeekLabel(start) {
  const end = getWeekEnd(start);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
