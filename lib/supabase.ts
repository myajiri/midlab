// ============================================
// Supabase クライアント設定
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxbeyuapdwyeefwwgvgo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmV5dWFwZHd5ZWVmd3dndmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Njg4ODYsImV4cCI6MjA4NTI0NDg4Nn0.IPP9QUQCs-M6hnw208eMk9orgFjeUGhxkOxgYvLatUw';

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
