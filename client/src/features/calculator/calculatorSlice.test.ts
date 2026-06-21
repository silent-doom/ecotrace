import { describe, it, expect } from 'vitest';
import calculatorReducer, {
  updateTransport,
  updateFood,
  updateEnergy,
  updateLifestyle,
  setLiveResult,
  setActiveTab,
  resetCalculator,
} from './calculatorSlice';
import type { CalculatorResult } from '../../types';

const defaultState = {
  input: {
    transport: { carType: 'car_petrol' as const, carKmPerWeek: 100, flightHoursPerYear: 5, publicTransitKmPerWeek: 20 },
    food: { dietType: 'meat_medium' as const, foodWasteLevel: 'medium' as const, localFoodPercent: '25_50' as const },
    energy: { region: 'global', monthlyKwh: 300, heatingType: 'natural_gas' as const, heatingKwhPerMonth: 100, hasSolar: false, solarOffsetPercent: 30 },
    lifestyle: { shoppingLevel: 'moderate' as const, streamingHoursPerWeek: 10, deviceUpgradeCycle: '3_years' as const },
  },
  liveResult: null,
  activeTab: 'transport' as const,
};

describe('calculatorSlice', () => {
  it('updateTransport merges partial transport fields', () => {
    const state = calculatorReducer(defaultState, updateTransport({ carType: 'car_electric', carKmPerWeek: 200 }));
    expect(state.input.transport.carType).toBe('car_electric');
    expect(state.input.transport.carKmPerWeek).toBe(200);
    // Unmodified fields preserved
    expect(state.input.transport.flightHoursPerYear).toBe(5);
  });

  it('updateFood merges partial food fields', () => {
    const state = calculatorReducer(defaultState, updateFood({ dietType: 'vegan' }));
    expect(state.input.food.dietType).toBe('vegan');
    expect(state.input.food.foodWasteLevel).toBe('medium'); // unchanged
  });

  it('updateEnergy toggles solar correctly', () => {
    const state = calculatorReducer(defaultState, updateEnergy({ hasSolar: true, solarOffsetPercent: 50 }));
    expect(state.input.energy.hasSolar).toBe(true);
    expect(state.input.energy.solarOffsetPercent).toBe(50);
    expect(state.input.energy.monthlyKwh).toBe(300); // unchanged
  });

  it('updateLifestyle updates shopping level', () => {
    const state = calculatorReducer(defaultState, updateLifestyle({ shoppingLevel: 'minimal' }));
    expect(state.input.lifestyle.shoppingLevel).toBe('minimal');
  });

  it('setLiveResult stores the calculation result', () => {
    const result: CalculatorResult = {
      totalKgCO2e: 5000,
      breakdown: { transport: 2000, food: 1500, energy: 1000, lifestyle: 500 },
    };
    const state = calculatorReducer(defaultState, setLiveResult(result));
    expect(state.liveResult).toEqual(result);
    expect(state.liveResult?.totalKgCO2e).toBe(5000);
  });

  it('setActiveTab changes tab', () => {
    const s1 = calculatorReducer(defaultState, setActiveTab('food'));
    expect(s1.activeTab).toBe('food');
    const s2 = calculatorReducer(s1, setActiveTab('energy'));
    expect(s2.activeTab).toBe('energy');
  });

  it('resetCalculator restores default values and clears liveResult', () => {
    const modified = calculatorReducer(defaultState, updateTransport({ carType: 'car_electric', carKmPerWeek: 500 }));
    const result: CalculatorResult = { totalKgCO2e: 1000, breakdown: { transport: 250, food: 250, energy: 250, lifestyle: 250 } };
    const withResult = calculatorReducer(modified, setLiveResult(result));
    const reset = calculatorReducer(withResult, resetCalculator());
    expect(reset.input.transport.carType).toBe('car_petrol');
    expect(reset.input.transport.carKmPerWeek).toBe(100);
    expect(reset.liveResult).toBeNull();
  });

  it('does not mutate previous state (immutability)', () => {
    const before = defaultState.input.transport.carKmPerWeek;
    calculatorReducer(defaultState, updateTransport({ carKmPerWeek: 999 }));
    expect(defaultState.input.transport.carKmPerWeek).toBe(before);
  });
});
