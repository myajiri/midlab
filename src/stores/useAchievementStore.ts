// ============================================
// アチーブメント・ジャーニーストア
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  UnlockedAchievement,
  JourneyState,
  JourneyStep,
  AchievementCategory,
} from '../types';

// ============================================
// アチーブメント定義
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // ジャーニー系
  {
    id: 'first_steps',
    category: 'journey',
    title: '最初の一歩',
    description: 'プロフィールを設定しました',
    icon: 'footsteps',
    color: '#3B82F6',
    condition: { type: 'stage', value: 'estimated' },
  },
  {
    id: 'scientist',
    category: 'journey',
    title: 'スポーツ科学者',
    description: '初めてのランプテストを完了しました',
    icon: 'flask',
    color: '#8B5CF6',
    condition: { type: 'test_count', value: 1 },
  },
  {
    id: 'strategist',
    category: 'journey',
    title: '戦略家',
    description: 'トレーニング計画を作成しました',
    icon: 'map',
    color: '#F97316',
    condition: { type: 'plan_created', value: 1 },
  },
  {
    id: 'athlete',
    category: 'journey',
    title: 'アスリート',
    description: '初めてのワークアウトを完了しました',
    icon: 'medal',
    color: '#22C55E',
    condition: { type: 'workout_count', value: 1 },
  },

  // トレーニング系
  {
    id: 'consistent_5',
    category: 'training',
    title: 'コンシステント',
    description: '5回のワークアウトを完了しました',
    icon: 'fitness',
    color: '#06B6D4',
    condition: { type: 'workout_count', value: 5 },
  },
  {
    id: 'dedicated_10',
    category: 'training',
    title: '献身的',
    description: '10回のワークアウトを完了しました',
    icon: 'barbell',
    color: '#14B8A6',
    condition: { type: 'workout_count', value: 10 },
  },
  {
    id: 'warrior_25',
    category: 'training',
    title: 'ウォリアー',
    description: '25回のワークアウトを完了しました',
    icon: 'shield-checkmark',
    color: '#EF4444',
    condition: { type: 'workout_count', value: 25 },
  },

  // マイルストーン系
  {
    id: 'test_veteran',
    category: 'milestone',
    title: 'テストベテラン',
    description: '3回のランプテストを実施しました',
    icon: 'analytics',
    color: '#A855F7',
    condition: { type: 'test_count', value: 3 },
  },
  {
    id: 'improvement',
    category: 'milestone',
    title: '進化',
    description: 'eTPが改善しました',
    icon: 'trending-up',
    color: '#22C55E',
    condition: { type: 'etp_improvement', value: 1 },
  },

  // 連続系
  {
    id: 'streak_3',
    category: 'streak',
    title: '3日連続',
    description: '3日連続でトレーニングしました',
    icon: 'flame',
    color: '#F97316',
    condition: { type: 'streak', value: 3 },
  },
  {
    id: 'streak_7',
    category: 'streak',
    title: '1週間の習慣',
    description: '7日連続でトレーニングしました',
    icon: 'bonfire',
    color: '#EF4444',
    condition: { type: 'streak', value: 7 },
  },
];

// ============================================
// ジャーニーステップ定義
// ============================================

export interface JourneyStepInfo {
  id: JourneyStep;
  title: string;
  description: string;
  icon: string;
  color: string;
  action?: string;
  route?: string;
}

export const JOURNEY_STEPS: JourneyStepInfo[] = [
  {
    id: 'welcome',
    title: 'ようこそ',
    description: 'MidLabへようこそ！',
    icon: 'hand-right',
    color: '#3B82F6',
  },
  {
    id: 'profile_setup',
    title: 'プロフィール設定',
    description: '基本情報を入力しましょう',
    icon: 'person',
    color: '#8B5CF6',
    action: 'プロフィールを設定',
    route: '/settings',
  },
  {
    id: 'pb_input',
    title: '自己ベスト入力',
    description: '自己ベストを入力するとeTPを推定できます',
    icon: 'stopwatch',
    color: '#F97316',
    action: 'PBを入力',
    route: '/settings',
  },
  {
    id: 'first_test',
    title: '初回テスト',
    description: 'ランプテストで正確なeTPを測定しましょう',
    icon: 'analytics',
    color: '#22C55E',
    action: 'テストを開始',
    route: '/test',
  },
  {
    id: 'review_results',
    title: '結果確認',
    description: 'テスト結果とトレーニングゾーンを確認しましょう',
    icon: 'eye',
    color: '#06B6D4',
  },
  {
    id: 'create_plan',
    title: '計画作成',
    description: '目標レースに向けた計画を作成しましょう',
    icon: 'calendar',
    color: '#A855F7',
    action: '計画を作成',
    route: '/plan',
  },
  {
    id: 'first_workout',
    title: '初回ワークアウト',
    description: '最初のワークアウトを完了しましょう',
    icon: 'fitness',
    color: '#EF4444',
    action: 'ワークアウトを見る',
    route: '/workout',
  },
  {
    id: 'completed',
    title: 'ジャーニー完了',
    description: 'おめでとうございます！基本セットアップ完了です',
    icon: 'trophy',
    color: '#EAB308',
  },
];

// ============================================
// ストア定義
// ============================================

interface AchievementStore {
  // アチーブメント
  unlockedAchievements: UnlockedAchievement[];
  pendingNotifications: string[]; // 未表示の通知

  // ジャーニー
  journey: JourneyState | null;

  // アクション
  initializeJourney: () => void;
  completeJourneyStep: (step: JourneyStep) => void;
  skipJourneyStep: (step: JourneyStep) => void;
  updateJourneyStep: (step: JourneyStep) => void;

  // アチーブメント
  unlockAchievement: (achievementId: string) => boolean;
  markNotified: (achievementId: string) => void;
  getNextPendingNotification: () => Achievement | null;
  isUnlocked: (achievementId: string) => boolean;

  // チェック
  checkAchievements: (context: AchievementContext) => void;

  // リセット
  resetAll: () => void;
}

// アチーブメントチェック用のコンテキスト
export interface AchievementContext {
  stage: string;
  testCount: number;
  workoutCount: number;
  streak: number;
  hasImprovement: boolean;
  hasPlan: boolean;
}

const initialJourney: JourneyState = {
  currentStep: 'welcome',
  completedSteps: [],
  skippedSteps: [],
  startedAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
};

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      unlockedAchievements: [],
      pendingNotifications: [],
      journey: null,

      initializeJourney: () => {
        const { journey } = get();
        if (!journey) {
          set({ journey: initialJourney });
        }
      },

      completeJourneyStep: (step: JourneyStep) => {
        const { journey } = get();
        if (!journey) return;

        const stepIndex = JOURNEY_STEPS.findIndex((s) => s.id === step);
        const nextStep = JOURNEY_STEPS[stepIndex + 1]?.id || 'completed';

        set({
          journey: {
            ...journey,
            currentStep: nextStep,
            completedSteps: [...journey.completedSteps, step],
            lastActivityAt: new Date().toISOString(),
          },
        });
      },

      skipJourneyStep: (step: JourneyStep) => {
        const { journey } = get();
        if (!journey) return;

        const stepIndex = JOURNEY_STEPS.findIndex((s) => s.id === step);
        const nextStep = JOURNEY_STEPS[stepIndex + 1]?.id || 'completed';

        set({
          journey: {
            ...journey,
            currentStep: nextStep,
            skippedSteps: [...journey.skippedSteps, step],
            lastActivityAt: new Date().toISOString(),
          },
        });
      },

      updateJourneyStep: (step: JourneyStep) => {
        const { journey } = get();
        if (!journey) return;

        set({
          journey: {
            ...journey,
            currentStep: step,
            lastActivityAt: new Date().toISOString(),
          },
        });
      },

      unlockAchievement: (achievementId: string) => {
        const { unlockedAchievements, pendingNotifications } = get();

        // 既にアンロック済みか確認
        if (unlockedAchievements.some((a) => a.achievementId === achievementId)) {
          return false;
        }

        const newUnlock: UnlockedAchievement = {
          achievementId,
          unlockedAt: new Date().toISOString(),
          notified: false,
        };

        set({
          unlockedAchievements: [...unlockedAchievements, newUnlock],
          pendingNotifications: [...pendingNotifications, achievementId],
        });

        return true;
      },

      markNotified: (achievementId: string) => {
        const { unlockedAchievements, pendingNotifications } = get();

        set({
          unlockedAchievements: unlockedAchievements.map((a) =>
            a.achievementId === achievementId ? { ...a, notified: true } : a
          ),
          pendingNotifications: pendingNotifications.filter((id) => id !== achievementId),
        });
      },

      getNextPendingNotification: () => {
        const { pendingNotifications } = get();
        if (pendingNotifications.length === 0) return null;

        const achievementId = pendingNotifications[0];
        return ACHIEVEMENTS.find((a) => a.id === achievementId) || null;
      },

      isUnlocked: (achievementId: string) => {
        const { unlockedAchievements } = get();
        return unlockedAchievements.some((a) => a.achievementId === achievementId);
      },

      checkAchievements: (context: AchievementContext) => {
        const { unlockAchievement, isUnlocked } = get();

        ACHIEVEMENTS.forEach((achievement) => {
          if (isUnlocked(achievement.id)) return;

          let shouldUnlock = false;

          switch (achievement.condition.type) {
            case 'stage':
              shouldUnlock = context.stage === achievement.condition.value ||
                (achievement.condition.value === 'estimated' &&
                 ['estimated', 'measured', 'planning', 'training'].includes(context.stage));
              break;

            case 'test_count':
              shouldUnlock = context.testCount >= (achievement.condition.value as number);
              break;

            case 'workout_count':
              shouldUnlock = context.workoutCount >= (achievement.condition.value as number);
              break;

            case 'streak':
              shouldUnlock = context.streak >= (achievement.condition.value as number);
              break;

            case 'etp_improvement':
              shouldUnlock = context.hasImprovement;
              break;

            case 'plan_created':
              shouldUnlock = context.hasPlan;
              break;
          }

          if (shouldUnlock) {
            unlockAchievement(achievement.id);
          }
        });
      },

      resetAll: () => {
        set({
          unlockedAchievements: [],
          pendingNotifications: [],
          journey: null,
        });
      },
    }),
    {
      name: 'midlab_achievements',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// カスタムフック
// ============================================

// 現在のジャーニーステップ情報を取得
export const useCurrentJourneyStep = () => {
  const journey = useAchievementStore((state) => state.journey);
  if (!journey) return null;

  return JOURNEY_STEPS.find((s) => s.id === journey.currentStep) || null;
};

// ジャーニーの進捗率を取得
export const useJourneyProgress = () => {
  const journey = useAchievementStore((state) => state.journey);
  if (!journey) return 0;

  const totalSteps = JOURNEY_STEPS.length - 1; // 'completed'を除く
  const completedCount = journey.completedSteps.length;

  return completedCount / totalSteps;
};

// カテゴリ別アチーブメントを取得
export const useAchievementsByCategory = (category: AchievementCategory) => {
  const unlockedAchievements = useAchievementStore((state) => state.unlockedAchievements);

  return ACHIEVEMENTS.filter((a) => a.category === category).map((achievement) => ({
    ...achievement,
    unlocked: unlockedAchievements.some((u) => u.achievementId === achievement.id),
    unlockedAt: unlockedAchievements.find((u) => u.achievementId === achievement.id)?.unlockedAt,
  }));
};
