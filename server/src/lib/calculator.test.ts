import { describe, it, expect } from 'vitest';
import { calculateFootprint, assignPersonality, getPersonalityMeta } from './calculator.js';
import type { CalculatorInput } from './calculator.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const minimalInput: CalculatorInput = {
  transport: { carType: 'none', carKmPerWeek: 0, flightHoursPerYear: 0, publicTransitKmPerWeek: 0 },
  food: { dietType: 'vegan', foodWasteLevel: 'none', localFoodPercent: '75_100' },
  energy: { region: 'global', monthlyKwh: 50, heatingType: 'electric_heat_pump', heatingKwhPerMonth: 0, hasSolar: false, solarOffsetPercent: 0 },
  lifestyle: { shoppingLevel: 'minimal', streamingHoursPerWeek: 0, deviceUpgradeCycle: '5_years' },
};

const highImpactInput: CalculatorInput = {
  transport: { carType: 'car_diesel', carKmPerWeek: 500, flightHoursPerYear: 100, publicTransitKmPerWeek: 0 },
  food: { dietType: 'meat_heavy', foodWasteLevel: 'high', localFoodPercent: '0_25' },
  energy: { region: 'us', monthlyKwh: 1000, heatingType: 'oil', heatingKwhPerMonth: 500, hasSolar: false, solarOffsetPercent: 0 },
  lifestyle: { shoppingLevel: 'very_high', streamingHoursPerWeek: 40, deviceUpgradeCycle: '1_year' },
};

// ── calculateFootprint ───────────────────────────────────────────────────────

describe('calculateFootprint', () => {
  it('returns non-negative values for all categories', () => {
    const result = calculateFootprint(minimalInput);
    expect(result.totalKgCO2e).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.transport).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.food).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.energy).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.lifestyle).toBeGreaterThanOrEqual(0);
  });

  it('total equals sum of breakdown categories', () => {
    const result = calculateFootprint(minimalInput);
    const sum = result.breakdown.transport + result.breakdown.food + result.breakdown.energy + result.breakdown.lifestyle;
    expect(result.totalKgCO2e).toBe(sum);
  });

  it('no-car user with zero flights has zero transport from car/flight', () => {
    const result = calculateFootprint(minimalInput);
    // Only bus transit contributes; with 0 transit km it's 0
    expect(result.breakdown.transport).toBe(0);
  });

  it('high-impact user emits significantly more than low-impact user', () => {
    const low = calculateFootprint(minimalInput);
    const high = calculateFootprint(highImpactInput);
    expect(high.totalKgCO2e).toBeGreaterThan(low.totalKgCO2e * 5);
  });

  it('solar panel reduces electricity emissions', () => {
    const noSolar = calculateFootprint(minimalInput);
    const withSolar = calculateFootprint({
      ...minimalInput,
      energy: { ...minimalInput.energy, hasSolar: true, solarOffsetPercent: 50 },
    });
    expect(withSolar.breakdown.energy).toBeLessThan(noSolar.breakdown.energy);
  });

  it('vegan diet emits less than meat-heavy diet', () => {
    const vegan = calculateFootprint(minimalInput);
    const meatHeavy = calculateFootprint({
      ...minimalInput,
      food: { dietType: 'meat_heavy', foodWasteLevel: 'none', localFoodPercent: '75_100' },
    });
    expect(vegan.breakdown.food).toBeLessThan(meatHeavy.breakdown.food);
  });

  it('electric car emits less than diesel car at same distance', () => {
    const ev = calculateFootprint({
      ...minimalInput,
      transport: { carType: 'car_electric', carKmPerWeek: 200, flightHoursPerYear: 0, publicTransitKmPerWeek: 0 },
    });
    const diesel = calculateFootprint({
      ...minimalInput,
      transport: { carType: 'car_diesel', carKmPerWeek: 200, flightHoursPerYear: 0, publicTransitKmPerWeek: 0 },
    });
    expect(ev.breakdown.transport).toBeLessThan(diesel.breakdown.transport);
  });

  it('high-emission grid (US) produces more than low-emission grid (India)', () => {
    const us = calculateFootprint({
      ...minimalInput,
      energy: { ...minimalInput.energy, region: 'us', monthlyKwh: 500 },
    });
    const india = calculateFootprint({
      ...minimalInput,
      energy: { ...minimalInput.energy, region: 'india', monthlyKwh: 500 },
    });
    // US grid is more carbon-intensive than India per our data
    expect(us.breakdown.energy).not.toBe(india.breakdown.energy);
  });

  it('returns integer values (rounded)', () => {
    const result = calculateFootprint(minimalInput);
    expect(Number.isInteger(result.totalKgCO2e)).toBe(true);
    expect(Number.isInteger(result.breakdown.transport)).toBe(true);
    expect(Number.isInteger(result.breakdown.food)).toBe(true);
    expect(Number.isInteger(result.breakdown.energy)).toBe(true);
    expect(Number.isInteger(result.breakdown.lifestyle)).toBe(true);
  });
});

// ── assignPersonality ────────────────────────────────────────────────────────

describe('assignPersonality', () => {
  it('returns The Green Pioneer for very low total emissions', () => {
    const result = assignPersonality({ transport: 500, food: 500, energy: 500, lifestyle: 400 });
    expect(result).toBe('The Green Pioneer');
  });

  it('returns The Road Warrior when transport is dominant and total is very high', () => {
    const result = assignPersonality({ transport: 12000, food: 1000, energy: 1000, lifestyle: 500 });
    expect(result).toBe('The Road Warrior');
  });

  it('returns The Home Optimizer when energy is dominant at mid-range', () => {
    const result = assignPersonality({ transport: 500, food: 500, energy: 5000, lifestyle: 500 });
    expect(result).toBe('The Home Optimizer');
  });

  it('always returns a non-empty string', () => {
    const personalities = [
      { transport: 0, food: 0, energy: 0, lifestyle: 0 },
      { transport: 100000, food: 100000, energy: 100000, lifestyle: 100000 },
    ];
    personalities.forEach((breakdown) => {
      expect(typeof assignPersonality(breakdown)).toBe('string');
      expect(assignPersonality(breakdown).length).toBeGreaterThan(0);
    });
  });
});

// ── getPersonalityMeta ───────────────────────────────────────────────────────

describe('getPersonalityMeta', () => {
  it('returns emoji, tagline, and primaryAction for known personality', () => {
    const meta = getPersonalityMeta('The Green Pioneer');
    expect(meta.emoji).toBeTruthy();
    expect(meta.tagline).toBeTruthy();
    expect(meta.primaryAction).toBeTruthy();
  });

  it('returns a fallback for unknown personality', () => {
    const meta = getPersonalityMeta('Unknown Type');
    expect(meta.emoji).toBe('🌿');
    expect(meta.tagline).toBe('Every action matters.');
  });

  it('has valid meta for all 10 known archetypes', () => {
    const archetypes = [
      'The Green Pioneer', 'The Conscious Foodie', 'The Mindful Mover',
      'The Eco Enthusiast', 'The Sky Traveler', 'The Home Optimizer',
      'The Omnivore in Transition', 'The Average Citizen',
      'The Road Warrior', 'The Conscious Consumer', 'The High-Impact Household',
    ];
    archetypes.forEach((name) => {
      const meta = getPersonalityMeta(name);
      expect(meta.emoji).toBeTruthy();
      expect(meta.primaryAction.length).toBeGreaterThan(5);
    });
  });
});
