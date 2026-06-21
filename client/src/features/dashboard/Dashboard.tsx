import { motion } from 'framer-motion';
import { useAppSelector } from '../../app/hooks';
import { useGetLatestFootprintQuery, useGetInsightsQuery, useGetFootprintsQuery, useGetActiveCommitmentsQuery } from '../../app/api';
import { ScoreRing } from '../../components/charts/ScoreRing';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, type CategoryKey } from '../../types';

const GLOBAL_AVG = 4900;
const PARIS_TARGET = 1500;

const EQUIVALENTS = (kg: number) => [
  { icon: '✈️', label: 'Flights (London→NY)', value: (kg / 900).toFixed(1) },
  { icon: '🌳', label: 'Trees needed to offset', value: Math.ceil(kg / 25) },
  { icon: '🚗', label: 'km driven (petrol)', value: Math.round(kg / 0.192).toLocaleString() },
  { icon: '🍔', label: 'Beef burgers equivalent', value: Math.round(kg / 3.6).toLocaleString() },
];

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', year: '2-digit' });
}

export function Dashboard() {
  const userId = useAppSelector((s) => s.user.userId)!;
  const { data: latest } = useGetLatestFootprintQuery(userId);
  const { data: history = [] } = useGetFootprintsQuery(userId);
  const { data: insightsData } = useGetInsightsQuery(userId);
  const { data: commitments = [] } = useGetActiveCommitmentsQuery(userId);

  const totalKg = latest?.totalKgCO2e ?? 0;
  const breakdown = latest?.breakdown ?? { transport: 0, food: 0, energy: 0, lifestyle: 0 };

  // Chart data: last 6 months reversed
  const trendData = [...history].slice(0, 6).reverse().map((s) => ({
    month: formatMonth(s.createdAt),
    total: Math.round(s.totalKgCO2e / 12), // monthly equivalent
  }));

  // Pie data
  const pieData = (Object.entries(breakdown) as [CategoryKey, number][]).map(([k, v]) => ({
    name: CATEGORY_LABELS[k], value: v, fill: CATEGORY_COLORS[k], icon: CATEGORY_ICONS[k],
  }));

  const totalSavedKg = commitments.reduce((sum, c) => sum + c.totalSavedKg, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Carbon HQ 🌿
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          {insightsData?.tip && <span>💡 <em>{insightsData.tip}</em></span>}
        </p>
      </div>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'start' }}>
        {/* Score ring */}
        <motion.div className="glass-card-elevated" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <ScoreRing value={totalKg} size={220} />

          {/* Comparison bars */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'You', value: totalKg, color: totalKg < GLOBAL_AVG ? '#00FF88' : '#FF4757' },
              { label: 'Global Avg', value: GLOBAL_AVG, color: '#FFB347' },
              { label: 'Paris Target', value: PARIS_TARGET, color: '#0DCCB0' },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 600 }}>{(row.value / 1000).toFixed(1)}t</span>
                </div>
                <div className="progress-bar-track">
                  <motion.div className="progress-bar-fill"
                    style={{ background: row.color, width: 0 }}
                    animate={{ width: `${Math.min((row.value / 20000) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Equivalents */}
          <motion.div className="glass-card" style={{ padding: 20 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your footprint equals...
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {EQUIVALENTS(totalKg).map((eq) => (
                <div key={eq.label} className="metric-equiv">
                  <span style={{ fontSize: '1.5rem' }}>{eq.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>{eq.value}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>{eq.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'CO₂ Saved', value: totalSavedKg.toFixed(1), unit: 'kg', icon: '💚', color: '#00FF88' },
              { label: 'Active Actions', value: commitments.length, unit: '', icon: '⚡', color: '#0DCCB0' },
              { label: 'Best Streak', value: Math.max(0, ...commitments.map((c) => c.streakDays)), unit: 'days', icon: '🔥', color: '#FFB347' },
            ].map((stat) => (
              <motion.div key={stat.label} className="glass-card" style={{ padding: 16, textAlign: 'center' }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: stat.color }}>
                  {stat.value}<span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 3 }}>{stat.unit}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row: Breakdown + Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Category breakdown */}
        <motion.div className="glass-card" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', marginBottom: 20 }}>
            Emission Breakdown
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <PieChart width={200} height={200}>
              <Pie data={pieData} cx={100} cy={100} innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={1000}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
            </PieChart>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(Object.entries(breakdown) as [CategoryKey, number][]).map(([cat, val]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: 4 }}>
                  <span>{CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}</span>
                  <span style={{ color: CATEGORY_COLORS[cat], fontWeight: 600 }}>{(val / 1000).toFixed(2)}t</span>
                </div>
                <div className="progress-bar-track">
                  <motion.div className="progress-bar-fill"
                    style={{ background: CATEGORY_COLORS[cat], width: 0 }}
                    animate={{ width: totalKg > 0 ? `${(val / totalKg) * 100}%` : '0%' }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trend chart */}
        <motion.div className="glass-card" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', marginBottom: 20 }}>
            Monthly Trend
          </h3>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8892A4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8892A4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F0F4FF' }}
                  formatter={(v: unknown) => [`${v} kg`, 'Monthly CO₂e']}
                />
                <Area type="monotone" dataKey="total" stroke="#00FF88" strokeWidth={2}
                  fill="url(#areaGrad)" dot={{ fill: '#00FF88', strokeWidth: 0, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Track more entries to see your trend 📈
            </div>
          )}
        </motion.div>
      </div>

      {/* Insights */}
      {insightsData?.insights && insightsData.insights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>
            🧠 Personalized Insights
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {insightsData.insights.map((insight, i) => (
              <motion.div key={i} className={`glass-card insight-card-${insight.type}`} style={{ padding: 20 }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{insight.title}</h4>
                  <span className={`badge badge-${insight.type === 'celebrate' ? 'primary' : insight.type === 'lever' ? 'danger' : 'warning'}`}>
                    {insight.metric}
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.83rem', margin: 0, lineHeight: 1.5 }}>
                  {insight.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
