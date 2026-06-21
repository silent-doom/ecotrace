import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useAppSelector } from '../../app/hooks';
import { useGetUserQuery, useGetLatestFootprintQuery, useGetActiveCommitmentsQuery, useGetFootprintsQuery } from '../../app/api';
import { ScoreRing } from '../../components/charts/ScoreRing';
import html2canvas from 'html2canvas';
import type { CategoryKey } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../types';

const PERSONALITY_META: Record<string, { emoji: string; tagline: string; primaryAction: string; gradient: string }> = {
  'The Green Pioneer': { emoji: '🌱', tagline: 'Already leading the way. Help others follow.', primaryAction: 'Advocate for climate policy in your community', gradient: 'linear-gradient(135deg, #00FF88, #0DCCB0)' },
  'The Conscious Foodie': { emoji: '🥗', tagline: 'Your plate is your most powerful climate tool.', primaryAction: 'Try full plant-based for one week', gradient: 'linear-gradient(135deg, #10B981, #3B82F6)' },
  'The Mindful Mover': { emoji: '🚲', tagline: 'Every journey is a choice. You make good ones.', primaryAction: 'Cycle to work 3 days this week', gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
  'The Eco Enthusiast': { emoji: '♻️', tagline: 'You care. Now let that care compound.', primaryAction: 'Switch to a renewable energy tariff', gradient: 'linear-gradient(135deg, #0DCCB0, #3B82F6)' },
  'The Sky Traveler': { emoji: '✈️', tagline: "The sky is beautiful — let's keep it that way.", primaryAction: 'Replace one flight with a train journey', gradient: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' },
  'The Home Optimizer': { emoji: '🏠', tagline: 'Your home is your biggest opportunity.', primaryAction: 'Install a smart thermostat this month', gradient: 'linear-gradient(135deg, #F59E0B, #FF4757)' },
  'The Omnivore in Transition': { emoji: '🥩', tagline: 'Small shifts in diet create big changes.', primaryAction: 'Reduce red meat to twice a week', gradient: 'linear-gradient(135deg, #FFB347, #10B981)' },
  'The Average Citizen': { emoji: '🌍', tagline: "Average isn't your ceiling. It's your starting point.", primaryAction: 'Pick your single biggest lever and act on it', gradient: 'linear-gradient(135deg, #8892A4, #0DCCB0)' },
  'The Road Warrior': { emoji: '🚗', tagline: 'The road ahead is electric. Are you ready?', primaryAction: 'Research electric vehicle options', gradient: 'linear-gradient(135deg, #3B82F6, #00FF88)' },
  'The Conscious Consumer': { emoji: '🛍️', tagline: 'Every purchase is a vote. Vote wisely.', primaryAction: 'Buy second-hand for your next 3 purchases', gradient: 'linear-gradient(135deg, #8B5CF6, #FF4757)' },
  'The High-Impact Household': { emoji: '⚡', tagline: 'High impact, high opportunity.', primaryAction: 'Conduct a home energy audit this week', gradient: 'linear-gradient(135deg, #FF4757, #FFB347)' },
};

const BADGES = [
  { id: 'first_action', label: 'First Step', icon: '🌱', desc: 'Committed to first action', threshold: (c: number) => c >= 1 },
  { id: 'five_actions', label: 'Eco Warrior', icon: '⚡', desc: '5 actions committed', threshold: (c: number) => c >= 5 },
  { id: 'ten_actions', label: 'Climate Champion', icon: '🏆', desc: '10 actions committed', threshold: (c: number) => c >= 10 },
  { id: 'streak_7', label: 'Week Warrior', icon: '🔥', desc: '7-day streak', threshold: (_c: number, s: number) => s >= 7 },
  { id: 'streak_30', label: 'Month Master', icon: '🌟', desc: '30-day streak', threshold: (_c: number, s: number) => s >= 30 },
  { id: 'below_global', label: 'Below Average', icon: '📉', desc: 'Below global average footprint', threshold: (_c: number, _s: number, kg: number) => kg > 0 && kg < 4900 },
  { id: 'paris_aligned', label: 'Paris Aligned', icon: '🌍', desc: 'Below Paris target (1.5t)', threshold: (_c: number, _s: number, kg: number) => kg > 0 && kg < 1500 },
];

export function Profile() {
  const userId = useAppSelector((s) => s.user.userId)!;
  const { data: user } = useGetUserQuery(userId);
  const { data: latest } = useGetLatestFootprintQuery(userId);
  const { data: commitments = [] } = useGetActiveCommitmentsQuery(userId);
  const { data: history = [] } = useGetFootprintsQuery(userId);
  const cardRef = useRef<HTMLDivElement>(null);

  const personality = user?.personality ?? 'The Average Citizen';
  const meta = PERSONALITY_META[personality] ?? PERSONALITY_META['The Average Citizen'];
  const totalKg = latest?.totalKgCO2e ?? 0;
  const breakdown = latest?.breakdown ?? { transport: 0, food: 0, energy: 0, lifestyle: 0 };
  const totalSaved = commitments.reduce((s, c) => s + c.totalSavedKg, 0);
  const bestStreak = Math.max(0, ...commitments.map((c) => c.streakDays));



  const handleShare = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement('a');
    link.download = 'ecotrace-carbon-card.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Your Carbon Profile 🌍
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Your personality archetype, badges, and shareable impact card.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Personality Card */}
        <div>
          <motion.div ref={cardRef} className="personality-card"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ fontSize: '4rem', marginBottom: 12, position: 'relative', zIndex: 1 }}>{meta.emoji}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6, position: 'relative', zIndex: 1 }}>
              <span style={{ background: meta.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {personality}
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 20, position: 'relative', zIndex: 1 }}>
              {meta.tagline}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
              <ScoreRing value={totalKg} size={160} strokeWidth={12} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, position: 'relative', zIndex: 1 }}>
              {(Object.entries(breakdown) as [CategoryKey, number][]).map(([cat, val]) => (
                <div key={cat} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem' }}>{CATEGORY_ICONS[cat]}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: CATEGORY_COLORS[cat] }}>{(val / 1000).toFixed(1)}t</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{CATEGORY_LABELS[cat]}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(0,255,136,0.06)', borderRadius: 10, border: '1px solid rgba(0,255,136,0.15)', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>🎯 Your Priority Action</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{meta.primaryAction}</div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#00FF88' }}>{totalSaved.toFixed(1)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>kg CO₂ saved</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#FFB347' }}>{bestStreak}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>day streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#0DCCB0' }}>{commitments.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>actions</div>
              </div>
            </div>
          </motion.div>

          <button className="btn-primary" onClick={handleShare} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            📷 Download Impact Card
          </button>
        </div>

        {/* Right column: Badges + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Badges */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>
              🏅 Badges
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {BADGES.map((badge) => {
                const earned = badge.threshold(commitments.length, bestStreak, totalKg);
                return (
                  <div key={badge.id} style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    background: earned ? 'rgba(0,255,136,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${earned ? 'rgba(0,255,136,0.25)' : 'var(--color-border)'}`,
                    opacity: earned ? 1 : 0.4, transition: 'all 0.3s',
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '1.6rem' }}>{badge.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: earned ? '#00FF88' : 'var(--color-text-secondary)' }}>{badge.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{badge.desc}</div>
                    </div>
                    {earned && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#00FF88' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Snapshot history */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>
              📊 Snapshot History
            </h3>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: 20 }}>
                Save snapshots from the Calculator to see your progress here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.slice(0, 8).map((snap) => {
                  const tonnes = (snap.totalKgCO2e / 1000).toFixed(2);
                  const date = new Date(snap.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' });
                  const color = snap.totalKgCO2e < 4900 ? '#00FF88' : snap.totalKgCO2e < 8000 ? '#FFB347' : '#FF4757';
                  return (
                    <div key={snap.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flex: 1 }}>{date}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color }}>
                        {tonnes}t
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
