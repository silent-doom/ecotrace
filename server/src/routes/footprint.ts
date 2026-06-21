import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/db.js';
import { calculateFootprint, assignPersonality, type CalculatorInput } from '../lib/calculator.js';

const router = Router();

// POST /api/footprint/:userId — save a footprint snapshot
router.post('/:userId', async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const input: CalculatorInput = req.body;
  const result = calculateFootprint(input);

  const snapshot = {
    id: uuidv4(),
    userId: req.params.userId,
    createdAt: new Date().toISOString(),
    totalKgCO2e: result.totalKgCO2e,
    breakdown: result.breakdown,
    inputs: input as unknown as Record<string, unknown>,
  };

  db.data.footprints.push(snapshot);

  // Update user personality
  const userIdx = db.data.users.findIndex((u) => u.id === req.params.userId);
  db.data.users[userIdx].personality = assignPersonality(result.breakdown);
  db.data.users[userIdx].onboardingComplete = true;

  await db.write();
  return res.status(201).json({ snapshot, personality: db.data.users[userIdx].personality });
});

// GET /api/footprint/:userId — all snapshots
router.get('/:userId', async (req, res) => {
  const db = await getDb();
  const snapshots = db.data.footprints
    .filter((f) => f.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(snapshots);
});

// GET /api/footprint/:userId/latest
router.get('/:userId/latest', async (req, res) => {
  const db = await getDb();
  const latest = db.data.footprints
    .filter((f) => f.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!latest) return res.status(404).json({ error: 'No footprint found' });
  return res.json(latest);
});

// POST /api/footprint/:userId/preview — calculate without saving
router.post('/:userId/preview', async (req, res) => {
  const input: CalculatorInput = req.body;
  const result = calculateFootprint(input);
  return res.json(result);
});

export default router;
