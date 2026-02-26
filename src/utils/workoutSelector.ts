// ============================================
// Workout Selector - ワークアウト選択ロジック
// ============================================

import { LimiterType, RaceDistance } from '../types';
import { WORKOUT_SELECTION_BY_ETP } from '../constants';

/**
 * カテゴリ・走力（eTP）に基づいてワークアウトIDを選択する
 * eTPが低い（速い）選手には長い距離のインターバルを推奨
 */
export function selectWorkoutForCategory(
  category: string,
  etp: number,
): string | undefined {
  const selections = WORKOUT_SELECTION_BY_ETP[category];
  if (!selections) return undefined;

  for (const sel of selections) {
    if (etp <= sel.maxEtp) {
      return sel.workoutId;
    }
  }
  return selections[selections.length - 1]?.workoutId;
}
