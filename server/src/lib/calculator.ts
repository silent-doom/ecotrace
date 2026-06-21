import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const factors = require('../data/emission-factors.json') as typeof import('../data/emission-factors.json');

export interface TransportInput {
  carType: keyof typeof factors.transport | 'none';
  carKmPerWeek: number;
  flightHoursPerYear: number;
  publicTransitKmPerWeek: number;
}

export interface FoodInput {
  dietType: keyof typeof factors.diet;
  foodWasteLevel: keyof typeof factors.food_waste_multiplier;
  localFoodPercent: keyof typeof factors.local_food_discount;
}

export interface EnergyInput {
  region: string;
  monthlyKwh: number;
  heatingType: keyof typeof factors.energy.heating;
  heatingKwhPerMonth: number;
  hasSolar: boolean;
  solarOffsetPercent: number;
}

export interface LifestyleInput {
  shoppingLevel: keyof typeof factors.lifestyle.shopping;
  streamingHoursPerWeek: number;
  deviceUpgradeCycle: keyof typeof factors.lifestyle.device_upgrade_cycle;
}

export interface CalculatorInput {
  transport: TransportInput;
  food: FoodInput;
  energy: EnergyInput;
  lifestyle: LifestyleInput;
}

export interface CalculatorResult {
  totalKgCO2e: number;
  breakdown: {
    transport: number;
    food: number;
    energy: number;
    lifestyle: number;
  };
}

export function calculateFootprint(input: CalculatorInput): CalculatorResult {
  // --- Transport ---
  let transport = 0;
  if (input.transport.carType !== 'none') {
    const carFactor = factors.transport[input.transport.carType];
    transport += carFactor.kgCO2e_per_km * input.transport.carKmPerWeek * 52;
  }
  // Average flight distance: short = 800km, long = 5500km; hours map roughly
  const shortFlightHours = Math.min(input.transport.flightHoursPerYear, 10);
  const longFlightHours = Math.max(0, input.transport.flightHoursPerYear - 10);
  transport += shortFlightHours * 800 * factors.transport.flight_short.kgCO2e_per_km;
  transport += longFlightHours * 850 * factors.transport.flight_long.kgCO2e_per_km;
  transport += factors.transport.bus.kgCO2e_per_km * input.transport.publicTransitKmPerWeek * 52;

  // --- Food ---
  const dietBase = factors.diet[input.food.dietType].kgCO2e_per_day * 365;
  const wasteMultiplier = factors.food_waste_multiplier[input.food.foodWasteLevel];
  const localDiscount = factors.local_food_discount[input.food.localFoodPercent];
  const food = dietBase * wasteMultiplier * localDiscount;

  // --- Energy ---
  const gridIntensity =
    (factors.energy.grid_intensity as Record<string, number>)[input.energy.region] ??
    factors.energy.grid_intensity.global_avg;
  let electricityKg = input.energy.monthlyKwh * 12 * gridIntensity;
  if (input.energy.hasSolar) {
    electricityKg *= 1 - input.energy.solarOffsetPercent / 100;
  }
  const heatingFactor = factors.energy.heating[input.energy.heatingType];
  const heatingKg = input.energy.heatingKwhPerMonth * 12 * heatingFactor.kgCO2e_per_kwh;
  const energy = electricityKg + heatingKg;

  // --- Lifestyle ---
  const shoppingKg = factors.lifestyle.shopping[input.lifestyle.shoppingLevel].kgCO2e_per_year;
  const streamingKg =
    input.lifestyle.streamingHoursPerWeek * 52 * factors.lifestyle.streaming_kgCO2e_per_hour;
  const deviceKg =
    factors.lifestyle.device_upgrade_cycle[input.lifestyle.deviceUpgradeCycle].kgCO2e_per_year;
  const lifestyle = shoppingKg + streamingKg + deviceKg;

  const totalKgCO2e = transport + food + energy + lifestyle;

  return {
    totalKgCO2e: Math.round(totalKgCO2e),
    breakdown: {
      transport: Math.round(transport),
      food: Math.round(food),
      energy: Math.round(energy),
      lifestyle: Math.round(lifestyle),
    },
  };
}

export function assignPersonality(breakdown: CalculatorResult['breakdown']): string {
  const { transport, food, energy, lifestyle } = breakdown;
  const total = transport + food + energy + lifestyle;
  const maxCategory = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0][0];

  if (total < 2000) return 'The Green Pioneer';
  if (total < 4000) {
    if (maxCategory === 'food') return 'The Conscious Foodie';
    if (maxCategory === 'transport') return 'The Mindful Mover';
    return 'The Eco Enthusiast';
  }
  if (total < 8000) {
    if (maxCategory === 'transport' && transport > 3000) return 'The Sky Traveler';
    if (maxCategory === 'energy') return 'The Home Optimizer';
    if (maxCategory === 'food') return 'The Omnivore in Transition';
    return 'The Average Citizen';
  }
  if (maxCategory === 'transport') return 'The Road Warrior';
  if (maxCategory === 'lifestyle') return 'The Conscious Consumer';
  return 'The High-Impact Household';
}

export function getPersonalityMeta(personality: string): {
  emoji: string;
  tagline: string;
  primaryAction: string;
} {
  const map: Record<string, { emoji: string; tagline: string; primaryAction: string }> = {
    'The Green Pioneer': {
      emoji: '🌱',
      tagline: 'You are already leading the way. Help others follow.',
      primaryAction: 'Advocate for climate policy in your community',
    },
    'The Conscious Foodie': {
      emoji: '🥗',
      tagline: 'Your plate is your most powerful climate tool.',
      primaryAction: 'Try full plant-based for one week',
    },
    'The Mindful Mover': {
      emoji: '🚲',
      tagline: 'Every journey is a choice. You make good ones.',
      primaryAction: 'Cycle to work 3 days this week',
    },
    'The Eco Enthusiast': {
      emoji: '♻️',
      tagline: 'You care. Now let that care compound.',
      primaryAction: 'Switch to a renewable energy tariff',
    },
    'The Sky Traveler': {
      emoji: '✈️',
      tagline: 'The sky is beautiful — let\'s keep it that way.',
      primaryAction: 'Replace one flight with a train journey',
    },
    'The Home Optimizer': {
      emoji: '🏠',
      tagline: 'Your home is your biggest opportunity.',
      primaryAction: 'Install a smart thermostat this month',
    },
    'The Omnivore in Transition': {
      emoji: '🥩',
      tagline: 'Small shifts in diet create big changes.',
      primaryAction: 'Reduce red meat to twice a week',
    },
    'The Average Citizen': {
      emoji: '🌍',
      tagline: 'Average isn\'t your ceiling. It\'s your starting point.',
      primaryAction: 'Pick your single biggest lever and act on it',
    },
    'The Road Warrior': {
      emoji: '🚗',
      tagline: 'The road ahead is electric. Are you ready?',
      primaryAction: 'Research electric vehicle options',
    },
    'The Conscious Consumer': {
      emoji: '🛍️',
      tagline: 'Every purchase is a vote. Vote wisely.',
      primaryAction: 'Buy second-hand for your next 3 purchases',
    },
    'The High-Impact Household': {
      emoji: '⚡',
      tagline: 'High impact, high opportunity. The changes are within reach.',
      primaryAction: 'Conduct a home energy audit this week',
    },
  };
  return (
    map[personality] ?? {
      emoji: '🌿',
      tagline: 'Every action matters.',
      primaryAction: 'Start with one small change today',
    }
  );
}
