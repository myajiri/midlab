// ============================================
// 認証サービス
// ============================================

import { supabase, type User, type Session } from '../lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

export interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

// ============================================
// メール認証
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
 * アカウント完全削除
 * Supabase Edge Function経由でauth.usersから完全削除
 * Edge Function未デプロイ時はサインアウトのみ実行
 */
export const deleteAccount = async (): Promise<{ complete: boolean }> => {
    // 現在のセッションを取得
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('ログインしていません');
    }

    let completelyDeleted = false;

    try {
        // Edge Functionを呼び出してアカウントを完全削除
        const { error } = await supabase.functions.invoke('delete-user', {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (!error) {
            completelyDeleted = true;
        }
    } catch (e) {
        // Edge Functionが利用できない場合は無視
        console.log('Edge Function not available, falling back to sign out only');
    }

    // ローカルセッションをクリア
    await supabase.auth.signOut();

    return { complete: completelyDeleted };
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

// ============================================
// Apple認証 (iOS専用)
// ============================================

/**
 * Appleでサインイン（iOS専用）
 */
export const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
    }

    // nonceを生成（リプレイ攻撃対策）
    const rawNonce = Array.from(
        Crypto.getRandomValues(new Uint8Array(32))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
    );

    // Apple認証ダイアログを表示
    const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
    });

    if (!credential.identityToken) {
        throw new Error('Apple Sign In failed: No identity token');
    }

    // Supabaseでサインイン
    const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
    });

    if (error) throw error;
    return data;
};

/**
 * Apple認証が利用可能か確認
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;
    return await AppleAuthentication.isAvailableAsync();
};

// ============================================
// Google認証
// ============================================

/**
 * Googleでサインイン
 * 注: expo-auth-sessionを使用した実装
 * 本番環境ではGoogle Cloud ConsoleでOAuth設定が必要
 */
export const signInWithGoogle = async () => {
    // Supabase OAuth経由でGoogleサインイン
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'zone2peak://auth/callback',
            skipBrowserRedirect: true,
        },
    });

    if (error) throw error;
    return data;
};
