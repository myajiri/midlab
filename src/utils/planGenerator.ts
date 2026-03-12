// ============================================
// Plan Generator - トレーニング計画生成ロジック
// ============================================

import {
  RacePlan,
  RaceDistance,
  Phase,
  PhaseType,
  WeeklyPlan,
  ScheduledWorkout,
  LimiterType,
  AgeCategory,
  Experience,
  Gender,
  RestDayFrequency,
} from '../types';

import {
  PHASE_CONFIG,
  PHASE_DISTRIBUTION,
  DISTRIBUTION_BY_LIMITER,
  KEY_WORKOUTS_BY_PHASE,
  KEY_WORKOUTS_BY_DISTANCE,
  WEEKLY_DISTANCE_BY_EVENT,
  EASY_DISTANCE_BY_EVENT,
  TAPER_CONFIG,
  PHYSIOLOGICAL_FOCUS_CATEGORIES,
  AGE_CATEGORY_CONFIG,
  EXPERIENCE_CONFIG,
  GENDER_CONFIG,
  REST_DAY_FREQUENCY_CONFIG,
  DEFAULT_MONTHLY_DISTANCE,
  VOLUME_SCALE_LIMITS,
  EASY_WORKOUT_BY_DISTANCE,
  LONG_RUN_BY_DISTANCE,
  RECOVERY_WORKOUT_BY_DISTANCE,
  WORKOUT_REPS_SCALING,
  INTENSITY_DISTRIBUTION_BY_EXPERIENCE,
  PLAN_VERSION,
  WORKOUTS,
  MAX_MONTHLY_DISTANCE_CAP,
} from '../constants';
import { selectWorkoutForCategory } from './workoutSelector';

export interface GeneratePlanParams {
  race: { name: string; date: string; distance: RaceDistance; customDistance?: number };
  baseline: { etp: number; limiterType: LimiterType };
  restDay?: number; // 0=月〜6=日、デフォルト6（日曜）
  keyWorkoutDays?: number[]; // ユーザー選択のKey曜日（2日）
  ageCategory?: AgeCategory;
  experience?: Experience;
  gender?: Gender;
  restDayFrequency?: RestDayFrequency; // 休養日頻度（デフォルト: 'auto'）
  monthlyMileage?: number; // 月間走行可能距離（km）
}

// カスタム距離を最も近い既存距離カテゴリにマッピング
const STANDARD_DISTANCES = [400, 800, 1500, 3000, 5000, 10000, 21097, 42195] as const;

export function resolveDistanceForLookup(distance: RaceDistance, customDistance?: number): number {
  if (distance === 'custom') {
    const d = customDistance || 5000;
    // 最も近い既存距離を返す
    let closest = STANDARD_DISTANCES[0];
    let minDiff = Math.abs(d - closest);
    for (const sd of STANDARD_DISTANCES) {
      const diff = Math.abs(d - sd);
      if (diff < minDiff) {
        minDiff = diff;
        closest = sd;
      }
    }
    return closest;
  }
  return distance as number;
}

// 競技歴と月間走行距離から休養日頻度を自動判定する
// 初心者は安全側（毎週）を維持し、上級者は自由度を高める
export function determineRestDayFrequency(
  experience: Experience,
  monthlyMileage?: number,
): Exclude<RestDayFrequency, 'auto'> {
  // 初心者: 常に週1回（安全側を維持）
  if (experience === 'beginner') return 'weekly';

  // 中級者: 月間200km以上なら2週に1回、それ以外は毎週
  if (experience === 'intermediate') {
    if (monthlyMileage && monthlyMileage >= 200) return 'biweekly';
    return 'weekly';
  }

  // 上級者・エリート: 月間走行距離に基づき調整
  if (monthlyMileage && monthlyMileage >= 300) return 'monthly';
  if (monthlyMileage && monthlyMileage >= 200) return 'biweekly';
  return 'weekly';
}

/**
 * 月間走行距離からボリューム倍率を計算
 * ユーザーの目標月間走行距離と種目別のデフォルト月間距離を比較し、スケーリング係数を算出
 */
export function calculateVolumeScale(monthlyMileage: number | undefined, raceDistance: RaceDistance | number): number {
  if (!monthlyMileage || monthlyMileage <= 0) return 1.0;
  const lookupDist = typeof raceDistance === 'string' ? 1500 : raceDistance;
  // 種目別内部上限でキャップ（過剰なボリュームを防止）
  const cap = MAX_MONTHLY_DISTANCE_CAP[lookupDist] || monthlyMileage;
  const effectiveMileage = Math.min(monthlyMileage, cap);
  const defaultMonthly = DEFAULT_MONTHLY_DISTANCE[lookupDist] || DEFAULT_MONTHLY_DISTANCE[1500];
  const scale = effectiveMileage / defaultMonthly;
  return Math.max(VOLUME_SCALE_LIMITS.min, Math.min(VOLUME_SCALE_LIMITS.max, scale));
}

/**
 * ボリューム倍率に応じたイージー走ワークアウトIDを選択
 */
function selectEasyWorkout(baseEasyDistance: number, volumeScale: number): { workoutId: string; distance: number; label: string } {
  const scaledDistance = Math.round(baseEasyDistance * volumeScale);
  for (const entry of EASY_WORKOUT_BY_DISTANCE) {
    if (scaledDistance <= entry.maxDistance) {
      return {
        workoutId: entry.workoutId,
        distance: entry.distance,
        label: `イージー ${entry.distance / 1000}km`,
      };
    }
  }
  const last = EASY_WORKOUT_BY_DISTANCE[EASY_WORKOUT_BY_DISTANCE.length - 1];
  return { workoutId: last.workoutId, distance: last.distance, label: `イージー ${last.distance / 1000}km` };
}

/**
 * ボリューム倍率に応じたリカバリー走ワークアウトIDを選択
 */
function selectRecoveryWorkout(volumeScale: number): { workoutId: string; distance: number } {
  const scaledDistance = Math.round(4000 * volumeScale);
  for (const entry of RECOVERY_WORKOUT_BY_DISTANCE) {
    if (scaledDistance <= entry.maxDistance) {
      return { workoutId: entry.workoutId, distance: entry.distance };
    }
  }
  const last = RECOVERY_WORKOUT_BY_DISTANCE[RECOVERY_WORKOUT_BY_DISTANCE.length - 1];
  return { workoutId: last.workoutId, distance: last.distance };
}

/**
 * ボリューム倍率に応じたロングランワークアウトIDを選択
 */
function selectLongRunWorkout(volumeScale: number): { workoutId: string; distance: number } {
  // ベースのロングランは10000m、ボリュームスケールで選択
  const scaledDistance = Math.round(10000 * volumeScale);
  for (const entry of LONG_RUN_BY_DISTANCE) {
    if (scaledDistance <= entry.maxDistance) {
      return { workoutId: entry.workoutId, distance: entry.distance };
    }
  }
  const last = LONG_RUN_BY_DISTANCE[LONG_RUN_BY_DISTANCE.length - 1];
  return { workoutId: last.workoutId, distance: last.distance };
}

/**
 * ボリューム倍率に応じたワークアウト本数ボーナスを取得
 */
function getWorkoutRepsBonus(volumeScale: number): number {
  for (const entry of WORKOUT_REPS_SCALING) {
    if (volumeScale >= entry.threshold) {
      return entry.repsBonus;
    }
  }
  return 0;
}

export function generatePlan({ race, baseline, restDay = 6, keyWorkoutDays, ageCategory = 'senior', experience = 'intermediate', gender = 'other', restDayFrequency = 'auto', monthlyMileage }: GeneratePlanParams): RacePlan {
  // 休養日頻度の解決: 'auto'の場合は競技歴と月間走行距離から自動判定
  const resolvedFrequency: Exclude<RestDayFrequency, 'auto'> = restDayFrequency === 'auto'
    ? determineRestDayFrequency(experience, monthlyMileage)
    : restDayFrequency;
  const restWeekInterval = REST_DAY_FREQUENCY_CONFIG[resolvedFrequency].restWeekInterval;

  // カスタム距離を既存距離カテゴリにマッピング
  const lookupDistance = resolveDistanceForLookup(race.distance, race.customDistance);

  // ボリューム倍率を計算（月間走行距離ベース）
  const volumeScale = calculateVolumeScale(monthlyMileage, lookupDistance as RaceDistance);

  // 年齢×競技歴による回復週サイクルを算出（短い方を採用）
  // 個別ワークアウトの質・量は維持し、回復頻度で調整する
  const ageConfig = AGE_CATEGORY_CONFIG[ageCategory];
  const genderConfig = GENDER_CONFIG[gender];
  // 性別による回復倍率を反映: recoveryMultiplier > 1 の場合、回復サイクルを短くする
  const baseRecoveryCycle = Math.min(ageConfig.recoveryCycle, EXPERIENCE_CONFIG[experience].recoveryCycle);
  const recoveryCycle = genderConfig.recoveryMultiplier > 1.0 ? Math.max(2, baseRecoveryCycle - 1) : baseRecoveryCycle;
  const today = new Date();
  const raceDate = new Date(race.date);
  const weeksUntilRace = Math.floor((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));

  const distribution = weeksUntilRace >= 16 ? 'long' : weeksUntilRace >= 10 ? 'medium' : weeksUntilRace >= 6 ? 'short' : 'minimal';
  const phaseConfig = PHASE_DISTRIBUTION[distribution as keyof typeof PHASE_DISTRIBUTION];
  const phases: Array<{ type: PhaseType; startWeek: number; endWeek: number; weeks: number }> = [];
  let currentWeek = 1;

  (['base', 'build', 'peak', 'taper'] as PhaseType[]).forEach(type => {
    const [min, max] = phaseConfig[type].weeks;
    const weeks = Math.min(max, Math.max(min, Math.floor(weeksUntilRace * (max / 16))));
    if (weeks > 0) {
      phases.push({ type, startWeek: currentWeek, endWeek: currentWeek + weeks - 1, weeks });
      currentWeek += weeks;
    }
  });

  // ETPテストをレース日から逆算して配置
  // レースから最低3週前までにのみ配置（taper期・レース直前を回避）
  const rampTestWeeks: number[] = [];
  const testInterval = 8;
  const minWeeksBeforeRace = 3; // レース3週前以降はテスト禁止
  const lastAllowedTestWeek = weeksToGenerate - minWeeksBeforeRace;
  // レースから逆算して8週間隔で配置（例: レース18週 → 許容15週目まで → 15, 7 の順）
  for (let w = lastAllowedTestWeek; w >= 1; w -= testInterval) {
    const weekPhase = phases.find(p => w >= p.startWeek && w <= p.endWeek);
    if (weekPhase && weekPhase.type !== 'taper') rampTestWeeks.push(w);
  }
  // ベースフェーズ終了時にテストがなければ追加（ただし許容範囲内に限る）
  const basePhase = phases.find(p => p.type === 'base');
  if (basePhase && basePhase.endWeek <= lastAllowedTestWeek && !rampTestWeeks.includes(basePhase.endWeek)) {
    rampTestWeeks.push(basePhase.endWeek);
  }
  rampTestWeeks.sort((a, b) => a - b);

  const weeklyPlans: WeeklyPlan[] = [];
  // 今週の月曜日を計算（月=0, 火=1, ... 日=6 の体系で）
  // JS の getDay(): 0=日, 1=月, ... 6=土
  // 日曜日(0)の場合は6日前の月曜、それ以外は (getDay()-1) 日前の月曜
  const startDate = new Date();
  const jsDay = startDate.getDay();
  const diffToMonday = jsDay === 0 ? 6 : jsDay - 1;
  startDate.setDate(startDate.getDate() - diffToMonday);

  const eventDistance = WEEKLY_DISTANCE_BY_EVENT[lookupDistance] || WEEKLY_DISTANCE_BY_EVENT[1500];

  // startDate（今週の月曜）からレース日を含む週までの週数を計算
  const weeksToGenerate = Math.min(Math.ceil((raceDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)), 20);

  for (let w = 0; w < weeksToGenerate; w++) {
    const weekNumber = w + 1;
    const phase = phases.find(p => weekNumber >= p.startWeek && weekNumber <= p.endWeek);
    // フェーズ外の週はレース週に近いためtaperとして扱う
    const phaseType = phase?.type || 'taper';
    const dist = DISTRIBUTION_BY_LIMITER[phaseType]?.[baseline.limiterType] || DISTRIBUTION_BY_LIMITER.base.balanced;

    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeksIntoPhase = weekNumber - (phase?.startWeek || 1);
    const phaseLength = phase?.weeks || 1;
    const phaseProgress = weeksIntoPhase / phaseLength;
    // 回復週サイクルを年齢・競技歴に応じて可変（デフォルト3週、若年/高齢/初心者は2週）
    const isRecoveryWeek = weeksIntoPhase > 0 && weeksIntoPhase % recoveryCycle === 0;

    let baseDistance = eventDistance[phaseType] || 50000;
    if (phaseType === 'taper') {
      const taperConfig = TAPER_CONFIG[baseline.limiterType] || TAPER_CONFIG.balanced;
      baseDistance = Math.round(eventDistance.peak * (1 - taperConfig.volumeReduction * phaseProgress));
    } else if (isRecoveryWeek) {
      baseDistance = Math.round(baseDistance * 0.7);
    } else {
      baseDistance = Math.round(baseDistance * (1 + phaseProgress * 0.1));
    }
    // 年齢カテゴリによるボリューム倍率
    baseDistance = Math.round(baseDistance * ageConfig.volumeMultiplier);
    // 月間走行距離によるボリュームスケーリング
    baseDistance = Math.round(baseDistance * volumeScale);

    // 年齢カテゴリの最大強度上限を適用
    const rawLoadPercent = isRecoveryWeek ? 70 : phaseType === 'taper' ? Math.round(100 - phaseProgress * 50) : Math.round(PHASE_CONFIG[phaseType].loadRange[0] + phaseProgress * 10);
    const loadPercent = Math.min(rawLoadPercent, ageConfig.maxIntensityPercent);
    const phaseKeyCategories = KEY_WORKOUTS_BY_PHASE[phaseType]?.categories || ['有酸素ベース'];
    // 種目別focusKeys: 800m/1500mではスピード・スプリントをKey日に昇格
    const distanceOverride = KEY_WORKOUTS_BY_DISTANCE[lookupDistance]?.[phaseType];
    const phaseFocusKeys = distanceOverride?.focusKeys || KEY_WORKOUTS_BY_PHASE[phaseType]?.focusKeys || ['aerobic'];
    const isRampTestWeek = rampTestWeeks.includes(weekNumber);

    // 休養日頻度に基づき、この週に休養日を入れるかを判定
    // 回復週・テスト週は常に休養日を入れる（安全のため）
    const hasScheduledRestDay = isRecoveryWeek || isRampTestWeek || (weekNumber % restWeekInterval === 0) || restWeekInterval === 1;

    const days = generateWeeklySchedule(phaseType, phaseFocusKeys, isRecoveryWeek, isRampTestWeek, baseline.limiterType, weekNumber, restDay, keyWorkoutDays, lookupDistance as RaceDistance, baseline.etp, ageConfig.recoveryDaysAfterKey, hasScheduledRestDay, volumeScale, experience);

    weeklyPlans.push({
      weekNumber,
      phaseType,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      targetDistance: baseDistance,
      loadPercent,
      distribution: dist,
      days,
      workouts: days.filter((d): d is ScheduledWorkout => d !== null),
      keyWorkouts: days.filter(d => d?.isKey).map(d => d?.focusKey || d?.label || ''),
      keyFocusCategories: phaseKeyCategories,
      focusKeys: phaseFocusKeys,
      isRecoveryWeek,
      isRampTestWeek,
    });
  }

  // ============================================
  // ターゲットレース日のメニューを「レース」に設定
  // 最終週のレース日にあたる曜日のメニューを変更
  // ============================================
  const raceDay = new Date(race.date);
  const raceDayOfWeek = (raceDay.getDay() + 6) % 7; // JS: 0=日→変換: 0=月
  const lastWeek = weeklyPlans[weeklyPlans.length - 1];
  if (lastWeek) {
    const lastWeekStart = new Date(lastWeek.startDate);
    const lastWeekEnd = new Date(lastWeek.endDate);
    if (raceDay >= lastWeekStart && raceDay <= lastWeekEnd) {
      // レース日のメニューを設定
      if (lastWeek.days[raceDayOfWeek]) {
        lastWeek.days[raceDayOfWeek] = {
          ...lastWeek.days[raceDayOfWeek]!,
          type: 'race',
          label: race.name || 'レース',
          isKey: true,
          workoutId: undefined,
          focusKey: undefined,
          focusCategory: undefined,
        };
      }
      // 前日の高強度を回避
      const prevDay = (raceDayOfWeek - 1 + 7) % 7;
      const prevWorkout = lastWeek.days[prevDay];
      if (prevWorkout && (prevWorkout.type === 'workout' || prevWorkout.isKey)) {
        const recoverySelection = selectRecoveryWorkout(volumeScale);
        lastWeek.days[prevDay] = {
          ...prevWorkout,
          type: 'easy',
          label: `イージー`,
          isKey: false,
          workoutId: recoverySelection.workoutId,
          focusKey: 'aerobic',
          focusCategory: '有酸素ベース',
        };
      }
      // workoutsを再構築
      lastWeek.workouts = lastWeek.days.filter((d): d is ScheduledWorkout => d !== null);
    }
  }

  // ============================================
  // サブレースの日のメニューを「レース」に設定 + 前日の高強度回避
  // （addSubRace時にも適用されるが、初期生成時はここで処理）
  // ============================================
  // サブレースは後からaddSubRaceで追加されるため、
  // generatePlan時点ではサブレース情報がない。
  // ただし、regeneratePlan時にはsubRacesが反映される。

  const phasesForPlan: Phase[] = phases.map(p => {
    const weekPlan = weeklyPlans.find(w => w.weekNumber === p.startWeek);
    const endWeekPlan = weeklyPlans.find(w => w.weekNumber === p.endWeek);
    return {
      type: p.type,
      startDate: weekPlan?.startDate || startDate.toISOString(),
      endDate: endWeekPlan?.endDate || startDate.toISOString(),
      weeks: p.weeks,
    };
  });

  const rampTestDates = rampTestWeeks.map(w => {
    const weekPlan = weeklyPlans.find(wp => wp.weekNumber === w);
    if (weekPlan) {
      const testDate = new Date(weekPlan.startDate);
      testDate.setDate(testDate.getDate() + 3);
      return testDate.toISOString();
    }
    return '';
  }).filter(d => d !== '');

  return {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    race: { name: race.name, date: race.date, distance: race.distance },
    baseline: { etp: baseline.etp, limiterType: baseline.limiterType },
    keyWorkoutDays,
    restDay,
    restDayFrequency,
    phases: phasesForPlan,
    weeklyPlans,
    rampTestDates,
    planVersion: PLAN_VERSION,
  };
}

function generateWeeklySchedule(
  phaseType: PhaseType,
  focusKeys: string[],
  isRecoveryWeek: boolean,
  isRampTestWeek: boolean,
  limiterType: LimiterType,
  weekNumber: number,
  restDay: number = 6,
  userKeyWorkoutDays?: number[],
  raceDistance: RaceDistance | number = 1500,
  etp: number = 80,
  recoveryDaysAfterKey: number = 1,
  hasScheduledRestDay: boolean = true,
  volumeScale: number = 1.0,
  experience: Experience = 'intermediate',
): (ScheduledWorkout | null)[] {
  // 休養日の決定
  // hasScheduledRestDay=falseの場合、主要休養日を入れずイージー走に置き換える
  const restDays: number[] = hasScheduledRestDay ? [restDay] : [];
  if (isRecoveryWeek || isRampTestWeek) {
    // 回復週・テスト週は常に休養日を確保
    if (!restDays.includes(restDay)) restDays.push(restDay);
    const secondaryRest = (restDay + 3) % 7;
    restDays.push(secondaryRest);
  }
  if (isRampTestWeek) {
    const tertiaryRest = (restDay + 5) % 7;
    if (!restDays.includes(tertiaryRest)) {
      restDays.push(tertiaryRest);
    }
  }

  // 練習日を取得
  const workoutDays: number[] = [];
  for (let d = 0; d < 7; d++) {
    if (!restDays.includes(d)) workoutDays.push(d);
  }

  // キーワークアウト・ロング走・テスト日の配置
  let keyWorkoutDays: number[] = [];
  let longRunDay: number | null = null;
  let testDay: number | null = null;

  // ユーザー指定のKey曜日がある場合はそれを使用
  if (userKeyWorkoutDays && userKeyWorkoutDays.length >= 2) {
    const validKeyDays = userKeyWorkoutDays.filter(d => !restDays.includes(d) && workoutDays.includes(d));
    keyWorkoutDays = validKeyDays.slice(0, 2);
    // ロング走: Key曜日以外の最後の練習日
    const nonKeyWorkoutDays = workoutDays.filter(d => !keyWorkoutDays.includes(d));
    longRunDay = nonKeyWorkoutDays.length > 0 ? nonKeyWorkoutDays[nonKeyWorkoutDays.length - 1] : workoutDays[workoutDays.length - 1];
    testDay = keyWorkoutDays[0];
  } else if (workoutDays.length >= 4) {
    // フォールバック: アルゴリズムで配置
    const mid = Math.floor(workoutDays.length / 2);
    keyWorkoutDays = [workoutDays[Math.floor(mid / 2)], workoutDays[mid + Math.floor((workoutDays.length - mid) / 2)]];
    longRunDay = workoutDays[workoutDays.length - 1];
    testDay = workoutDays[Math.floor(mid / 2)];
  } else if (workoutDays.length === 3) {
    keyWorkoutDays = [workoutDays[0], workoutDays[1]];
    longRunDay = workoutDays[2];
    testDay = workoutDays[1];
  } else if (workoutDays.length === 2) {
    keyWorkoutDays = [workoutDays[0]];
    longRunDay = workoutDays[1];
    testDay = workoutDays[0];
  } else if (workoutDays.length === 1) {
    longRunDay = workoutDays[0];
    testDay = workoutDays[0];
  }

  // フォーカス情報
  const primaryFocus = focusKeys[0] || 'aerobic';
  const secondaryFocus = focusKeys[1] || focusKeys[0] || 'threshold';
  const primary = PHYSIOLOGICAL_FOCUS_CATEGORIES[primaryFocus];
  const secondary = PHYSIOLOGICAL_FOCUS_CATEGORIES[secondaryFocus];

  // 各曜日のスケジュール生成
  const days: (ScheduledWorkout | null)[] = [];
  for (let d = 0; d < 7; d++) {
    if (restDays.includes(d)) {
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'rest', label: '休養', isKey: false, completed: false });
    } else if (isRampTestWeek && d === testDay) {
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'test', label: 'ETPテスト', isKey: true, completed: false, focusKey: 'test' });
    } else if (keyWorkoutDays.includes(d) && !isRecoveryWeek) {
      const idx = keyWorkoutDays.indexOf(d);
      const focus = idx === 0 ? primary : secondary;
      const focusKey = idx === 0 ? primaryFocus : secondaryFocus;
      const workoutId = selectWorkoutForCategory(focus?.menuCategory || '', etp, weekNumber);
      // workoutIdから具体的なワークアウト名を取得して表示
      const workoutName = workoutId ? WORKOUTS.find(w => w.id === workoutId)?.name : null;
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'workout', label: workoutName || focus?.name || 'ポイント練習', isKey: true, completed: false, focusKey, focusCategory: focus?.menuCategory, workoutId });
    } else if (d === longRunDay && !isRampTestWeek) {
      const longSelection = selectLongRunWorkout(volumeScale);
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'long', label: `ロング ${longSelection.distance / 1000}km`, isKey: !isRecoveryWeek, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース', workoutId: longSelection.workoutId });
    } else {
      const lookupDist = typeof raceDistance === 'string' ? 1500 : raceDistance;
      const baseEasyDist = EASY_DISTANCE_BY_EVENT[lookupDist]?.[phaseType] || 6000;
      const easySelection = selectEasyWorkout(baseEasyDist, volumeScale);
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'easy', label: easySelection.label, isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース', workoutId: easySelection.workoutId });
    }
  }

  // ポストプロセス: Key翌日のeasyをrecoveryに変換（年齢に応じて複数日）
  // リカバリー距離はvolumeScaleに応じてスケーリング
  const recoverySelection = selectRecoveryWorkout(volumeScale);
  for (let d = 0; d < 7; d++) {
    for (let offset = 1; offset <= recoveryDaysAfterKey; offset++) {
      const keyDay = (d - offset + 7) % 7;
      const keyWorkout = days[keyDay];
      const currentWorkout = days[d];
      if (keyWorkout && keyWorkout.isKey && currentWorkout && currentWorkout.type === 'easy') {
        days[d] = {
          ...currentWorkout,
          type: 'recovery',
          label: `リカバリー ${recoverySelection.distance / 1000}km`,
          workoutId: recoverySelection.workoutId,
        };
        break;
      }
    }
  }

  return days;
}
