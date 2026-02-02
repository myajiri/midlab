// ============================================
// 型定義
// ============================================

// テストレベル
export type LevelName = 'SS' | 'S' | 'A' | 'B' | 'C';

// ゾーン名
export type ZoneName = 'jog' | 'easy' | 'marathon' | 'threshold' | 'interval' | 'repetition';

// リミッタータイプ
export type LimiterType = 'cardio' | 'muscular' | 'balanced';

// フェーズタイプ
export type PhaseType = 'base' | 'build' | 'peak' | 'taper';

// 年齢カテゴリ
export type AgeCategory = 'junior_high' | 'high_school' | 'collegiate' | 'senior' | 'masters_40' | 'masters_50' | 'masters_60';

// 性別
export type Gender = 'male' | 'female' | 'other';

// 競技歴
export type Experience = 'beginner' | 'intermediate' | 'advanced' | 'elite';

// 終了理由
export type TerminationReason = 'breath' | 'legs' | 'both' | 'other';

// 回復時間
export type RecoveryTime = '<30' | '30-60' | '>60';

// 信頼度
export type Confidence = 'low' | 'medium' | 'high';

// リミッター判定信頼度
export type LimiterConfidence = 'confirmed' | 'tentative';

// ユーザーステージ
export type UserStage = 'new' | 'estimated' | 'measured' | 'planning' | 'training';

// PB（自己ベスト）
export interface PBs {
  m800?: number;
  m1500?: number;
  m3000?: number;
  m5000?: number;
}

// 推定値
export interface EstimatedValues {
  etp: number;
  confidence: Confidence;
  adjustments: Array<{ reason: string; value: number }>;
  limiterType?: LimiterType;
}

// 現在の測定値
export interface CurrentValues {
  etp: number;
  limiterType: LimiterType;
  lastTestDate: string;
}

// プロフィール
export interface Profile {
  displayName?: string;  // ニックネーム
  ageCategory: AgeCategory;
  gender: Gender;
  experience: Experience;
  pbs: PBs;
  estimated: EstimatedValues | null;
  current: CurrentValues | null;
}

// トレーニングゾーン
export type TrainingZones = Record<ZoneName, number>;

// レース予測
export interface RacePredictions {
  m800: { min: number; max: number };
  m1500: { min: number; max: number };
  m3000: { min: number; max: number };
  m5000: { min: number; max: number };
}

// テスト結果
export interface TestResult {
  id: string;
  date: string;
  level: LevelName;
  completedLaps: number;
  lastCompletedPace: number;
  terminationReason: TerminationReason;
  couldDoOneMore: boolean;
  couldContinueSlower: boolean;
  breathRecoveryTime: RecoveryTime;
  eTP: number;
  limiterType: LimiterType;
  limiterConfidence: LimiterConfidence;
  zones: TrainingZones;
  predictions: RacePredictions;
}

// フェーズ
export interface Phase {
  type: PhaseType;
  startDate: string;
  endDate: string;
  weeks: number;
}

// レース距離
export type RaceDistance = 800 | 1500 | 3000 | 5000;

// レース情報
export interface RaceInfo {
  name: string;
  date: string;
  distance: RaceDistance;
  targetTime: number;
}

// 週間ワークアウト
export interface ScheduledWorkout {
  id: string;
  dayOfWeek: number; // 0=月, 6=日
  type: 'workout' | 'easy' | 'long' | 'rest' | 'test';
  label: string;
  workoutId?: string;
  isKey?: boolean;
  completed?: boolean;
  focusKey?: string;
  focusCategory?: string;
  actualData?: {
    distance?: number;
    duration?: number;
    notes?: string;
  };
}

// 負荷配分
export interface LoadDistribution {
  easy: number;
  threshold: number;
  vo2max: number;
  speed: number;
}

// 週間プラン
export interface WeeklyPlan {
  weekNumber: number;
  startDate: string;
  endDate: string;
  phaseType: PhaseType;
  workouts: ScheduledWorkout[];
  days: Array<ScheduledWorkout | null>;
  // 拡張フィールド
  targetDistance: number;
  loadPercent: number;
  distribution: LoadDistribution;
  keyWorkouts: string[];
  keyFocusCategories: string[];
  focusKeys: string[];
  isRecoveryWeek: boolean;
  isRampTestWeek: boolean;
}

// レースプラン
export interface RacePlan {
  id: string;
  createdAt: string;
  race: RaceInfo;
  baseline: {
    etp: number;
    limiterType: LimiterType;
  };
  phases: Phase[];
  weeklyPlans: WeeklyPlan[];
  rampTestDates: string[];
}

// ワークアウトセグメント
export interface WorkoutSegment {
  zone: ZoneName;
  distance: number;
  label: string;
  reps?: number;
  recoveryDistance?: number;
}

// リミッター別バリアント
export interface LimiterVariant {
  reps?: number;
  recoveryDistance?: number;
  note: string;
}

// ワークアウトテンプレート
export interface WorkoutTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  segments: WorkoutSegment[];
  targetLimiter?: LimiterType;
  limiterVariants: Record<LimiterType, LimiterVariant>;
}

// ワークアウトログ
export interface WorkoutLog {
  id: string;
  date: string;
  plannedType?: string;
  plannedLabel?: string;
  workoutId?: string;
  completed: boolean;
  completedAt?: string;
  distance?: number;
  duration?: number;
  notes?: string;
}

// アプリ設定
export interface AppSettings {
  useNewUI?: boolean;
}

// 有効値（現在のeTPとリミッター）
export interface EffectiveValues {
  etp: number;
  limiter: LimiterType;
  source: 'default' | 'estimated' | 'measured';
}

// eTP計算結果
export interface EtpCalculationResult {
  baseEtp: number;
  adjustedEtp: number;
  adjustments: Array<{ reason: string; value: number }>;
  confidence: Confidence;
}

// レベル推奨結果
export interface LevelRecommendation {
  recommended: LevelName;
  alternative?: LevelName;
  reason: string;
}

// 週間進捗
export interface WeekProgress {
  completed: number;
  total: number;
  days: boolean[];
}
