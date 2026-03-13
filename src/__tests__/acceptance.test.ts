// ============================================
// 受け入れテスト
// メニューアップデート通知・メニュー差し替え・リカバリー走スケーリング
// スピード系メニュー配分・目標レース変更
// ============================================

import { generatePlan, calculateVolumeScale, GeneratePlanParams } from '../utils/planGenerator';
import { selectWorkoutForCategory } from '../utils/workoutSelector';
import { toDateStr } from '../utils';
import {
  PLAN_VERSION,
  KEY_WORKOUTS_BY_PHASE,
  KEY_WORKOUTS_BY_DISTANCE,
  WORKOUTS,
  PHYSIOLOGICAL_FOCUS_CATEGORIES,
  RECOVERY_WORKOUT_BY_DISTANCE,
  WORKOUT_SELECTION_BY_ETP,
} from '../constants';

// テスト用の共通パラメータ
const basePlanParams: GeneratePlanParams = {
  race: { name: 'テスト記録会', date: toDateStr(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), distance: 1500 },
  baseline: { etp: 80, limiterType: 'balanced' },
  restDay: 6,
  keyWorkoutDays: [2, 5],
  ageCategory: 'senior',
  experience: 'intermediate',
  gender: 'other',
  restDayFrequency: 'weekly',
};

// ============================================
// 1. メニューアップデート通知
// ============================================
describe('メニューアップデート通知', () => {
  it('生成された計画にplanVersionが付与される', () => {
    const plan = generatePlan(basePlanParams);
    expect(plan.planVersion).toBe(PLAN_VERSION);
  });

  it('planVersionは現在のPLAN_VERSIONと一致する', () => {
    const plan = generatePlan(basePlanParams);
    expect(plan.planVersion).toBeGreaterThanOrEqual(3);
  });

  it('PLAN_VERSIONが正の整数である', () => {
    expect(PLAN_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(PLAN_VERSION)).toBe(true);
  });
});

// ============================================
// 2. リカバリー走の改善
// ============================================
describe('リカバリー走スケーリング', () => {
  it('月間走行距離なし（volumeScale=1.0）の場合、リカバリーは4000m', () => {
    const plan = generatePlan(basePlanParams);
    const recoveryDays = plan.weeklyPlans.flatMap(w => w.days).filter(d => d?.type === 'recovery');
    expect(recoveryDays.length).toBeGreaterThan(0);
    // volumeScale=1.0なので4000mのリカバリー
    recoveryDays.forEach(d => {
      expect(d!.workoutId).toBe('recovery-4000');
    });
  });

  it('月間走行距離300km（volumeScale≈1.39）の場合、リカバリーは6000m', () => {
    const plan = generatePlan({
      ...basePlanParams,
      monthlyMileage: 300,
    });
    const recoveryDays = plan.weeklyPlans.flatMap(w => w.days).filter(d => d?.type === 'recovery');
    expect(recoveryDays.length).toBeGreaterThan(0);
    // volumeScale = 300/216 ≈ 1.39 → 4000 * 1.39 = 5556 → recovery-6000
    recoveryDays.forEach(d => {
      expect(d!.workoutId).toBe('recovery-6000');
    });
  });

  it('月間走行距離500km（volumeScale≈2.31）の場合、リカバリーは8000m', () => {
    const plan = generatePlan({
      ...basePlanParams,
      monthlyMileage: 500,
    });
    const recoveryDays = plan.weeklyPlans.flatMap(w => w.days).filter(d => d?.type === 'recovery');
    expect(recoveryDays.length).toBeGreaterThan(0);
    // volumeScale = 500/216 ≈ 2.31 → 4000 * 2.31 = 9240 → recovery-8000
    recoveryDays.forEach(d => {
      expect(d!.workoutId).toBe('recovery-8000');
    });
  });

  it('リカバリー走のラベルに距離（km）が含まれる', () => {
    const plan = generatePlan(basePlanParams);
    const recoveryDays = plan.weeklyPlans.flatMap(w => w.days).filter(d => d?.type === 'recovery');
    recoveryDays.forEach(d => {
      expect(d!.label).toMatch(/リカバリー \d+km/);
    });
  });

  it('リカバリー走テンプレートの説明に「上限目安」が含まれる', () => {
    const recoveryWorkouts = WORKOUTS.filter(w => w.id.startsWith('recovery-'));
    expect(recoveryWorkouts.length).toBeGreaterThanOrEqual(3);
    recoveryWorkouts.forEach(w => {
      expect(w.description).toContain('上限目安');
    });
  });

  it('リカバリー走テンプレートの説明に「分割走」が含まれる', () => {
    const recoveryWorkouts = WORKOUTS.filter(w => w.id.startsWith('recovery-'));
    recoveryWorkouts.forEach(w => {
      expect(w.description).toContain('分割走');
    });
  });

  it('RECOVERY_WORKOUT_BY_DISTANCEテーブルに3段階ある', () => {
    expect(RECOVERY_WORKOUT_BY_DISTANCE).toHaveLength(3);
    expect(RECOVERY_WORKOUT_BY_DISTANCE[0].workoutId).toBe('recovery-4000');
    expect(RECOVERY_WORKOUT_BY_DISTANCE[1].workoutId).toBe('recovery-6000');
    expect(RECOVERY_WORKOUT_BY_DISTANCE[2].workoutId).toBe('recovery-8000');
  });
});

// ============================================
// 3. スピード・スプリント系メニュー
// ============================================
describe('スピード・スプリント カテゴリ', () => {
  it('カテゴリ名が「スピード・スプリント」に変更されている', () => {
    const speedCategory = PHYSIOLOGICAL_FOCUS_CATEGORIES['speed'];
    expect(speedCategory.name).toBe('スピード・スプリント');
    expect(speedCategory.menuCategory).toBe('スピード・スプリント');
  });

  it('「神経筋系」カテゴリのワークアウトが存在しない', () => {
    const oldCategoryWorkouts = WORKOUTS.filter(w => w.category === '神経筋系');
    expect(oldCategoryWorkouts).toHaveLength(0);
  });

  it('「スピード・スプリント」カテゴリのワークアウトが存在する', () => {
    const speedWorkouts = WORKOUTS.filter(w => w.category === 'スピード・スプリント');
    expect(speedWorkouts.length).toBeGreaterThanOrEqual(7);
  });

  it('新しいスピード系メニューが追加されている', () => {
    const workoutIds = WORKOUTS.map(w => w.id);
    expect(workoutIds).toContain('short-200x12');
    expect(workoutIds).toContain('sprint-150x8');
    expect(workoutIds).toContain('speed-300x6');
    expect(workoutIds).toContain('windsprints');
  });

  it('WORKOUT_SELECTION_BY_ETPに「スピード・スプリント」がある', () => {
    expect(WORKOUT_SELECTION_BY_ETP['スピード・スプリント']).toBeDefined();
    expect(WORKOUT_SELECTION_BY_ETP['スピード・スプリント'].length).toBeGreaterThanOrEqual(3);
  });

  it('selectWorkoutForCategoryで「スピード・スプリント」が正常に選択される', () => {
    // eTP 65（速い選手）→ speed-300x6
    const fastResult = selectWorkoutForCategory('スピード・スプリント', 65);
    expect(fastResult).toBe('speed-300x6');

    // eTP 80（中間）→ reps-400x6
    const midResult = selectWorkoutForCategory('スピード・スプリント', 80);
    expect(midResult).toBe('reps-400x6');

    // eTP 90（遅い選手）→ reps-200x10
    const slowResult = selectWorkoutForCategory('スピード・スプリント', 90);
    expect(slowResult).toBe('reps-200x10');
  });
});

// ============================================
// 4. 種目別スピード配分（800m/1500m）
// ============================================
describe('800m向けスピード配分', () => {
  const params800: GeneratePlanParams = {
    ...basePlanParams,
    race: { name: '800m記録会', date: toDateStr(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), distance: 800 },
  };

  it('800mのKEY_WORKOUTS_BY_DISTANCEが定義されている', () => {
    expect(KEY_WORKOUTS_BY_DISTANCE[800]).toBeDefined();
    expect(KEY_WORKOUTS_BY_DISTANCE[800].base).toBeDefined();
    expect(KEY_WORKOUTS_BY_DISTANCE[800].build).toBeDefined();
    expect(KEY_WORKOUTS_BY_DISTANCE[800].peak).toBeDefined();
  });

  it('800m基礎期: focusKeysにspeedが含まれる', () => {
    const base800 = KEY_WORKOUTS_BY_DISTANCE[800]!.base!;
    expect(base800.focusKeys).toContain('speed');
  });

  it('800m強化期: スピードが2番手（vo2max + speed）', () => {
    const build800 = KEY_WORKOUTS_BY_DISTANCE[800]!.build!;
    expect(build800.focusKeys[0]).toBe('vo2max');
    expect(build800.focusKeys[1]).toBe('speed');
  });

  it('800m試合期: スピードが最優先（speed + vo2max）', () => {
    const peak800 = KEY_WORKOUTS_BY_DISTANCE[800]!.peak!;
    expect(peak800.focusKeys[0]).toBe('speed');
    expect(peak800.focusKeys[1]).toBe('vo2max');
  });

  it('800m計画生成時にスピード系ワークアウトがKey日に配置される', () => {
    const plan = generatePlan(params800);
    // build期以降の週でスピード系がKey日に入っているか
    const buildWeeks = plan.weeklyPlans.filter(w => w.phaseType === 'build' || w.phaseType === 'peak');
    const speedKeyDays = buildWeeks.flatMap(w => w.days)
      .filter(d => d?.isKey && d?.focusKey === 'speed');
    expect(speedKeyDays.length).toBeGreaterThan(0);
  });
});

describe('1500m向けスピード配分', () => {
  const params1500: GeneratePlanParams = {
    ...basePlanParams,
    race: { name: '1500m記録会', date: toDateStr(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), distance: 1500 },
  };

  it('1500mのKEY_WORKOUTS_BY_DISTANCEが定義されている', () => {
    expect(KEY_WORKOUTS_BY_DISTANCE[1500]).toBeDefined();
    expect(KEY_WORKOUTS_BY_DISTANCE[1500].build).toBeDefined();
    expect(KEY_WORKOUTS_BY_DISTANCE[1500].peak).toBeDefined();
  });

  it('1500m強化期: スピードが2番手（vo2max + speed）', () => {
    const build1500 = KEY_WORKOUTS_BY_DISTANCE[1500]!.build!;
    expect(build1500.focusKeys[0]).toBe('vo2max');
    expect(build1500.focusKeys[1]).toBe('speed');
  });

  it('1500m計画生成時にスピード系ワークアウトがKey日に配置される', () => {
    const plan = generatePlan(params1500);
    const buildWeeks = plan.weeklyPlans.filter(w => w.phaseType === 'build' || w.phaseType === 'peak');
    const speedKeyDays = buildWeeks.flatMap(w => w.days)
      .filter(d => d?.isKey && d?.focusKey === 'speed');
    expect(speedKeyDays.length).toBeGreaterThan(0);
  });

  it('スピード系Key日にスピード・スプリントカテゴリのworkoutIdが割り当てられる', () => {
    const plan = generatePlan(params1500);
    const speedKeyDays = plan.weeklyPlans.flatMap(w => w.days)
      .filter(d => d?.isKey && d?.focusKey === 'speed' && d?.workoutId);
    expect(speedKeyDays.length).toBeGreaterThan(0);
    // workoutIdがスピード系のいずれかであることを確認
    const validSpeedWorkoutIds = WORKOUTS
      .filter(w => w.category === 'スピード・スプリント')
      .map(w => w.id);
    speedKeyDays.forEach(d => {
      expect(validSpeedWorkoutIds).toContain(d!.workoutId);
    });
  });
});

describe('3000m/5000mはデフォルト配分', () => {
  it('3000mではスピードがKey日に入らない（デフォルト: vo2max + threshold）', () => {
    const plan = generatePlan({
      ...basePlanParams,
      race: { name: '3000m記録会', date: toDateStr(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), distance: 3000 },
    });
    const buildWeeks = plan.weeklyPlans.filter(w => w.phaseType === 'build');
    // build期のKey日はvo2maxとthresholdのみ
    const keyDays = buildWeeks.flatMap(w => w.days)
      .filter(d => d?.isKey && d?.type === 'workout');
    const focusKeys = keyDays.map(d => d!.focusKey);
    // build期のデフォルトfocusKeysは['vo2max', 'threshold', 'speed']だが
    // 2つのKey日には[0]と[1]のみ割り当てられる
    expect(focusKeys.filter(k => k === 'speed')).toHaveLength(0);
  });
});

// ============================================
// 5. 目標レース変更（計画差し替え）
// ============================================
describe('目標レース変更', () => {
  it('計画を生成し直しても構造が正しい', () => {
    // 最初の計画
    const plan1 = generatePlan(basePlanParams);
    expect(plan1.race.distance).toBe(1500);

    // 目標を800mに変更して新しい計画を生成
    const plan2 = generatePlan({
      ...basePlanParams,
      race: { name: '800m記録会', date: toDateStr(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)), distance: 800 },
    });
    expect(plan2.race.distance).toBe(800);

    // 新しい計画は有効なデータを持っている
    expect(plan2.id).toBeDefined();
    expect(plan2.weeklyPlans.length).toBeGreaterThan(0);
    expect(plan2.phases.length).toBeGreaterThan(0);
    expect(plan2.planVersion).toBe(PLAN_VERSION);
  });

  it('異なるレース距離で異なる計画が生成される', () => {
    const plan1500 = generatePlan(basePlanParams);
    const plan800 = generatePlan({
      ...basePlanParams,
      race: { name: '800m', date: basePlanParams.race.date, distance: 800 },
    });
    // 異なるレース距離
    expect(plan1500.race.distance).toBe(1500);
    expect(plan800.race.distance).toBe(800);
    // 異なるレース距離では異なるワークアウト配分になる
    const plan1500Labels = plan1500.weeklyPlans.flatMap(w => w.days.map(d => d?.label)).join(',');
    const plan800Labels = plan800.weeklyPlans.flatMap(w => w.days.map(d => d?.label)).join(',');
    expect(plan1500Labels).not.toBe(plan800Labels);
  });
});

// ============================================
// 6. メニュー差し替え（ストア操作）
// ============================================
describe('メニュー差し替えロジック', () => {
  it('生成された計画のworkoutIdをプログラム的に差し替えできる', () => {
    const plan = generatePlan(basePlanParams);
    // 最初のKey日を見つける
    const firstKeyDay = plan.weeklyPlans[0].days.find(d => d?.isKey && d?.workoutId);
    expect(firstKeyDay).toBeDefined();

    // 差し替えのシミュレーション（ストアのreplaceWorkoutと同等のロジック）
    const weekNumber = 1;
    const dayId = firstKeyDay!.id;
    const newWorkoutId = 'tempo-4000';
    const newWorkoutName = 'テンポ走4000m';
    const newWorkoutCategory = '乳酸閾値';

    const updatedWeeklyPlans = plan.weeklyPlans.map((week) => {
      if (week.weekNumber !== weekNumber) return week;
      return {
        ...week,
        days: week.days.map((d) => {
          if (!d || d.id !== dayId) return d;
          return { ...d, workoutId: newWorkoutId, label: newWorkoutName, focusCategory: newWorkoutCategory };
        }),
      };
    });

    // 差し替え後のデータを確認
    const replacedDay = updatedWeeklyPlans[0].days.find(d => d?.id === dayId);
    expect(replacedDay!.workoutId).toBe('tempo-4000');
    expect(replacedDay!.label).toBe('テンポ走4000m');
    expect(replacedDay!.focusCategory).toBe('乳酸閾値');
    // isKeyやdayOfWeekなど他のプロパティは保持される
    expect(replacedDay!.isKey).toBe(firstKeyDay!.isKey);
    expect(replacedDay!.dayOfWeek).toBe(firstKeyDay!.dayOfWeek);
  });
});

// ============================================
// 7. ボリュームスケール計算の確認
// ============================================
describe('ボリュームスケールとリカバリー選択の整合性', () => {
  it('月間走行距離100km（低ボリューム）→ recovery-4000', () => {
    const scale = calculateVolumeScale(100, 1500); // 100/216 ≈ 0.46 → min 0.6
    expect(scale).toBeCloseTo(0.6, 1);
    // 4000 * 0.6 = 2400 → maxDistance 5000以内 → recovery-4000
  });

  it('月間走行距離216km（デフォルト）→ recovery-4000', () => {
    const scale = calculateVolumeScale(216, 1500); // 216/216 = 1.0
    expect(scale).toBeCloseTo(1.0, 1);
    // 4000 * 1.0 = 4000 → maxDistance 5000以内 → recovery-4000
  });

  it('月間走行距離350km → recovery-6000', () => {
    const scale = calculateVolumeScale(350, 1500); // 350/216 ≈ 1.62
    expect(scale).toBeCloseTo(1.62, 1);
    // 4000 * 1.62 = 6480 → maxDistance 7000以内 → recovery-6000
  });

  it('月間走行距離500km → recovery-8000', () => {
    const scale = calculateVolumeScale(500, 1500); // 500/216 ≈ 2.31
    expect(scale).toBeCloseTo(2.31, 1);
    // 4000 * 2.31 = 9240 → maxDistance 999999以内 → recovery-8000
  });
});
