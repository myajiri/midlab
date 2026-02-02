// ============================================
// Supabase クライアント設定
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 環境変数から設定を取得
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// 開発時の警告（本番では環境変数が必須）
if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        '[Supabase] 環境変数が設定されていません。\n' +
        '.env.example を参考に .env ファイルを作成してください。'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// 型定義
export type { User, Session } from '@supabase/supabase-js';
