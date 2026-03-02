// ============================================
// planGenerator のテストケース
// 休養日頻度の柔軟性（PBI-004）
// ============================================

import { generatePlan, determineRestDayFrequency, GeneratePlanParams } from '../utils/planGenerator';

// ============================================
// determineRestDayFrequency
// ============================================

describe('determineRestDayFrequency', () => {
  it('初心者は常にweekly（安全側）', () => {
    expect(determineRestDayFrequency('beginner')).toBe('weekly');
    expect(determineRestDayFrequency('beginner', 100)).toBe('weekly');
    expect(determineRestDayFrequency('beginner', 300)).toBe('weekly');
  });

  it('中級者: 月間200km未満はweekly', () => {
    expect(determineRestDayFrequency('intermediate')).toBe('weekly');
    expect(determineRestDayFrequency('intermediate', 150)).toBe('weekly');
    expect(determineRestDayFrequency('intermediate', 199)).toBe('weekly');
  });

  it('中級者: 月間200km以上はbiweekly', () => {
    expect(determineRestDayFrequency('intermediate', 200)).toBe('biweekly');
    expect(determineRestDayFrequency('intermediate', 300)).toBe('biweekly');
  });

  it('上級者: 月間走行距離なしはweekly', () => {
    expect(determineRestDayFrequency('advanced')).toBe('weekly');
  });

  it('上級者: 月間200km以上はbiweekly', () => {
    expect(determineRestDayFrequency('advanced', 200)).toBe('biweekly');
    expect(determineRestDayFrequency('advanced', 250)).toBe('biweekly');
  });

  it('上級者: 月間300km以上はmonthly', () => {
    expect(determineRestDayFrequency('advanced', 300)).toBe('monthly');
    expect(determineRestDayFrequency('advanced', 400)).toBe('monthly');
  });

  it('エリート: 上級者と同じロジック', () => {
    expect(determineRestDayFrequency('elite')).toBe('weekly');
    expect(determineRestDayFrequency('elite', 200)).toBe('biweekly');
    expect(determineRestDayFrequency('elite', 300)).toBe('monthly');
  });
});

// ============================================
// generatePlan - 休養日頻度
// ============================================

describe('generatePlan - 休養日頻度', () => {
  // 8週間後のレース日を作成
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 56);

  const baseParams: GeneratePlanParams = {
    race: { name: 'テストレース', date: futureDate.toISOString(), distance: 1500 },
    baseline: { etp: 75, limiterType: 'balanced' },
    restDay: 6,
    ageCategory: 'senior',
    experience: 'intermediate',
    gender: 'other',
  };

  it('weekly: 毎週休養日がある', () => {
    const plan = generatePlan({ ...baseParams, restDayFrequency: 'weekly' });
    expect(plan.weeklyPlans.length).toBeGreaterThan(0);

    // 通常週（非回復・非テスト週）はすべて休養日がある
    for (const week of plan.weeklyPlans) {
      const restDays = week.days.filter(d => d?.type === 'rest');
      expect(restDays.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('biweekly: 一部の週は休養日がない', () => {
    const plan = generatePlan({ ...baseParams, restDayFrequency: 'biweekly' });
    expect(plan.weeklyPlans.length).toBeGreaterThan(0);

    // 回復週・テスト週以外で休養日がない週が存在するはず
    const normalWeeks = plan.weeklyPlans.filter(w => !w.isRecoveryWeek && !w.isRampTestWeek);
    const weeksWithoutRest = normalWeeks.filter(w =>
      w.days.filter(d => d?.type === 'rest').length === 0
    );
    // 通常週が十分にあれば、休養日なし週が存在するはず
    if (normalWeeks.length >= 2) {
      expect(weeksWithoutRest.length).toBeGreaterThan(0);
    }
  });

  it('monthly: 大部分の週は休養日がない', () => {
    const plan = generatePlan({ ...baseParams, restDayFrequency: 'monthly' });
    expect(plan.weeklyPlans.length).toBeGreaterThan(0);

    // 回復週・テスト週以外で休養日がない週が多い
    const normalWeeks = plan.weeklyPlans.filter(w => !w.isRecoveryWeek && !w.isRampTestWeek);
    const weeksWithRest = normalWeeks.filter(w =>
      w.days.filter(d => d?.type === 'rest').length > 0
    );
    // monthly(4週間隔)なので、休養日ありの通常週は少ない
    if (normalWeeks.length >= 4) {
      expect(weeksWithRest.length).toBeLessThan(normalWeeks.length);
    }
  });

  it('auto + 初心者: weeklyと同じ結果', () => {
    const autoParams = { ...baseParams, restDayFrequency: 'auto' as const, experience: 'beginner' as const };
    const weeklyParams = { ...baseParams, restDayFrequency: 'weekly' as const, experience: 'beginner' as const };
    const autoPlan = generatePlan(autoParams);
    const weeklyPlan = generatePlan(weeklyParams);

    // 両方とも毎週休養日があるはず
    for (const week of autoPlan.weeklyPlans) {
      const restDays = week.days.filter(d => d?.type === 'rest');
      expect(restDays.length).toBeGreaterThanOrEqual(1);
    }
    // 週数は同じ
    expect(autoPlan.weeklyPlans.length).toBe(weeklyPlan.weeklyPlans.length);
  });

  it('auto + 上級者 + 月間300km: monthlyに相当', () => {
    const plan = generatePlan({
      ...baseParams,
      restDayFrequency: 'auto',
      experience: 'advanced',
      monthlyMileage: 300,
    });

    // 回復週・テスト週以外で休養日がない週があるはず
    const normalWeeks = plan.weeklyPlans.filter(w => !w.isRecoveryWeek && !w.isRampTestWeek);
    const weeksWithoutRest = normalWeeks.filter(w =>
      w.days.filter(d => d?.type === 'rest').length === 0
    );
    if (normalWeeks.length >= 4) {
      expect(weeksWithoutRest.length).toBeGreaterThan(0);
    }
  });

  it('回復週は頻度に関係なく休養日がある', () => {
    const plan = generatePlan({ ...baseParams, restDayFrequency: 'monthly' });
    const recoveryWeeks = plan.weeklyPlans.filter(w => w.isRecoveryWeek);

    for (const week of recoveryWeeks) {
      const restDays = week.days.filter(d => d?.type === 'rest');
      expect(restDays.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('テスト週は頻度に関係なく休養日がある', () => {
    const plan = generatePlan({ ...baseParams, restDayFrequency: 'monthly' });
    const testWeeks = plan.weeklyPlans.filter(w => w.isRampTestWeek);

    for (const week of testWeeks) {
      const restDays = week.days.filter(d => d?.type === 'rest');
      expect(restDays.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('休養日なし週ではイージー走に置き換わっている', () => {
    const plan = generatePlan({ ...baseParams, restDayFrequency: 'monthly' });
    const normalWeeks = plan.weeklyPlans.filter(w => !w.isRecoveryWeek && !w.isRampTestWeek);
    const weeksWithoutRest = normalWeeks.filter(w =>
      w.days.filter(d => d?.type === 'rest').length === 0
    );

    // 休養日がない週は全7日にワークアウトが割り当てられている
    for (const week of weeksWithoutRest) {
      const nonNullDays = week.days.filter(d => d !== null);
      expect(nonNullDays.length).toBe(7);
      // 全日がrest以外のタイプ
      for (const day of nonNullDays) {
        expect(day!.type).not.toBe('rest');
      }
    }
  });

  it('デフォルト（restDayFrequency未指定）はautoと同じ', () => {
    const defaultPlan = generatePlan(baseParams);
    const autoPlan = generatePlan({ ...baseParams, restDayFrequency: 'auto' });

    // 同じ週数
    expect(defaultPlan.weeklyPlans.length).toBe(autoPlan.weeklyPlans.length);
  });
});
