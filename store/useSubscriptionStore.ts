// ============================================
// サブスクリプション状態管理
// Zustand + RevenueCat
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// 開発用モック設定
// DEV_FORCE_PREMIUM を true にするとプレミアム状態を強制
// Expo Go環境でも課金UIの確認が可能
// ============================================
const DEV_FORCE_PREMIUM = __DEV__ && true; // trueで強制プレミアム

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

                    // パッケージ取得
                    const packages = await getOfferings();

                    // 顧客情報取得
                    const customerInfo = await getCustomerInfo();
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
                    const isPremium = checkPremiumStatus(customerInfo);
                    set({ customerInfo, isPremium, loading: false });
                    return true;
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
                    set({ customerInfo, isPremium, loading: false });
                    return isPremium;
                } catch (error: any) {
                    set({ loading: false, error: error.message });
                    return false;
                }
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
