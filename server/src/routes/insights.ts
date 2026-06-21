import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const factors = require('../data/emission-factors.json') as typeof import('../data/emission-factors.json');

const router = Router();

const TIPS = [
  'Charging your phone overnight wastes 40% of the energy used. Charge to 80% during the day.',
  'A plant-based burger uses 75% less water and 95% less land than a beef burger.',
  'Streaming an hour of HD video uses about 36g CO₂e — less than driving 200 metres.',
  'The fashion industry emits more CO₂ than aviation and shipping combined.',
  'If food waste were a country, it would be the 3rd largest emitter in the world.',
  'A single tree absorbs ~25kg of CO₂ per year when mature.',
  'EVs have 50-70% lower lifecycle emissions even in coal-heavy grids.',
  'Switching to a green bank can cut your financial carbon footprint by over 1 tonne/year.',
  'Teleconferencing one day a week instead of commuting saves ~700kg CO₂e per person/year.',
  'Composting 50% of food waste prevents the equivalent of 500kg CO₂e from methane.',
  'A 5-minute shower uses ~35 litres of hot water. A bath uses 150 litres.',
  'Buying second-hand extends garment life by ~2 years, cutting its carbon impact by 24%.',
  'The Paris Agreement target is 1.5°C warming — requiring per-capita emissions below 1.5 tonnes/year.',
  'Solar panels in most regions pay back their carbon debt in under 2 years.',
  'Eating seasonally and locally cuts food transport emissions by up to 50%.',
];

// GET /api/insights/:userId — personalized insights
router.get('/:userId', async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const latest = db.data.footprints
    .filter((f) => f.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latest) return res.json({ insights: [], tip: getTodayTip() });

  const regionAvg =
    (factors.regional_averages as Record<string, number>)[user.region] ??
    factors.regional_averages.global;
  const parisTarget = factors.paris_target_kg;

  const insights = generateInsights(latest.breakdown, latest.totalKgCO2e, regionAvg, parisTarget);
  return res.json({ insights, tip: getTodayTip() });
});

// GET /api/insights/tips/today
router.get('/tips/today', (_req, res) => {
  return res.json({ tip: getTodayTip() });
});

// GET /api/averages/:region
router.get('/averages/:region', (req, res) => {
  const avg =
    (factors.regional_averages as Record<string, number>)[req.params.region] ??
    factors.regional_averages.global;
  return res.json({
    region: req.params.region,
    avgKgCO2ePerYear: avg,
    parisTarget: factors.paris_target_kg,
  });
});

function getTodayTip(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS[dayOfYear % TIPS.length];
}

function generateInsights(
  breakdown: { transport: number; food: number; energy: number; lifestyle: number },
  total: number,
  regionAvg: number,
  parisTarget: number
) {
  const insights: Array<{
    type: 'lever' | 'quickwin' | 'comparison' | 'celebrate';
    title: string;
    body: string;
    metric: string;
    priority: number;
  }> = [];

  const entries = Object.entries(breakdown) as Array<[string, number]>;
  const [topCategory, topValue] = entries.sort((a, b) => b[1] - a[1])[0];
  const topPercent = Math.round((topValue / total) * 100);

  // Biggest lever
  const categoryLabels: Record<string, string> = {
    transport: 'Transport',
    food: 'Food & Diet',
    energy: 'Home Energy',
    lifestyle: 'Lifestyle & Shopping',
  };
  insights.push({
    type: 'lever',
    title: `Your Biggest Lever: ${categoryLabels[topCategory]}`,
    body: `${categoryLabels[topCategory]} accounts for ${topPercent}% of your footprint (${Math.round(topValue / 1000 * 10) / 10} tonnes CO₂e). Focusing here will have the greatest impact.`,
    metric: `${topPercent}% of total`,
    priority: 1,
  });

  // vs Paris target
  const vsParisMultiple = Math.round((total / parisTarget) * 10) / 10;
  if (vsParisMultiple > 1) {
    insights.push({
      type: 'comparison',
      title: `${vsParisMultiple}× the Paris Agreement Target`,
      body: `The Paris Agreement requires per-person emissions below 1.5 tonnes/year by 2050. You're currently at ${Math.round(total / 100) / 10} tonnes. Cutting ${Math.round((total - parisTarget) / 1000 * 10) / 10} tonnes will close that gap.`,
      metric: `${vsParisMultiple}× over target`,
      priority: 2,
    });
  } else {
    insights.push({
      type: 'celebrate',
      title: 'Below the Paris Target! 🎉',
      body: `You're one of the few already living within sustainable limits. Your footprint of ${Math.round(total / 100) / 10} tonnes is below the 1.5-tonne Paris target.`,
      metric: 'Paris-aligned!',
      priority: 2,
    });
  }

  // vs regional average
  const vsDiff = Math.round(((total - regionAvg) / regionAvg) * 100);
  if (vsDiff > 10) {
    insights.push({
      type: 'comparison',
      title: `${vsDiff}% Above Your Regional Average`,
      body: `The average person in your region emits ${Math.round(regionAvg / 100) / 10} tonnes/year. You're ${vsDiff}% above that. The good news: you have clear room to improve.`,
      metric: `+${vsDiff}% vs average`,
      priority: 3,
    });
  } else if (vsDiff < -10) {
    insights.push({
      type: 'celebrate',
      title: `${Math.abs(vsDiff)}% Below Your Regional Average`,
      body: `You're already outperforming most people in your region. Share your habits — your choices make a difference.`,
      metric: `${Math.abs(vsDiff)}% below average`,
      priority: 3,
    });
  }

  // Quick win — smallest category with significant room
  const [quickCategory, quickValue] = entries.sort((a, b) => a[1] - b[1])[0];
  if (quickValue > 200) {
    insights.push({
      type: 'quickwin',
      title: `Quick Win: Reduce ${categoryLabels[quickCategory]}`,
      body: `${categoryLabels[quickCategory]} is your lowest-emission category at ${Math.round(quickValue)} kg/year — but even small reductions here compound over time.`,
      metric: `${Math.round(quickValue)} kg/yr`,
      priority: 4,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export default router;
