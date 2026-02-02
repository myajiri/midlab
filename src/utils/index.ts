// ============================================
// ユーティリティ関数
// ============================================

import {
  LevelName,
  ZoneName,
  LimiterType,
  AgeCategory,
  Experience,
  TerminationReason,
  RecoveryTime,
  LimiterConfidence,
  TrainingZones,
  RacePredictions,
  PBs,
  Profile,
  TestResult,
  RacePlan,
  EtpCalculationResult,
  LevelRecommendation,
  EffectiveValues,
  UserStage,
  WeekProgress,
  ScheduledWorkout,
} from '../types';

import {
  LEVELS,
  PACE_INCREMENT,
  ETP_COEFFICIENT,
  ZONE_COEFFICIENTS_V3,
  LIMITER_ZONE_ADJUSTMENTS,
  RACE_COEFFICIENTS,
  LIMITER_ADJUSTMENTS,
  AGE_CATEGORY_CONFIG,
  EXPERIENCE_CONFIG,
  PB_COEFFICIENTS,
} from '../constants';

// ============================================
// 時間フォーマット
// ============================================

/**
 * 秒数を M:SS 形式に変換
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 400mペースを km/ペースに変換
 */
export const formatKmPace = (pace400m: number): string => {
  const kmSeconds = pace400m * 2.5;
  return formatTime(kmSeconds) + '/km';
};

/**
 * M:SS 形式を秒数に変換
 */
export const parseTime = (timeStr: string): number | null => {
  const match = timeStr.match(/^(\d+):(\d{2})$/);
  if (!match) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  if (secs >= 60) return null;
  return mins * 60 + secs;
};

/**
 * 周回数をラベルに変換
 */
export const toLaps = (distance: number): string => {
  const laps = distance / 400;
  if (laps === Math.floor(laps)) return `${laps}周`;
  return `${laps.toFixed(1)}周`;
};

// ============================================
// eTP計算
// ============================================

/**
 * PBからeTPを計算
 */
export const calculateEtp = (
  pbs: PBs,
  ageCategory: AgeCategory,
  experience: Experience
): EtpCalculationResult | null => {
  const entries = Object.entries(pbs).filter(([_, v]) => v != null && v > 0) as [keyof PBs, number][];
  if (entries.length === 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [distance, time] of entries) {
    const config = PB_COEFFICIENTS[distance];
    if (config) {
      const estimatedEtp = time / config.coef;
      weightedSum += estimatedEtp * config.weight;
      totalWeight += config.weight;
    }
  }

  if (totalWeight === 0) return null;

  const baseEtp = Math.round(weightedSum / totalWeight);

  // 属性補正
  const adjustments: Array<{ reason: string; value: number }> = [];
  const ageAdj = AGE_CATEGORY_CONFIG[ageCategory].etpAdj;
  const expAdj = EXPERIENCE_CONFIG[experience].etpAdj;

  if (ageAdj !== 0) {
    adjustments.push({ reason: `年齢: ${AGE_CATEGORY_CONFIG[ageCategory].label}`, value: ageAdj });
  }
  if (expAdj !== 0) {
    adjustments.push({ reason: `経験: ${EXPERIENCE_CONFIG[experience].label}`, value: expAdj });
  }

  const adjustedEtp = baseEtp + ageAdj + expAdj;
  const confidence = EXPERIENCE_CONFIG[experience].confidence;

  return { baseEtp, adjustedEtp, adjustments, confidence };
};

/**
 * テスト結果からeTPを計算
 */
export const calculateEtpFromTest = (lastCompletedPace: number): number => {
  return Math.round(lastCompletedPace * ETP_COEFFICIENT);
};

// ============================================
// ゾーン計算
// ============================================

/**
 * 6ゾーンを計算（リミッター調整込み）
 */
export const calculateZonesV3 = (etp: number, limiterType: LimiterType): TrainingZones => {
  const adjustments = LIMITER_ZONE_ADJUSTMENTS[limiterType];
  const zones: Partial<TrainingZones> = {};

  for (const [zone, config] of Object.entries(ZONE_COEFFICIENTS_V3)) {
    const zoneName = zone as ZoneName;
    const adjustment = adjustments[zoneName] || 0;
    zones[zoneName] = Math.round(etp * (config.coef + adjustment));
  }

  return zones as TrainingZones;
};

// ============================================
// レース予測
// ============================================

/**
 * レース予測タイムを計算
 */
export const calculateRacePredictions = (etp: number, limiterType: LimiterType): RacePredictions => {
  const predictions: Partial<RacePredictions> = {};

  for (const [distance, coeffs] of Object.entries(RACE_COEFFICIENTS)) {
    const distanceKey = distance as keyof RacePredictions;
    const limiterAdj = LIMITER_ADJUSTMENTS[distanceKey];
    const adjustment = limiterType === 'balanced' ? 0 : limiterAdj[limiterType] || 0;

    // 400mペース × 距離係数 × (距離/400m)
    const distanceMultiplier = {
      m800: 2,
      m1500: 3.75,
      m3000: 7.5,
      m5000: 12.5,
    }[distanceKey];

    predictions[distanceKey] = {
      min: Math.round(etp * coeffs.min * distanceMultiplier + adjustment),
      max: Math.round(etp * coeffs.max * distanceMultiplier + adjustment),
    };
  }

  return predictions as RacePredictions;
};

// ============================================
// リミッター判定
// ============================================

/**
 * リミッタータイプを判定
 */
export const determineLimiterType = (
  terminationReason: TerminationReason,
  couldDoOneMore: boolean,
  couldContinueSlower: boolean,
  breathRecoveryTime: RecoveryTime
): { type: LimiterType; confidence: LimiterConfidence } => {
  if (terminationReason === 'both') {
    return { type: 'balanced', confidence: 'confirmed' };
  }

  if (terminationReason === 'breath') {
    if (breathRecoveryTime === '>60') {
      return { type: 'cardio', confidence: 'confirmed' };
    }
    return { type: 'cardio', confidence: 'tentative' };
  }

  if (terminationReason === 'legs') {
    if (couldDoOneMore && couldContinueSlower) {
      return { type: 'muscular', confidence: 'confirmed' };
    }
    return { type: 'muscular', confidence: 'tentative' };
  }

  return { type: 'balanced', confidence: 'tentative' };
};

// ============================================
// レベル推奨
// ============================================

/**
 * eTPから推奨テストレベルを計算
 */
export const recommendTestLevel = (
  etp: number,
  ageCategory: AgeCategory,
  experience: Experience
): LevelRecommendation => {
  const levelAdj = AGE_CATEGORY_CONFIG[ageCategory].levelAdj + EXPERIENCE_CONFIG[experience].levelAdj;
  const levels: LevelName[] = ['SS', 'S', 'A', 'B', 'C'];

  // eTP閾値はLEVELSの1500mタイム定義と一致（PB秒 ÷ 3.375）
  // SS: 1500m < 3:30 (210秒) → eTP < 62
  // S: 1500m 3:30-4:00 (210-240秒) → eTP 62-71
  // A: 1500m 4:00-4:30 (240-270秒) → eTP 71-80
  // B: 1500m 4:30-5:00 (270-300秒) → eTP 80-89
  // C: 1500m 5:00-5:30 (300-330秒) → eTP 89-98
  let baseIndex: number;
  if (etp < 62) baseIndex = 0;       // SS
  else if (etp < 71) baseIndex = 1;  // S
  else if (etp < 80) baseIndex = 2;  // A
  else if (etp < 89) baseIndex = 3;  // B
  else baseIndex = 4;                // C

  const adjustedIndex = Math.max(0, Math.min(4, baseIndex + levelAdj));
  const recommended = levels[adjustedIndex];
  const alternative = adjustedIndex > 0 ? levels[adjustedIndex - 1] : undefined;

  let reason = `eTP ${etp}秒に基づく推奨`;
  if (levelAdj !== 0) {
    reason += `（属性により${levelAdj > 0 ? '難易度下げ' : '難易度上げ'}）`;
  }

  return { recommended, alternative, reason };
};

/**
 * eTPからレベル名を取得
 * eTP閾値はLEVELSの1500mタイム定義と一致（PB秒 ÷ 3.375）
 */
export const getLevelFromEtp = (etp: number): LevelName | null => {
  if (etp < 62) return 'SS';   // 1500m < 3:30 (210秒)
  if (etp < 71) return 'S';    // 1500m 3:30-4:00
  if (etp < 80) return 'A';    // 1500m 4:00-4:30
  if (etp < 89) return 'B';    // 1500m 4:30-5:00
  return 'C';                   // 1500m 5:00以上
};

// ============================================
// ラップスケジュール
// ============================================

/**
 * テストのラップスケジュールを生成
 */
export const generateLapSchedule = (level: LevelName): Array<{ lap: number; pace: number }> => {
  const config = LEVELS[level];
  const schedule: Array<{ lap: number; pace: number }> = [];

  for (let i = 0; i < config.maxLaps; i++) {
    schedule.push({
      lap: i + 1,
      pace: config.startPace - i * PACE_INCREMENT,
    });
  }

  return schedule;
};

// ============================================
// VO2max推定
// ============================================

/**
 * eTPからVO2maxを推定
 */
export const estimateVO2max = (etp: number): number | null => {
  if (!etp || etp <= 0) return null;
  // 1500m予測タイムからVO2maxを推定（Daniels式の簡易版）
  const predicted1500 = etp * 0.90 * 3.75; // 秒
  const velocity = 1500 / predicted1500; // m/s
  const vo2max = Math.round(-4.6 + 0.182 * velocity * 60 + 0.000104 * Math.pow(velocity * 60, 2));
  return Math.max(30, Math.min(85, vo2max));
};

// ============================================
// 有効値・ユーザーステージ
// ============================================

/**
 * 現在の有効なeTPとリミッターを取得
 */
export const getEffectiveValues = (profile: Profile, results: TestResult[]): EffectiveValues => {
  // 測定値優先
  if (profile.current) {
    return {
      etp: profile.current.etp,
      limiter: profile.current.limiterType,
      source: 'measured',
    };
  }

  // テスト結果から
  if (results.length > 0) {
    const latest = results[0];
    return {
      etp: latest.eTP,
      limiter: latest.limiterType,
      source: 'measured',
    };
  }

  // 推定値
  if (profile.estimated) {
    return {
      etp: profile.estimated.etp,
      limiter: profile.estimated.limiterType || 'balanced',
      source: 'estimated',
    };
  }

  // デフォルト
  return {
    etp: 100,
    limiter: 'balanced',
    source: 'default',
  };
};

/**
 * ユーザーのステージを判定
 */
export const getUserStage = (
  profile: Profile,
  results: TestResult[],
  activePlan: RacePlan | null
): UserStage => {
  if (activePlan) return 'training';
  if (results.length > 0 || profile.current) return 'measured';
  if (profile.estimated) return 'estimated';
  if (profile.pbs.m1500 || Object.values(profile.pbs).some(v => v != null && v > 0)) {
    return 'estimated';
  }
  return 'new';
};

// ============================================
// ワークアウトペース計算
// ============================================

/**
 * ワークアウト用ペースを計算
 */
export const calculateWorkoutPace = (
  etp: number,
  zone: ZoneName,
  limiterType: LimiterType,
  isHighIntensity: boolean = false
): number => {
  const zoneConfig = ZONE_COEFFICIENTS_V3[zone];
  if (!zoneConfig) return etp;

  const adjustment = LIMITER_ZONE_ADJUSTMENTS[limiterType][zone] || 0;
  let pace = Math.round(etp * (zoneConfig.coef + adjustment));

  return pace;
};

/**
 * ワークアウトの総距離を計算
 */
export const calculateTotalWorkoutDistance = (
  segments: Array<{ distance: number; reps?: number; recoveryDistance?: number }>,
  limiterVariant?: { reps?: number; recoveryDistance?: number }
): number => {
  return segments.reduce((sum, seg) => {
    if (seg.reps) {
      const reps = limiterVariant?.reps || seg.reps;
      const recovery = limiterVariant?.recoveryDistance || seg.recoveryDistance || 0;
      return sum + (seg.distance * reps) + (recovery * (reps - 1));
    }
    return sum + seg.distance;
  }, 0);
};

// ============================================
// 計画関連ヘルパー
// ============================================

/**
 * 今日のワークアウトを取得
 */
export const getTodayWorkout = (plan: RacePlan): ScheduledWorkout | null => {
  if (!plan?.weeklyPlans) return null;

  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 0=月, 6=日

  const currentWeek = plan.weeklyPlans.find(w => {
    const start = new Date(w.startDate);
    const end = new Date(w.endDate);
    return today >= start && today <= end;
  });

  if (!currentWeek?.days) return null;
  return currentWeek.days[dayOfWeek] || null;
};

/**
 * 週間進捗を取得
 */
export const getWeekProgress = (plan: RacePlan): WeekProgress | null => {
  if (!plan?.weeklyPlans) return null;

  const today = new Date();
  const currentWeek = plan.weeklyPlans.find(w => {
    const start = new Date(w.startDate);
    const end = new Date(w.endDate);
    return today >= start && today <= end;
  });

  if (!currentWeek?.days) return null;

  const days = currentWeek.days.map(d => d?.completed || false);
  const completed = days.filter(Boolean).length;
  const total = currentWeek.days.filter(d => d?.type !== 'rest').length;

  return { completed, total, days };
};

/**
 * 次回ランプテスト推奨を取得
 */
export const getNextTestRecommendation = (results: TestResult[]): { reason: string } | null => {
  if (!results || results.length === 0) {
    return { reason: 'まだテストを実施していません' };
  }

  const latestTest = new Date(results[0].date);
  const daysSinceTest = Math.floor((Date.now() - latestTest.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceTest >= 28) {
    return { reason: `前回のテストから${daysSinceTest}日経過 - 再測定をお勧めします` };
  }

  if (daysSinceTest >= 21) {
    return { reason: `前回のテストから${daysSinceTest}日経過` };
  }

  return null;
};

// ============================================
// PBからリミッター推定
// ============================================

/**
 * PBからリミッタータイプを推定
 * 800mと1500mの比率から推定
 */
export const estimateLimiterFromPBs = (pbs: PBs): LimiterType => {
  const m800 = pbs.m800;
  const m1500 = pbs.m1500;

  if (!m800 || !m1500) return 'balanced';

  // 800m/1500mのスピード指数比率でリミッターを推定
  const speedIndex800 = m800 / PB_COEFFICIENTS.m800.coef;
  const speedIndex1500 = m1500 / PB_COEFFICIENTS.m1500.coef;
  const ratio = speedIndex800 / speedIndex1500;

  if (ratio < 0.94) {
    // 800mが相対的に遅い = 心肺系が強い
    return 'cardio';
  } else if (ratio > 1.06) {
    // 800mが相対的に速い = 筋持久力系が強い
    return 'muscular';
  }

  return 'balanced';
};

// ============================================
// 単一PBからeTP推定（オンボーディング用）
// ============================================

/**
 * 単一PBからeTPを推定
 */
export const estimateEtpFromPb = (pbSeconds: number, distance: number = 1500): number | null => {
  if (!pbSeconds || pbSeconds <= 0) return null;

  // 各距離の係数（RACE_COEFFICIENTSのmin値を使用）
  const coefficients: Record<number, number> = {
    800: 0.82,
    1500: 0.88,
    3000: 0.96,
    5000: 1.00,
  };

  const coef = coefficients[distance] || 0.90;
  const distanceRatio = distance / 400;
  const divisor = coef * distanceRatio;

  return Math.round(pbSeconds / divisor);
};

// ============================================
// スピード指標計算
// ============================================

export interface SpeedIndex {
  value: number;
  source: string;
  estimated: boolean;
}

/**
 * スピード指標を計算
 * スピード指標 = (800mタイム × 1.875) / 1500mタイム
 * 理論上、同じ能力なら1.0になる
 */
export const calculateSpeedIndex = (pbs: Partial<PBs>): SpeedIndex | null => {
  const pb800 = pbs.m800;
  const pb1500 = pbs.m1500;

  // 800mと1500mの両方が必要
  if (pb800 && pb1500) {
    const index = (pb800 * 1.875) / pb1500;
    return { value: Math.round(index * 100) / 100, source: '800m', estimated: false };
  }

  return null;
};

/**
 * スピード指標からリミッター型を推定
 */
export const estimateLimiterFromSpeedIndex = (
  speedIndex: SpeedIndex | null
): { type: LimiterType; confidence: 'high' | 'medium'; reason: string } | null => {
  if (!speedIndex) return null;
  const { value } = speedIndex;

  if (value < 0.95) {
    return { type: 'muscular', confidence: 'high', reason: 'スピード型（中距離寄り）' };
  } else if (value < 1.02) {
    return { type: 'balanced', confidence: 'medium', reason: 'バランス型' };
  } else {
    return { type: 'cardio', confidence: 'high', reason: '持久型（長距離寄り）' };
  }
};

// 移行ユーティリティをエクスポート
export { migrateStorageKeys, resetMigration } from './migration';
