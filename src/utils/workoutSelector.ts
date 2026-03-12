// ============================================
// Workout Selector - ワークアウト選択ロジック
// ============================================

import { LimiterType, RaceDistance, Experience } from '../types';
import { WORKOUT_SELECTION_BY_ETP, WORKOUT_REPS_SCALING } from '../constants';

/**
 * カテゴリ・走力（eTP）・週番号に基づいてワークアウトIDを選択する
 * eTPが低い（速い）選手には長い距離のインターバルを推奨
 * weekNumberを指定すると、alternatesとのローテーションで毎週異なるメニューを選択
 */
export function selectWorkoutForCategory(
  category: string,
  etp: number,
  weekNumber?: number,
): string | undefined {
  const selections = WORKOUT_SELECTION_BY_ETP[category];
  if (!selections) return undefined;

  for (const sel of selections) {
    if (etp <= sel.maxEtp) {
      // ローテーション候補がある場合、週番号で切り替え
      if (weekNumber != null && sel.alternates && sel.alternates.length > 0) {
        const pool = [sel.workoutId, ...sel.alternates];
        return pool[weekNumber % pool.length];
      }
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
