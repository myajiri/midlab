// ============================================
// 定数定義
// ============================================

import { LevelName, ZoneName, LimiterType, PhaseType, AgeCategory, Gender, Experience } from '../types';

// 型の再エクスポート（store/useAppStore.ts, utils/calculations.ts 等で利用）
export type { LevelName, ZoneName, LimiterType, PhaseType, AgeCategory, Gender, Experience };

// テストレベル設定
// eTP閾値はLEVELSの1500mタイム定義と一致（PB秒 ÷ 3.375）
export const LEVELS: Record<LevelName, { name: string; description: string; startPace: number; maxLaps: number; etpRange: { min: number; max: number } }> = {
  SS: { name: 'SS', description: '1500m 3:30以内', startPace: 76, maxLaps: 6, etpRange: { min: 0, max: 62 } },     // < 210秒
  S: { name: 'S', description: '1500m 3:30-4:00', startPace: 88, maxLaps: 8, etpRange: { min: 62, max: 71 } },    // 210-240秒
  A: { name: 'A', description: '1500m 4:00-4:30', startPace: 96, maxLaps: 10, etpRange: { min: 71, max: 80 } },   // 240-270秒
  B: { name: 'B', description: '1500m 4:30-5:00', startPace: 108, maxLaps: 10, etpRange: { min: 80, max: 89 } },  // 270-300秒
  C: { name: 'C', description: '1500m 5:00以上', startPace: 120, maxLaps: 10, etpRange: { min: 89, max: 999 } },  // 300秒以上
};

export const PACE_INCREMENT = 4;
export const ETP_COEFFICIENT = 1.12;

// ライトモード設定（ペース加速が緩やかなテスト）
// 通常テストが厳しすぎる選手向け。ペースインクリメントを2-3秒に抑え、最大周回も削減。
export const LEVELS_LITE: Record<LevelName, { startPace: number; maxLaps: number; paceIncrement: number }> = {
  SS: { startPace: 76, maxLaps: 6, paceIncrement: 2 },
  S:  { startPace: 88, maxLaps: 8, paceIncrement: 2 },
  A:  { startPace: 96, maxLaps: 8, paceIncrement: 3 },
  B:  { startPace: 108, maxLaps: 8, paceIncrement: 3 },
  C:  { startPace: 120, maxLaps: 8, paceIncrement: 3 },
};

// 6ゾーン係数
// coef: eTP=60時のベース係数
// slope: eTPが1上がるごとの追加係数（上限eTP=100で打ち止め）
// 運動生理学的根拠: 走力が低い選手ほどVT1（第1換気閾値）がVO2maxに対して低い位置にあるため、
// 低強度ゾーン（jog/easy）はeTPに応じてより遅くする必要がある（Seiler, 2010; Daniels VDOT）
// 実効係数 = coef + slope × clamp(eTP - 60, 0, 40)
export const ZONE_COEFFICIENTS_V3: Record<ZoneName, { coef: number; slope: number; name: string; label: string; color: string; description: string; note?: string }> = {
  jog: { coef: 1.45, slope: 0.004, name: 'リカバリー', label: 'リカバリー', color: '#9CA3AF', description: '回復ペース', note: '目安' },
  easy: { coef: 1.32, slope: 0.004, name: 'イージー', label: 'イージー', color: '#3B82F6', description: 'VT1以下・有酸素ベース' },
  marathon: { coef: 1.15, slope: 0, name: 'マラソン', label: 'マラソン', color: '#22C55E', description: 'マラソンペース' },
  threshold: { coef: 1.06, slope: 0, name: '閾値', label: '閾値', color: '#EAB308', description: '乳酸閾値' },
  interval: { coef: 0.97, slope: 0, name: 'インターバル', label: 'インターバル', color: '#F97316', description: 'VO2max' },
  repetition: { coef: 0.90, slope: 0, name: 'レペティション', label: 'レペティション', color: '#EF4444', description: 'スピード' },
};

// リミッター別ゾーン調整
// cardio: VT1が低い（~72% VO2max）→ 低強度ゾーンをより遅くする必要がある
// muscular: VT1が高い（~78% VO2max）→ 中強度の持続走で筋疲労を保護
export const LIMITER_ZONE_ADJUSTMENTS: Record<LimiterType, Record<ZoneName, number>> = {
  cardio: { jog: +0.05, easy: +0.08, marathon: +0.03, threshold: +0.02, interval: +0.02, repetition: +0.02 },
  muscular: { jog: +0.02, easy: +0.03, marathon: +0.04, threshold: +0.03, interval: +0.02, repetition: -0.02 },
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
// recoveryCycle: 回復週の挿入サイクル（週数）。若年・高齢者は短いサイクルで回復週を設ける
export const AGE_CATEGORY_CONFIG: Record<AgeCategory, {
  label: string; desc: string; etpAdj: number; levelAdj: number;
  recoveryCycle: number; maxIntensityPercent: number; volumeMultiplier: number; recoveryDaysAfterKey: number;
}> = {
  junior_high: { label: '中学生', desc: '12〜15歳', etpAdj: 0, levelAdj: -1, recoveryCycle: 2, maxIntensityPercent: 90, volumeMultiplier: 0.75, recoveryDaysAfterKey: 1 },
  high_school: { label: '高校生', desc: '15〜18歳', etpAdj: 0, levelAdj: 0, recoveryCycle: 3, maxIntensityPercent: 95, volumeMultiplier: 0.9, recoveryDaysAfterKey: 1 },
  collegiate: { label: '大学生', desc: '18〜22歳', etpAdj: 0, levelAdj: 0, recoveryCycle: 3, maxIntensityPercent: 100, volumeMultiplier: 1.0, recoveryDaysAfterKey: 1 },
  senior: { label: '一般', desc: '22〜39歳', etpAdj: 0, levelAdj: 0, recoveryCycle: 3, maxIntensityPercent: 100, volumeMultiplier: 1.0, recoveryDaysAfterKey: 1 },
  masters_40: { label: 'マスターズ40代', desc: '40〜49歳', etpAdj: 2, levelAdj: 0, recoveryCycle: 3, maxIntensityPercent: 95, volumeMultiplier: 0.9, recoveryDaysAfterKey: 1 },
  masters_50: { label: 'マスターズ50代', desc: '50〜59歳', etpAdj: 4, levelAdj: -1, recoveryCycle: 2, maxIntensityPercent: 90, volumeMultiplier: 0.85, recoveryDaysAfterKey: 2 },
  masters_60: { label: 'マスターズ60歳以上', desc: '60歳以上', etpAdj: 6, levelAdj: -1, recoveryCycle: 2, maxIntensityPercent: 85, volumeMultiplier: 0.75, recoveryDaysAfterKey: 2 },
};

// 性別設定
export const GENDER_CONFIG: Record<Gender, { label: string; etpAdj: number; recoveryMultiplier: number; note?: string }> = {
  male: { label: '男性', etpAdj: 0, recoveryMultiplier: 1.0 },
  female: { label: '女性', etpAdj: 0, recoveryMultiplier: 1.1, note: '生理周期を考慮してテスト日を選択' },
  other: { label: '回答しない', etpAdj: 0, recoveryMultiplier: 1.0 },
};

// 競技歴設定
// recoveryCycle: 回復週の挿入サイクル（週数）。初心者は短いサイクルで回復週を設ける
export const EXPERIENCE_CONFIG: Record<Experience, { label: string; desc: string; etpAdj: number; levelAdj: number; confidence: 'low' | 'medium' | 'high'; recoveryCycle: number }> = {
  beginner: { label: '初心者', desc: '競技歴2年未満', etpAdj: 3, levelAdj: -1, confidence: 'low', recoveryCycle: 2 },
  intermediate: { label: '中級者', desc: '競技歴2〜5年', etpAdj: 1, levelAdj: 0, confidence: 'medium', recoveryCycle: 3 },
  advanced: { label: '上級者', desc: '競技歴5年以上', etpAdj: 0, levelAdj: 0, confidence: 'high', recoveryCycle: 3 },
  elite: { label: 'エリート', desc: '全国大会出場レベル', etpAdj: -1, levelAdj: 0, confidence: 'high', recoveryCycle: 3 },
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
    name: 'イージー6000m',
    category: '有酸素ベース',
    description: '基礎的な有酸素能力を構築するイージーペースでの持続走。会話ができるペースで脂肪燃焼と毛細血管発達を促進。ペースは上限目安で、余裕があればさらにゆっくり走ってもOK。',
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
    id: 'easy-8000',
    name: 'イージー8000m',
    category: '有酸素ベース',
    description: '有酸素能力を構築するイージーペースでの持続走。ペースは上限目安で、余裕があればさらにゆっくり走ってもOK。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 800, label: 'W-up 2周' },
      { zone: 'easy' as ZoneName, distance: 6400, label: 'Easy 16周' },
      { zone: 'jog' as ZoneName, distance: 800, label: 'C-down 2周' },
    ],
    limiterVariants: {
      cardio: { note: 'ペースを10秒/km遅めに維持' },
      muscular: { note: '後半4周をMペースに上げてOK' },
      balanced: { note: '標準ペースで実施' },
    },
  },
  {
    id: 'easy-10000',
    name: 'イージー10000m',
    category: '有酸素ベース',
    description: '長めのイージー走。有酸素キャパシティの拡大に効果的。ペースは上限目安で、余裕を持って走る。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'easy' as ZoneName, distance: 7600, label: 'Easy 19周' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: 'ペースを10秒/km遅めに維持' },
      muscular: { note: '後半4周をMペースに上げてOK' },
      balanced: { note: '標準ペースで実施' },
    },
  },
  {
    id: 'recovery-4000',
    name: 'リカバリー4000m',
    category: '有酸素ベース',
    description: 'キーワークアウト翌日の回復走。リカバリーペースで体の回復を促進。ゆっくり余裕を持って走る。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 800, label: 'W-up 2周' },
      { zone: 'jog' as ZoneName, distance: 2400, label: 'Recovery 6周' },
      { zone: 'jog' as ZoneName, distance: 800, label: 'C-down 2周' },
    ],
    limiterVariants: {
      cardio: { note: '3200mに短縮可' },
      muscular: { note: '標準で実施' },
      balanced: { note: '標準で実施' },
    },
  },
  {
    id: 'long-10000',
    name: 'ロングラン10000m',
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
    name: 'テンポ走4000m',
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
    name: 'クルーズ1600m×3',
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
    name: '1000m×5インターバル',
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
    name: '800m×6インターバル',
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
    name: '200m×10レペティション',
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
    id: 'vo2max-1200x4',
    name: '1200m×4インターバル',
    category: 'VO2max',
    targetLimiter: 'cardio' as LimiterType,
    description: '1200mインターバル。走力の高い選手向け。1000mよりVO2max刺激時間を確保できる。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'interval' as ZoneName, distance: 1200, label: 'I 1200m', reps: 4, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 3, recoveryDistance: 600, note: '3本に減、回復600m' },
      muscular: { reps: 5, recoveryDistance: 400, note: '5本に増量' },
      balanced: { reps: 4, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'vo2max-600x8',
    name: '600m×8インターバル',
    category: 'VO2max',
    description: '600mショートインターバル。高回転でVO2max刺激。スピード持久力の養成に。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'interval' as ZoneName, distance: 600, label: 'I 600m', reps: 8, recoveryDistance: 200 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 6, recoveryDistance: 400, note: '6本に減、回復400m' },
      muscular: { reps: 10, recoveryDistance: 200, note: '10本に増量' },
      balanced: { reps: 8, recoveryDistance: 200, note: '標準で実施' },
    },
  },
  {
    id: 'tempo-6000',
    name: 'テンポ走6000m',
    category: '乳酸閾値',
    description: '長めの閾値ペース持続走。乳酸処理能力と精神的タフネスを同時に養成。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'threshold' as ZoneName, distance: 6000, label: 'T 15周' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: '4800m(12周)に短縮、ペース+2秒' },
      muscular: { note: '標準で実施、後半ペースアップ可' },
      balanced: { note: '標準で実施' },
    },
  },
  {
    id: 'cruise-1200x4',
    name: 'クルーズ1200m×4',
    category: '乳酸閾値',
    description: '1200mクルーズインターバル。テンポ走より短い回復で質の高い閾値刺激。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'threshold' as ZoneName, distance: 1200, label: 'T 1200m', reps: 4, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 3, recoveryDistance: 600, note: '3本に減、回復600m' },
      muscular: { reps: 5, recoveryDistance: 400, note: '5本に増量' },
      balanced: { reps: 4, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'reps-300x8',
    name: '300m×8レペティション',
    category: '神経筋系',
    description: '300mレペティション。200mより長い距離でスピード持久力を養成。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 300, label: 'R 300m', reps: 8, recoveryDistance: 300 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 6, recoveryDistance: 400, note: '6本に減、回復400m' },
      muscular: { reps: 10, recoveryDistance: 200, note: '10本に増量' },
      balanced: { reps: 8, recoveryDistance: 300, note: '標準で実施' },
    },
  },
  {
    id: 'reps-400x6',
    name: '400m×6レペティション',
    category: '神経筋系',
    description: '400mレペティション。1周のスピード持久力とフォーム維持を養成。中距離選手に効果的。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 400, label: 'R 400m', reps: 6, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 5, recoveryDistance: 600, note: '5本に減、回復600m' },
      muscular: { reps: 8, recoveryDistance: 400, note: '8本に増量' },
      balanced: { reps: 6, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'pyramid',
    name: 'ピラミッド',
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

// イージー走距離目安（種目×フェーズ別）
export const EASY_DISTANCE_BY_EVENT: Record<number, Record<PhaseType, number>> = {
  800:  { base: 6000, build: 6000, peak: 6000, taper: 4000 },
  1500: { base: 8000, build: 8000, peak: 6000, taper: 4000 },
  3000: { base: 8000, build: 10000, peak: 8000, taper: 6000 },
  5000: { base: 10000, build: 10000, peak: 8000, taper: 6000 },
};

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

// eTP別ワークアウト選択設定
// eTP閾値以下の選手（速い選手）にはより長い距離のインターバルを推奨
export const WORKOUT_SELECTION_BY_ETP: Record<string, Array<{ maxEtp: number; workoutId: string }>> = {
  'VO2max': [
    { maxEtp: 70, workoutId: 'vo2max-1200x4' },   // SS〜S: 速い選手 → 1200m
    { maxEtp: 80, workoutId: 'vo2max-1000x5' },   // A: 中間 → 1000m
    { maxEtp: 999, workoutId: 'vo2max-800x6' },    // B〜C: → 800m
  ],
  '乳酸閾値': [
    { maxEtp: 75, workoutId: 'tempo-6000' },       // 速い選手 → 長めテンポ
    { maxEtp: 999, workoutId: 'tempo-4000' },      // 標準 → 4000m
  ],
  '神経筋系': [
    { maxEtp: 75, workoutId: 'reps-400x6' },       // 速い選手 → 長めレップ
    { maxEtp: 999, workoutId: 'reps-200x10' },     // 標準 → 200m
  ],
};

// カラー定義
export const COLORS = {
  background: {
    dark: '#0a0a0f',
    light: '#12121a',
  },
  primary: '#2d9f2d',
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
