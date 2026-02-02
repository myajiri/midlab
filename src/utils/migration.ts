// ============================================
// MidLab データ移行ユーティリティ
// Zone2Peak → MidLab リブランディング対応
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../constants';

/**
 * 旧ストレージキー（zone2peak_*）から新キー（midlab_*）へデータを移行
 * 初回起動時に一度だけ実行される
 */
export const migrateStorageKeys = async (): Promise<boolean> => {
  try {
    // 移行済みフラグを確認
    const migrationComplete = await AsyncStorage.getItem('midlab_migration_complete');
    if (migrationComplete === 'true') {
      return false; // 既に移行済み
    }

    if (__DEV__) {
      console.log('[Migration] Starting storage key migration from zone2peak to midlab...');
    }

    const keyMappings = [
      { legacy: LEGACY_STORAGE_KEYS.profile, current: STORAGE_KEYS.profile },
      { legacy: LEGACY_STORAGE_KEYS.testResults, current: STORAGE_KEYS.testResults },
      { legacy: LEGACY_STORAGE_KEYS.activePlan, current: STORAGE_KEYS.activePlan },
      { legacy: LEGACY_STORAGE_KEYS.workoutLogs, current: STORAGE_KEYS.workoutLogs },
      { legacy: LEGACY_STORAGE_KEYS.settings, current: STORAGE_KEYS.settings },
      { legacy: LEGACY_STORAGE_KEYS.onboardingComplete, current: STORAGE_KEYS.onboardingComplete },
    ];

    let migratedCount = 0;

    for (const { legacy, current } of keyMappings) {
      try {
        // 旧キーからデータを取得
        const legacyData = await AsyncStorage.getItem(legacy);

        if (legacyData !== null) {
          // 新キーにデータが存在しない場合のみ移行
          const currentData = await AsyncStorage.getItem(current);

          if (currentData === null) {
            await AsyncStorage.setItem(current, legacyData);
            if (__DEV__) {
              console.log(`[Migration] Migrated: ${legacy} → ${current}`);
            }
            migratedCount++;
          } else {
            if (__DEV__) {
              console.log(`[Migration] Skipped (already exists): ${current}`);
            }
          }

          // 旧キーを削除
          await AsyncStorage.removeItem(legacy);
          if (__DEV__) {
            console.log(`[Migration] Removed legacy key: ${legacy}`);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error(`[Migration] Error migrating ${legacy}:`, error);
        }
      }
    }

    // 移行完了フラグを設定
    await AsyncStorage.setItem('midlab_migration_complete', 'true');
    if (__DEV__) {
      console.log(`[Migration] Complete. Migrated ${migratedCount} keys.`);
    }

    return migratedCount > 0;
  } catch (error) {
    if (__DEV__) {
      console.error('[Migration] Migration failed:', error);
    }
    return false;
  }
};

/**
 * 移行状態をリセット（デバッグ用）
 */
export const resetMigration = async (): Promise<void> => {
  await AsyncStorage.removeItem('midlab_migration_complete');
  if (__DEV__) {
    console.log('[Migration] Migration flag reset');
  }
};
