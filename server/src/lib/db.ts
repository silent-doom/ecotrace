import { JSONFilePreset } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface UserRecord {
  id: string;
  createdAt: string;
  region: string;
  householdSize: number;
  personality: string | null;
  onboardingComplete: boolean;
}

export interface FootprintSnapshot {
  id: string;
  userId: string;
  createdAt: string;
  totalKgCO2e: number;
  breakdown: {
    transport: number;
    food: number;
    energy: number;
    lifestyle: number;
  };
  inputs: Record<string, unknown>;
}

export interface ActionCommitment {
  id: string;
  userId: string;
  actionId: string;
  startDate: string;
  lastCheckin: string | null;
  streakDays: number;
  totalSavedKg: number;
}

export interface DbSchema {
  users: UserRecord[];
  footprints: FootprintSnapshot[];
  commitments: ActionCommitment[];
}

const defaultData: DbSchema = {
  users: [],
  footprints: [],
  commitments: [],
};

const dbPath =
  process.env.NODE_ENV === 'production'
    ? '/data/db.json'
    : join(__dirname, '../../db.json');

// Ensure the directory exists before lowdb tries to write to it
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

import type { Low } from 'lowdb';

export async function getDb(): Promise<Low<DbSchema>> {
  return JSONFilePreset<DbSchema>(dbPath, defaultData);
}
