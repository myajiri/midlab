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
} from '../types';

import {
  PHASE_CONFIG,
  PHASE_DISTRIBUTION,
  DISTRIBUTION_BY_LIMITER,
  KEY_WORKOUTS_BY_PHASE,
  WEEKLY_DISTANCE_BY_EVENT,
  EASY_DISTANCE_BY_EVENT,
  TAPER_CONFIG,
  PHYSIOLOGICAL_FOCUS_CATEGORIES,
  AGE_CATEGORY_CONFIG,
  EXPERIENCE_CONFIG,
} from '../constants';
import { selectWorkoutForCategory } from './workoutSelector';

export interface GeneratePlanParams {
  race: { name: string; date: string; distance: RaceDistance };
  baseline: { etp: number; limiterType: LimiterType };
  restDay?: number; // 0=月〜6=日、デフォルト6（日曜）
  keyWorkoutDays?: number[]; // ユーザー選択のKey曜日（2日）
  ageCategory?: AgeCategory;
  experience?: Experience;
}

export function generatePlan({ race, baseline, restDay = 6, keyWorkoutDays, ageCategory = 'senior', experience = 'intermediate' }: GeneratePlanParams): RacePlan {
  // 年齢×競技歴による回復週サイクルを算出（短い方を採用）
  // 個別ワークアウトの質・量は維持し、回復頻度で調整する
  const ageConfig = AGE_CATEGORY_CONFIG[ageCategory];
  const recoveryCycle = Math.min(ageConfig.recoveryCycle, EXPERIENCE_CONFIG[experience].recoveryCycle);
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

  const rampTestWeeks: number[] = [];
  const testInterval = 4;
  for (let w = testInterval; w <= weeksUntilRace && w < 20; w += testInterval) {
    const weekPhase = phases.find(p => w >= p.startWeek && w <= p.endWeek);
    if (weekPhase && weekPhase.type !== 'taper') rampTestWeeks.push(w);
  }
  const basePhase = phases.find(p => p.type === 'base');
  if (basePhase && !rampTestWeeks.includes(basePhase.endWeek)) {
    rampTestWeeks.push(basePhase.endWeek);
    rampTestWeeks.sort((a, b) => a - b);
  }

  const weeklyPlans: WeeklyPlan[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);

  const eventDistance = WEEKLY_DISTANCE_BY_EVENT[race.distance] || WEEKLY_DISTANCE_BY_EVENT[1500];

  for (let w = 0; w < weeksUntilRace && w < 20; w++) {
    const weekNumber = w + 1;
    const phase = phases.find(p => weekNumber >= p.startWeek && weekNumber <= p.endWeek);
    const phaseType = phase?.type || 'base';
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

    // 年齢カテゴリの最大強度上限を適用
    const rawLoadPercent = isRecoveryWeek ? 70 : phaseType === 'taper' ? Math.round(100 - phaseProgress * 50) : Math.round(PHASE_CONFIG[phaseType].loadRange[0] + phaseProgress * 10);
    const loadPercent = Math.min(rawLoadPercent, ageConfig.maxIntensityPercent);
    const phaseKeyCategories = KEY_WORKOUTS_BY_PHASE[phaseType]?.categories || ['有酸素ベース'];
    const phaseFocusKeys = KEY_WORKOUTS_BY_PHASE[phaseType]?.focusKeys || ['aerobic'];
    const isRampTestWeek = rampTestWeeks.includes(weekNumber);

    const days = generateWeeklySchedule(phaseType, phaseFocusKeys, isRecoveryWeek, isRampTestWeek, baseline.limiterType, weekNumber, restDay, keyWorkoutDays, race.distance, baseline.etp, ageConfig.recoveryDaysAfterKey);

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
    phases: phasesForPlan,
    weeklyPlans,
    rampTestDates,
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
  raceDistance: RaceDistance = 1500,
  etp: number = 80,
  recoveryDaysAfterKey: number = 1,
): (ScheduledWorkout | null)[] {
  // 休養日の決定
  const restDays: number[] = [restDay];
  if (isRecoveryWeek || isRampTestWeek) {
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
      const workoutId = selectWorkoutForCategory(focus?.menuCategory || '', etp);
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'workout', label: focus?.name || 'ポイント練習', isKey: true, completed: false, focusKey, focusCategory: focus?.menuCategory, workoutId });
    } else if (d === longRunDay && !isRampTestWeek) {
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'long', label: 'ロング', isKey: !isRecoveryWeek, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' });
    } else {
      const easyDist = EASY_DISTANCE_BY_EVENT[raceDistance]?.[phaseType] || 6000;
      const easyWorkoutId = easyDist >= 10000 ? 'easy-10000' : easyDist >= 8000 ? 'easy-8000' : 'easy-6000';
      days.push({ id: `w${weekNumber}-d${d}`, dayOfWeek: d, type: 'easy', label: 'イージー', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース', workoutId: easyWorkoutId });
    }
  }

  // ポストプロセス: Key翌日のeasyをrecoveryに変換（年齢に応じて複数日）
  for (let d = 0; d < 7; d++) {
    for (let offset = 1; offset <= recoveryDaysAfterKey; offset++) {
      const keyDay = (d - offset + 7) % 7;
      const keyWorkout = days[keyDay];
      const currentWorkout = days[d];
      if (keyWorkout && keyWorkout.isKey && currentWorkout && currentWorkout.type === 'easy') {
        days[d] = {
          ...currentWorkout,
          type: 'recovery',
          label: 'リカバリー',
        };
        break;
      }
    }
  }

  return days;
}
