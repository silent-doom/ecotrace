import { describe, it, expect, beforeEach } from 'vitest';
import userReducer, {
  setUserId,
  setOnboardingStep,
  setRegion,
  setHouseholdSize,
  completeOnboarding,
  resetUser,
} from './userSlice';

// ── Helpers ──────────────────────────────────────────────────────────────────
const freshState = () => ({
  userId: null as string | null,
  onboardingStep: 1,
  region: 'global',
  householdSize: 1,
});

describe('userSlice', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('has correct default state shape', () => {
    const state = freshState();
    expect(state.userId).toBeNull();
    expect(state.onboardingStep).toBe(1);
    expect(state.region).toBe('global');
    expect(state.householdSize).toBe(1);
  });

  it('setUserId updates userId and persists to localStorage', () => {
    const state = userReducer(freshState(), setUserId('abc-123'));
    expect(state.userId).toBe('abc-123');
    expect(globalThis.localStorage.getItem('ecotrace_user_id')).toBe('abc-123');
  });

  it('setOnboardingStep advances the step', () => {
    const s1 = userReducer(freshState(), setOnboardingStep(2));
    expect(s1.onboardingStep).toBe(2);
    const s2 = userReducer(s1, setOnboardingStep(3));
    expect(s2.onboardingStep).toBe(3);
  });

  it('completeOnboarding sets step to 4', () => {
    const state = userReducer(freshState(), completeOnboarding());
    expect(state.onboardingStep).toBe(4);
  });

  it('setRegion updates region', () => {
    const state = userReducer(freshState(), setRegion('india'));
    expect(state.region).toBe('india');
  });

  it('setHouseholdSize updates householdSize', () => {
    const state = userReducer(freshState(), setHouseholdSize(4));
    expect(state.householdSize).toBe(4);
  });

  it('resetUser clears userId, resets step, and removes from localStorage', () => {
    globalThis.localStorage.setItem('ecotrace_user_id', 'some-id');
    const populated = { userId: 'some-id', onboardingStep: 4, region: 'us', householdSize: 3 };
    const state = userReducer(populated, resetUser());
    expect(state.userId).toBeNull();
    expect(state.onboardingStep).toBe(0);
    expect(globalThis.localStorage.getItem('ecotrace_user_id')).toBeNull();
  });

  it('does not mutate previous state (immutability)', () => {
    const initial = freshState();
    const next = userReducer(initial, setRegion('eu'));
    expect(initial.region).toBe('global'); // original unchanged
    expect(next.region).toBe('eu');
  });
});
