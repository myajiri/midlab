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
  ScheduledWorkout,
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
import { calculateEtp, calculateZonesV3, getEffectiveValues, getUserStage, estimateLimiterFromPBs, toDateStr, parseDateStr } from '../utils';
import { generatePlan } from '../utils/planGenerator';
import i18next from 'i18next';

// サブレースの距離に対応するレースワークアウトIDを返す
function selectRaceWorkoutId(distance: number | 'custom', customDistance?: number): string | undefined {
  const d = distance === 'custom' ? (customDistance || 5000) : distance;
  if (d <= 800) return 'race-800';
  if (d <= 1500) return 'race-1500';
  if (d <= 3000) return 'race-3000';
  if (d <= 5000) return 'race-5000';
  if (d <= 10000) return 'race-10000';
  if (d <= 21097) return 'race-half';
  return 'race-full';
}

// サブレースの優先度に応じてレース前の日を調整するヘルパー
// 返り値: { days: 調整後のdays配列, originalDays: 変更前の元データ }
function applySubRaceAdjustments(
  days: Array<ScheduledWorkout | null>,
  srDayOfWeek: number,
  subRace: SubRace,
): { days: Array<ScheduledWorkout | null>; originalDays: { [dayIndex: number]: ScheduledWorkout | null } } {
  const newDays = [...days];
  const originalDays: { [dayIndex: number]: ScheduledWorkout | null } = {};

  // 全優先度共通：レース日をレースメニューに変更（ゾーン別距離付き）
  const raceWorkoutId = selectRaceWorkoutId(subRace.distance, subRace.customDistance);
  if (newDays[srDayOfWeek]) {
    originalDays[srDayOfWeek] = { ...newDays[srDayOfWeek]! };
    newDays[srDayOfWeek] = {
      ...newDays[srDayOfWeek]!,
      type: 'race' as const,
      label: subRace.name || i18next.t('plan.raceLabel'),
      isKey: true,
      workoutId: raceWorkoutId,
      focusKey: undefined,
      focusCategory: 'レース',
    };
  }

  const isActive = (d: ScheduledWorkout | null): d is ScheduledWorkout =>
    d !== null && d.type !== 'rest';

  if (subRace.priority === 'high') {
    // 重要レース：R-1〜R-3 を調整
    // R-1: イージー（レース前調整）
    const r1 = (srDayOfWeek - 1 + 7) % 7;
    if (isActive(newDays[r1])) {
      originalDays[r1] = { ...newDays[r1]! };
      newDays[r1] = {
        ...newDays[r1]!,
        type: 'easy',
        label: i18next.t('plan.easyPreRace'),
        isKey: false,
        workoutId: undefined,
        focusKey: 'aerobic',
        focusCategory: '有酸素ベース',
      };
    }
    // R-2: イージー（レース前調整）
    const r2 = (srDayOfWeek - 2 + 7) % 7;
    if (isActive(newDays[r2])) {
      originalDays[r2] = { ...newDays[r2]! };
      newDays[r2] = {
        ...newDays[r2]!,
        type: 'easy',
        label: i18next.t('plan.easyPreRace'),
        isKey: false,
        workoutId: undefined,
        focusKey: 'aerobic',
        focusCategory: '有酸素ベース',
      };
    }
    // R-3: Mペース刺激+WS（軽めの質的練習）
    const r3 = (srDayOfWeek - 3 + 7) % 7;
    if (isActive(newDays[r3])) {
      originalDays[r3] = { ...newDays[r3]! };
      newDays[r3] = {
        ...newDays[r3]!,
        type: 'easy',
        label: i18next.t('plan.mPacePreRace'),
        isKey: false,
        workoutId: undefined,
        focusKey: 'aerobic',
        focusCategory: '有酸素ベース',
      };
    }
  } else if (subRace.priority === 'medium') {
    // 中程度レース：R-1 をリカバリーに変更
    const r1 = (srDayOfWeek - 1 + 7) % 7;
    if (isActive(newDays[r1])) {
      originalDays[r1] = { ...newDays[r1]! };
      newDays[r1] = {
        ...newDays[r1]!,
        type: 'recovery',
        label: i18next.t('plan.recoveryPreRace'),
        isKey: false,
        workoutId: undefined,
        focusKey: 'aerobic',
        focusCategory: '有酸素ベース',
      };
    }
  }
  // 低（練習レース）：レース日のみ変更、他は通常トレーニング維持

  return { days: newDays, originalDays };
}

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
              lastTestDate: toDateStr(new Date()),
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
          (a, b) => a.date.localeCompare(b.date)
        );

        // サブレースを週間プランに反映 + 優先度に応じたメニュー調整
        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          const weekStart = parseDateStr(week.startDate);
          const weekEnd = parseDateStr(week.endDate);
          const subRaceInWeek = updatedSubRaces.find((sr) => {
            const srDate = parseDateStr(sr.date);
            return srDate >= weekStart && srDate <= weekEnd;
          });

          if (!subRaceInWeek) return { ...week, subRace: undefined };

          const srDate = parseDateStr(subRaceInWeek.date);
          const srDayOfWeek = (srDate.getDay() + 6) % 7;
          const result = applySubRaceAdjustments(week.days, srDayOfWeek, subRaceInWeek);
          subRaceInWeek.originalDays = result.originalDays;

          return {
            ...week,
            subRace: subRaceInWeek,
            days: result.days,
            workouts: result.days.filter((d): d is NonNullable<typeof d> => d !== null),
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

        // 削除対象のサブレースを取得（元データ復元用）
        const removedSubRace = (plan.subRaces || []).find((sr) => sr.id === subRaceId);
        const updatedSubRaces = (plan.subRaces || []).filter((sr) => sr.id !== subRaceId);

        // サブレースを週間プランから除去し、変更された日のメニューを復元
        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          const weekStart = parseDateStr(week.startDate);
          const weekEnd = parseDateStr(week.endDate);
          const subRaceInWeek = updatedSubRaces.find((sr) => {
            const srDate = parseDateStr(sr.date);
            return srDate >= weekStart && srDate <= weekEnd;
          });

          // この週のサブレースが削除対象の場合、元のdaysを復元
          if (week.subRace && week.subRace.id === subRaceId && removedSubRace?.originalDays) {
            const restoredDays = [...week.days];
            for (const [dayIndexStr, originalDay] of Object.entries(removedSubRace.originalDays)) {
              const dayIndex = Number(dayIndexStr);
              if (originalDay && restoredDays[dayIndex]) {
                restoredDays[dayIndex] = originalDay;
              }
            }
            return {
              ...week,
              subRace: subRaceInWeek || undefined,
              days: restoredDays,
              workouts: restoredDays.filter((d): d is NonNullable<typeof d> => d !== null),
            };
          }

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

        // 新ワークアウトのカテゴリからisKey・type・focusKeyを決定
        const isEasyCategory = newWorkoutCategory === '有酸素ベース';
        const isRecovery = newWorkoutId.startsWith('recovery-');
        const isLong = newWorkoutId.startsWith('long-');
        const isEasy = newWorkoutId.startsWith('easy-');
        const newIsKey = !isEasyCategory || isLong; // ロングはKey扱い
        const newType: ScheduledWorkout['type'] = isRecovery ? 'recovery' : isEasy ? 'easy' : isLong ? 'long' : 'workout';
        const categoryToFocusKey: Record<string, string> = {
          '有酸素ベース': 'aerobic',
          '乳酸閾値': 'threshold',
          'VO2max': 'vo2max',
          'スピード・スプリント': 'speed',
          '総合': 'threshold',
        };
        const newFocusKey = categoryToFocusKey[newWorkoutCategory] || 'aerobic';

        const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
          if (week.weekNumber !== weekNumber) return week;
          const applyReplace = (d: ScheduledWorkout) => ({
            ...d,
            workoutId: newWorkoutId,
            label: newWorkoutName,
            focusCategory: newWorkoutCategory,
            isKey: newIsKey,
            type: newType,
            focusKey: newFocusKey,
          });
          return {
            ...week,
            days: week.days.map((d) => {
              if (!d || d.id !== dayId) return d;
              return applyReplace(d);
            }),
            workouts: week.workouts.map((w) => {
              if (w.id !== dayId) return w;
              return applyReplace(w);
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
          const weekStart = parseDateStr(week.startDate);
          const weekEnd = parseDateStr(week.endDate);
          const subRaceInWeek = subRaces.find((sr) => {
            const srDate = parseDateStr(sr.date);
            return srDate >= weekStart && srDate <= weekEnd;
          });

          // サブレース日の曜日を計算してレースメニューに変更
          const newDays = week.days.map((day) => {
            if (!day) return day;
            const saved = completionMap.get(day.id);
            if (saved) {
              return { ...day, completed: saved.completed, actualData: saved.actualData };
            }
            return day;
          });

          if (subRaceInWeek) {
            const srDate = parseDateStr(subRaceInWeek.date);
            const srDayOfWeek = (srDate.getDay() + 6) % 7;
            const result = applySubRaceAdjustments(newDays, srDayOfWeek, subRaceInWeek);
            subRaceInWeek.originalDays = result.originalDays;
            // resultのdaysを反映
            for (let i = 0; i < result.days.length; i++) {
              newDays[i] = result.days[i];
            }
          }

          return {
            ...week,
            subRace: subRaceInWeek || undefined,
            days: newDays,
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
