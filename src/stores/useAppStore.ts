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
  SubRace,
  WorkoutLog,
  TrainingLog,
  FeelingLevel,
  AppSettings,
  LimiterType,
  AgeCategory,
  Experience,
  PBs,
  TrainingZones,
  CustomWorkout,
} from '../types';

import { STORAGE_KEYS } from '../constants';
import { calculateEtp, calculateZonesV3, getEffectiveValues, getUserStage, estimateLimiterFromPBs } from '../utils';
import { generatePlan } from '../utils/planGenerator';

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
    monthlyMileage?: number;
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
  // サブレース管理
  addSubRace: (subRace: SubRace) => void;
  removeSubRace: (subRaceId: string) => void;
  // プロフィール変更に応じて計画を再生成（完了状態を保持）
  regeneratePlan: (profile: Profile, testResults: TestResult[]) => void;
  // 特定日のワークアウトを別のメニューに差し替える
  replaceWorkout: (weekNumber: number, dayId: string, newWorkoutId: string, newWorkoutName: string, newWorkoutCategory: string) => void;
  // 実績データを更新（事後記録: 完了状態にし、ゾーン別実績距離等を記録）
  updateActualData: (weekNumber: number, dayId: string, actualData: { distance?: number; duration?: number; notes?: string; zoneDistances?: Partial<Record<string, number>> }) => void;
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

      // サブレース追加
      addSubRace: (subRace) => {
        const plan = get().activePlan;
        if (!plan) return;

        const currentSubRaces = plan.subRaces || [];
        const updatedSubRaces = [...currentSubRaces, subRace].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // サブレースを週間プランに反映 + レース日/前日のメニュー調整
        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          const weekStart = new Date(week.startDate);
          const weekEnd = new Date(week.endDate);
          const subRaceInWeek = updatedSubRaces.find((sr) => {
            const srDate = new Date(sr.date);
            return srDate >= weekStart && srDate <= weekEnd;
          });

          if (!subRaceInWeek) return { ...week, subRace: undefined };

          // サブレース日の曜日を計算（0=月〜6=日）
          const srDate = new Date(subRaceInWeek.date);
          const srDayOfWeek = (srDate.getDay() + 6) % 7;

          const newDays = [...week.days];
          // レース日をレースメニューに変更
          if (newDays[srDayOfWeek] && newDays[srDayOfWeek]!.type !== 'rest') {
            newDays[srDayOfWeek] = {
              ...newDays[srDayOfWeek]!,
              type: 'race' as const,
              label: subRaceInWeek.name || 'レース',
              isKey: true,
              workoutId: undefined,
              focusKey: undefined,
              focusCategory: undefined,
            };
          }
          // 前日の高強度を回避
          const prevDay = (srDayOfWeek - 1 + 7) % 7;
          const prevWorkout = newDays[prevDay];
          if (prevWorkout && (prevWorkout.type === 'workout' || prevWorkout.isKey) && prevWorkout.type !== 'rest') {
            newDays[prevDay] = {
              ...prevWorkout,
              type: 'easy',
              label: 'イージー（レース前調整）',
              isKey: false,
              focusKey: 'aerobic',
              focusCategory: '有酸素ベース',
            };
          }

          return {
            ...week,
            subRace: subRaceInWeek,
            days: newDays,
            workouts: newDays.filter((d): d is NonNullable<typeof d> => d !== null),
          };
        });

        set({
          activePlan: {
            ...plan,
            subRaces: updatedSubRaces,
            weeklyPlans: updatedWeeklyPlans,
          },
        });
      },

      // サブレース削除
      removeSubRace: (subRaceId) => {
        const plan = get().activePlan;
        if (!plan) return;

        const updatedSubRaces = (plan.subRaces || []).filter((sr) => sr.id !== subRaceId);

        // サブレースを週間プランから除去
        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          const weekStart = new Date(week.startDate);
          const weekEnd = new Date(week.endDate);
          const subRaceInWeek = updatedSubRaces.find((sr) => {
            const srDate = new Date(sr.date);
            return srDate >= weekStart && srDate <= weekEnd;
          });
          return { ...week, subRace: subRaceInWeek || undefined };
        });

        set({
          activePlan: {
            ...plan,
            subRaces: updatedSubRaces,
            weeklyPlans: updatedWeeklyPlans,
          },
        });
      },

      // 特定日のワークアウトを別のメニューに差し替える
      replaceWorkout: (weekNumber, dayId, newWorkoutId, newWorkoutName, newWorkoutCategory) => {
        const plan = get().activePlan;
        if (!plan) return;

        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          if (week.weekNumber !== weekNumber) return week;
          return {
            ...week,
            days: week.days.map((d) => {
              if (!d || d.id !== dayId) return d;
              return { ...d, workoutId: newWorkoutId, label: newWorkoutName, focusCategory: newWorkoutCategory };
            }),
            workouts: week.workouts.map((w) => {
              if (w.id !== dayId) return w;
              return { ...w, workoutId: newWorkoutId, label: newWorkoutName, focusCategory: newWorkoutCategory };
            }),
          };
        });

        set({
          activePlan: { ...plan, weeklyPlans: updatedWeeklyPlans },
        });
      },

      // 実績データを更新（事後記録: 完了状態にし、ゾーン別実績距離等を記録）
      updateActualData: (weekNumber, dayId, actualData) => {
        const plan = get().activePlan;
        if (!plan) return;

        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          if (week.weekNumber !== weekNumber) return week;
          return {
            ...week,
            days: week.days.map((d) => {
              if (!d || d.id !== dayId) return d;
              return { ...d, completed: true, actualData };
            }),
            workouts: week.workouts.map((w) => {
              if (w.id !== dayId) return w;
              return { ...w, completed: true, actualData };
            }),
          };
        });

        set({
          activePlan: { ...plan, weeklyPlans: updatedWeeklyPlans },
        });
      },

      // プロフィール変更に応じて計画を再生成（完了状態を保持）
      regeneratePlan: (profile, testResults) => {
        const currentPlan = get().activePlan;
        if (!currentPlan) return;

        // 現在のeTP・リミッターを取得
        const effective = getEffectiveValues(profile, testResults);

        // 既存の完了状態・実績データを保存（ワークアウトIDで索引）
        const completionMap = new Map<string, { completed: boolean; actualData?: { distance?: number; duration?: number; notes?: string } }>();
        for (const week of currentPlan.weeklyPlans) {
          for (const day of week.days) {
            if (day && day.completed) {
              completionMap.set(day.id, { completed: true, actualData: day.actualData });
            }
          }
        }

        // 同じレース・設定で計画を再生成
        const newPlan = generatePlan({
          race: currentPlan.race,
          baseline: { etp: effective.etp, limiterType: effective.limiter },
          restDay: currentPlan.restDay ?? 6,
          keyWorkoutDays: currentPlan.keyWorkoutDays,
          ageCategory: profile.ageCategory,
          experience: profile.experience,
          gender: profile.gender,
          restDayFrequency: currentPlan.restDayFrequency ?? 'auto',
          monthlyMileage: profile.monthlyMileage,
        });

        // 完了状態を復元し、サブレースを再配置
        const subRaces = currentPlan.subRaces || [];
        const restoredWeeklyPlans = newPlan.weeklyPlans.map((week) => {
          const weekStart = new Date(week.startDate);
          const weekEnd = new Date(week.endDate);
          const subRaceInWeek = subRaces.find((sr) => {
            const srDate = new Date(sr.date);
            return srDate >= weekStart && srDate <= weekEnd;
          });

          return {
            ...week,
            subRace: subRaceInWeek || undefined,
            days: week.days.map((day) => {
              if (!day) return day;
              const saved = completionMap.get(day.id);
              if (saved) {
                return { ...day, completed: saved.completed, actualData: saved.actualData };
              }
              return day;
            }),
            workouts: week.workouts.map((w) => {
              const saved = completionMap.get(w.id);
              if (saved) {
                return { ...w, completed: saved.completed, actualData: saved.actualData };
              }
              return w;
            }),
          };
        });

        // 元のID・作成日時・サブレースを保持して更新
        set({
          activePlan: {
            ...newPlan,
            id: currentPlan.id,
            createdAt: currentPlan.createdAt,
            subRaces: currentPlan.subRaces,
            weeklyPlans: restoredWeeklyPlans,
          },
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
// Training Logs Store（トレーニング日誌）
// ============================================

interface TrainingLogsState {
  logs: TrainingLog[];
  addLog: (log: TrainingLog) => void;
  completeLog: (id: string, result: {
    distance?: number;
    duration?: number;
    feeling?: FeelingLevel;
    notes?: string;
  }) => void;
  skipLog: (id: string) => void;
  updateLog: (id: string, updates: Partial<TrainingLog>) => void;
  deleteLog: (id: string) => void;
  getLogsByPlanId: (planId: string) => TrainingLog[];
}

export const useTrainingLogsStore = create<TrainingLogsState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (log) => {
        const current = get().logs;
        set({ logs: [log, ...current] });
      },

      completeLog: (id, result) => {
        const logs = get().logs.map((log) => {
          if (log.id !== id) return log;
          return {
            ...log,
            status: 'completed' as const,
            result,
            completedAt: new Date().toISOString(),
          };
        });
        set({ logs });
      },

      skipLog: (id) => {
        const logs = get().logs.map((log) => {
          if (log.id !== id) return log;
          return { ...log, status: 'skipped' as const };
        });
        set({ logs });
      },

      updateLog: (id, updates) => {
        const logs = get().logs.map((log) => {
          if (log.id !== id) return log;
          return { ...log, ...updates };
        });
        set({ logs });
      },

      deleteLog: (id) => {
        const logs = get().logs.filter((log) => log.id !== id);
        set({ logs });
      },

      getLogsByPlanId: (planId) => {
        return get().logs.filter((log) => log.planId === planId);
      },
    }),
    {
      name: STORAGE_KEYS.trainingLogs,
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

// ============================================
// Custom Workouts Store（オリジナルメニュー）
// ============================================

interface CustomWorkoutsState {
  customWorkouts: CustomWorkout[];
  addCustomWorkout: (workout: CustomWorkout) => void;
  updateCustomWorkout: (id: string, updates: Partial<Omit<CustomWorkout, 'id' | 'createdAt'>>) => void;
  deleteCustomWorkout: (id: string) => void;
}

export const useCustomWorkoutsStore = create<CustomWorkoutsState>()(
  persist(
    (set, get) => ({
      customWorkouts: [],

      addCustomWorkout: (workout) => {
        set({ customWorkouts: [...get().customWorkouts, workout] });
      },

      updateCustomWorkout: (id, updates) => {
        set({
          customWorkouts: get().customWorkouts.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
          ),
        });
      },

      deleteCustomWorkout: (id) => {
        set({ customWorkouts: get().customWorkouts.filter((w) => w.id !== id) });
      },
    }),
    {
      name: STORAGE_KEYS.customWorkouts,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// プロフィール変更時の計画自動同期
// ============================================

// プロフィールまたはテスト結果が変更されたら、既存の計画を自動で再生成する
const syncPlanWithProfile = () => {
  const profile = useProfileStore.getState().profile;
  const testResults = useTestResultsStore.getState().results;
  usePlanStore.getState().regeneratePlan(profile, testResults);
};

// プロフィール変更を監視
useProfileStore.subscribe((state, prevState) => {
  if (state.profile !== prevState.profile) {
    syncPlanWithProfile();
  }
});

// テスト結果変更を監視
useTestResultsStore.subscribe((state, prevState) => {
  if (state.results !== prevState.results) {
    syncPlanWithProfile();
  }
});
