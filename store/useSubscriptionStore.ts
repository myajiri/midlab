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
    type PurchasesPackage,
    type CustomerInfo,
} from '../lib/purchases';

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
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPremium: false,
            customerInfo: null,
            packages: [],
            loading: false,
            error: null,
            initialized: false,

            initialize: async (userId) => {
                if (get().initialized) return;

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
                    console.error('Subscription init error:', error);
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
                    console.error('Purchase login error:', error);
                }
            },

            onUserLogout: async () => {
                try {
                    await logoutPurchases();
                    set({ isPremium: false, customerInfo: null });
                } catch (error) {
                    console.error('Purchase logout error:', error);
                }
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isPremium: state.isPremium,
            }),
        }
    )
);

// セレクター
export const useIsPremium = () => useSubscriptionStore((state) => state.isPremium);
export const useSubscriptionLoading = () => useSubscriptionStore((state) => state.loading);
export const usePackages = () => useSubscriptionStore((state) => state.packages);
