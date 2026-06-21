// Shared TypeScript types across the EcoTrace client

export interface User {
  id: string;
  createdAt: string;
  region: string;
  householdSize: number;
  personality: string | null;
  onboardingComplete: boolean;
}

export interface FootprintBreakdown {
  transport: number;
  food: number;
  energy: number;
  lifestyle: number;
}

export interface FootprintSnapshot {
  id: string;
  userId: string;
  createdAt: string;
  totalKgCO2e: number;
  breakdown: FootprintBreakdown;
  inputs: Record<string, unknown>;
}

export interface TransportInput {
  carType: string;
  carKmPerWeek: number;
  flightHoursPerYear: number;
  publicTransitKmPerWeek: number;
}

export interface FoodInput {
  dietType: string;
  foodWasteLevel: string;
  localFoodPercent: string;
}

export interface EnergyInput {
  region: string;
  monthlyKwh: number;
  heatingType: string;
  heatingKwhPerMonth: number;
  hasSolar: boolean;
  solarOffsetPercent: number;
}

export interface LifestyleInput {
  shoppingLevel: string;
  streamingHoursPerWeek: number;
  deviceUpgradeCycle: string;
}

export interface CalculatorInput {
  transport: TransportInput;
  food: FoodInput;
  energy: EnergyInput;
  lifestyle: LifestyleInput;
}

export interface CalculatorResult {
  totalKgCO2e: number;
  breakdown: FootprintBreakdown;
}

export interface Action {
  id: string;
  category: 'transport' | 'food' | 'energy' | 'lifestyle';
  title: string;
  description: string;
  kgCO2e_saved_per_year: number;
  effort: number;
  time_minutes_per_day: number;
  tags: string[];
}

export interface ActionCommitment {
  id: string;
  userId: string;
  actionId: string;
  startDate: string;
  lastCheckin: string | null;
  streakDays: number;
  totalSavedKg: number;
  action?: Action;
}

export interface Insight {
  type: 'lever' | 'quickwin' | 'comparison' | 'celebrate';
  title: string;
  body: string;
  metric: string;
  priority: number;
}

export interface PersonalityMeta {
  emoji: string;
  tagline: string;
  primaryAction: string;
}

export type CategoryKey = 'transport' | 'food' | 'energy' | 'lifestyle';

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  transport: '#3B82F6',
  food: '#10B981',
  energy: '#F59E0B',
  lifestyle: '#8B5CF6',
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  transport: 'Transport',
  food: 'Food & Diet',
  energy: 'Home Energy',
  lifestyle: 'Lifestyle',
};

export const CATEGORY_ICONS: Record<CategoryKey, string> = {
  transport: '🚗',
  food: '🍽️',
  energy: '⚡',
  lifestyle: '🛍️',
};
