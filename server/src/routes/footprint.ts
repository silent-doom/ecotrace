import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDb } from '../lib/db.js';
import { calculateFootprint, assignPersonality } from '../lib/calculator.js';

const router = Router();

// ── Validation schemas ───────────────────────────────────────────────────────

const VALID_REGIONS = ['global','us','uk','eu','india','china','australia','canada','brazil','south_africa'] as const;
const DIET_TYPES = ['vegan','vegetarian','pescatarian','meat_low','meat_medium','meat_heavy'] as const;
const WASTE_LEVELS = ['none','low','medium','high'] as const;
const LOCAL_FOOD = ['0_25','25_50','50_75','75_100'] as const;
const CAR_TYPES = ['none','car_electric','car_hybrid','car_petrol','car_diesel'] as const;
const HEATING_TYPES = ['natural_gas','electric_heat_pump','oil','wood','district'] as const;
const SHOPPING_LEVELS = ['minimal','moderate','high','very_high'] as const;
const DEVICE_CYCLES = ['1_year','2_years','3_years','5_years'] as const;

const FootprintInputSchema = z.object({
  transport: z.object({
    carType: z.enum(CAR_TYPES),
    carKmPerWeek: z.number().min(0).max(5000),
    flightHoursPerYear: z.number().min(0).max(2000),
    publicTransitKmPerWeek: z.number().min(0).max(1000),
  }),
  food: z.object({
    dietType: z.enum(DIET_TYPES),
    foodWasteLevel: z.enum(WASTE_LEVELS),
    localFoodPercent: z.enum(LOCAL_FOOD),
  }),
  energy: z.object({
    region: z.enum(VALID_REGIONS),
    monthlyKwh: z.number().min(0).max(10000),
    heatingType: z.enum(HEATING_TYPES),
    heatingKwhPerMonth: z.number().min(0).max(5000),
    hasSolar: z.boolean(),
    solarOffsetPercent: z.number().min(0).max(100),
  }),
  lifestyle: z.object({
    shoppingLevel: z.enum(SHOPPING_LEVELS),
    streamingHoursPerWeek: z.number().min(0).max(168),
    deviceUpgradeCycle: z.enum(DEVICE_CYCLES),
  }),
});

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /api/footprint/:userId — save a footprint snapshot
router.post('/:userId', async (req, res) => {
  if (!isValidUUID(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  const parsed = FootprintInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid footprint input', details: parsed.error.flatten() });
  }

  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const result = calculateFootprint(parsed.data);
  const snapshot = {
    id: uuidv4(),
    userId: req.params.userId,
    createdAt: new Date().toISOString(),
    totalKgCO2e: result.totalKgCO2e,
    breakdown: result.breakdown,
    inputs: parsed.data as unknown as Record<string, unknown>,
  };

  db.data.footprints.push(snapshot);

  const userIdx = db.data.users.findIndex((u) => u.id === req.params.userId);
  db.data.users[userIdx].personality = assignPersonality(result.breakdown);
  db.data.users[userIdx].onboardingComplete = true;

  await db.write();
  return res.status(201).json({ snapshot, personality: db.data.users[userIdx].personality });
});

// GET /api/footprint/:userId — all snapshots
router.get('/:userId', async (req, res) => {
  if (!isValidUUID(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  const db = await getDb();
  const snapshots = db.data.footprints
    .filter((f) => f.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(snapshots);
});

// GET /api/footprint/:userId/latest
router.get('/:userId/latest', async (req, res) => {
  if (!isValidUUID(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  const db = await getDb();
  const latest = db.data.footprints
    .filter((f) => f.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!latest) return res.status(404).json({ error: 'No footprint found' });
  return res.json(latest);
});

// POST /api/footprint/:userId/preview — calculate without saving
router.post('/:userId/preview', (req, res) => {
  const parsed = FootprintInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid footprint input', details: parsed.error.flatten() });
  }
  return res.json(calculateFootprint(parsed.data));
});

export default router;
