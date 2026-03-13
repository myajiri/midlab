// ============================================
// ユーティリティ関数
// ============================================

import {
  LevelName,
  ZoneName,
  LimiterType,
  PhaseType,
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
  ZoneDistances,
  WorkoutTemplate,
  WorkoutSegment,
  WeeklyPlan,
  TrainingLog,
} from '../types';

import i18next from '../i18n';

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
  WORKOUTS,
} from '../constants';

// ============================================
// タイムゾーン安全な日付ユーティリティ
// ============================================
// JavaScriptのDateはデバイスのシステムタイムゾーンを自動取得する。
// ただし new Date("YYYY-MM-DD") はUTC 0:00として解釈されるため、
// ローカル日付パースには parseDateStr() を使用すること。

// i18n言語コードからBCP 47ロケールタグへのマッピング
const LANGUAGE_TO_LOCALE: Record<string, string> = {
  ja: 'ja-JP',
  en: 'en-US',
};

/**
 * 現在のi18n言語設定に基づくBCP 47ロケールタグを返す
 */
export const getDateLocale = (): string => {
  const lang = i18next.language || 'ja';
  return LANGUAGE_TO_LOCALE[lang] || LANGUAGE_TO_LOCALE['ja'];
};

/**
 * デバイスのシステムタイムゾーンのIANA名を取得する
 * 例: "Asia/Tokyo", "America/New_York"
 */
export const getSystemTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * タイムゾーン安全な日付文字列ヘルパー（YYYY-MM-DD）
 * ローカルタイムゾーンの日付コンポーネントを使用し、UTC変換による日付ズレを防ぐ
 */
export const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * YYYY-MM-DD形式の文字列をローカルタイムゾーンのDateとしてパースする
 * new Date("YYYY-MM-DD") はUTC解釈されるため、この関数で安全にパースする
 */
export const parseDateStr = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Date/日付文字列をi18nロケールとシステムタイムゾーンに応じた表示形式にフォーマットする
 * 例: ja → "2024年3月13日", en → "3/13/2024"
 * YYYY-MM-DD形式はローカル日付として安全にパースする
 */
export const formatLocalDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    // YYYY-MM-DD形式: ローカルタイムゾーンとしてパース（UTC解釈を回避）
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return parseDateStr(date).toLocaleDateString(getDateLocale());
    }
    // ISO 8601等のフル形式: システムタイムゾーンで表示
    return new Date(date).toLocaleDateString(getDateLocale(), {
      timeZone: getSystemTimeZone(),
    });
  }
  return date.toLocaleDateString(getDateLocale());
};

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
  const t = i18next.t;
  if (laps === Math.floor(laps)) return t('utils.lapFormat', { laps });
  return t('utils.lapFormatDecimal', { laps: laps.toFixed(1) });
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
    adjustments.push({ reason: i18next.t('utils.ageReason', { label: i18next.t(`constants.ageCategories.${ageCategory}.label`) }), value: ageAdj });
  }
  if (expAdj !== 0) {
    adjustments.push({ reason: i18next.t('utils.expReason', { label: i18next.t(`constants.experience.${experience}.label`) }), value: expAdj });
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
 * ゾーンの実効係数を計算（eTP依存の非線形補正）
 * 低強度ゾーン（jog/easy）は走力が低いほど係数が大きくなる（よりゆっくり走る）
 * 生理学的根拠: 走力が低い選手ほどVT1がVO2maxに対して低い位置にある
 */
export const getEffectiveZoneCoef = (zone: ZoneName, etp: number): number => {
  const config = ZONE_COEFFICIENTS_V3[zone];
  const etpFactor = Math.max(0, Math.min(etp, 100) - 60);
  return config.coef + config.slope * etpFactor;
};

/**
 * 6ゾーンを計算（eTP依存の非線形補正 + リミッター調整込み）
 */
export const calculateZonesV3 = (etp: number, limiterType: LimiterType): TrainingZones => {
  const adjustments = LIMITER_ZONE_ADJUSTMENTS[limiterType];
  const zones: Partial<TrainingZones> = {};

  for (const [zone] of Object.entries(ZONE_COEFFICIENTS_V3)) {
    const zoneName = zone as ZoneName;
    const effectiveCoef = getEffectiveZoneCoef(zoneName, etp);
    const adjustment = adjustments[zoneName] || 0;
    zones[zoneName] = Math.round(etp * (effectiveCoef + adjustment));
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

  let reason = i18next.t('utils.etpReason', { etp });
  if (levelAdj !== 0) {
    const adj = levelAdj > 0 ? i18next.t('utils.difficultyDown') : i18next.t('utils.difficultyUp');
    reason += i18next.t('utils.etpReasonWithAdj', { adj });
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
 * @param level レベル名
 * @param overrides オプション: startPace, maxLaps, paceIncrement を上書き可能（ライトモード用）
 */
export const generateLapSchedule = (
  level: LevelName,
  overrides?: { startPace?: number; maxLaps?: number; paceIncrement?: number },
): Array<{ lap: number; pace: number }> => {
  const config = LEVELS[level];
  const startPace = overrides?.startPace ?? config.startPace;
  const maxLaps = overrides?.maxLaps ?? config.maxLaps;
  const increment = overrides?.paceIncrement ?? PACE_INCREMENT;
  const schedule: Array<{ lap: number; pace: number }> = [];

  for (let i = 0; i < maxLaps; i++) {
    schedule.push({
      lap: i + 1,
      pace: startPace - i * increment,
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

  const effectiveCoef = getEffectiveZoneCoef(zone, etp);
  const adjustment = LIMITER_ZONE_ADJUSTMENTS[limiterType][zone] || 0;
  let pace = Math.round(etp * (effectiveCoef + adjustment));

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

  const todayStr = toDateStr(today);
  const currentWeek = plan.weeklyPlans.find(w => {
    return todayStr >= w.startDate && todayStr <= w.endDate;
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
  const todayStr = toDateStr(today);
  const currentWeek = plan.weeklyPlans.find(w => {
    return todayStr >= w.startDate && todayStr <= w.endDate;
  });

  if (!currentWeek?.days) return null;

  const days = currentWeek.days.map(d => d?.completed || false);
  const completed = days.filter(Boolean).length;
  const total = currentWeek.days.filter(d => d?.type !== 'rest').length;

  return { completed, total, days };
};

/**
 * 次回ETPテスト推奨を取得
 */
export const getNextTestRecommendation = (results: TestResult[]): { reason: string } | null => {
  if (!results || results.length === 0) {
    return { reason: i18next.t('utils.noTestYet') };
  }

  const latestTest = new Date(results[0].date);
  const daysSinceTest = Math.floor((Date.now() - latestTest.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceTest >= 28) {
    return { reason: i18next.t('utils.daysSinceTestRecommend', { days: daysSinceTest }) };
  }

  if (daysSinceTest >= 21) {
    return { reason: i18next.t('utils.daysSinceTest', { days: daysSinceTest }) };
  }

  return null;
};

// ============================================
// PBからリミッター推定
// ============================================

/**
 * PBからリミッタータイプを推定
 * 利用可能な全PBペアのeTP比率を加重平均して推定
 * 距離差が大きいペアほど判別力が高いため、距離比の対数で重み付け
 */
export const estimateLimiterFromPBs = (pbs: PBs): LimiterType => {
  const distanceOrder: (keyof PBs)[] = ['m200', 'm400', 'm800', 'm1500', 'm3000', 'm5000'];
  const distanceMeters: Record<keyof PBs, number> = { m200: 200, m400: 400, m800: 800, m1500: 1500, m3000: 3000, m5000: 5000 };
  const available = distanceOrder.filter(d => pbs[d] != null && pbs[d]! > 0);

  if (available.length < 2) return 'balanced';

  // 各PBからeTPを推定
  const etpByDistance: Partial<Record<keyof PBs, number>> = {};
  for (const d of available) {
    etpByDistance[d] = pbs[d]! / PB_COEFFICIENTS[d].coef;
  }

  // 全ペア（短距離 vs 長距離）の比率を加重平均
  // ratio < 1: 短距離が相対的に速い → 心肺系リミッター
  // ratio > 1: 短距離が相対的に遅い → 筋持久力リミッター
  let weightedRatioSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < available.length; i++) {
    for (let j = i + 1; j < available.length; j++) {
      const shorter = available[i];
      const longer = available[j];
      const ratio = etpByDistance[shorter]! / etpByDistance[longer]!;
      // 距離差が大きいペアほど判別力が高い
      const weight = Math.log(distanceMeters[longer] / distanceMeters[shorter]);
      weightedRatioSum += ratio * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 'balanced';

  const avgRatio = weightedRatioSum / totalWeight;

  if (avgRatio < 0.94) return 'cardio';
  if (avgRatio > 1.06) return 'muscular';
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

  // 各距離の係数（短距離ほどスピード依存が高く係数が小さい）
  const coefficients: Record<number, number> = {
    200: 0.76,
    400: 0.78,
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
    return { type: 'muscular', confidence: 'high', reason: i18next.t('utils.speedType') };
  } else if (value < 1.02) {
    return { type: 'balanced', confidence: 'medium', reason: i18next.t('utils.balancedType') };
  } else {
    return { type: 'cardio', confidence: 'high', reason: i18next.t('utils.enduranceType') };
  }
};

// ============================================
// ワークアウト根拠生成
// ============================================

import {
  LIMITER_RATIONALE,
  PHASE_RATIONALE,
  PHYSIOLOGICAL_FOCUS_CATEGORIES,
  WORKOUT_LIMITER_CONFIG,
} from '../constants';

/**
 * ワークアウトの根拠テキストを生成
 * リミッタータイプとフォーカスカテゴリに基づき、なぜこのメニューかを説明
 */
export const getWorkoutRationale = (
  category: string,
  limiterType: LimiterType,
): { headline: string; detail: string } => {
  // フォーカスカテゴリのキーを逆引き
  const focusKey = Object.entries(PHYSIOLOGICAL_FOCUS_CATEGORIES).find(
    ([_, v]) => v.menuCategory === category
  )?.[0];

  if (focusKey) {
    return {
      headline: i18next.t(`rationale.focus.${focusKey}.whyImportant`),
      detail: i18next.t(`rationale.focus.${focusKey}.limiterConnection.${limiterType}`),
    };
  }

  // フォールバック（総合カテゴリ等）
  const limiterRationale = LIMITER_RATIONALE[limiterType];
  return {
    headline: i18next.t('utils.limiterTraining', { name: i18next.t(`constants.limiters.${limiterType}.name`) }),
    detail: i18next.t(`rationale.limiter.${limiterType}.trainingFocus`),
  };
};

/**
 * 週間計画の根拠テキストを生成
 * フェーズとリミッタータイプに基づき、この週のメニュー構成の理由を説明
 */
// 期×リミッター別の週間ねらいテキスト（i18n対応）
const getPhaseLimiterFocus = (phase: PhaseType, limiter: LimiterType): string => {
  return i18next.t(`rationale.phaseLimiter.${phase}.${limiter}`);
};

export const getWeeklyPlanRationale = (
  phaseType: PhaseType,
  limiterType: LimiterType,
  isRecoveryWeek: boolean,
  isRampTestWeek: boolean,
  subRaceName?: string,
  subRacePriority?: 'high' | 'medium' | 'low',
): string => {
  const t = i18next.t;
  if (isRampTestWeek) {
    return t('utils.rampTestWeek');
  }
  if (isRecoveryWeek) {
    return t('utils.recoveryWeek');
  }

  const purpose = t(`rationale.phase.${phaseType}.purpose`);
  const focus = getPhaseLimiterFocus(phaseType, limiterType);
  let rationale = t('utils.phaseRationale', { purpose, focus });

  if (subRaceName) {
    const priorityKey = subRacePriority === 'high' ? 'subRaceHigh'
      : subRacePriority === 'medium' ? 'subRaceMedium' : 'subRaceLow';
    rationale = t(`utils.${priorityKey}`, { name: subRaceName });
  }

  return rationale;
};

// ============================================
// ゾーン別距離計算・トレーニング分析
// ============================================

/**
 * ワークアウトIDからゾーン別距離（m）を計算
 */
export const getWorkoutZoneDistances = (workoutId: string, limiterType?: LimiterType, additionalWorkouts?: WorkoutTemplate[]): ZoneDistances => {
  const workout = WORKOUTS.find((w: WorkoutTemplate) => w.id === workoutId)
    || additionalWorkouts?.find((w) => w.id === workoutId);
  if (!workout) return {};
  const zones: ZoneDistances = {};
  const variant = limiterType ? workout.limiterVariants?.[limiterType] : undefined;
  for (const s of workout.segments) {
    const seg = s as WorkoutSegment;
    const reps = seg.reps ? (variant?.reps || seg.reps) : 1;
    const dist = seg.distance * reps;
    zones[seg.zone] = (zones[seg.zone] || 0) + dist;
    // リカバリーはjogゾーンとして加算
    if (seg.reps && seg.reps > 1 && seg.recoveryDistance) {
      const recovery = (variant?.recoveryDistance || seg.recoveryDistance) * (reps - 1);
      zones['jog'] = (zones['jog'] || 0) + recovery;
    }
  }
  return zones;
};

/**
 * ゾーン別距離からゾーン別推定時間（秒）を計算
 */
export const calculateZoneTimes = (zoneDistances: ZoneDistances, etp: number, limiterType: LimiterType): Partial<Record<ZoneName, number>> => {
  const zones = calculateZonesV3(etp, limiterType);
  const times: Partial<Record<ZoneName, number>> = {};
  for (const [zone, distance] of Object.entries(zoneDistances)) {
    const pace = zones[zone as ZoneName]; // 秒/400m
    if (pace && distance) {
      times[zone as ZoneName] = (distance / 400) * pace;
    }
  }
  return times;
};

/**
 * 計画全体のトレーニング分析データを計算
 */
export interface TrainingAnalytics {
  // 完了済みワークアウトのゾーン別合計距離（m）
  completedZoneDistances: ZoneDistances;
  // 計画全体のゾーン別目標距離（m）
  plannedZoneDistances: ZoneDistances;
  // 週間走行距離（直近7日間の完了ワークアウト距離合計）
  weeklyDistance: number;
  // 過去30日間の走行距離
  monthlyDistance: number;
  // 完了ワークアウト数
  completedCount: number;
  // 全ワークアウト数（休養日除く）
  totalCount: number;
}

// 分析期間フィルタ: 'all'=全期間, '7d'=過去7日, '30d'=過去30日
export type AnalyticsPeriod = 'all' | '7d' | '30d';

export const calculateTrainingAnalytics = (
  weeklyPlans: WeeklyPlan[],
  limiterType: LimiterType,
  trainingLogs?: TrainingLog[],
  additionalWorkouts?: WorkoutTemplate[],
  period: AnalyticsPeriod = 'all',
): TrainingAnalytics => {
  const completedZoneDistances: ZoneDistances = {};
  const plannedZoneDistances: ZoneDistances = {};
  let completedCount = 0;
  let totalCount = 0;
  let weeklyDistance = 0;
  let monthlyDistance = 0;

  // トップレベルのtoDateStrを使用（タイムゾーン安全）

  const now = new Date();
  const todayStr = toDateStr(now);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = toDateStr(weekAgo);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = toDateStr(monthAgo);

  // 期間フィルタの開始日を決定
  const periodStartStr = period === '7d' ? weekAgoStr : period === '30d' ? monthAgoStr : '';

  // weeklyPlansの完了済みワークアウトIDを追跡（重複防止）
  const planCompletedWorkoutKeys = new Set<string>();

  for (const week of weeklyPlans) {
    // startDateからローカル日付を計算（parseDateStrでローカルタイムゾーンとしてパース）
    const weekStartLocal = parseDateStr(week.startDate);
    const startParts = [weekStartLocal.getFullYear(), weekStartLocal.getMonth() + 1, weekStartLocal.getDate()];

    for (let i = 0; i < week.days.length; i++) {
      const day = week.days[i];
      if (!day || day.type === 'rest') continue;

      // ローカル日付として計算（タイムゾーン安全）
      const dayDate = new Date(startParts[0], startParts[1] - 1, startParts[2] + i);
      const dateStr = toDateStr(dayDate);

      // 期間フィルタ: 開始日より前の日はスキップ
      if (periodStartStr && dateStr < periodStartStr) continue;

      // 本日以降の未来の日はカウント対象外（計画基準は本日まで）
      const isFutureDay = dateStr > todayStr;
      if (!isFutureDay) {
        totalCount++;
      }

      // ワークアウトのゾーン別距離を取得
      const zones = day.workoutId
        ? getWorkoutZoneDistances(day.workoutId, limiterType, additionalWorkouts)
        : {};

      // 計画されたゾーン距離を集計（本日までの目標合計）
      if (!isFutureDay) {
        for (const [zone, dist] of Object.entries(zones)) {
          plannedZoneDistances[zone as ZoneName] = (plannedZoneDistances[zone as ZoneName] || 0) + (dist || 0);
        }
      }

      if (day.completed) {
        completedCount++;
        planCompletedWorkoutKeys.add(`${dateStr}_${day.workoutId || day.id}`);

        // 実績ゾーン距離がある場合はそれを使用、なければ計画値（メニューの距離）
        const actualZones = day.actualData?.zoneDistances || zones;
        for (const [zone, dist] of Object.entries(actualZones)) {
          completedZoneDistances[zone as ZoneName] = (completedZoneDistances[zone as ZoneName] || 0) + (dist || 0);
        }

        // 総距離の計算（メニューのゾーン距離合計を使用）
        const totalDist = Object.values(actualZones).reduce((s, d) => s + (d || 0), 0);
        if (dateStr >= weekAgoStr) weeklyDistance += totalDist;
        if (dateStr >= monthAgoStr) monthlyDistance += totalDist;
      }
    }
  }

  // trainingLogsから、weeklyPlansに含まれない完了済み記録を集計
  if (trainingLogs) {
    for (const log of trainingLogs) {
      if (log.status !== 'completed') continue;

      // 期間フィルタ: 開始日より前の記録はスキップ
      if (periodStartStr && log.date < periodStartStr) continue;

      // weeklyPlansで既にカウント済みの記録はスキップ
      const key = `${log.date}_${log.workoutId}`;
      if (planCompletedWorkoutKeys.has(key)) continue;

      completedCount++;
      totalCount++;

      // ワークアウトのゾーン別距離を取得（メニューの距離をそのまま使用）
      const zones = getWorkoutZoneDistances(log.workoutId, limiterType, additionalWorkouts);

      // 計画外のワークアウトは実績のみ加算（planned には追加しない）
      // → 計画外の追加トレーニングがcompletedを押し上げて100%超えを実現
      for (const [zone, dist] of Object.entries(zones)) {
        completedZoneDistances[zone as ZoneName] = (completedZoneDistances[zone as ZoneName] || 0) + (dist || 0);
      }

      // 総距離の計算（メニューのゾーン距離合計を使用）
      const totalDist = Object.values(zones).reduce((s, d) => s + (d || 0), 0);
      if (log.date >= weekAgoStr) weeklyDistance += totalDist;
      if (log.date >= monthAgoStr) monthlyDistance += totalDist;
    }
  }

  return {
    completedZoneDistances,
    plannedZoneDistances,
    completedCount,
    totalCount,
    weeklyDistance,
    monthlyDistance,
  };
};

// 移行ユーティリティをエクスポート
export { migrateStorageKeys, resetMigration } from './migration';

// ボリュームスケーリングユーティリティをエクスポート
export { calculateVolumeScale } from './planGenerator';
export { getVolumeRepsBonus } from './workoutSelector';
