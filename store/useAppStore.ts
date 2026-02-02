// ============================================
// MidLab グローバル状態管理
// Zustand + AsyncStorage永続化
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type LimiterType, type PhaseType } from '../constants';
import { calculateZones, predict5kTime, estimateVO2max, getZonesList } from '../utils/calculations';

// ============================================
// 型定義
// ============================================

// テスト結果
export interface TestResult {
    id: string;
    date: string;
    testType: 'midlab' | 'ramp';

    // MidLabテスト結果
    dist5min?: number;
    dist30min?: number;

    // ランプテスト結果
    level?: string;
    completedLaps?: number;
    lcp?: number;

    // 共通結果
    etp: number;
    limiterType: LimiterType;
    limiterConfidence: 'high' | 'medium' | 'low' | 'confirmed' | 'tentative';
    zones: Record<string, number>;
    predictions: {
        m5000: number;
    };
}

// プロフィール
export interface Profile {
    displayName: string;
    avatarUri?: string; // プロフィール画像URI
    ageCategory: 'junior' | 'youth' | 'senior' | 'master';
    gender: 'male' | 'female' | 'other';
    experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    selfReportedLimiter?: LimiterType; // 自己申告タイプ
    pbs: {
        m200?: number;  // 秒
        m400?: number;
        m800?: number;
        m1500?: number;
        m3000?: number;
        m5000?: number;
    };
    restDays: number[];  // 休養日（0=月, 1=火... 6=日）
}

// アプリ設定
export interface AppSettings {
    theme: 'dark' | 'light' | 'system';
    notifications: boolean;
    haptics: boolean;
}

// ワークアウトログ
export interface WorkoutLog {
    id: string;
    date: string;           // ISO 8601
    workoutType: string;    // 'interval_1000', 'tempo_run' など
    workoutName: string;    // 表示名
    completed: boolean;
    actualDistance?: number;   // km
    actualDuration?: number;   // 分
    notes?: string;
}

// 計画の日ごとのスケジュール
export interface DaySchedule {
    dayOfWeek: number;  // 0=月, 1=火... 6=日
    type: 'easy' | 'workout' | 'long' | 'rest' | 'test';
    label: string;
    isKey: boolean;
    completed: boolean;
    focusKey?: string;
    focusCategory?: string;
}

// 週間プラン
export interface WeeklyPlan {
    weekNumber: number;
    phaseType: PhaseType;
    startDate: string;
    endDate: string;
    targetDistance: number;
    loadPercent: number;
    days: DaySchedule[];
    keyWorkouts: string[];
    isRecoveryWeek: boolean;
    isRiseTestWeek: boolean;
}

// フェーズ情報
export interface PlanPhase {
    type: PhaseType;
    startWeek: number;
    endWeek: number;
    weeks: number;
    focus: string;
}

// トレーニング計画
export interface TrainingPlan {
    id: string;
    createdAt: string;
    race: {
        name: string;
        date: string;
        distance: number;  // 800, 1500, 3000, 5000
        targetTime: number;  // 秒
    };
    baseline: {
        etp: number;
        limiterType: LimiterType;
    };
    phases: PlanPhase[];
    weeklyPlans: WeeklyPlan[];
    riseTestDates: number[];  // テスト推奨週
}

// ストア状態
interface AppState {
    // プロフィール
    profile: Profile;
    setProfile: (profile: Partial<Profile>) => void;

    // テスト結果
    testResults: TestResult[];
    addTestResult: (result: Omit<TestResult, 'id' | 'date'>) => void;
    deleteTestResult: (id: string) => void;
    clearTestResults: () => void;

    // 現在のeTP（最新のテスト結果から）
    currentEtp: number | null;
    currentLimiter: LimiterType | null;
    // PBから推定したeTPを設定（テスト結果がない場合に使用）
    setEstimatedEtp: (etp: number | null, limiter: LimiterType | null) => void;

    // ワークアウトログ
    workoutLogs: WorkoutLog[];
    addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void;
    deleteWorkoutLog: (id: string) => void;
    getRecentWorkouts: (days: number) => WorkoutLog[];

    // トレーニング計画
    activePlan: TrainingPlan | null;
    setActivePlan: (plan: TrainingPlan | null) => void;
    updateDayCompletion: (weekNumber: number, dayOfWeek: number, completed: boolean) => void;

    // オンボーディング
    isOnboardingComplete: boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void;

    // 設定
    settings: AppSettings;
    setSettings: (settings: Partial<AppSettings>) => void;

    // 計算済みデータ取得
    getZones: () => ReturnType<typeof getZonesList>;
    getVO2max: () => number | null;
    get5kPrediction: () => number | null;
}

// ============================================
// デフォルト値
// ============================================

const defaultProfile: Profile = {
    displayName: 'ゲスト',
    ageCategory: 'senior',
    gender: 'other',
    experience: 'intermediate',
    pbs: {},
    restDays: [0, 4],  // デフォルト: 月曜・金曜を休養日
};

const defaultSettings: AppSettings = {
    theme: 'dark',
    notifications: true,
    haptics: true,
};

// ============================================
// ストア作成
// ============================================

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // プロフィール
            profile: defaultProfile,
            setProfile: (updates) =>
                set((state) => ({
                    profile: { ...state.profile, ...updates },
                })),

            // テスト結果
            testResults: [],
            addTestResult: (result) =>
                set((state) => {
                    const newResult: TestResult = {
                        ...result,
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                    };
                    const newResults = [newResult, ...state.testResults];

                    return {
                        testResults: newResults,
                        currentEtp: newResult.etp,
                        currentLimiter: newResult.limiterType,
                    };
                }),
            deleteTestResult: (id) =>
                set((state) => {
                    const newResults = state.testResults.filter((r) => r.id !== id);
                    const latest = newResults[0];

                    return {
                        testResults: newResults,
                        currentEtp: latest?.etp ?? null,
                        currentLimiter: latest?.limiterType ?? null,
                    };
                }),
            clearTestResults: () =>
                set({
                    testResults: [],
                    currentEtp: null,
                    currentLimiter: null,
                }),

            // 現在値
            currentEtp: null,
            currentLimiter: null,
            // PBから推定したeTPを設定（テスト結果がない場合に使用）
            setEstimatedEtp: (etp, limiter) =>
                set((state) => {
                    // テスト結果がある場合は上書きしない
                    if (state.testResults.length > 0) return {};
                    return { currentEtp: etp, currentLimiter: limiter };
                }),

            // ワークアウトログ
            workoutLogs: [],
            addWorkoutLog: (log) =>
                set((state) => ({
                    workoutLogs: [
                        { ...log, id: Date.now().toString() },
                        ...state.workoutLogs,
                    ],
                })),
            deleteWorkoutLog: (id) =>
                set((state) => ({
                    workoutLogs: state.workoutLogs.filter((log) => log.id !== id),
                })),
            getRecentWorkouts: (days: number): WorkoutLog[] => {
                const { workoutLogs } = get();
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                return workoutLogs.filter(
                    (log) => new Date(log.date) >= cutoff
                );
            },

            // オンボーディング
            isOnboardingComplete: false,
            completeOnboarding: () => set({ isOnboardingComplete: true }),
            resetOnboarding: () => set({ isOnboardingComplete: false }),

            // トレーニング計画
            activePlan: null,
            setActivePlan: (plan) => set({ activePlan: plan }),
            updateDayCompletion: (weekNumber, dayOfWeek, completed) =>
                set((state) => {
                    if (!state.activePlan) return state;
                    const weekIndex = state.activePlan.weeklyPlans.findIndex(
                        (w) => w.weekNumber === weekNumber
                    );
                    if (weekIndex === -1) return state;

                    const updatedPlans = [...state.activePlan.weeklyPlans];
                    const updatedDays = [...updatedPlans[weekIndex].days];
                    const dayIndex = updatedDays.findIndex((d) => d.dayOfWeek === dayOfWeek);
                    if (dayIndex !== -1) {
                        updatedDays[dayIndex] = { ...updatedDays[dayIndex], completed };
                        updatedPlans[weekIndex] = { ...updatedPlans[weekIndex], days: updatedDays };
                    }

                    return {
                        activePlan: { ...state.activePlan, weeklyPlans: updatedPlans },
                    };
                }),

            // 設定
            settings: defaultSettings,
            setSettings: (updates) =>
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                })),

            // 計算済みデータ
            getZones: () => {
                const { currentEtp, currentLimiter } = get();
                if (!currentEtp) return [];
                return getZonesList(currentEtp, currentLimiter || 'balanced');
            },
            getVO2max: () => {
                const { currentEtp } = get();
                if (!currentEtp) return null;
                return estimateVO2max(currentEtp);
            },
            get5kPrediction: () => {
                const { currentEtp, currentLimiter } = get();
                if (!currentEtp) return null;
                return predict5kTime(currentEtp, currentLimiter || 'balanced');
            },
        }),
        {
            name: 'midlab-app-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state: AppState) => ({
                profile: state.profile,
                testResults: state.testResults,
                currentEtp: state.currentEtp,
                currentLimiter: state.currentLimiter,
                isOnboardingComplete: state.isOnboardingComplete,
                workoutLogs: state.workoutLogs,
                activePlan: state.activePlan,
                settings: state.settings,
            }),
        }
    )
);

// ============================================
// セレクター（パフォーマンス最適化用）
// ============================================

export const useProfile = () => useAppStore((state) => state.profile);
export const useTestResults = () => useAppStore((state) => state.testResults);
export const useLatestResult = () => useAppStore((state) => state.testResults[0]);
export const useCurrentEtp = () => useAppStore((state) => state.currentEtp);
export const useCurrentLimiter = () => useAppStore((state) => state.currentLimiter);
export const useIsOnboardingComplete = () => useAppStore((state) => state.isOnboardingComplete);
export const useSettings = () => useAppStore((state) => state.settings);
