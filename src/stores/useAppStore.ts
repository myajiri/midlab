// ============================================
// Zustand Store
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Profile,
  TestResult,
  RacePlan,
  WorkoutLog,
  AppSettings,
  LimiterType,
  AgeCategory,
  Experience,
  PBs,
  TrainingZones,
} from '../types';

import { STORAGE_KEYS } from '../constants';
import { calculateEtp, calculateZonesV3, getEffectiveValues, getUserStage, estimateLimiterFromPBs } from '../utils';

// ============================================
// Profile Store
// ============================================

interface ProfileState {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  updatePBs: (pbs: PBs) => void;
  updateAttributes: (attrs: {
    displayName?: string;
    ageCategory?: AgeCategory;
    gender?: Profile['gender'];
    experience?: Experience;
  }) => void;
  setLimiterType: (limiterType: LimiterType) => void;
  setEstimated: (etp: number, limiterType: LimiterType) => void;
  updateEstimated: (data: { etp: number; limiterType: LimiterType; confidence: 'low' | 'medium' | 'high' }) => void;
  setCurrent: (etp: number, limiterType: LimiterType) => void;
  resetProfile: () => void;
}

const defaultProfile: Profile = {
  ageCategory: 'senior',
  gender: 'other',
  experience: 'intermediate',
  pbs: {},
  estimated: null,
  current: null,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,

      setProfile: (profile) => set({ profile }),

      updatePBs: (pbs) => {
        const current = get().profile;
        const newPbs = { ...current.pbs, ...pbs };
        const etpResult = calculateEtp(newPbs, current.ageCategory, current.experience);

        // 複数PBからリミッタータイプを自動推定（テスト測定値がない場合）
        const autoLimiter = estimateLimiterFromPBs(newPbs);
        const limiterType = !current.current
          ? autoLimiter
          : (current.estimated?.limiterType || 'balanced');

        set({
          profile: {
            ...current,
            pbs: newPbs,
            estimated: etpResult ? {
              etp: etpResult.adjustedEtp,
              confidence: etpResult.confidence,
              adjustments: etpResult.adjustments,
              limiterType,
            } : current.estimated,
          },
        });
      },

      updateAttributes: (attrs) => {
        const current = get().profile;
        const newProfile = { ...current, ...attrs };
        const etpResult = calculateEtp(
          newProfile.pbs,
          newProfile.ageCategory,
          newProfile.experience
        );

        set({
          profile: {
            ...newProfile,
            estimated: etpResult ? {
              etp: etpResult.adjustedEtp,
              confidence: etpResult.confidence,
              adjustments: etpResult.adjustments,
              limiterType: current.estimated?.limiterType || 'balanced',
            } : current.estimated,
          },
        });
      },

      setLimiterType: (limiterType) => {
        const current = get().profile;
        set({
          profile: {
            ...current,
            estimated: {
              ...current.estimated,
              etp: current.estimated?.etp || 0,
              confidence: current.estimated?.confidence || 'low',
              adjustments: current.estimated?.adjustments || [],
              limiterType,
            },
          },
        });
      },

      setEstimated: (etp, limiterType) => {
        const current = get().profile;
        set({
          profile: {
            ...current,
            estimated: {
              etp,
              confidence: 'medium',
              adjustments: [],
              limiterType,
            },
          },
        });
      },

      updateEstimated: (data) => {
        const current = get().profile;
        set({
          profile: {
            ...current,
            estimated: {
              etp: data.etp,
              confidence: data.confidence,
              adjustments: [],
              limiterType: data.limiterType,
            },
          },
        });
      },

      setCurrent: (etp, limiterType) => {
        const current = get().profile;
        set({
          profile: {
            ...current,
            current: {
              etp,
              limiterType,
              lastTestDate: new Date().toISOString(),
            },
          },
        });
      },

      resetProfile: () => set({ profile: defaultProfile }),
    }),
    {
      name: STORAGE_KEYS.profile,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Test Results Store
// ============================================

interface TestResultsState {
  results: TestResult[];
  addResult: (result: TestResult) => void;
  getLatestResult: () => TestResult | null;
  clearResults: () => void;
}

export const useTestResultsStore = create<TestResultsState>()(
  persist(
    (set, get) => ({
      results: [],

      addResult: (result) => {
        const current = get().results;
        set({ results: [result, ...current] });
      },

      getLatestResult: () => {
        const results = get().results;
        return results.length > 0 ? results[0] : null;
      },

      clearResults: () => set({ results: [] }),
    }),
    {
      name: STORAGE_KEYS.testResults,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Plan Store
// ============================================

interface PlanState {
  activePlan: RacePlan | null;
  setPlan: (plan: RacePlan) => void;
  clearPlan: () => void;
  markWorkoutComplete: (weekNumber: number, workoutId: string, actualData?: {
    distance?: number;
    duration?: number;
    notes?: string;
  }) => void;
  toggleWorkoutComplete: (weekNumber: number, workoutId: string) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      activePlan: null,

      setPlan: (plan) => set({ activePlan: plan }),

      clearPlan: () => set({ activePlan: null }),

      markWorkoutComplete: (weekNumber, workoutId, actualData) => {
        const plan = get().activePlan;
        if (!plan) return;

        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          if (week.weekNumber !== weekNumber) return week;
          return {
            ...week,
            workouts: week.workouts.map((w) => {
              if (w.id !== workoutId) return w;
              return { ...w, completed: true, actualData };
            }),
            days: week.days.map((d) => {
              if (!d || d.id !== workoutId) return d;
              return { ...d, completed: true, actualData };
            }),
          };
        });

        set({
          activePlan: { ...plan, weeklyPlans: updatedWeeklyPlans },
        });
      },

      // 完了状態をトグル（完了→未完了、未完了→完了）
      toggleWorkoutComplete: (weekNumber, workoutId) => {
        const plan = get().activePlan;
        if (!plan) return;

        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          if (week.weekNumber !== weekNumber) return week;
          return {
            ...week,
            workouts: week.workouts.map((w) => {
              if (w.id !== workoutId) return w;
              return { ...w, completed: !w.completed, actualData: w.completed ? undefined : w.actualData };
            }),
            days: week.days.map((d) => {
              if (!d || d.id !== workoutId) return d;
              return { ...d, completed: !d.completed, actualData: d.completed ? undefined : d.actualData };
            }),
          };
        });

        set({
          activePlan: { ...plan, weeklyPlans: updatedWeeklyPlans },
        });
      },
    }),
    {
      name: STORAGE_KEYS.activePlan,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Workout Logs Store
// ============================================

interface WorkoutLogsState {
  logs: WorkoutLog[];
  addLog: (log: WorkoutLog) => void;
  clearLogs: () => void;
}

export const useWorkoutLogsStore = create<WorkoutLogsState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (log) => {
        const current = get().logs;
        set({ logs: [log, ...current] });
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: STORAGE_KEYS.workoutLogs,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Settings Store
// ============================================

interface SettingsState {
  settings: AppSettings;
  onboardingComplete: boolean;
  setSettings: (settings: Partial<AppSettings>) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: { useNewUI: true },
      onboardingComplete: false,

      setSettings: (newSettings) => {
        const current = get().settings;
        set({ settings: { ...current, ...newSettings } });
      },

      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Derived Hooks
// ============================================

export const useEffectiveValues = () => {
  const profile = useProfileStore((state) => state.profile);
  const results = useTestResultsStore((state) => state.results);
  return getEffectiveValues(profile, results);
};

export const useUserStage = () => {
  const profile = useProfileStore((state) => state.profile);
  const results = useTestResultsStore((state) => state.results);
  const activePlan = usePlanStore((state) => state.activePlan);
  return getUserStage(profile, results, activePlan);
};

export const useTrainingZones = (): TrainingZones => {
  const { etp, limiter } = useEffectiveValues();
  return calculateZonesV3(etp, limiter);
};
