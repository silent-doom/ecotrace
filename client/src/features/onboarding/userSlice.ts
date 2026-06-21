import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userId: string | null;
  onboardingStep: number; // 0=not started, 1,2,3=steps, 4=complete
  region: string;
  householdSize: number;
}

const STORAGE_KEY = 'ecotrace_user_id';

const initialState: UserState = {
  userId: localStorage.getItem(STORAGE_KEY),
  onboardingStep: localStorage.getItem(STORAGE_KEY) ? 4 : 1,
  region: 'global',
  householdSize: 1,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId(state, action: PayloadAction<string>) {
      state.userId = action.payload;
      localStorage.setItem(STORAGE_KEY, action.payload);
    },
    setOnboardingStep(state, action: PayloadAction<number>) {
      state.onboardingStep = action.payload;
    },
    setRegion(state, action: PayloadAction<string>) {
      state.region = action.payload;
    },
    setHouseholdSize(state, action: PayloadAction<number>) {
      state.householdSize = action.payload;
    },
    completeOnboarding(state) {
      state.onboardingStep = 4;
    },
    resetUser(state) {
      state.userId = null;
      state.onboardingStep = 0;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const {
  setUserId,
  setOnboardingStep,
  setRegion,
  setHouseholdSize,
  completeOnboarding,
  resetUser,
} = userSlice.actions;

export default userSlice.reducer;
