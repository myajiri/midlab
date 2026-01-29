// ============================================
// 認証サービス
// ============================================

import { supabase, type User, type Session } from '../lib/supabase';

export interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

// ============================================
// 認証関数
// ============================================

/**
 * メール/パスワードでサインアップ
 */
export const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

/**
 * メール/パスワードでサインイン
 */
export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

/**
 * サインアウト
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

/**
 * 現在のセッションを取得
 */
export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

/**
 * パスワードリセットメール送信
 */
export const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
};

/**
 * 認証状態の変更をリッスン
 */
export const onAuthStateChange = (callback: (session: Session | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            callback(session);
        }
    );
    return subscription;
};
