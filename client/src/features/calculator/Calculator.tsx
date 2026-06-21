import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateTransport, updateFood, updateEnergy, updateLifestyle, setActiveTab, setLiveResult } from './calculatorSlice';
import { usePreviewFootprintMutation, useSaveFootprintMutation } from '../../app/api';
import { ScoreRing } from '../../components/charts/ScoreRing';
import { CATEGORY_COLORS, type CategoryKey } from '../../types';

const TAB_CONFIG: { key: CategoryKey; label: string; icon: string }[] = [
  { key: 'transport', label: 'Transport', icon: '🚗' },
  { key: 'food', label: 'Food', icon: '🍽️' },
  { key: 'energy', label: 'Energy', icon: '⚡' },
  { key: 'lifestyle', label: 'Lifestyle', icon: '🛍️' },
];

export function Calculator() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.user.userId)!;
  const { input, liveResult, activeTab } = useAppSelector((s) => s.calculator);
  const [previewFootprint] = usePreviewFootprintMutation();
  const [saveFootprint, { isLoading: saving }] = useSaveFootprintMutation();
  const [saved, setSaved] = useState(false);

  // Debounced live preview
  const runPreview = useCallback(async () => {
    const result = await previewFootprint({ userId, input }).unwrap();
    dispatch(setLiveResult(result));
  }, [input, userId, previewFootprint, dispatch]);

  useEffect(() => {
    const timer = setTimeout(runPreview, 400);
    return () => clearTimeout(timer);
  }, [runPreview]);

  const handleSave = async () => {
    await saveFootprint({ userId, input });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Carbon Calculator 🧮
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Adjust sliders to explore how lifestyle changes affect your footprint in real time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Left: Tabs + inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tab nav */}
          <div className="tab-nav">
            {TAB_CONFIG.map((tab) => (
              <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => dispatch(setActiveTab(tab.key))}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'transport' && <TransportTab />}
            {activeTab === 'food' && <FoodTab />}
            {activeTab === 'energy' && <EnergyTab />}
            {activeTab === 'lifestyle' && <LifestyleTab />}
          </motion.div>
        </div>

        {/* Right: Live score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 32 }}>
          <div className="glass-card-elevated" style={{ padding: 24, textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Score
            </h3>
            <ScoreRing value={liveResult?.totalKgCO2e ?? 0} size={180} strokeWidth={14} />

            {liveResult && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Object.entries(liveResult.breakdown) as [CategoryKey, number][]).map(([cat, val]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{cat}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, margin: '0 10px' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: CATEGORY_COLORS[cat],
                        width: liveResult.totalKgCO2e > 0 ? `${(val / liveResult.totalKgCO2e) * 100}%` : '0%',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ color: CATEGORY_COLORS[cat], fontWeight: 600 }}>{(val / 1000).toFixed(1)}t</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className={saved ? 'btn-ghost' : 'btn-primary'} onClick={handleSave} disabled={saving}
            style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Snapshot'}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Saved snapshots appear in your trend chart
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Transport Tab ----
function TransportTab() {
  const dispatch = useAppDispatch();
  const { transport } = useAppSelector((s) => s.calculator.input);

  const CAR_TYPES = [
    { value: 'none', label: 'No Car', icon: '🚶' },
    { value: 'car_electric', label: 'Electric', icon: '⚡' },
    { value: 'car_hybrid', label: 'Hybrid', icon: '🔋' },
    { value: 'car_petrol', label: 'Petrol', icon: '⛽' },
    { value: 'car_diesel', label: 'Diesel', icon: '🛢️' },
    { value: 'motorbike', label: 'Motorbike', icon: '🏍️' },
  ];

  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label className="form-label">Vehicle Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {CAR_TYPES.map((c) => (
            <div key={c.value} className={`option-card ${transport.carType === c.value ? 'selected' : ''}`}
              onClick={() => dispatch(updateTransport({ carType: c.value }))}>
              <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: transport.carType === c.value ? '#00FF88' : 'inherit' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {transport.carType !== 'none' && (
        <Slider label="Km driven per week" value={transport.carKmPerWeek} min={0} max={800} step={10}
          unit="km" onChange={(v) => dispatch(updateTransport({ carKmPerWeek: v }))} />
      )}

      <Slider label="Flight hours per year" value={transport.flightHoursPerYear} min={0} max={150} step={1}
        unit="h" onChange={(v) => dispatch(updateTransport({ flightHoursPerYear: v }))} />

      <Slider label="Public transit km per week" value={transport.publicTransitKmPerWeek} min={0} max={300} step={5}
        unit="km" onChange={(v) => dispatch(updateTransport({ publicTransitKmPerWeek: v }))} />
    </div>
  );
}

// ---- Food Tab ----
function FoodTab() {
  const dispatch = useAppDispatch();
  const { food } = useAppSelector((s) => s.calculator.input);

  const DIETS = [
    { v: 'vegan', l: 'Vegan', i: '🌱' }, { v: 'vegetarian', l: 'Vegetarian', i: '🥗' },
    { v: 'pescatarian', l: 'Pescatarian', i: '🐟' }, { v: 'meat_low', l: 'Low Meat', i: '🥩' },
    { v: 'meat_medium', l: 'Omnivore', i: '🍖' }, { v: 'meat_heavy', l: 'Heavy Meat', i: '🥩🥩' },
  ];
  const WASTE = [
    { v: 'none', l: 'None', i: '✅' }, { v: 'low', l: 'Low', i: '🟡' },
    { v: 'medium', l: 'Medium', i: '🟠' }, { v: 'high', l: 'High', i: '🔴' },
  ];
  const LOCAL = [
    { v: '75_100', l: '75–100%', i: '🏘️' }, { v: '50_75', l: '50–75%', i: '🌿' },
    { v: '25_50', l: '25–50%', i: '🛒' }, { v: '0_25', l: '0–25%', i: '🌐' },
  ];

  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label className="form-label">Diet Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {DIETS.map((d) => (
            <div key={d.v} className={`option-card ${food.dietType === d.v ? 'selected' : ''}`}
              onClick={() => dispatch(updateFood({ dietType: d.v }))}>
              <span style={{ fontSize: '1.4rem' }}>{d.i}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: food.dietType === d.v ? '#00FF88' : 'inherit' }}>{d.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Food Waste Level</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {WASTE.map((w) => (
            <div key={w.v} className={`option-card ${food.foodWasteLevel === w.v ? 'selected' : ''}`}
              onClick={() => dispatch(updateFood({ foodWasteLevel: w.v }))}>
              <span style={{ fontSize: '1.2rem' }}>{w.i}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: food.foodWasteLevel === w.v ? '#00FF88' : 'inherit' }}>{w.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Local / Seasonal Food Purchased</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {LOCAL.map((l) => (
            <div key={l.v} className={`option-card ${food.localFoodPercent === l.v ? 'selected' : ''}`}
              onClick={() => dispatch(updateFood({ localFoodPercent: l.v }))}>
              <span style={{ fontSize: '1.2rem' }}>{l.i}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: food.localFoodPercent === l.v ? '#00FF88' : 'inherit' }}>{l.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Energy Tab ----
function EnergyTab() {
  const dispatch = useAppDispatch();
  const { energy } = useAppSelector((s) => s.calculator.input);

  const HEATING = [
    { v: 'natural_gas', l: 'Natural Gas', i: '🔥' },
    { v: 'electric_heat_pump', l: 'Heat Pump', i: '♨️' },
    { v: 'oil', l: 'Oil', i: '🛢️' },
    { v: 'coal', l: 'Coal', i: '⚫' },
    { v: 'wood', l: 'Biomass', i: '🪵' },
    { v: 'district', l: 'District', i: '🏭' },
  ];

  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Slider label="Monthly electricity use" value={energy.monthlyKwh} min={50} max={1500} step={10}
        unit="kWh" onChange={(v) => dispatch(updateEnergy({ monthlyKwh: v }))} />

      <div>
        <label className="form-label">Heating Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {HEATING.map((h) => (
            <div key={h.v} className={`option-card ${energy.heatingType === h.v ? 'selected' : ''}`}
              onClick={() => dispatch(updateEnergy({ heatingType: h.v }))}>
              <span style={{ fontSize: '1.4rem' }}>{h.i}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: energy.heatingType === h.v ? '#00FF88' : 'inherit' }}>{h.l}</span>
            </div>
          ))}
        </div>
      </div>

      <Slider label="Monthly heating energy" value={energy.heatingKwhPerMonth} min={0} max={500} step={10}
        unit="kWh" onChange={(v) => dispatch(updateEnergy({ heatingKwhPerMonth: v }))} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,255,136,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,255,136,0.12)' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>☀️ Solar Panels</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Do you have rooftop solar?</div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={energy.hasSolar} onChange={(e) => dispatch(updateEnergy({ hasSolar: e.target.checked }))} />
          <span className="toggle-slider" />
        </label>
      </div>

      {energy.hasSolar && (
        <Slider label="Solar offset percentage" value={energy.solarOffsetPercent} min={5} max={100} step={5}
          unit="%" onChange={(v) => dispatch(updateEnergy({ solarOffsetPercent: v }))} />
      )}
    </div>
  );
}

// ---- Lifestyle Tab ----
function LifestyleTab() {
  const dispatch = useAppDispatch();
  const { lifestyle } = useAppSelector((s) => s.calculator.input);

  const SHOPPING = [
    { v: 'minimal', l: 'Minimal', i: '♻️', d: '<€500/yr' },
    { v: 'moderate', l: 'Moderate', i: '🛒', d: '€500–1.5k' },
    { v: 'high', l: 'High', i: '🛍️', d: '€1.5k–3k' },
    { v: 'very_high', l: 'Very High', i: '💸', d: '>€3k/yr' },
  ];

  const DEVICES = [
    { v: '1_year', l: 'Yearly', i: '📱' },
    { v: '2_years', l: 'Every 2yr', i: '📲' },
    { v: '3_years', l: 'Every 3yr', i: '🔋' },
    { v: '5_years', l: '5yr+', i: '♻️' },
  ];

  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label className="form-label">Shopping Spend Level</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SHOPPING.map((s) => (
            <div key={s.v} className={`option-card ${lifestyle.shoppingLevel === s.v ? 'selected' : ''}`}
              onClick={() => dispatch(updateLifestyle({ shoppingLevel: s.v }))}>
              <span style={{ fontSize: '1.4rem' }}>{s.i}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: lifestyle.shoppingLevel === s.v ? '#00FF88' : 'inherit' }}>{s.l}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{s.d}</span>
            </div>
          ))}
        </div>
      </div>

      <Slider label="Streaming hours per week" value={lifestyle.streamingHoursPerWeek} min={0} max={80} step={1}
        unit="h" onChange={(v) => dispatch(updateLifestyle({ streamingHoursPerWeek: v }))} />

      <div>
        <label className="form-label">Device Upgrade Cycle</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {DEVICES.map((d) => (
            <div key={d.v} className={`option-card ${lifestyle.deviceUpgradeCycle === d.v ? 'selected' : ''}`}
              onClick={() => dispatch(updateLifestyle({ deviceUpgradeCycle: d.v }))}>
              <span style={{ fontSize: '1.4rem' }}>{d.i}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: lifestyle.deviceUpgradeCycle === d.v ? '#00FF88' : 'inherit' }}>{d.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Reusable Slider ----
function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#00FF88' }}>
          {value.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{unit}</span>
        </span>
      </div>
      <input type="range" className="form-range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
