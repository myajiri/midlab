// ============================================
// RevenueCat 課金設定
// ============================================

import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 環境変数から設定を取得
const REVENUECAT_API_KEY_IOS = Constants.expoConfig?.extra?.revenueCatApiKeyIos || '';
const REVENUECAT_API_KEY_ANDROID = Constants.expoConfig?.extra?.revenueCatApiKeyAndroid || '';
const ENABLE_PURCHASES = Constants.expoConfig?.extra?.enablePurchases || false;

// 商品ID
export const PRODUCT_IDS = {
    PREMIUM_MONTHLY: 'midlab_premium_monthly',  // ¥980/月
    PREMIUM_YEARLY: 'midlab_premium_yearly',    // ¥9,800/年
    // COACHING_MONTHLY: 'midlab_coaching_monthly', // ¥2,980/月
} as const;

// エンタイトルメントID
export const ENTITLEMENTS = {
    PREMIUM: 'MidLab Pro',
} as const;

/**
 * Expo Go環境かどうかを判定
 */
export const isExpoGo = (): boolean => {
    return Constants.appOwnership === 'expo';
};

/**
 * 課金機能が有効かどうか
 */
export const isPurchasesEnabled = (): boolean => {
    // Expo Goでは無効
    if (isExpoGo()) return false;
    // 環境変数で無効化されている場合
    if (!ENABLE_PURCHASES) return false;
    // APIキーが設定されていない場合
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    if (!apiKey) return false;
    return true;
};

/**
 * RevenueCat初期化
 * Expo Go環境または無効化されている場合はスキップ
 */
export const initializePurchases = async (userId?: string) => {
    if (!isPurchasesEnabled()) {
        if (__DEV__) {
            console.log('[RevenueCat] 課金機能は無効化されています');
        }
        return;
    }

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({
        apiKey,
        appUserID: userId,
    });
};

/**
 * ユーザーIDを設定（ログイン後に呼び出し）
 */
export const loginPurchases = async (userId: string) => {
    if (!isPurchasesEnabled()) return;
    await Purchases.logIn(userId);
};

/**
 * ユーザーログアウト
 */
export const logoutPurchases = async () => {
    if (!isPurchasesEnabled()) return;
    await Purchases.logOut();
};

/**
 * 利用可能なパッケージを取得
 */
export const getOfferings = async () => {
    if (!isPurchasesEnabled()) return [];
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
};

/**
 * 購入処理
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
    if (!isPurchasesEnabled()) return null;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
};

/**
 * 購入復元
 */
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
    if (!isPurchasesEnabled()) return null;
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
};

/**
 * 顧客情報取得
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
    if (!isPurchasesEnabled()) return null;
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
};

/**
 * プレミアムかどうかを判定
 */
export const checkPremiumStatus = (customerInfo: CustomerInfo | null): boolean => {
    if (!customerInfo) return false;
    return customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]?.isActive ?? false;
};

export type { PurchasesPackage, CustomerInfo };
