import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setUserId, setOnboardingStep, completeOnboarding, setRegion, setHouseholdSize } from './userSlice';
import { updateEnergy } from '../calculator/calculatorSlice';
import { useCreateUserMutation, useSaveFootprintMutation } from '../../app/api';

const REGIONS = [
  { value: 'global', label: '🌍 Global Average' },
  { value: 'us', label: '🇺🇸 United States' },
  { value: 'uk', label: '🇬🇧 United Kingdom' },
  { value: 'eu', label: '🇪🇺 European Union' },
  { value: 'india', label: '🇮🇳 India' },
  { value: 'china', label: '🇨🇳 China' },
  { value: 'australia', label: '🇦🇺 Australia' },
  { value: 'canada', label: '🇨🇦 Canada' },
  { value: 'brazil', label: '🇧🇷 Brazil' },
  { value: 'south_africa', label: '🇿🇦 South Africa' },
];

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan', icon: '🌱', desc: 'No animal products' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗', desc: 'No meat or fish' },
  { value: 'pescatarian', label: 'Pescatarian', icon: '🐟', desc: 'Fish, no meat' },
  { value: 'meat_low', label: 'Low Meat', icon: '🥩', desc: 'Meat a few times/week' },
  { value: 'meat_medium', label: 'Omnivore', icon: '🍖', desc: 'Regular meat eater' },
  { value: 'meat_heavy', label: 'Heavy Meat', icon: '🥩🥩', desc: 'Meat most meals' },
];

const TRANSPORT_OPTIONS = [
  { value: 'none', label: 'No Car', icon: '🚶' },
  { value: 'car_electric', label: 'Electric', icon: '⚡' },
  { value: 'car_hybrid', label: 'Hybrid', icon: '🔋' },
  { value: 'car_petrol', label: 'Petrol', icon: '⛽' },
  { value: 'car_diesel', label: 'Diesel', icon: '🛢️' },
];

const ENERGY_OPTIONS = [
  { value: 'natural_gas', label: 'Gas', icon: '🔥' },
  { value: 'electric_heat_pump', label: 'Heat Pump', icon: '♨️' },
  { value: 'oil', label: 'Oil', icon: '🛢️' },
  { value: 'wood', label: 'Wood/Biomass', icon: '🪵' },
  { value: 'district', label: 'District', icon: '🏭' },
];

const pageVariants = {
  initial: { opacity: 0, x: 40, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -40, scale: 0.98 },
};

export function OnboardingWizard() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((s) => s.user.onboardingStep);
  const region = useAppSelector((s) => s.user.region);
  const householdSize = useAppSelector((s) => s.user.householdSize);

  const [diet, setDiet] = useState('meat_medium');
  const [carType, setCarType] = useState('car_petrol');
  const [heatingType, setHeatingType] = useState('natural_gas');
  const [flightHours, setFlightHours] = useState(5);
  const [monthlyKwh, setMonthlyKwh] = useState(300);

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [, { isLoading: saving }] = useSaveFootprintMutation();

  const handleStep1Next = async () => {
    const user = await createUser({ region, householdSize }).unwrap();
    dispatch(setUserId(user.id));
    dispatch(updateEnergy({ region }));
    dispatch(setOnboardingStep(2));
  };

  const handleStep2Next = () => {
    dispatch(setOnboardingStep(3));
  };

  return (
    <div className="onboarding-container">
      <div className="bg-animated" />

      {/* Logo */}
      <div style={{ position: 'fixed', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00FF88, #0DCCB0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px'
        }}>🌿</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
          EcoTrace
        </span>
      </div>

      <div className="onboarding-card">
        {/* Step indicators */}
        <div className="step-indicator">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`step-dot ${step === s ? 'active' : ''} ${step > s ? 'done' : ''}`}
              style={{ width: step === s ? 32 : 16 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <Step1 region={region} householdSize={householdSize}
                onRegionChange={(r) => dispatch(setRegion(r))}
                onHouseholdChange={(h) => dispatch(setHouseholdSize(h))}
                onNext={handleStep1Next} loading={creating}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <Step2
                diet={diet} setDiet={setDiet}
                carType={carType} setCarType={setCarType}
                heatingType={heatingType} setHeatingType={setHeatingType}
                flightHours={flightHours} setFlightHours={setFlightHours}
                monthlyKwh={monthlyKwh} setMonthlyKwh={setMonthlyKwh}
                onNext={handleStep2Next}
              />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <Step3FinishSetup
                region={region}
                diet={diet} carType={carType} heatingType={heatingType}
                flightHours={flightHours} monthlyKwh={monthlyKwh}
                saving={saving}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- Step 1: Region & Household ----
function Step1({ region, householdSize, onRegionChange, onHouseholdChange, onNext, loading }: {
  region: string; householdSize: number;
  onRegionChange: (r: string) => void;
  onHouseholdChange: (h: number) => void;
  onNext: () => void; loading: boolean;
}) {
  return (
    <div className="glass-card-elevated" style={{ padding: '40px 36px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌍</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>
          Where in the world are you?
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Your region affects grid electricity intensity and baseline comparisons.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="form-label">Your Region</label>
        <select className="form-select" value={region} onChange={(e) => onRegionChange(e.target.value)}>
          {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 32 }}>
        <label className="form-label">Household Size</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} onClick={() => onHouseholdChange(n)}
              style={{
                width: 52, height: 52, borderRadius: 'var(--radius-md)',
                border: `1px solid ${householdSize === n ? '#00FF88' : 'var(--color-border)'}`,
                background: householdSize === n ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                color: householdSize === n ? '#00FF88' : 'var(--color-text-secondary)',
                fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'var(--font-display)',
              }}>
              {n === 6 ? '6+' : n}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
          {householdSize} {householdSize === 1 ? 'person' : 'people'} — we'll show per-person and household totals
        </p>
      </div>

      <button className="btn-primary" onClick={onNext} disabled={loading}
        style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px' }}>
        {loading ? '⏳ Setting up...' : 'Continue →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 16 }}>
        No account needed. Your data stays on your device.
      </p>
    </div>
  );
}

// ---- Step 2: Lifestyle Snapshot ----
function Step2({ diet, setDiet, carType, setCarType, heatingType, setHeatingType,
  flightHours, setFlightHours, monthlyKwh, setMonthlyKwh, onNext }: {
  diet: string; setDiet: (v: string) => void;
  carType: string; setCarType: (v: string) => void;
  heatingType: string; setHeatingType: (v: string) => void;
  flightHours: number; setFlightHours: (v: number) => void;
  monthlyKwh: number; setMonthlyKwh: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="glass-card-elevated" style={{ padding: '36px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚡</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
          Quick Lifestyle Snapshot
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          A few questions to give you an accurate baseline.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Diet */}
        <div>
          <label className="form-label">🍽️ Diet Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {DIET_OPTIONS.map((d) => (
              <div key={d.value} className={`option-card ${diet === d.value ? 'selected' : ''}`}
                onClick={() => setDiet(d.value)} style={{ padding: '12px 8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{d.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: diet === d.value ? '#00FF88' : 'var(--color-text-primary)' }}>{d.label}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{d.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Car type */}
        <div>
          <label className="form-label">🚗 Primary Vehicle</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TRANSPORT_OPTIONS.map((t) => (
              <div key={t.value} className={`option-card ${carType === t.value ? 'selected' : ''}`}
                onClick={() => setCarType(t.value)} style={{ flex: '1 1 80px', minWidth: 80 }}>
                <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: carType === t.value ? '#00FF88' : 'var(--color-text-primary)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flight hours */}
        <div>
          <label className="form-label">✈️ Flight Hours per Year: <span style={{ color: '#00FF88' }}>{flightHours}h</span></label>
          <input type="range" className="form-range" min={0} max={100} value={flightHours}
            onChange={(e) => setFlightHours(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            <span>None</span><span>10h (2 flights)</span><span>100h+</span>
          </div>
        </div>

        {/* Heating */}
        <div>
          <label className="form-label">🔥 Home Heating Type</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ENERGY_OPTIONS.map((e) => (
              <div key={e.value} className={`option-card ${heatingType === e.value ? 'selected' : ''}`}
                onClick={() => setHeatingType(e.value)} style={{ flex: '1 1 80px', minWidth: 80 }}>
                <span style={{ fontSize: '1.3rem' }}>{e.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: heatingType === e.value ? '#00FF88' : 'var(--color-text-primary)' }}>{e.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly kWh */}
        <div>
          <label className="form-label">⚡ Monthly Electricity: <span style={{ color: '#00FF88' }}>{monthlyKwh} kWh</span></label>
          <input type="range" className="form-range" min={50} max={1000} step={10} value={monthlyKwh}
            onChange={(e) => setMonthlyKwh(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            <span>Minimal</span><span>Average</span><span>High use</span>
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={onNext}
        style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px', marginTop: 28 }}>
        Calculate My Footprint →
      </button>
    </div>
  );
}

// ---- Step 3: Reveal & save footprint ----
function Step3FinishSetup({ region, diet, carType, heatingType, flightHours, monthlyKwh, saving }: {
  region: string; diet: string; carType: string;
  heatingType: string; flightHours: number; monthlyKwh: number; saving: boolean;
}) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId);
  const [saveFootprint] = useSaveFootprintMutation();
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ totalKgCO2e: number; personality: string } | null>(null);

  const handleFinish = async () => {
    if (!userId) return;
    const input = {
      transport: { carType, carKmPerWeek: 100, flightHoursPerYear: flightHours, publicTransitKmPerWeek: 20 },
      food: { dietType: diet, foodWasteLevel: 'medium' as const, localFoodPercent: '25_50' as const },
      energy: { region, monthlyKwh, heatingType, heatingKwhPerMonth: 80, hasSolar: false, solarOffsetPercent: 30 },
      lifestyle: { shoppingLevel: 'moderate' as const, streamingHoursPerWeek: 10, deviceUpgradeCycle: '3_years' as const },
    };
    const res = await saveFootprint({ userId, input }).unwrap();
    setResult({ totalKgCO2e: res.snapshot.totalKgCO2e, personality: res.personality });
    setDone(true);
    setTimeout(() => dispatch(completeOnboarding()), 3000);
  };

  if (done && result) {
    const tonnes = (result.totalKgCO2e / 1000).toFixed(1);
    return (
      <motion.div className="glass-card-elevated" style={{ padding: '48px 36px', textAlign: 'center' }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <motion.div style={{ fontSize: '4rem', marginBottom: 16 }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, delay: 0.3 }}>
          {result.personality.includes('Pioneer') || result.personality.includes('Enthusiast') ? '🌱' :
           result.personality.includes('Sky') ? '✈️' : '🌍'}
        </motion.div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
          You are <span className="gradient-text">{result.personality}</span>
        </h2>
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, color: '#00FF88' }}>
            {tonnes}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginLeft: 6 }}>tonnes CO₂e/year</span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Loading your Carbon HQ...
        </p>
        <motion.div style={{ marginTop: 24, height: 3, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', background: 'linear-gradient(90deg, #00FF88, #0DCCB0)', borderRadius: 999 }}
            initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.5, ease: 'easeInOut' }} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="glass-card-elevated" style={{ padding: '48px 36px', textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>🔮</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
        Ready for your <span className="gradient-text">Carbon Story?</span>
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: 380, margin: '0 auto 32px' }}>
        We'll calculate your carbon footprint, reveal your personality archetype, and give you a personalized action plan.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {['Real emission data', 'Personalized insights', 'Action streaks'].map((t) => (
          <span key={t} className="badge badge-primary">✓ {t}</span>
        ))}
      </div>

      <button className="btn-primary" onClick={handleFinish} disabled={saving}
        style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '16px' }}>
        {saving ? '⏳ Calculating...' : '🚀 Reveal My Footprint'}
      </button>
    </div>
  );
}
