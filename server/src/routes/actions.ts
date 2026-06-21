import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/db.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(__dirname, '../data/actions-catalog.json'), 'utf-8')
) as Array<{
  id: string;
  category: string;
  title: string;
  description: string;
  kgCO2e_saved_per_year: number;
  effort: number;
  time_minutes_per_day: number;
  tags: string[];
}>;

const router = Router();

// GET /api/actions — full catalog
router.get('/', (_req, res) => {
  return res.json(catalog);
});

// POST /api/actions/:userId/commit — commit to an action
router.post('/:userId/commit', async (req, res) => {
  const db = await getDb();
  const { actionId } = req.body;
  if (!actionId) return res.status(400).json({ error: 'actionId required' });

  const action = catalog.find((a) => a.id === actionId);
  if (!action) return res.status(404).json({ error: 'Action not found' });

  // Check if already committed
  const existing = db.data.commitments.find(
    (c) => c.userId === req.params.userId && c.actionId === actionId
  );
  if (existing) return res.status(409).json({ error: 'Already committed', commitment: existing });

  const commitment = {
    id: uuidv4(),
    userId: req.params.userId,
    actionId,
    startDate: new Date().toISOString(),
    lastCheckin: null,
    streakDays: 0,
    totalSavedKg: 0,
  };

  db.data.commitments.push(commitment);
  await db.write();
  return res.status(201).json({ commitment, action });
});

// GET /api/actions/:userId/active — active commitments with streak info
router.get('/:userId/active', async (req, res) => {
  const db = await getDb();
  const commitments = db.data.commitments.filter((c) => c.userId === req.params.userId);
  const enriched = commitments.map((c) => {
    const action = catalog.find((a) => a.id === c.actionId);
    return { ...c, action };
  });
  return res.json(enriched);
});

// PATCH /api/actions/:userId/:actionId/checkin — daily check-in
router.patch('/:userId/:actionId/checkin', async (req, res) => {
  const db = await getDb();
  const idx = db.data.commitments.findIndex(
    (c) => c.userId === req.params.userId && c.actionId === req.params.actionId
  );
  if (idx === -1) return res.status(404).json({ error: 'Commitment not found' });

  const commitment = db.data.commitments[idx];
  const now = new Date();
  const lastCheckin = commitment.lastCheckin ? new Date(commitment.lastCheckin) : null;

  // Check if already checked in today
  if (lastCheckin && lastCheckin.toDateString() === now.toDateString()) {
    return res.status(409).json({ error: 'Already checked in today', commitment });
  }

  // Check if streak continues (within 25 hours to allow flexibility)
  const isConsecutive =
    lastCheckin && now.getTime() - lastCheckin.getTime() < 25 * 60 * 60 * 1000;
  const newStreak = isConsecutive ? commitment.streakDays + 1 : 1;

  const action = catalog.find((a) => a.id === req.params.actionId);
  const dailySaving = action ? action.kgCO2e_saved_per_year / 365 : 0;

  db.data.commitments[idx].lastCheckin = now.toISOString();
  db.data.commitments[idx].streakDays = newStreak;
  db.data.commitments[idx].totalSavedKg += dailySaving;

  await db.write();
  return res.json(db.data.commitments[idx]);
});

// DELETE /api/actions/:userId/:actionId — remove commitment
router.delete('/:userId/:actionId', async (req, res) => {
  const db = await getDb();
  const before = db.data.commitments.length;
  db.data.commitments = db.data.commitments.filter(
    (c) => !(c.userId === req.params.userId && c.actionId === req.params.actionId)
  );
  if (db.data.commitments.length === before)
    return res.status(404).json({ error: 'Commitment not found' });
  await db.write();
  return res.status(204).send();
});

export default router;
