import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import {
  useGetActionsQuery, useCommitActionMutation, useGetActiveCommitmentsQuery,
  useCheckinActionMutation, useRemoveCommitmentMutation,
} from '../../app/api';
import type { Action, CategoryKey } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../types';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type FilterCategory = 'all' | CategoryKey;
type SortMode = 'impact' | 'effort' | 'time';

export function ActionHub() {
  const userId = useAppSelector((s) => s.user.userId)!;
  const { data: actions = [], isLoading } = useGetActionsQuery();
  const { data: commitments = [] } = useGetActiveCommitmentsQuery(userId);
  const [commitAction] = useCommitActionMutation();
  const [checkinAction] = useCheckinActionMutation();
  const [removeCommitment] = useRemoveCommitmentMutation();

  const [filterCat, setFilterCat] = useState<FilterCategory>('all');
  const [sortMode, setSortMode] = useState<SortMode>('impact');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const committedIds = new Set(commitments.map((c) => c.actionId));

  const filtered = actions
    .filter((a) => filterCat === 'all' || a.category === filterCat)
    .filter((a) => !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'impact') return b.kgCO2e_saved_per_year - a.kgCO2e_saved_per_year;
      if (sortMode === 'effort') return a.effort - b.effort;
      return a.time_minutes_per_day - b.time_minutes_per_day;
    });

  const totalPotentialSaving = commitments.reduce((sum, c) => {
    const action = actions.find((a) => a.id === c.actionId);
    return sum + (action?.kgCO2e_saved_per_year ?? 0);
  }, 0);

  const handleCommit = async (actionId: string) => {
    if (committedIds.has(actionId)) {
      await removeCommitment({ userId, actionId });
    } else {
      await commitAction({ userId, actionId });
    }
  };

  const handleCheckin = async (actionId: string) => {
    await checkinAction({ userId, actionId });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Action Hub ⚡
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Commit to actions, build streaks, and track your real-world impact.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Actions Committed', value: commitments.length, icon: '✅', color: '#00FF88' },
          { label: 'Potential Annual Saving', value: `${(totalPotentialSaving / 1000).toFixed(2)}t`, icon: '📉', color: '#0DCCB0' },
          { label: 'Longest Streak', value: `${Math.max(0, ...commitments.map((c) => c.streakDays))} days`, icon: '🔥', color: '#FFB347' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active commitments */}
      {commitments.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: 14 }}>
            🌱 Active Commitments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {commitments.map((c) => {
              const action = actions.find((a) => a.id === c.actionId);
              if (!action) return null;
              const isCheckedInToday = c.lastCheckin
                ? new Date(c.lastCheckin).toDateString() === new Date().toDateString()
                : false;
              return (
                <motion.div key={c.id} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                  layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <span style={{ fontSize: '1.4rem' }}>{CATEGORY_ICONS[action.category as CategoryKey]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{action.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className={`badge badge-${action.category}`}>{CATEGORY_LABELS[action.category as CategoryKey]}</span>
                      {c.streakDays > 0 && <span className="badge badge-warning">🔥 {c.streakDays} day streak</span>}
                      <span className="badge badge-secondary">💚 {c.totalSavedKg.toFixed(1)} kg saved</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCheckin(c.actionId)}
                      disabled={isCheckedInToday}
                      style={{
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
                        background: isCheckedInToday ? 'rgba(0,255,136,0.1)' : 'rgba(0,255,136,0.15)',
                        color: isCheckedInToday ? 'var(--color-text-muted)' : '#00FF88',
                        cursor: isCheckedInToday ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem', fontWeight: 600,
                      }}>
                      {isCheckedInToday ? '✅ Done' : '☑️ Check in'}
                    </button>
                    <button className="btn-danger" onClick={() => removeCommitment({ userId, actionId: c.actionId })}>✕</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="🔍 Search actions..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: 220 }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'transport', 'food', 'energy', 'lifestyle'] as FilterCategory[]).map((cat) => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: '1px solid',
                borderColor: filterCat === cat ? (cat === 'all' ? '#00FF88' : CATEGORY_COLORS[cat as CategoryKey] ?? '#00FF88') : 'var(--color-border)',
                background: filterCat === cat ? `${(cat === 'all' ? '#00FF88' : CATEGORY_COLORS[cat as CategoryKey])}15` : 'transparent',
                color: filterCat === cat ? (cat === 'all' ? '#00FF88' : CATEGORY_COLORS[cat as CategoryKey]) : 'var(--color-text-secondary)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {cat === 'all' ? 'All' : `${CATEGORY_ICONS[cat as CategoryKey]} ${CATEGORY_LABELS[cat as CategoryKey]}`}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select className="form-select" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}
            style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.83rem' }}>
            <option value="impact">↑ Impact</option>
            <option value="effort">↑ Easiest</option>
            <option value="time">↑ Quickest</option>
          </select>
          <button onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
            style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.83rem' }}>
            {viewMode === 'list' ? '📊 Matrix' : '📋 List'}
          </button>
        </div>
      </div>

      {/* Matrix view */}
      {viewMode === 'matrix' && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>
            Impact vs. Effort Matrix
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
              <XAxis dataKey="effort" name="Effort" type="number" domain={[0, 6]} label={{ value: 'Effort →', position: 'insideBottom', offset: -5, fill: '#8892A4', fontSize: 12 }} tick={{ fill: '#8892A4', fontSize: 11 }} />
              <YAxis dataKey="kgCO2e_saved_per_year" name="CO₂ Saved" label={{ value: 'CO₂ Impact ↑', angle: -90, position: 'insideLeft', fill: '#8892A4', fontSize: 12 }} tick={{ fill: '#8892A4', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#0F1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                formatter={((val: unknown, name: unknown) => [name === 'CO₂ Saved' ? `${val} kg/yr` : val, name]) as Parameters<typeof Tooltip>[0]['formatter']} />
              <Scatter data={filtered.map((a) => ({ ...a, effort: a.effort, kgCO2e_saved_per_year: a.kgCO2e_saved_per_year }))}>
                {filtered.map((a, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[a.category as CategoryKey]} opacity={committedIds.has(a.id) ? 1 : 0.5} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Action list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>Loading actions...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <AnimatePresence>
            {filtered.map((action) => (
              <ActionCard key={action.id} action={action}
                committed={committedIds.has(action.id)}
                onCommit={() => handleCommit(action.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ActionCard({ action, committed, onCommit }: { action: Action; committed: boolean; onCommit: () => void }) {
  const cat = action.category as CategoryKey;
  const color = CATEGORY_COLORS[cat];
  const saving = (action.kgCO2e_saved_per_year / 1000).toFixed(2);

  return (
    <motion.div layout className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
      borderColor: committed ? `${color}40` : 'var(--color-border)',
      background: committed ? `${color}08` : undefined,
    }}
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <span className={`badge badge-${cat}`} style={{ marginBottom: 8 }}>
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </span>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}>{action.title}</h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{action.description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color }}>
            {saving}t
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>CO₂e saved/yr</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#FFB347' }}>
            {'⭐'.repeat(action.effort)}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Effort</div>
        </div>
        {action.time_minutes_per_day > 0 && (
          <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0DCCB0' }}>
              {action.time_minutes_per_day}m
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Daily time</div>
          </div>
        )}
      </div>

      <button onClick={onCommit} style={{
        width: '100%', padding: '9px', borderRadius: 'var(--radius-sm)', border: `1px solid ${committed ? color : 'var(--color-border)'}`,
        background: committed ? `${color}15` : 'rgba(255,255,255,0.03)',
        color: committed ? color : 'var(--color-text-secondary)',
        fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.2s',
        fontFamily: 'var(--font-body)',
      }}>
        {committed ? '✅ Committed' : '+ Commit to This'}
      </button>
    </motion.div>
  );
}
