import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../app/hooks';
import { useGetLatestFootprintQuery } from '../../app/api';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Carbon HQ', ariaLabel: 'Go to Carbon HQ dashboard' },
  { to: '/calculator', icon: '🧮', label: 'Calculator', ariaLabel: 'Open carbon footprint calculator' },
  { to: '/actions', icon: '⚡', label: 'Action Hub', ariaLabel: 'Browse and commit to eco actions' },
  { to: '/profile', icon: '🌍', label: 'My Profile', ariaLabel: 'View your carbon profile and badges' },
];

export function Sidebar() {
  const userId = useAppSelector((s) => s.user.userId);
  const { data: latest } = useGetLatestFootprintQuery(userId ?? '', { skip: !userId });
  const footprintTonnes = latest ? (latest.totalKgCO2e / 1000).toFixed(1) : null;

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 4 }}>
        <div
          aria-hidden="true"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00FF88, #0DCCB0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 0 16px rgba(0,255,136,0.3)',
          }}>🌿</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)', lineHeight: 1 }}>EcoTrace</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Carbon Intelligence</div>
        </div>
      </div>

      {/* Score pill */}
      {latest && (
        <div
          role="status"
          aria-label={`Your carbon footprint is ${footprintTonnes} tonnes CO2 per year`}
          aria-live="polite"
          style={{ marginBottom: 24, padding: '12px 14px', background: 'rgba(0,255,136,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,255,136,0.15)' }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Your Footprint</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#00FF88' }}>
            {footprintTonnes}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 4 }}>t CO₂e/yr</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.min((latest.totalKgCO2e / 20000) * 100, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Carbon footprint: ${footprintTonnes} out of 20 tonnes maximum`}
            style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}
          >
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #00FF88, #0DCCB0)', borderRadius: 999 }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((latest.totalKgCO2e / 20000) * 100, 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav aria-label="Site pages" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.ariaLabel}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              background: isActive ? 'rgba(0,255,136,0.1)' : 'transparent',
              color: isActive ? '#00FF88' : 'var(--color-text-secondary)',
              borderLeft: isActive ? '2px solid #00FF88' : '2px solid transparent',
              transition: 'all 0.2s',
              fontSize: '0.9rem', fontWeight: isActive ? 600 : 400,
            })}
          >
            <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Data sources: IPCC AR6, DEFRA 2023, IEA, Project Drawdown
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
          🔒 Your data stays local
        </div>
      </footer>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.ariaLabel}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            textDecoration: 'none', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            color: isActive ? '#00FF88' : 'var(--color-text-muted)',
            transition: 'all 0.2s', fontSize: '0.68rem', fontWeight: isActive ? 600 : 400,
            flex: 1,
          })}
        >
          <span aria-hidden="true" style={{ fontSize: '1.3rem' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
