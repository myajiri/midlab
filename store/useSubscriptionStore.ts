// ============================================
// サブスクリプション状態管理
// Zustand + RevenueCat
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
    initializePurchases,
    getCustomerInfo,
    checkPremiumStatus,
    purchasePackage,
    restorePurchases,
    getOfferings,
    loginPurchases,
    logoutPurchases,
    isPurchasesEnabled,
    type PurchasesPackage,
    type CustomerInfo,
} from '../lib/purchases';

// ============================================
// 開発用・テスト用モック設定
// DEV_FORCE_PREMIUM を true にするとプレミアム状態を強制
// Expo Go環境でも課金UIの確認が可能
// EXPO_PUBLIC_FORCE_PREMIUM=true で本番以外のビルドでも強制可能
// ============================================
const ENV_FORCE_PREMIUM = Constants.expoConfig?.extra?.forcePremium === true;
const DEV_FORCE_PREMIUM = (__DEV__ && true) || ENV_FORCE_PREMIUM;

interface SubscriptionState {
    isPremium: boolean;
    customerInfo: CustomerInfo | null;
    packages: PurchasesPackage[];
    loading: boolean;
    error: string | null;
    initialized: boolean;

    // アクション
    initialize: (userId?: string) => Promise<void>;
    refreshStatus: () => Promise<void>;
    purchase: (pkg: PurchasesPackage) => Promise<boolean>;
    restore: () => Promise<boolean>;
    applyPremiumStatus: () => void;
    onUserLogin: (userId: string) => Promise<void>;
    onUserLogout: () => Promise<void>;
    // 開発用
    setDevPremium: (isPremium: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPremium: DEV_FORCE_PREMIUM,
            customerInfo: null,
            packages: [],
            loading: false,
            error: null,
            initialized: false,

            initialize: async (userId) => {
                if (get().initialized) return;

                // 開発用モック: 強制プレミアムの場合は即座に完了
                if (DEV_FORCE_PREMIUM) {
                    set({ isPremium: true, loading: false, initialized: true });
                    return;
                }

                // 課金機能が無効の場合もスキップ
                if (!isPurchasesEnabled()) {
                    set({ loading: false, initialized: true });
                    return;
                }

                set({ loading: true, error: null });
                try {
                    await initializePurchases(userId);

                    // configure後にネイティブ側の初期化が安定するまで待機
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // パッケージ取得（configure失敗時は空配列で継続）
                    let packages: PurchasesPackage[] = [];
                    try {
                        packages = await getOfferings();
                    } catch (e) {
                        if (__DEV__) console.warn('getOfferings failed:', e);
                    }

                    // 顧客情報取得（失敗時はnullで継続）
                    let customerInfo: CustomerInfo | null = null;
                    try {
                        customerInfo = await getCustomerInfo();
                    } catch (e) {
                        if (__DEV__) console.warn('getCustomerInfo failed:', e);
                    }

                    const isPremium = checkPremiumStatus(customerInfo);

                    set({
                        packages,
                        customerInfo,
                        isPremium,
                        loading: false,
                        initialized: true,
                    });
                } catch (error: any) {
                    if (__DEV__) {
                        console.error('Subscription init error:', error);
                    }
                    set({
                        loading: false,
                        error: error.message,
                        initialized: true,
                    });
                }
            },

            refreshStatus: async () => {
                set({ loading: true, error: null });
                try {
                    const customerInfo = await getCustomerInfo();
                    const isPremium = checkPremiumStatus(customerInfo);
                    set({ customerInfo, isPremium, loading: false });
                } catch (error: any) {
                    set({ loading: false, error: error.message });
                }
            },

            purchase: async (pkg) => {
                set({ loading: true, error: null });
                try {
                    const customerInfo = await purchasePackage(pkg);
                    if (!customerInfo) {
                        set({ loading: false, error: '購入情報を取得できませんでした' });
                        return false;
                    }
                    const isPremium = checkPremiumStatus(customerInfo);
                    // isPremiumは即座に更新しない。購入完了時の同期的な再レンダリングが
                    // 画面遷移アニメーションと競合するため、customerInfoのみ保存し、
                    // isPremiumの更新はapplyPremiumStatus()に委譲する
                    set({ customerInfo, loading: false });
                    return isPremium;
                } catch (error: any) {
                    set({ loading: false, error: error.message });
                    return false;
                }
            },

            restore: async () => {
                set({ loading: true, error: null });
                try {
                    const customerInfo = await restorePurchases();
                    const isPremium = checkPremiumStatus(customerInfo);
                    // purchase()と同様、isPremiumは即座に更新しない
                    set({ customerInfo, loading: false });
                    return isPremium;
                } catch (error: any) {
                    set({ loading: false, error: error.message });
                    return false;
                }
            },

            // 購入/復元後にisPremium状態を安全に更新する
            // 画面遷移完了後に呼び出すことで、再レンダリングとネイティブ操作の競合を回避
            applyPremiumStatus: () => {
                const { customerInfo } = get();
                const isPremium = checkPremiumStatus(customerInfo);
                set({ isPremium });
            },

            onUserLogin: async (userId) => {
                try {
                    await loginPurchases(userId);
                    await get().refreshStatus();
                } catch (error) {
                    if (__DEV__) {
                        console.error('Purchase login error:', error);
                    }
                }
            },

            onUserLogout: async () => {
                try {
                    await logoutPurchases();
                    set({ isPremium: false, customerInfo: null });
                } catch (error) {
                    if (__DEV__) {
                        console.error('Purchase logout error:', error);
                    }
                }
            },

            // 開発用: プレミアム状態を手動で切り替え
            setDevPremium: (isPremium) => {
                if (__DEV__) {
                    set({ isPremium });
                }
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // 本番環境でのみisPremiumを永続化
                isPremium: state.isPremium,
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<SubscriptionState> | undefined;
                // 開発環境では永続化されたisPremiumを無視し、DEV_FORCE_PREMIUMを使用
                if (__DEV__) {
                    return {
                        ...currentState,
                        ...persisted,
                        isPremium: DEV_FORCE_PREMIUM,
                    };
                }
                // 本番環境では永続化された値を使用
                return {
                    ...currentState,
                    ...persisted,
                };
            },
        }
    )
);

// セレクター
export const useIsPremium = () => useSubscriptionStore((state) => state.isPremium);
export const useSubscriptionLoading = () => useSubscriptionStore((state) => state.loading);
export const usePackages = () => useSubscriptionStore((state) => state.packages);
