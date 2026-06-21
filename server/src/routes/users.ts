import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDb } from '../lib/db.js';
import { assignPersonality } from '../lib/calculator.js';

const router = Router();

// ── Validation schemas ───────────────────────────────────────────────────────

const VALID_REGIONS = ['global','us','uk','eu','india','china','australia','canada','brazil','south_africa'] as const;

const CreateUserSchema = z.object({
  region: z.enum(VALID_REGIONS).default('global'),
  householdSize: z.number().int().min(1).max(20).default(1),
});

const UpdateProfileSchema = z.object({
  region: z.enum(VALID_REGIONS).optional(),
  householdSize: z.number().int().min(1).max(20).optional(),
  onboardingComplete: z.boolean().optional(),
});

// UUID v4 regex for param validation
const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /api/users — create anonymous user
router.post('/', async (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const db = await getDb();
  const user = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    region: parsed.data.region,
    householdSize: parsed.data.householdSize,
    personality: null,
    onboardingComplete: false,
  };
  db.data.users.push(user);
  await db.write();
  return res.status(201).json(user);
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

// PUT /api/users/:id/profile
router.put('/:id/profile', async (req, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const db = await getDb();
  const idx = db.data.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  const { region, householdSize, onboardingComplete } = parsed.data;
  if (region !== undefined) db.data.users[idx].region = region;
  if (householdSize !== undefined) db.data.users[idx].householdSize = householdSize;
  if (onboardingComplete !== undefined) db.data.users[idx].onboardingComplete = onboardingComplete;

  // Recalculate personality if we have a footprint
  const latestFootprint = db.data.footprints
    .filter((f) => f.userId === req.params.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (latestFootprint) {
    db.data.users[idx].personality = assignPersonality(latestFootprint.breakdown);
  }

  await db.write();
  return res.json(db.data.users[idx]);
});

export default router;
