import { motion, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface ScoreRingProps {
  value: number; // kg CO2e/year
  size?: number;
  strokeWidth?: number;
}

const PARIS_TARGET = 1500;
const GLOBAL_AVG = 4900;
const MAX_DISPLAY = 20000;

function getScoreColor(kg: number): string {
  if (kg <= PARIS_TARGET) return '#00FF88';
  if (kg <= GLOBAL_AVG) return '#0DCCB0';
  if (kg <= 8000) return '#FFB347';
  return '#FF4757';
}

function getScoreLabel(kg: number): string {
  if (kg <= PARIS_TARGET) return 'Paris-Aligned';
  if (kg <= GLOBAL_AVG) return 'Below Average';
  if (kg <= 8000) return 'Above Average';
  if (kg <= 14000) return 'High Impact';
  return 'Very High Impact';
}

export function ScoreRing({ value, size = 240, strokeWidth = 16 }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / MAX_DISPLAY, 1);
  const colour = getScoreColor(value);
  const tonnes = (value / 1000).toFixed(1);
  const label = getScoreLabel(value);

  const strokeRef = useRef<SVGCircleElement>(null);
  const prevPct = useRef(0);

  useEffect(() => {
    const el = strokeRef.current;
    if (!el) return;
    const fromOffset = circumference - prevPct.current * circumference;
    const toOffset = circumference - pct * circumference;
    prevPct.current = pct;
    const ctrl = animate(fromOffset, toOffset, {
      duration: 1.2,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (v) => { el.style.strokeDashoffset = String(v); },
    });
    return () => ctrl.stop();
  }, [pct, circumference]);

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <div className="ring-glow" />
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        {/* Score arc */}
        <circle ref={strokeRef} cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={colour} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - pct * circumference}
          style={{ filter: `drop-shadow(0 0 8px ${colour})`, transition: 'stroke 0.5s ease' }}
        />
        {/* Paris target marker */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(0,255,136,0.4)" strokeWidth={2}
          strokeDasharray={`4 ${circumference - 4}`}
          strokeDashoffset={circumference - (PARIS_TARGET / MAX_DISPLAY) * circumference}
          strokeLinecap="round"
        />
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <motion.span key={tonnes}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: colour, lineHeight: 1 }}>
          {tonnes}
        </motion.span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>tonnes CO₂e/yr</span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, color: colour,
          background: `${colour}15`, padding: '2px 8px', borderRadius: 999, marginTop: 2,
        }}>{label}</span>
      </div>
    </div>
  );
}

// ---- Animated counter ----
interface CounterProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  style?: React.CSSProperties;
}

export function AnimatedCounter({ value, decimals = 0, suffix = '', prefix = '', duration = 1.5, style }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    const ctrl = animate(from, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = prefix + v.toFixed(decimals) + suffix;
      },
    });
    return () => ctrl.stop();
  }, [value, decimals, duration, prefix, suffix]);

  return <span ref={ref} style={style}>{prefix}{value.toFixed(decimals)}{suffix}</span>;
}
