import { JSONFilePreset } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

import { existsSync, accessSync, constants } from 'fs';
import type { Low } from 'lowdb';

function resolveDbPath(): string {
  if (process.env.NODE_ENV !== 'production') {
    return join(__dirname, '../../db.json');
  }
  // Use /data only if a Render disk is mounted there (i.e. it exists & is writable)
  try {
    accessSync('/data', constants.W_OK);
    return '/data/db.json';
  } catch {
    // No disk mounted — fall back to /tmp (ephemeral but always writable)
    return '/tmp/db.json';
  }
}

const dbPath = resolveDbPath();

export async function getDb(): Promise<Low<DbSchema>> {
  return JSONFilePreset<DbSchema>(dbPath, defaultData);
}

