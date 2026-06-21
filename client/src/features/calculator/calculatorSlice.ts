import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CalculatorInput, CalculatorResult } from '../../types';

interface CalculatorState {
  input: CalculatorInput;
  liveResult: CalculatorResult | null;
  activeTab: 'transport' | 'food' | 'energy' | 'lifestyle';
}

const defaultInput: CalculatorInput = {
  transport: {
    carType: 'car_petrol',
    carKmPerWeek: 100,
    flightHoursPerYear: 5,
    publicTransitKmPerWeek: 20,
  },
  food: {
    dietType: 'meat_medium',
    foodWasteLevel: 'medium',
    localFoodPercent: '25_50',
  },
  energy: {
    region: 'global',
    monthlyKwh: 300,
    heatingType: 'natural_gas',
    heatingKwhPerMonth: 100,
    hasSolar: false,
    solarOffsetPercent: 30,
  },
  lifestyle: {
    shoppingLevel: 'moderate',
    streamingHoursPerWeek: 10,
    deviceUpgradeCycle: '3_years',
  },
};

const initialState: CalculatorState = {
  input: defaultInput,
  liveResult: null,
  activeTab: 'transport',
};

const calculatorSlice = createSlice({
  name: 'calculator',
  initialState,
  reducers: {
    updateTransport(state, action: PayloadAction<Partial<CalculatorInput['transport']>>) {
      state.input.transport = { ...state.input.transport, ...action.payload };
    },
    updateFood(state, action: PayloadAction<Partial<CalculatorInput['food']>>) {
      state.input.food = { ...state.input.food, ...action.payload };
    },
    updateEnergy(state, action: PayloadAction<Partial<CalculatorInput['energy']>>) {
      state.input.energy = { ...state.input.energy, ...action.payload };
    },
    updateLifestyle(state, action: PayloadAction<Partial<CalculatorInput['lifestyle']>>) {
      state.input.lifestyle = { ...state.input.lifestyle, ...action.payload };
    },
    setLiveResult(state, action: PayloadAction<CalculatorResult>) {
      state.liveResult = action.payload;
    },
    setActiveTab(state, action: PayloadAction<CalculatorState['activeTab']>) {
      state.activeTab = action.payload;
    },
    resetCalculator(state) {
      state.input = defaultInput;
      state.liveResult = null;
    },
  },
});

export const {
  updateTransport,
  updateFood,
  updateEnergy,
  updateLifestyle,
  setLiveResult,
  setActiveTab,
  resetCalculator,
} = calculatorSlice.actions;

export default calculatorSlice.reducer;
