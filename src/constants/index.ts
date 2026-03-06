// ============================================
// 定数定義
// ============================================

import { LevelName, ZoneName, LimiterType, PhaseType, AgeCategory, Gender, Experience, RestDayFrequency } from '../types';

// 型の再エクスポート（store/useAppStore.ts, utils/calculations.ts 等で利用）
export type { LevelName, ZoneName, LimiterType, PhaseType, AgeCategory, Gender, Experience, RestDayFrequency };

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

// 休養日頻度設定
// 休養日（完全休養）の挿入頻度をユーザーが選択可能にする
export const REST_DAY_FREQUENCY_CONFIG: Record<RestDayFrequency, {
  label: string;
  desc: string;
  restWeekInterval: number; // 何週ごとに休養日を入れるか（1=毎週, 2=2週に1回, 4=月1回）
}> = {
  weekly: { label: '毎週', desc: '毎週1回の完全休養（初心者推奨）', restWeekInterval: 1 },
  biweekly: { label: '2週に1回', desc: '2週間に1回の完全休養', restWeekInterval: 2 },
  monthly: { label: '月1〜2回', desc: '月に1〜2回の完全休養（上級者向け）', restWeekInterval: 4 },
  auto: { label: '自動', desc: '競技歴と月間走行距離から自動決定', restWeekInterval: 1 },
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
// 200m/400mは初回プロファイリング向け（定期再評価にはeTPテストを推奨）
export const PB_COEFFICIENTS = {
  m200: { coef: 0.38, weight: 0.1, label: '200m' },
  m400: { coef: 0.78, weight: 0.2, label: '400m' },
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
  trainingLogs: 'midlab_trainingLogs',
  settings: 'midlab_settings',
  onboardingComplete: 'midlab_onboardingComplete',
  customWorkouts: 'midlab_customWorkouts',
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
    selectionGuide: '月間走行距離が少なめ（〜150km）の選手や、ポイント練習翌日のつなぎに最適。8000mでは長すぎる・疲労が残りそうな場合はこちらを選択。短い分、ペースの安定感に意識を向けやすい。',
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
    selectionGuide: '月間150〜250kmの選手の標準的なつなぎ練習。6000mより刺激時間が長く有酸素適応が進みやすい。10000mだと疲労が翌日に残る場合はこちら。一定ペースを保つ練習としても有効。',
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
    selectionGuide: '月間250〜350kmの選手に。8000mでは物足りないが12000mだと負担が大きい場合に最適。有酸素キャパシティの拡大期（基礎期〜強化期）に特に効果的。後半のペース落ちを防ぐ意識を。',
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
    id: 'easy-12000',
    name: 'イージー12000m',
    category: '有酸素ベース',
    description: '高ボリューム走者向けのイージー走。有酸素ベースの拡大に効果的。',
    selectionGuide: '月間350〜400kmの選手向け。10000mと比べて約20%長い分、脂肪代謝能力と精神的持久力がより鍛えられる。ただしポイント練習翌日は10000m以下を推奨。週に1〜2回の実施が目安。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'easy' as ZoneName, distance: 9600, label: 'Easy 24周' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: 'ペースを10秒/km遅めに維持' },
      muscular: { note: '後半6周をMペースに上げてOK' },
      balanced: { note: '標準ペースで実施' },
    },
  },
  {
    id: 'easy-14000',
    name: 'イージー14000m',
    category: '有酸素ベース',
    description: '高ボリューム走者向けの長めイージー走。月間400km以上を目指す選手に。',
    selectionGuide: '月間400km以上の選手向け。12000mからさらに2km伸ばし、有酸素基盤を厚くする。中距離専門でも5000m以上のレースを見据える場合は検討価値あり。ポイント練習から離れた日に配置。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'easy' as ZoneName, distance: 10800, label: 'Easy 27周' },
      { zone: 'jog' as ZoneName, distance: 1600, label: 'C-down 4周' },
    ],
    limiterVariants: {
      cardio: { note: 'ペースを10秒/km遅めに維持' },
      muscular: { note: '後半6周をMペースに上げてOK' },
      balanced: { note: '標準ペースで実施' },
    },
  },
  {
    id: 'easy-16000',
    name: 'イージー16000m',
    category: '有酸素ベース',
    description: 'エリート向けの長距離イージー走。月間450km以上を目指す選手に。',
    selectionGuide: '月間450km以上のエリート選手向け。14000mでは距離が不足する場合に。長時間のイージーペース維持が有酸素酵素活性を最大限に高める。ただしこの距離のイージーは疲労も蓄積するため週1回を目安に。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'easy' as ZoneName, distance: 12800, label: 'Easy 32周' },
      { zone: 'jog' as ZoneName, distance: 1600, label: 'C-down 4周' },
    ],
    limiterVariants: {
      cardio: { note: 'ペースを10秒/km遅めに維持' },
      muscular: { note: '後半8周をMペースに上げてOK' },
      balanced: { note: '標準ペースで実施' },
    },
  },
  {
    id: 'recovery-4000',
    name: 'リカバリー4000m',
    category: '有酸素ベース',
    description: 'キーワークアウト翌日の回復走。表示ペースは上限目安で、これより遅くてOK。体の回復を最優先に。分割走（朝夕2回）にしても効果的。',
    selectionGuide: 'イージー走とは明確に異なり、積極的回復が目的。イージーペースよりさらに遅いリカバリーペースで走る。ポイント練習翌日や疲労感が強い日に。イージー走を選ぶか迷ったら、脚に張りや重さがあればこちらを。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 800, label: 'W-up 2周' },
      { zone: 'jog' as ZoneName, distance: 2400, label: 'Recovery 6周' },
      { zone: 'jog' as ZoneName, distance: 800, label: 'C-down 2周' },
    ],
    limiterVariants: {
      cardio: { note: '3200mに短縮可。ペースは上限目安' },
      muscular: { note: '標準で実施。ペースは上限目安' },
      balanced: { note: '標準で実施。ペースは上限目安' },
    },
  },
  {
    id: 'recovery-6000',
    name: 'リカバリー6000m',
    category: '有酸素ベース',
    description: '月間走行距離200km以上の選手向けリカバリー走。表示ペースは上限目安で、これより遅くてOK。分割走（朝夕2回に分けて3000m×2）も推奨。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'jog' as ZoneName, distance: 3600, label: 'Recovery 9周' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: '4000mに短縮可。ペースは上限目安' },
      muscular: { note: '標準で実施。ペースは上限目安' },
      balanced: { note: '標準で実施。ペースは上限目安' },
    },
  },
  {
    id: 'recovery-8000',
    name: 'リカバリー8000m',
    category: '有酸素ベース',
    description: '月間走行距離300km以上の選手向けリカバリー走。表示ペースは上限目安で、これより遅くてOK。分割走（朝夕2回に分けて4000m×2）も推奨。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'jog' as ZoneName, distance: 4800, label: 'Recovery 12周' },
      { zone: 'jog' as ZoneName, distance: 1600, label: 'C-down 4周' },
    ],
    limiterVariants: {
      cardio: { note: '6000mに短縮可。ペースは上限目安' },
      muscular: { note: '標準で実施。ペースは上限目安' },
      balanced: { note: '標準で実施。ペースは上限目安' },
    },
  },
  {
    id: 'long-10000',
    name: 'ロングラン10000m',
    category: '有酸素ベース',
    description: 'プログレッシブ・ロングラン。後半にかけてペースを上げ、疲労状態でのペース維持能力を養成。',
    selectionGuide: 'イージー走との違いは後半にMペース区間があること。レース後半のペース維持能力を養う。14000mロングランだと負荷が高すぎる場合や、月間走行距離が〜250kmの場合に。後半のMペース区間で「疲れた状態からの切り替え」を意識。',
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
    id: 'long-14000',
    name: 'ロングラン14000m',
    category: '有酸素ベース',
    description: '高ボリューム走者向けのロングラン。有酸素ベース拡大と精神的タフネスを養成。',
    selectionGuide: '10000mロングランより4km長く、Mペース区間も延長。月間300km以上の選手向け。10000mロングランでは物足りなくなった段階で移行。後半のMペース区間が長い分、レース後半のシミュレーションとしてより実戦的。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1200, label: 'W-up 3周' },
      { zone: 'easy' as ZoneName, distance: 6000, label: 'Easy 15周' },
      { zone: 'easy' as ZoneName, distance: 2400, label: 'Easy→M 6周' },
      { zone: 'marathon' as ZoneName, distance: 3200, label: 'M 8周' },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { note: 'Mペース区間を2400mに短縮' },
      muscular: { note: 'Mペース区間を4000mに延長可' },
      balanced: { note: '標準で実施' },
    },
  },
  {
    id: 'long-18000',
    name: 'ロングラン18000m',
    category: '有酸素ベース',
    description: 'エリート向けのロングラン。月間400km以上の選手に最適。',
    selectionGuide: '月間400km以上のエリート選手向けロングラン。14000mでは刺激が不足する場合に。Mペース区間が9周と長く、有酸素系と精神面の両方を大きく鍛える。体調万全の日に実施し、翌日はリカバリーを。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'easy' as ZoneName, distance: 8000, label: 'Easy 20周' },
      { zone: 'easy' as ZoneName, distance: 3200, label: 'Easy→M 8周' },
      { zone: 'marathon' as ZoneName, distance: 3600, label: 'M 9周' },
      { zone: 'jog' as ZoneName, distance: 1600, label: 'C-down 4周' },
    ],
    limiterVariants: {
      cardio: { note: 'Mペース区間を2800mに短縮' },
      muscular: { note: 'Mペース区間を4400mに延長可' },
      balanced: { note: '標準で実施' },
    },
  },
  {
    id: 'tempo-4000',
    name: 'テンポ走4000m',
    category: '乳酸閾値',
    description: '閾値ペースでの持続走。乳酸処理能力を向上させ、レースペースの維持能力を高める。「快適にきつい」ペースを維持。',
    selectionGuide: 'クルーズインターバル（1200×4, 1600×3）との違いは「休憩なしの持続走」であること。閾値ペースを途切れなく維持する集中力と乳酸処理能力を養う。6000mテンポ走がまだきつい段階や、閾値走に慣れていない場合はこちらから。意識すべきポイントは「ペースの均一性」。前半突っ込まず最後まで同じペースを保つこと。',
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
    selectionGuide: '1200m×4と比べて1本の距離が長く本数が少ない。テンポ走（持続走）に近い刺激を、回復を挟みながら得られる。1200m×4では「短すぎてペースが安定しない」場合や、3000m〜5000m選手でより長い持続刺激が欲しい場合に選択。意識すべきポイントは「各本の入りを落ち着いて入り、後半もペースを落とさない」こと。',
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
    selectionGuide: 'VO2maxインターバルの定番メニュー。800m×6より1本が長くペース配分が求められる。1200m×4ほどきつくなく、バランスの良い刺激が得られる。1500m選手の標準メニューとして最適。800m×6との違いは、1本あたりのVO2max滞在時間が長い点。意識すべきポイントは「全本を同じペースで走ること」。最初の1本が速すぎると後半で崩れやすい。',
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
    selectionGuide: '1000m×5と比べて1本が短く本数が多い。VO2maxへの到達が早く、スピード寄りの刺激になる。800m選手や、1000mインターバルだとペースが安定しない段階の選手に推奨。600m×8との違いは、1本の持続時間が長い分VO2max刺激がしっかり入ること。意識すべきポイントは「回復中に完全に呼吸を整えきらない」こと。やや息が残った状態で次の本に入る。',
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
    category: 'スピード・スプリント',
    targetLimiter: 'muscular' as LimiterType,
    description: 'レペティションペースでの短距離反復。神経筋協調性とランニングエコノミーを改善。筋持久力リミッター型のスピード強化に効果的。',
    selectionGuide: '神経筋系メニューの中で最も短い距離。ピュアなスピードとフォーム改善に特化。300m×8や400m×6と比べて乳酸の蓄積が少なく、1本1本をフレッシュな状態で全力に近い質で走れる。スピードの絶対値を上げたい場合はこちら。意識すべきポイントは「力まずにリラックスしたフォームでトップスピードに乗る」こと。',
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
    selectionGuide: 'VO2maxインターバルの中で最も1本が長く負荷が高い。1000m×5で余裕が出てきた選手のステップアップに。eTPが低い（速い）選手に自動推奨される。1000m×5との違いは、1本あたりのVO2max帯の滞在時間がさらに長く、乳酸耐性も同時に鍛えられる点。意識すべきポイントは「800〜1000m通過で最もきつくなるが、そこからの200mを粘る」こと。',
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
    selectionGuide: 'VO2maxインターバルの中で最も短く本数が多い。800m×6より速いペースで走れるため、スピード要素が強い。800m選手のレースペース練習としても有効。800m×6との違いは、回復が短く高回転でVO2maxに繰り返し到達するショートインターバル的な性質。意識すべきポイントは「回復200mの間にフォームを整え、次の本のスタートダッシュをスムーズにすること」。',
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
    selectionGuide: '4000mテンポ走の上位版。4000mでは余裕が出てきた選手や、eTPが低い（速い）選手に推奨。15周の持続走は精神的にもタフだが、3000m〜5000mレースの後半を想定した実戦的トレーニング。4000mとの選択基準は「4000mテンポ走を閾値ペースで安定して走りきれるか」。',
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
    selectionGuide: '1600m×3と比べて1本が短く本数が多い。短い本数で集中しやすく、800m〜1500m選手に特に有効。テンポ走のような長時間の持続が苦手でも、分割することで閾値ペースの質を確保できる。1600m×3との選択基準は「1600mを閾値ペースで安定して走りきれるか」。まだ難しければこちらから。意識すべきポイントは「回復を短く保ち、次の本もペースを落とさない」こと。',
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
    category: 'スピード・スプリント',
    description: '300mレペティション。200mより長い距離でスピード持久力を養成。',
    selectionGuide: '200m×10と400m×6の中間。200mでは短すぎてスピード持久力が鍛えにくく、400mでは乳酸がきつすぎる場合に最適。800m〜1500m選手のラストスパート強化に特に有効。200m×10との違いは、後半100mで乳酸を感じながらフォームを維持する練習になること。意識すべきポイントは「250m通過以降でフォームが崩れないよう腕振りを意識する」こと。',
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
    category: 'スピード・スプリント',
    description: '400mレペティション。1周のスピード持久力とフォーム維持を養成。中距離選手に効果的。',
    selectionGuide: '神経筋系メニューの中で最も距離が長く、スピード持久力への負荷が最大。200mや300mのレペティションで余裕が出てきた段階のステップアップに。eTPが低い（速い）選手に自動推奨される。200m・300mとの違いは、1周全体を通じて乳酸を処理しながらスピードを維持する能力が求められる点。意識すべきポイントは「300m通過以降の減速を最小限に抑える」こと。',
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
    selectionGuide: '単一距離のインターバルやレペティションとは異なり、異なる距離・ペースを1セッションで経験できる。マンネリ防止やレース中のペース変化への対応力を養うのに有効。インターバルとレペティションどちらを選ぶか迷った場合の「いいとこ取り」メニュー。意識すべきポイントは「距離が変わってもゾーンに合ったペースを守ること」。',
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
  // ショートインターバル・スプリント系（中距離選手向け追加メニュー）
  {
    id: 'short-200x12',
    name: '200m×12ショートインターバル',
    category: 'スピード・スプリント',
    description: 'VO2max〜Rペースでの高回転ショートインターバル。800m/1500m選手のスピード持久力を養成。レースペースへの適応に効果的。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 200, label: 'R 200m', reps: 12, recoveryDistance: 200 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 10, recoveryDistance: 300, note: '10本に減、回復300m' },
      muscular: { reps: 14, recoveryDistance: 200, note: '14本に増量' },
      balanced: { reps: 12, recoveryDistance: 200, note: '標準で実施' },
    },
  },
  {
    id: 'sprint-150x8',
    name: '150m×8スプリント',
    category: 'スピード・スプリント',
    description: '最大スピードに近い短距離スプリント。ランニングフォームの改善とトップスピードの向上に。800m選手のラストスパート強化に効果的。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 150, label: 'Sprint 150m', reps: 8, recoveryDistance: 250 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 6, recoveryDistance: 400, note: '6本に減、回復400m' },
      muscular: { reps: 10, recoveryDistance: 200, note: '10本に増量' },
      balanced: { reps: 8, recoveryDistance: 250, note: '標準で実施' },
    },
  },
  {
    id: 'speed-300x6',
    name: '300m×6スピード持久力',
    category: 'スピード・スプリント',
    description: '300mをレペティションペースで。レースの中盤〜終盤のペース維持能力を養成。1500m選手のスピード持久力強化に最適。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 300, label: 'R 300m', reps: 6, recoveryDistance: 300 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 5, recoveryDistance: 500, note: '5本に減、回復500m' },
      muscular: { reps: 8, recoveryDistance: 300, note: '8本に増量' },
      balanced: { reps: 6, recoveryDistance: 300, note: '標準で実施' },
    },
  },
  {
    id: 'windsprints',
    name: 'ウインドスプリント（流し）',
    category: 'スピード・スプリント',
    description: 'イージー走＋流し。イージー走の後に100m流しを入れることで、スピード刺激を加えつつ回復を確保。基礎期のスピード維持に。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 800, label: 'W-up 2周' },
      { zone: 'easy' as ZoneName, distance: 4000, label: 'Easy 10周' },
      { zone: 'repetition' as ZoneName, distance: 100, label: '流し 100m', reps: 6, recoveryDistance: 300 },
      { zone: 'jog' as ZoneName, distance: 800, label: 'C-down 2周' },
    ],
    limiterVariants: {
      cardio: { note: '流し4本に減' },
      muscular: { note: '流し8本に増量' },
      balanced: { note: '標準で実施' },
    },
  },
  // 800m・400-800タイプ向け追加メニュー
  {
    id: 'speed-500x5',
    name: '500m×5スピード持久力',
    category: 'スピード・スプリント',
    description: '800m選手の特異的トレーニング。400mより長く乳酸耐性を鍛え、600mより短く1本あたりの質を維持できる。800mレースの前半〜中盤のペース感覚を養成。',
    selectionGuide: '800m選手のメインメニューの一つ。400m×6では短すぎてレース後半の乳酸耐性が鍛えにくく、600m×4ではペースが落ちやすい場合に最適。レースペースの95-100%で走り、残り100mでフォームが崩れないよう意識する。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 500, label: 'R 500m', reps: 5, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 4, recoveryDistance: 500, note: '4本に減、回復500m' },
      muscular: { reps: 6, recoveryDistance: 300, note: '6本に増、回復300m' },
      balanced: { reps: 5, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'speed-600x4',
    name: '600m×4レースモデル',
    category: 'スピード・スプリント',
    description: '800mの3/4距離でのレースペース走。レース中盤の苦しい場面でのペース維持能力とメンタル強化に。800m選手のレースシミュレーションとして効果的。',
    selectionGuide: '800mレースの75%距離で実施するため、レースペースに近い強度で質の高い練習ができる。500m×5よりもレースに近い距離感で走れるため、試合前のシミュレーション練習に最適。最後の200mでのペースアップを意識する。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'interval' as ZoneName, distance: 600, label: 'I 600m', reps: 4, recoveryDistance: 600 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 3, recoveryDistance: 800, note: '3本に減、回復800m' },
      muscular: { reps: 5, recoveryDistance: 400, note: '5本に増、回復400m' },
      balanced: { reps: 4, recoveryDistance: 600, note: '標準で実施' },
    },
  },
  {
    id: 'set-200-400-200',
    name: '(200+400+200)m×3セットインターバル',
    category: 'スピード・スプリント',
    description: '変化走形式のセットインターバル。200m-400m-200mを1セットとし、800mのレースで起きるペース変化に対応する力を養成。400-800タイプの選手に特に効果的。',
    selectionGuide: '単一距離の反復では得られない、ペースの切り替え能力を鍛えるメニュー。スタートダッシュ(200m)→中盤の維持(400m)→ラストスパート(200m)という800mレースの展開をシミュレーション。各セット間は十分な回復を取り、質を維持する。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 200, label: 'R 200m', reps: 3, recoveryDistance: 200 },
      { zone: 'interval' as ZoneName, distance: 400, label: 'I 400m', reps: 3, recoveryDistance: 200 },
      { zone: 'repetition' as ZoneName, distance: 200, label: 'R 200m', reps: 3, recoveryDistance: 400 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 2, recoveryDistance: 400, note: '2セットに減、セット間回復400m' },
      muscular: { reps: 4, recoveryDistance: 200, note: '4セットに増' },
      balanced: { reps: 3, recoveryDistance: 400, note: '標準で実施' },
    },
  },
  {
    id: 'speed-350x6',
    name: '350m×6スピード持久力',
    category: 'スピード・スプリント',
    description: '400-800タイプ向けのショートインターバル。400mより少し短い距離でレペティションペース以上の強度を維持。スプリント持久力の向上に特化。',
    selectionGuide: '300m×8と400m×6の間に位置するメニュー。300mでは少し短くて乳酸が十分溜まらず、400mではペースが落ちる選手に最適。400m的なスプリント持久力と800m的な乳酸耐性の両方を鍛えられる。意識すべきは「最後の50mまでフォームを崩さない」こと。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 350, label: 'R 350m', reps: 6, recoveryDistance: 350 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 5, recoveryDistance: 500, note: '5本に減、回復500m' },
      muscular: { reps: 8, recoveryDistance: 250, note: '8本に増、回復250m' },
      balanced: { reps: 6, recoveryDistance: 350, note: '標準で実施' },
    },
  },
  {
    id: 'sprint-150x10',
    name: '150m×10ウインドスプリント',
    category: 'スピード・スプリント',
    description: '最大スピードに近い短距離スプリントを10本。神経筋系の活性化と最大スピードの向上に特化。800m選手のトップスピード向上とラストスパート強化に効果的。',
    selectionGuide: '150m×8より本数を増やしたバージョン。トップスピードの絶対値を引き上げたい800m選手に推奨。力まずリラックスしたフォームで走ることが重要。2本目以降タイムが落ちるようなら回復を延長する。',
    segments: [
      { zone: 'jog' as ZoneName, distance: 1600, label: 'W-up 4周' },
      { zone: 'repetition' as ZoneName, distance: 150, label: 'Sprint 150m', reps: 10, recoveryDistance: 250 },
      { zone: 'jog' as ZoneName, distance: 1200, label: 'C-down 3周' },
    ],
    limiterVariants: {
      cardio: { reps: 8, recoveryDistance: 350, note: '8本に減、回復350m' },
      muscular: { reps: 12, recoveryDistance: 200, note: '12本に増、回復200m' },
      balanced: { reps: 10, recoveryDistance: 250, note: '標準で実施' },
    },
  },
];

// イージー走距離目安（種目×フェーズ別）
export const EASY_DISTANCE_BY_EVENT: Record<number, Record<PhaseType, number>> = {
  400:  { base: 6000, build: 6000, peak: 4000, taper: 4000 },
  800:  { base: 6000, build: 6000, peak: 6000, taper: 4000 },
  1500: { base: 8000, build: 8000, peak: 6000, taper: 4000 },
  3000: { base: 8000, build: 10000, peak: 8000, taper: 6000 },
  5000: { base: 10000, build: 10000, peak: 8000, taper: 6000 },
  10000: { base: 10000, build: 12000, peak: 10000, taper: 8000 },
  21097: { base: 12000, build: 14000, peak: 12000, taper: 8000 },
  42195: { base: 14000, build: 16000, peak: 14000, taper: 10000 },
};

// 週間距離目安（種目別）
export const WEEKLY_DISTANCE_BY_EVENT: Record<number, Record<PhaseType, number>> = {
  400: { base: 30000, build: 35000, peak: 30000, taper: 18000 },
  800: { base: 35000, build: 40000, peak: 35000, taper: 20000 },
  1500: { base: 40000, build: 50000, peak: 45000, taper: 25000 },
  3000: { base: 50000, build: 60000, peak: 55000, taper: 30000 },
  5000: { base: 55000, build: 70000, peak: 60000, taper: 35000 },
  10000: { base: 60000, build: 80000, peak: 70000, taper: 40000 },
  21097: { base: 70000, build: 90000, peak: 80000, taper: 45000 },
  42195: { base: 80000, build: 100000, peak: 90000, taper: 50000 },
};

// キーワークアウト（フェーズ別・デフォルト）
// 種目別の調整は KEY_WORKOUTS_BY_DISTANCE で上書きされる
export const KEY_WORKOUTS_BY_PHASE: Record<PhaseType, { categories: string[]; focusKeys: string[]; description: string }> = {
  base: {
    categories: ['有酸素ベース', '乳酸閾値'],
    focusKeys: ['aerobic', 'threshold'],
    description: '有酸素能力の土台を構築',
  },
  build: {
    categories: ['VO2max', '乳酸閾値', 'スピード・スプリント'],
    focusKeys: ['vo2max', 'threshold', 'speed'],
    description: 'VO2max・乳酸閾値の向上',
  },
  peak: {
    categories: ['VO2max', '乳酸閾値'],
    focusKeys: ['vo2max', 'threshold'],
    description: 'レースペースへの最終調整',
  },
  taper: {
    categories: ['有酸素ベース', 'スピード・スプリント'],
    focusKeys: ['aerobic', 'speed'],
    description: '疲労回復とスピード維持',
  },
};

// 種目別キーワークアウト配分
// 800m/1500mではスピード・スプリントを2つのKey日の1つに昇格
export const KEY_WORKOUTS_BY_DISTANCE: Record<number, Partial<Record<PhaseType, { focusKeys: string[] }>>> = {
  400: {
    base: { focusKeys: ['speed', 'threshold'] },       // 400m: スピード最優先
    build: { focusKeys: ['speed', 'vo2max'] },
    peak: { focusKeys: ['speed', 'vo2max'] },
  },
  800: {
    base: { focusKeys: ['threshold', 'speed'] },       // 800m: 基礎期でもスピード刺激
    build: { focusKeys: ['vo2max', 'speed'] },          // 800m: スピードを2番手に昇格
    peak: { focusKeys: ['speed', 'vo2max'] },           // 800m: スピードを最優先
  },
  1500: {
    build: { focusKeys: ['vo2max', 'speed'] },          // 1500m: スピードを2番手に昇格
    peak: { focusKeys: ['vo2max', 'speed'] },           // 1500m: スピードを2番手に
  },
  // 3000m, 5000mはデフォルト（KEY_WORKOUTS_BY_PHASE）をそのまま使用
  10000: {
    base: { focusKeys: ['aerobic', 'threshold'] },
    build: { focusKeys: ['threshold', 'vo2max'] },
    peak: { focusKeys: ['threshold', 'vo2max'] },
  },
  21097: {
    base: { focusKeys: ['aerobic', 'threshold'] },
    build: { focusKeys: ['threshold', 'aerobic'] },
    peak: { focusKeys: ['threshold', 'vo2max'] },
  },
  42195: {
    base: { focusKeys: ['aerobic', 'threshold'] },
    build: { focusKeys: ['aerobic', 'threshold'] },
    peak: { focusKeys: ['threshold', 'aerobic'] },
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
    name: 'スピード・スプリント',
    menuCategory: 'スピード・スプリント',
    iconName: 'flash',
    color: '#EF4444',
    description: 'スピード持久力・ランニングエコノミー',
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
  'スピード・スプリント': [
    { maxEtp: 70, workoutId: 'speed-300x6' },      // SS〜S: 300mスピード持久力
    { maxEtp: 80, workoutId: 'reps-400x6' },       // A: 400mレップ
    { maxEtp: 999, workoutId: 'reps-200x10' },     // B〜C: 200mレップ
  ],
  '有酸素ベース': [
    { maxEtp: 70, workoutId: 'windsprints' },       // SS〜S: 流し付きイージー走
    { maxEtp: 80, workoutId: 'easy-12000' },        // A: やや長めのイージー走
    { maxEtp: 999, workoutId: 'easy-10000' },       // B〜C: 標準ロングイージー走
  ],
};

// ============================================
// 根拠・哲学データ
// ============================================

// リミッタータイプ別の根拠説明
export const LIMITER_RATIONALE: Record<LimiterType, {
  summary: string;
  detail: string;
  trainingFocus: string;
  scienceBasis: string;
}> = {
  cardio: {
    summary: '心肺系がパフォーマンスの制限要因',
    detail: 'テスト中に「息が先にきつくなる」パターンから、心肺系（VO2max・心拍出量）がボトルネックと判定されました。',
    trainingFocus: 'VO2maxインターバルを重点的に配置し、最大酸素摂取量の天井を引き上げます。回復を長めに取り、1本1本の質を重視します。',
    scienceBasis: '心肺リミッター型では、VT1（第1換気閾値）がVO2maxの約72%と低い位置にあるため、高強度刺激で心肺適応を促進する必要があります（Seiler, 2010）。',
  },
  muscular: {
    summary: '筋持久力がパフォーマンスの制限要因',
    detail: 'テスト中に「脚が先にきつくなる」パターンから、筋持久力（ランニングエコノミー・神経筋協調性）がボトルネックと判定されました。',
    trainingFocus: 'レペティション・スピード系を重点的に配置し、神経筋協調性とランニングエコノミーを改善します。本数を多めに設定し、筋適応を促します。',
    scienceBasis: '筋持久力リミッター型では、VT1がVO2maxの約78%と高い位置にあり心肺余裕がある一方、筋疲労が先行します。スピード刺激で筋パワー・効率を高めることが効果的です。',
  },
  balanced: {
    summary: '心肺系と筋持久力がバランスよく発達',
    detail: '心肺系と筋持久力の両方が均等に制限要因となっています。特定の弱点がない分、総合的なアプローチが有効です。',
    trainingFocus: 'VO2max・閾値・スピードをバランスよく配置し、全体的な能力底上げを図ります。',
    scienceBasis: 'バランス型ではVT1がVO2maxの約75%に位置し、各能力が均等に発達しています。Danielsのトレーニング理論に基づき、多面的な刺激で段階的に向上させます。',
  },
};

// フェーズ別の根拠説明
export const PHASE_RATIONALE: Record<PhaseType, {
  purpose: string;
  why: string;
  keyPrinciple: string;
}> = {
  base: {
    purpose: '有酸素能力の土台構築',
    why: 'どんなトレーニングも有酸素基盤の上に成り立ちます。毛細血管の発達とミトコンドリアの増加により、酸素運搬・利用能力を高めます。',
    keyPrinciple: '「速く走る前に、長く走れる体を作る」- 基礎期で土台を固めることで、次の強化期の高強度トレーニングの効果を最大化します。',
  },
  build: {
    purpose: 'VO2max・乳酸閾値の向上',
    why: '基礎期で築いた有酸素基盤の上に、レースペースに近い強度の刺激を加えます。心肺機能と乳酸処理能力を同時に引き上げます。',
    keyPrinciple: '「段階的な負荷増大」- 漸進的に強度を上げることで、過負荷を避けながら着実にパフォーマンスを向上させます（漸進的過負荷の原則）。',
  },
  peak: {
    purpose: 'レースペースへの最終調整',
    why: '目標レースのペースと距離に特化したトレーニングで、レース当日に最高のパフォーマンスを発揮できる状態を作ります。',
    keyPrinciple: '「特異性の原則」- レースと同じ強度・リズムで練習することで、本番に必要な生理学的・心理的な準備を整えます。',
  },
  taper: {
    purpose: '疲労回復とパフォーマンスのピーキング',
    why: 'トレーニング量を減らしつつ強度は維持することで、蓄積された疲労を取り除き、体の超回復を引き出します。',
    keyPrinciple: '「テーパリングの科学」- 研究によりボリュームを40-60%減少させつつ強度を維持するテーパーが、2-3%のパフォーマンス向上をもたらすことが示されています（Mujika & Padilla, 2003）。',
  },
};

// 生理学的焦点カテゴリの根拠（PHYSIOLOGICAL_FOCUS_CATEGORIESの補完）
export const FOCUS_RATIONALE: Record<string, {
  whyImportant: string;
  limiterConnection: Record<LimiterType, string>;
}> = {
  aerobic: {
    whyImportant: '有酸素ベースはすべての持久系パフォーマンスの土台です。毛細血管密度の向上により、筋肉への酸素供給が改善されます。',
    limiterConnection: {
      cardio: '心肺リミッター型にとって、有酸素ベースの拡大はVO2max向上の基盤となります。ペースを落として長く走ることで、低強度でも心肺適応を促します。',
      muscular: '筋持久力型でも有酸素ベースは不可欠です。後半のMペース区間で筋持久力も同時に養成します。',
      balanced: 'バランス型にはスタンダードな有酸素トレーニングが有効です。安定したペースで基盤を構築します。',
    },
  },
  threshold: {
    whyImportant: '乳酸閾値の向上は、より速いペースをより長く維持する能力に直結します。「快適にきつい」ペースの継続が乳酸処理能力を高めます。',
    limiterConnection: {
      cardio: '心肺リミッター型は回復を長めに、持続距離を短めにして質を確保します。',
      muscular: '筋持久力型は持続距離を長めにして、筋疲労耐性も同時に養います。',
      balanced: 'バランス型には標準的な閾値トレーニングが最適です。',
    },
  },
  vo2max: {
    whyImportant: 'VO2max（最大酸素摂取量）は有酸素パフォーマンスの天井を決定します。インターバルトレーニングで心肺系に最大刺激を与えます。',
    limiterConnection: {
      cardio: 'あなたのVO2maxリミッターを改善するために配置されています。本数を減らし回復を長めにすることで、1本あたりの質を最大化します。',
      muscular: 'VO2max刺激は心肺余裕を活かして本数を増やし、筋力面でも持久力を養成します。',
      balanced: 'バランスよくVO2maxを刺激し、有酸素能力の天井を引き上げます。',
    },
  },
  speed: {
    whyImportant: 'スピード・スプリント系のトレーニングはランニングエコノミー（走効率）とトップスピードを改善し、レースのペース変動への対応力を高めます。特に800m/1500mではスピード持久力が成績を大きく左右します。',
    limiterConnection: {
      cardio: '心肺リミッター型でもスピード維持は重要です。本数を控えめにし回復を十分取ります。',
      muscular: 'あなたの筋持久力リミッターを改善するために重点配置されています。本数を多めにしてスピード適応を最大化します。',
      balanced: 'バランスよくスピード刺激を与え、走効率の向上を図ります。',
    },
  },
};

// トレーニング哲学（設定画面の哲学ページ用）
export const TRAINING_PHILOSOPHY: Array<{
  title: string;
  content: string;
  icon: string;
}> = [
  {
    title: 'MidLabの基本理念',
    content: 'MidLabは「ETP（推定閾値ペース）」を軸に、個人の生理学的特性に応じたトレーニングを自動設計します。Jack Danielsのランニング理論をベースに、リミッタータイプ（パフォーマンスの制限要因）を特定し、弱点を重点的に改善するアプローチを採用しています。',
    icon: 'flash',
  },
  {
    title: 'リミッターモデル',
    content: '持久力パフォーマンスは「心肺系」と「筋持久力」の2つの要素で制限されます。ETPテストで「息が先にきつくなる（心肺型）」か「脚が先にきつくなる（筋持久力型）」かを判定し、各選手の弱点を特定します。弱点を重点的にトレーニングすることで、効率的なパフォーマンス向上を実現します。',
    icon: 'analytics',
  },
  {
    title: '個別ペース設定',
    content: 'すべてのトレーニングペースはETPから算出されます。走力が低い選手ほど低強度ゾーン（ジョグ・イージー）をよりゆっくり設定する非線形モデルを採用。VT1（第1換気閾値）の個人差を反映し、適切な強度でトレーニングできます（Seiler, 2010; Daniels VDOT理論）。',
    icon: 'speedometer',
  },
  {
    title: '期分け（ピリオダイゼーション）',
    content: 'トレーニング計画は基礎期→強化期→試合期→テーパーの4フェーズで構成されます。各フェーズで異なる生理学的適応を段階的に獲得し、レース当日にピークを持ってくる設計です。回復週は年齢・競技歴に応じて自動調整され、オーバートレーニングを防止します。',
    icon: 'layers',
  },
  {
    title: 'リミッター別の負荷配分',
    content: '心肺リミッター型にはVO2maxインターバルを多めに、筋持久力リミッター型にはスピード・レペティション系を多めに配分します。同じワークアウトでもリミッタータイプに応じて本数・回復時間が自動調整され、個人に最適化されたトレーニングを提供します。',
    icon: 'options',
  },
  {
    title: '根拠に基づくアプローチ',
    content: 'MidLabが提案するすべてのメニューには、運動生理学的な根拠があります。「なぜこのメニューか」「なぜこのペースか」「なぜこの順番か」を明示することで、選手・コーチが納得してトレーニングに取り組める環境を提供します。「信じてやれるか」が結果を左右するからです。',
    icon: 'school',
  },
];

// ============================================
// ボリューム個別化設定
// ============================================

// 月間走行距離からボリューム倍率を計算するための基準値（種目別・月間km）
// WEEKLY_DISTANCE_BY_EVENT の build期 × 4.33 / 1000 で算出
export const DEFAULT_MONTHLY_DISTANCE: Record<number, number> = {
  400: 152,   // 35km/week × 4.33
  800: 173,   // 40km/week × 4.33
  1500: 216,  // 50km/week × 4.33
  3000: 260,  // 60km/week × 4.33
  5000: 303,  // 70km/week × 4.33
  10000: 346, // 80km/week × 4.33
  21097: 390, // 90km/week × 4.33
  42195: 433, // 100km/week × 4.33
};

// ボリューム倍率の上限・下限
export const VOLUME_SCALE_LIMITS = {
  min: 0.6,  // 最低60%（初心者・故障明け向け）
  max: 2.5,  // 最大250%（エリート向け）
};

// 種目別月間走行距離の内部上限（km）
// ターゲットレースの距離に対して適切なボリュームのメニューを生成するため、
// ユーザー入力値がこれを超える場合は内部的にキャップする
export const MAX_MONTHLY_DISTANCE_CAP: Record<number, number> = {
  400: 250,
  800: 350,
  1500: 550,
  3000: 650,
  5000: 700,
  10000: 800,
  21097: 900,
  42195: 1000,
};

// イージー走距離の選択テーブル（ボリュームスケール後の距離からワークアウトIDを選択）
export const EASY_WORKOUT_BY_DISTANCE: Array<{ maxDistance: number; workoutId: string; distance: number }> = [
  { maxDistance: 7000, workoutId: 'easy-6000', distance: 6000 },
  { maxDistance: 9000, workoutId: 'easy-8000', distance: 8000 },
  { maxDistance: 11000, workoutId: 'easy-10000', distance: 10000 },
  { maxDistance: 13000, workoutId: 'easy-12000', distance: 12000 },
  { maxDistance: 15000, workoutId: 'easy-14000', distance: 14000 },
  { maxDistance: 999999, workoutId: 'easy-16000', distance: 16000 },
];

// ロングラン距離の選択テーブル
export const LONG_RUN_BY_DISTANCE: Array<{ maxDistance: number; workoutId: string; distance: number }> = [
  { maxDistance: 12000, workoutId: 'long-10000', distance: 10000 },
  { maxDistance: 16000, workoutId: 'long-14000', distance: 14000 },
  { maxDistance: 999999, workoutId: 'long-18000', distance: 18000 },
];

// リカバリー走距離の選択テーブル（ボリュームスケールで選択）
export const RECOVERY_WORKOUT_BY_DISTANCE: Array<{ maxDistance: number; workoutId: string; distance: number }> = [
  { maxDistance: 5000, workoutId: 'recovery-4000', distance: 4000 },
  { maxDistance: 7000, workoutId: 'recovery-6000', distance: 6000 },
  { maxDistance: 999999, workoutId: 'recovery-8000', distance: 8000 },
];

// ワークアウト本数のボリューム倍率テーブル
// volumeScale > threshold の場合、repsBonus本追加
export const WORKOUT_REPS_SCALING: Array<{ threshold: number; repsBonus: number }> = [
  { threshold: 1.8, repsBonus: 2 },
  { threshold: 1.4, repsBonus: 1 },
  { threshold: 1.0, repsBonus: 0 },
];

// 経験レベル別の強度配分倍率（上級者はより高強度の配分比率が高い）
export const INTENSITY_DISTRIBUTION_BY_EXPERIENCE: Record<Experience, { easyRatio: number; thresholdRatio: number; vo2maxRatio: number; speedRatio: number }> = {
  beginner: { easyRatio: 1.10, thresholdRatio: 0.85, vo2maxRatio: 0.70, speedRatio: 0.70 },
  intermediate: { easyRatio: 1.00, thresholdRatio: 1.00, vo2maxRatio: 1.00, speedRatio: 1.00 },
  advanced: { easyRatio: 0.95, thresholdRatio: 1.05, vo2maxRatio: 1.10, speedRatio: 1.10 },
  elite: { easyRatio: 0.90, thresholdRatio: 1.10, vo2maxRatio: 1.15, speedRatio: 1.15 },
};

// プラン生成バージョン
// メニュー内容・プランロジックに変更があった場合にインクリメントする
// これにより既存ユーザーに再生成を促す通知が表示される
export const PLAN_VERSION = 3;

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
