// ============================================
// 認証状態管理
// Zustand + Supabase
// ============================================

import { create } from 'zustand';
import { type User, type Session } from '../lib/supabase';
import { onAuthStateChange, getSession, signOut as authSignOut } from '../services/auth';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;

    // アクション
    setSession: (session: Session | null) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    setSession: (session) => {
        set({
            session,
            user: session?.user ?? null,
            loading: false,
        });
    },

    signOut: async () => {
        set({ loading: true });
        try {
            await authSignOut();
            set({ user: null, session: null, loading: false });
        } catch (error) {
            if (__DEV__) {
                console.error('Sign out error:', error);
            }
            set({ loading: false });
            throw error;
        }
    },

    initialize: async () => {
        if (get().initialized) return;

        try {
            // 現在のセッションを取得
            const session = await getSession();
            set({
                session,
                user: session?.user ?? null,
                loading: false,
                initialized: true,
            });

            // 認証状態の変更をリッスン
            onAuthStateChange((newSession) => {
                set({
                    session: newSession,
                    user: newSession?.user ?? null,
                });
            });
        } catch (error) {
            if (__DEV__) {
                console.error('Auth initialization error:', error);
            }
            set({ loading: false, initialized: true });
        }
    },
}));

// セレクター
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.session);
