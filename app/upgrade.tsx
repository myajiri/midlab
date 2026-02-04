// ============================================
// プレミアムアップグレード画面（コンパクト版）
// ============================================

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import {
    useSubscriptionStore,
    useIsPremium,
    useSubscriptionLoading,
    usePackages,
} from '../store/useSubscriptionStore';
import { isPurchasesEnabled } from '../lib/purchases';

// 定数
const COLORS = {
    background: { dark: '#0a0a0f', light: '#12121a' },
    primary: '#2d9f2d',
    secondary: '#8b5cf6',
    premium: '#F59E0B',
    success: '#22c55e',
    text: { primary: '#ffffff', secondary: '#a1a1aa', muted: '#71717a' },
};

// プレミアム機能リスト（コンパクト版）
const PREMIUM_FEATURES = [
    { icon: 'calendar', text: 'トレーニング計画' },
    { icon: 'barbell', text: 'トレーニング' },
    { icon: 'analytics', text: 'レース予測' },
    { icon: 'trending-up', text: '進捗分析' },
];

export default function UpgradeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { feature } = useLocalSearchParams<{ feature?: string }>();
    const isPremium = useIsPremium();
    const loading = useSubscriptionLoading();
    const packages = usePackages();
    const { purchase, restore } = useSubscriptionStore();
    const [restoring, setRestoring] = useState(false);
    const isNavigatingRef = useRef(false);

    // PremiumGateから来た場合、スワイプバック・ハードウェアバックを
    // インターセプトしてホームへ遷移
    useEffect(() => {
        if (!feature) return;

        const navigateToHome = () => {
            if (isNavigatingRef.current) return;
            isNavigatingRef.current = true;
            // setTimeoutで次のティックに遷移を遅延させて、beforeRemoveの競合を回避
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 0);
        };

        // iOSスワイプバック対応: beforeRemoveイベント
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (isNavigatingRef.current) return;
            e.preventDefault();
            navigateToHome();
        });

        // Androidハードウェアバックボタン対応
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigateToHome();
            return true;
        });

        return () => {
            unsubscribe();
            backHandler.remove();
        };
    }, [feature, navigation, router]);

    // 月額プランを取得
    const monthlyPackage = packages.find(pkg =>
        pkg.identifier.includes('monthly') || pkg.packageType === 'MONTHLY'
    );

    // 購入処理
    const handlePurchase = useCallback(async () => {
        if (!monthlyPackage) {
            Alert.alert('エラー', '購入可能なプランが見つかりません');
            return;
        }

        const success = await purchase(monthlyPackage);
        if (success) {
            Alert.alert('購入完了', 'プレミアムプランへのアップグレードが完了しました！', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    }, [monthlyPackage, purchase, router]);

    // 購入復元
    const handleRestore = useCallback(async () => {
        setRestoring(true);
        const restored = await restore();
        setRestoring(false);

        if (restored) {
            Alert.alert('復元完了', '購入が復元されました', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
        }
    }, [restore, router]);

    // サブスクリプション管理を開く
    const handleManageSubscription = useCallback(() => {
        if (Platform.OS === 'ios') {
            Linking.openURL('https://apps.apple.com/account/subscriptions');
        } else {
            Linking.openURL('https://play.google.com/store/account/subscriptions');
        }
    }, []);

    // 既にプレミアムの場合
    if (isPremium) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>プレミアム</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.premiumActiveContainer}>
                    <LinearGradient
                        colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                        style={styles.premiumActiveCard}
                    >
                        <Ionicons name="trophy" size={48} color="#F59E0B" />
                        <Text style={styles.premiumActiveTitle}>プレミアム会員</Text>
                        <Text style={styles.premiumActiveDescription}>
                            すべてのプレミアム機能をご利用いただけます
                        </Text>
                        <Pressable style={styles.manageButton} onPress={handleManageSubscription}>
                            <Text style={styles.manageButtonText}>サブスクリプションを管理</Text>
                        </Pressable>
                    </LinearGradient>
                </View>
            </SafeAreaView>
        );
    }

    // 課金機能が無効な場合
    const purchasesEnabled = isPurchasesEnabled();

    // 戻るボタンの処理
    // PremiumGateから来た場合（featureパラメータあり）はホームへ遷移
    // それ以外は通常の戻る動作
    const handleBack = useCallback(() => {
        if (feature) {
            if (isNavigatingRef.current) return;
            isNavigatingRef.current = true;
            router.replace('/(tabs)');
        } else {
            router.back();
        }
    }, [feature, router]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* ヘッダー */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>プレミアム</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* ヒーローセクション */}
                <LinearGradient
                    colors={['rgba(245, 158, 11, 0.25)', 'rgba(245, 158, 11, 0.05)']}
                    style={styles.heroSection}
                >
                    <Ionicons name="trophy" size={56} color="#F59E0B" />
                    <Text style={styles.heroTitle}>MidLab Premium</Text>
                    <Text style={styles.heroSubtitle}>
                        {feature
                            ? `「${feature}」はプレミアム限定です`
                            : 'すべての機能をアンロック'}
                    </Text>
                </LinearGradient>

                {/* 機能リスト（横並び） */}
                <View style={styles.featuresRow}>
                    {PREMIUM_FEATURES.map((item, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Ionicons name={item.icon as any} size={20} color={COLORS.premium} />
                            <Text style={styles.featureText}>{item.text}</Text>
                        </View>
                    ))}
                </View>

                {/* 価格カード */}
                <View style={styles.pricingCard}>
                    <View style={styles.pricingRow}>
                        <View>
                            <Text style={styles.pricingTitle}>月額プラン</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.price}>¥980</Text>
                                <Text style={styles.period}>/月</Text>
                            </View>
                        </View>
                        <View style={styles.trialBadge}>
                            <Text style={styles.trialBadgeText}>初回1週間無料</Text>
                        </View>
                    </View>
                </View>

                {/* 購入ボタン */}
                <View style={styles.purchaseSection}>
                    {purchasesEnabled ? (
                        <>
                            <Pressable
                                style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
                                onPress={handlePurchase}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#F59E0B', '#EAB308']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.purchaseButtonGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.purchaseButtonText}>
                                            無料トライアルを開始
                                        </Text>
                                    )}
                                </LinearGradient>
                            </Pressable>

                            <Pressable
                                style={styles.restoreButton}
                                onPress={handleRestore}
                                disabled={restoring}
                            >
                                {restoring ? (
                                    <ActivityIndicator color={COLORS.text.secondary} size="small" />
                                ) : (
                                    <Text style={styles.restoreButtonText}>購入を復元</Text>
                                )}
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.unavailableContainer}>
                            <Ionicons name="information-circle-outline" size={20} color={COLORS.text.muted} />
                            <Text style={styles.unavailableText}>
                                この環境では課金機能をご利用いただけません
                            </Text>
                        </View>
                    )}
                </View>

                {/* 利用規約・プライバシーポリシー */}
                <View style={styles.legalSection}>
                    <Text style={styles.legalText}>
                        購入により
                        <Text
                            style={styles.legalLink}
                            onPress={() => Linking.openURL('https://myajiri.github.io/midlab/terms.html')}
                        >
                            利用規約
                        </Text>
                        ・
                        <Text
                            style={styles.legalLink}
                            onPress={() => Linking.openURL('https://myajiri.github.io/midlab/privacy.html')}
                        >
                            プライバシーポリシー
                        </Text>
                        に同意
                    </Text>
                    <Text style={styles.legalNote}>
                        無料トライアル終了後、月額¥980（年額¥9,800）で自動更新されます。{'\n'}
                        解約はいつでも{Platform.OS === 'ios' ? 'App Store' : 'Google Play'}の設定から可能です。
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    heroSection: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 8,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    featureText: {
        fontSize: 13,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    pricingCard: {
        marginHorizontal: 20,
        backgroundColor: COLORS.background.light,
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: COLORS.premium,
    },
    pricingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pricingTitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    period: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginLeft: 2,
    },
    trialBadge: {
        backgroundColor: COLORS.premium,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    trialBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    purchaseSection: {
        paddingHorizontal: 20,
    },
    purchaseButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
    },
    purchaseButtonDisabled: {
        opacity: 0.7,
    },
    purchaseButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    purchaseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    restoreButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    restoreButtonText: {
        fontSize: 14,
        color: COLORS.text.secondary,
    },
    unavailableContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background.light,
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    unavailableText: {
        fontSize: 13,
        color: COLORS.text.muted,
    },
    legalSection: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    legalText: {
        fontSize: 11,
        color: COLORS.text.muted,
        textAlign: 'center',
    },
    legalLink: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    legalNote: {
        fontSize: 11,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    premiumActiveContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    premiumActiveCard: {
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        gap: 12,
    },
    premiumActiveTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    premiumActiveDescription: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    manageButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    manageButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text.primary,
    },
});
