// ============================================
// Zone2Peak ストレージサービス
// AsyncStorage を使用したローカルストレージ
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 汎用ストレージメソッド
// ============================================

export const storageService = {
    // 文字列
    getString: async (key: string): Promise<string | null> => {
        return await AsyncStorage.getItem(key);
    },
    setString: async (key: string, value: string): Promise<void> => {
        await AsyncStorage.setItem(key, value);
    },

    // オブジェクト（JSON）
    getObject: async <T>(key: string): Promise<T | null> => {
        const str = await AsyncStorage.getItem(key);
        if (!str) return null;
        try {
            return JSON.parse(str) as T;
        } catch {
            return null;
        }
    },
    setObject: async <T>(key: string, value: T): Promise<void> => {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    },

    // 削除
    delete: async (key: string): Promise<void> => {
        await AsyncStorage.removeItem(key);
    },

    // 全削除
    clearAll: async (): Promise<void> => {
        await AsyncStorage.clear();
    },

    // 全キー取得
    getAllKeys: async (): Promise<readonly string[]> => {
        return await AsyncStorage.getAllKeys();
    },
};

// ============================================
// Zustand 永続化用アダプター（AsyncStorage）
// ============================================

export const asyncStorageAdapter = {
    getItem: async (name: string): Promise<string | null> => {
        return await AsyncStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await AsyncStorage.removeItem(name);
    },
};
