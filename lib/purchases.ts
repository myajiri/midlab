// ============================================
// RevenueCat 課金設定
// ============================================

import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat API Keys (要設定)
const REVENUECAT_API_KEY_IOS = 'YOUR_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'YOUR_ANDROID_API_KEY';

// 商品ID
export const PRODUCT_IDS = {
    PREMIUM_MONTHLY: 'midlab_premium_monthly',
    PREMIUM_YEARLY: 'midlab_premium_yearly',
} as const;

// エンタイトルメントID
export const ENTITLEMENTS = {
    PREMIUM: 'premium',
} as const;

/**
 * Expo Go環境かどうかを判定
 */
export const isExpoGo = (): boolean => {
    return Constants.appOwnership === 'expo';
};

/**
 * RevenueCat初期化
 * Expo Go環境ではスキップ
 */
export const initializePurchases = async (userId?: string) => {
    // Expo Goではネイティブモジュールが使えないのでスキップ
    if (isExpoGo()) {
        console.log('RevenueCat: Skipping initialization in Expo Go');
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
    if (isExpoGo()) return;
    await Purchases.logIn(userId);
};

/**
 * ユーザーログアウト
 */
export const logoutPurchases = async () => {
    if (isExpoGo()) return;
    await Purchases.logOut();
};

/**
 * 利用可能なパッケージを取得
 */
export const getOfferings = async () => {
    if (isExpoGo()) return [];
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
};

/**
 * 購入処理
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
    if (isExpoGo()) return null;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
};

/**
 * 購入復元
 */
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
    if (isExpoGo()) return null;
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
};

/**
 * 顧客情報取得
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
    if (isExpoGo()) return null;
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

