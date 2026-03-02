// ============================================
// Workout Selector - ワークアウト選択ロジック
// ============================================

import { LimiterType, RaceDistance, Experience } from '../types';
import { WORKOUT_SELECTION_BY_ETP, WORKOUT_REPS_SCALING } from '../constants';

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

/**
 * ボリューム倍率に応じたワークアウト本数ボーナスを取得
 * 月間走行距離が多い選手は、インターバル等の本数を増やす
 */
export function getVolumeRepsBonus(volumeScale: number): number {
  for (const entry of WORKOUT_REPS_SCALING) {
    if (volumeScale >= entry.threshold) {
      return entry.repsBonus;
    }
  }
  return 0;
}
