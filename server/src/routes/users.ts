import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/db.js';
import { assignPersonality } from '../lib/calculator.js';

const router = Router();

// POST /api/users — create anonymous user
router.post('/', async (req, res) => {
  const db = await getDb();
  const { region = 'global', householdSize = 1 } = req.body;
  const user = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    region,
    householdSize,
    personality: null,
    onboardingComplete: false,
  };
  db.data.users.push(user);
  await db.write();
  res.status(201).json(user);
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

// PUT /api/users/:id/profile
router.put('/:id/profile', async (req, res) => {
  const db = await getDb();
  const idx = db.data.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const { region, householdSize, onboardingComplete } = req.body;
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
