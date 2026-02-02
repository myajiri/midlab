// ============================================
// 定数定義
// ============================================

import { LevelName, ZoneName, LimiterType, PhaseType, AgeCategory, Gender, Experience } from '../types';

// テストレベル設定
// eTP閾値はLEVELSの1500mタイム定義と一致（PB秒 ÷ 3.375）
export const LEVELS: Record<LevelName, { name: string; description: string; startPace: number; maxLaps: number; etpRange: { min: number; max: number } }> = {
  SS: { name: 'SS', description: '1500m 3:30以内', startPace: 76, maxLaps: 6, etpRange: { min: 0, max: 62 } },     // < 210秒
  S: { name: 'S', description: '1500m 3:30-4:00', startPace: 88, maxLaps: 8, etpRange: { min: 62, max: 71 } },    // 210-240秒
  A: { name: 'A', description: '1500m 4:00-4:30', startPace: 96, maxLaps: 10, etpRange: { min: 71, max: 80 } },   // 240-270秒
  B: { name: 'B', description: '1500m 4:30-5:00', startPace: 108, maxLaps: 10, etpRange: { min: 80, max: 89 } },  // 270-300秒
  C: { name: 'C', description: '1500m 5:00-5:30', startPace: 120, maxLaps: 10, etpRange: { min: 89, max: 98 } },  // 300-330秒
};

export const PACE_INCREMENT = 4;
export const ETP_COEFFICIENT = 1.12;

// 6ゾーン係数
export const ZONE_COEFFICIENTS_V3: Record<ZoneName, { coef: number; name: string; label: string; color: string; description: string; note?: string }> = {
  jog: { coef: 1.40, name: 'リカバリーJog', label: 'リカバリーJog', color: '#9CA3AF', description: '回復ペース', note: '目安' },
  easy: { coef: 1.275, name: 'Easy', label: 'Easy', color: '#3B82F6', description: '有酸素ベース' },
  marathon: { coef: 1.125, name: 'Marathon', label: 'Marathon', color: '#22C55E', description: 'マラソンペース' },
  threshold: { coef: 1.025, name: 'Threshold', label: 'Threshold', color: '#EAB308', description: '乳酸閾値' },
  interval: { coef: 0.945, name: 'Interval', label: 'Interval', color: '#F97316', description: 'VO2max' },
  repetition: { coef: 0.875, name: 'Rep', label: 'Rep', color: '#EF4444', description: 'スピード' },
};

// リミッター別ゾーン調整
export const LIMITER_ZONE_ADJUSTMENTS: Record<LimiterType, Record<ZoneName, number>> = {
  cardio: { jog: 0, easy: +0.05, marathon: +0.03, threshold: +0.02, interval: +0.03, repetition: +0.03 },
  muscular: { jog: +0.05, easy: +0.08, marathon: +0.06, threshold: +0.04, interval: +0.03, repetition: -0.02 },
  balanced: { jog: 0, easy: 0, marathon: 0, threshold: 0, interval: 0, repetition: 0 },
};

// レース予測係数（laps = 400mラップ数、係数はペース倍率）
export const RACE_COEFFICIENTS = {
  m800: { coefficient: 0.835, min: 0.82, max: 0.85, laps: 2, label: '800m' },
  m1500: { coefficient: 0.90, min: 0.88, max: 0.92, laps: 3.75, label: '1500m' },
  m3000: { coefficient: 0.98, min: 0.96, max: 1.00, laps: 7.5, label: '3000m' },
  m5000: { coefficient: 1.02, min: 1.00, max: 1.04, laps: 12.5, label: '5000m' },
};

// リミッター別タイム調整（秒）
export const LIMITER_ADJUSTMENTS = {
  m800: { cardio: -3, muscular: 3 },
  m1500: { cardio: 1.5, muscular: -1.5 },
  m3000: { cardio: 11.5, muscular: -11.5 },
  m5000: { cardio: 27.5, muscular: -27.5 },
};

// 年齢カテゴリ設定
export const AGE_CATEGORY_CONFIG: Record<AgeCategory, { label: string; desc: string; etpAdj: number; levelAdj: number }> = {
  junior_high: { label: '中学生', desc: '12〜15歳', etpAdj: 0, levelAdj: -1 },
  high_school: { label: '高校生', desc: '15〜18歳', etpAdj: 0, levelAdj: 0 },
  collegiate: { label: '大学生', desc: '18〜22歳', etpAdj: 0, levelAdj: 0 },
  senior: { label: '一般', desc: '22〜39歳', etpAdj: 0, levelAdj: 0 },
  masters_40: { label: 'マスターズ40代', desc: '40〜49歳', etpAdj: 2, levelAdj: 0 },
  masters_50: { label: 'マスターズ50代', desc: '50〜59歳', etpAdj: 4, levelAdj: -1 },
  masters_60: { label: 'マスターズ60歳以上', desc: '60歳以上', etpAdj: 6, levelAdj: -1 },
};

// 性別設定
export const GENDER_CONFIG: Record<Gender, { label: string; etpAdj: number; note?: string }> = {
  male: { label: '男性', etpAdj: 0 },
  female: { label: '女性', etpAdj: 0, note: '生理周期を考慮してテスト日を選択' },
  other: { label: '回答しない', etpAdj: 0 },
};

// 競技歴設定
export const EXPERIENCE_CONFIG: Record<Experience, { label: string; desc: string; etpAdj: number; levelAdj: number; confidence: 'low' | 'medium' | 'high' }> = {
  beginner: { label: '初心者', desc: '競技歴2年未満', etpAdj: 3, levelAdj: -1, confidence: 'low' },
  intermediate: { label: '中級者', desc: '競技歴2〜5年', etpAdj: 1, levelAdj: 0, confidence: 'medium' },
  advanced: { label: '上級者', desc: '競技歴5年以上', etpAdj: 0, levelAdj: 0, confidence: 'high' },
  elite: { label: 'エリート', desc: '全国大会出場レベル', etpAdj: -1, levelAdj: 0, confidence: 'high' },
};

// 複数PB係数
export const PB_COEFFICIENTS = {
  m800: { coef: 1.64, weight: 0.3, label: '800m' },
  m1500: { coef: 3.30, weight: 0.5, label: '1500m' },
  m3000: { coef: 7.20, weight: 0.2, label: '3000m' },
  m5000: { coef: 12.5, weight: 0.15, label: '5000m' },
};

// ストレージキー
export const STORAGE_KEYS = {
  profile: 'midlab_profile',
  testResults: 'midlab_results',
  activePlan: 'midlab_activePlan',
  workoutLogs: 'midlab_workoutLogs',
  settings: 'midlab_settings',
  onboardingComplete: 'midlab_onboardingComplete',
};

// 旧ストレージキー（移行用）
export const LEGACY_STORAGE_KEYS = {
  profile: 'zone2peak_profile',
  testResults: 'zone2peak_results',
  activePlan: 'zone2peak_activePlan',
  workoutLogs: 'zone2peak_workoutLogs',
  settings: 'zone2peak_settings',
  onboardingComplete: 'zone2peak_onboardingComplete',
};

// フェーズ設定
export const PHASE_CONFIG: Record<PhaseType, { name: string; label: string; color: string; loadRange: [number, number] }> = {
  base: { name: '基礎期', label: '基礎', color: '#3B82F6', loadRange: [100, 100] },
  build: { name: '強化期', label: '強化', color: '#F97316', loadRange: [110, 120] },
  peak: { name: '試合期', label: '試合', color: '#EF4444', loadRange: [90, 100] },
  taper: { name: 'テーパー', label: 'テーパー', color: '#A855F7', loadRange: [50, 70] },
};

// 準備期間別の期分け配分
export const PHASE_DISTRIBUTION = {
  long: {
    base: { weeks: [4, 6] },
    build: { weeks: [6, 8] },
    peak: { weeks: [3, 4] },
    taper: { weeks: [2, 3] },
  },
  medium: {
    base: { weeks: [3, 4] },
    build: { weeks: [4, 6] },
    peak: { weeks: [2, 3] },
    taper: { weeks: [1, 2] },
  },
  short: {
    base: { weeks: [2, 2] },
    build: { weeks: [3, 4] },
    peak: { weeks: [1, 2] },
    taper: { weeks: [1, 1] },
  },
  minimal: {
    base: { weeks: [1, 1] },
    build: { weeks: [2, 2] },
    peak: { weeks: [1, 1] },
    taper: { weeks: [1, 1] },
  },
};

// フェーズ × リミッター別の負荷配分（%）
export const DISTRIBUTION_BY_LIMITER = {
  base: {
    cardio: { easy: 60, threshold: 25, vo2max: 10, speed: 5 },
    muscular: { easy: 55, threshold: 25, vo2max: 10, speed: 10 },
    balanced: { easy: 58, threshold: 25, vo2max: 10, speed: 7 },
  },
  build: {
    cardio: { easy: 40, threshold: 20, vo2max: 30, speed: 10 },
    muscular: { easy: 40, threshold: 20, vo2max: 15, speed: 25 },
    balanced: { easy: 40, threshold: 22, vo2max: 23, speed: 15 },
  },
  peak: {
    cardio: { easy: 45, threshold: 20, vo2max: 25, speed: 10 },
    muscular: { easy: 45, threshold: 15, vo2max: 15, speed: 25 },
    balanced: { easy: 45, threshold: 18, vo2max: 20, speed: 17 },
  },
  taper: {
    cardio: { easy: 60, threshold: 15, vo2max: 15, speed: 10 },
    muscular: { easy: 55, threshold: 15, vo2max: 10, speed: 20 },
    balanced: { easy: 58, threshold: 15, vo2max: 12, speed: 15 },
  },
};

// テーパー戦略
export const TAPER_CONFIG = {
  cardio: {
    durationMultiplier: 1.2,
    volumeReduction: 0.50,
    intensityKeep: true,
    lastIntenseWorkout: 10,
  },
  muscular: {
    durationMultiplier: 0.8,
    volumeReduction: 0.60,
    intensityKeep: true,
    lastIntenseWorkout: 5,
  },
  balanced: {
    durationMultiplier: 1.0,
    volumeReduction: 0.55,
    intensityKeep: true,
    lastIntenseWorkout: 7,
  },
};

// ワークアウトUI用リミッター設定
export const WORKOUT_LIMITER_CONFIG: Record<LimiterType, { icon: string; name: string; label: string; color: string; recoveryMult: number; repsAdj: number; paceAdj: number }> = {
  cardio: { icon: 'heart', name: '心肺リミッター型', label: '心肺', color: '#EF4444', recoveryMult: 1.5, repsAdj: -1, paceAdj: 2 },
  muscular: { icon: 'fitness', name: '筋持久力リミッター型', label: '筋持久力', color: '#F97316', recoveryMult: 0.75, repsAdj: 1, paceAdj: -1 },
  balanced: { icon: 'git-compare', name: 'バランス型', label: 'バランス', color: '#3B82F6', recoveryMult: 1.0, repsAdj: 0, paceAdj: 0 },
};

// リミッターアイコン設定（UI表示用）
export const LIMITER_ICONS: Record<LimiterType, { icon: string; label: string; color: string }> = {
  cardio: { icon: 'heart', label: '心肺', color: '#EF4444' },
  muscular: { icon: 'fitness', label: '筋持久力', color: '#F97316' },
  balanced: { icon: 'git-compare', label: 'バランス', color: '#3B82F6' },
};

// ワークアウトテンプレート
export const WORKOUTS = [
  {
    id: 'easy-6000',
    name: 'Easy 6000m',
    category: '有酸素ベース',
    description: '基礎的な有酸素能力を構築するイージーペースでの持続走。会話ができるペースで脂肪燃焼と毛細血管発達を促進。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 800, label: 'W-up 2周' },
      { zone: 'easy' as ZoneName, distance: 4400, label: 'Easy 11周' },
      { zone: 'jog' as ZoneName, distance: 800, label: 'C-down 2周' },
    ],
    limiterVariants: {
      cardio: { note: 'ペースを10秒/km遅めに維持' },
      muscular: { note: '後半2周をMペースに上げてOK' },
      balanced: { note: '標準ペースで実施' },
    },
  },
  {
    id: 'long-10000',
    name: 'Long Run 10000m',
    category: '有酸素ベース',
    description: 'プログレッシブ・ロングラン。後半にかけてペースを上げ、疲労状態でのペース維持能力を養成。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 800, label: 'W-up 2周' },
      { zone: 'easy' as ZoneName, distance: 4000, label: 'Easy 10周' },
      { zone: 'easy' as ZoneName, distance: 2400, label: 'Easy→M 6周' },
      { zone: 'marathon' as ZoneName, distance: 2000, label: 'M 5周' },
      { zone: 'jog' as ZoneName, distance: 800, label: 'C-down 2周' },
    ],
    limiterVariants: {
      cardio: { note: 'Mペース区間を1600mに短縮' },
      muscular: { note: 'Mペース区間を2400mに延長可' },
      balanced: { note: '標準で実施' },
    },
  },
  {
    id: 'tempo-4000',
    name: 'Tempo 4000m',
    category: '乳酸閾値',
    description: '閾値ペースでの持続走。乳酸処理能力を向上させ、レースペースの維持能力を高める。「快適にきつい」ペースを維持。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'threshold' as ZoneName, distance: 4000, label: 'T 10周' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: '3200m(8周)に短縮、ペース+2秒' },
      muscular: { note: '4800m(12周)に延長可' },
      balanced: { note: '標準で実施' },
    },
  },
  {
    id: 'cruise-1600x3',
    name: 'Cruise 1600m×3',
    category: '乳酸閾値',
    description: '閾値ペースでのクルーズインターバル。回復を挟むことで質の高い閾値刺激を維持。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'threshold' as ZoneName, distance: 1600, label: 'T 1600m', reps: 3, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 3, recoveryDistance: 600, note: '回復600mに延長' },
      muscular: { reps: 4, recoveryDistance: 400, note: '4本に増量' },
      balanced: { reps: 3, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'vo2max-1000x5',
    name: '1000m×5 Intervals',
    category: 'VO2max',
    targetLimiter: 'cardio' as LimiterType,
    description: 'インターバルペースでの高強度反復。VO2maxを刺激し最大酸素摂取量を向上。心肺リミッター型の改善に効果的。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'interval' as ZoneName, distance: 1000, label: 'I 1000m', reps: 5, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 4, recoveryDistance: 600, note: '4本に減、回復600m' },
      muscular: { reps: 6, recoveryDistance: 400, note: '6本に増量' },
      balanced: { reps: 5, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'vo2max-800x6',
    name: '800m×6 Intervals',
    category: 'VO2max',
    description: '800mインターバル。1000mより速いペースで短時間の高強度刺激。スピード持久力の養成に。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'interval' as ZoneName, distance: 800, label: 'I 800m', reps: 6, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 5, recoveryDistance: 600, note: '5本に減、回復600m' },
      muscular: { reps: 7, recoveryDistance: 400, note: '7本に増量' },
      balanced: { reps: 6, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'reps-200x10',
    name: '200m×10 Reps',
    category: '神経筋系',
    targetLimiter: 'muscular' as LimiterType,
    description: 'レペティションペースでの短距離反復。神経筋協調性とランニングエコノミーを改善。筋持久力リミッター型のスピード強化に効果的。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 200, label: 'R 200m', reps: 10, recoveryDistance: 200 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 8, recoveryDistance: 400, note: '8本に減、回復400m' },
      muscular: { reps: 12, recoveryDistance: 200, note: '12本に増量' },
      balanced: { reps: 10, recoveryDistance: 200, note: '標準で実施' },
    },
  },
  {
    id: 'pyramid',
    name: 'Pyramid',
    category: '総合',
    description: '段階的に距離を上げ下げするピラミッド。400→800→1200→800→400で多様なペース刺激。スピードと持久力を同時養成。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'interval' as ZoneName, distance: 400, label: 'I 400m' },
      { zone: 'jog' as ZoneName, distance: 400, label: '回復 1周' },
      { zone: 'interval' as ZoneName, distance: 800, label: 'I 800m' },
      { zone: 'jog' as ZoneName, distance: 400, label: '回復 1周' },
      { zone: 'threshold' as ZoneName, distance: 1200, label: 'T 1200m' },
      { zone: 'jog' as ZoneName, distance: 400, label: '回復 1周' },
      { zone: 'interval' as ZoneName, distance: 800, label: 'I 800m' },
      { zone: 'jog' as ZoneName, distance: 400, label: '回復 1周' },
      { zone: 'interval' as ZoneName, distance: 400, label: 'I 400m' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: '各回復を600mに延長' },
      muscular: { note: '1200mを1600mに延長' },
      balanced: { note: '標準で実施' },
    },
  },
];

// 週間距離目安（種目別）
export const WEEKLY_DISTANCE_BY_EVENT = {
  800: { base: 35000, build: 40000, peak: 35000, taper: 20000 },
  1500: { base: 40000, build: 50000, peak: 45000, taper: 25000 },
  3000: { base: 50000, build: 60000, peak: 55000, taper: 30000 },
  5000: { base: 55000, build: 70000, peak: 60000, taper: 35000 },
};

// キーワークアウト（フェーズ別）
export const KEY_WORKOUTS_BY_PHASE = {
  base: {
    categories: ['有酸素ベース', '乳酸閾値'],
    focusKeys: ['aerobic', 'threshold'],
    description: '有酸素能力の土台を構築',
  },
  build: {
    categories: ['VO2max', '乳酸閾値', '神経筋系'],
    focusKeys: ['vo2max', 'threshold', 'speed'],
    description: 'VO2max・乳酸閾値の向上',
  },
  peak: {
    categories: ['VO2max', '乳酸閾値'],
    focusKeys: ['vo2max', 'threshold'],
    description: 'レースペースへの最終調整',
  },
  taper: {
    categories: ['有酸素ベース', '神経筋系'],
    focusKeys: ['aerobic', 'speed'],
    description: '疲労回復と神経筋系維持',
  },
};

// 生理学的焦点カテゴリ
export const PHYSIOLOGICAL_FOCUS_CATEGORIES: Record<string, { name: string; menuCategory: string; iconName: string; color: string; description: string }> = {
  aerobic: {
    name: '有酸素ベース',
    menuCategory: '有酸素ベース',
    iconName: 'heart',
    color: '#3B82F6',
    description: '毛細血管発達・ミトコンドリア増加',
  },
  threshold: {
    name: '乳酸閾値',
    menuCategory: '乳酸閾値',
    iconName: 'fitness',
    color: '#EAB308',
    description: '乳酸処理能力の向上',
  },
  vo2max: {
    name: 'VO2max',
    menuCategory: 'VO2max',
    iconName: 'flame',
    color: '#F97316',
    description: '最大酸素摂取量の向上',
  },
  speed: {
    name: '神経筋系',
    menuCategory: '神経筋系',
    iconName: 'flash',
    color: '#EF4444',
    description: '神経筋協調性・ランニングエコノミー',
  },
};

// カラー定義
export const COLORS = {
  background: {
    dark: '#0a0a0f',
    light: '#12121a',
  },
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#EAB308',
  danger: '#EF4444',
  orange: '#f97316',
  gray: '#9CA3AF',
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
};
