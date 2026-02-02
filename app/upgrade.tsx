// ============================================
// プレミアムアップグレード画面
// ============================================

import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    premium: '#F59E0B',
    success: '#22c55e',
    text: { primary: '#ffffff', secondary: '#a1a1aa', muted: '#71717a' },
};

// プレミアム機能リスト
const PREMIUM_FEATURES = [
    { icon: 'calendar-outline', title: '詳細なトレーニング計画', description: '目標レースに向けた最適な計画を自動生成' },
    { icon: 'create-outline', title: '計画の編集・カスタマイズ', description: 'あなたのスケジュールに合わせて調整' },
    { icon: 'fitness-outline', title: '全ワークアウトテンプレート', description: '8種類以上の専門的なワークアウト' },
    { icon: 'analytics-outline', title: 'レース予測の詳細表示', description: '5K〜マラソンまでの予測タイム' },
    { icon: 'trending-up-outline', title: '進捗グラフ・分析機能', description: 'eTPの推移とパフォーマンス分析' },
    { icon: 'time-outline', title: 'テスト履歴の詳細分析', description: '過去のテスト結果を比較・分析' },
];

export default function UpgradeScreen() {
    const router = useRouter();
    const isPremium = useIsPremium();
    const loading = useSubscriptionLoading();
    const packages = usePackages();
    const { purchase, restore } = useSubscriptionStore();
    const [restoring, setRestoring] = useState(false);

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
                        <Text style={styles.premiumActiveIcon}>👑</Text>
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>プレミアムにアップグレード</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* ヒーローセクション */}
                <LinearGradient
                    colors={['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.05)']}
                    style={styles.heroSection}
                >
                    <Text style={styles.heroIcon}>👑</Text>
                    <Text style={styles.heroTitle}>MidLab Premium</Text>
                    <Text style={styles.heroSubtitle}>
                        あなたのランニングを次のレベルへ
                    </Text>
                </LinearGradient>

                {/* 機能リスト */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>プレミアム機能</Text>
                    {PREMIUM_FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons
                                    name={feature.icon as any}
                                    size={24}
                                    color={COLORS.premium}
                                />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 価格セクション */}
                <View style={styles.pricingSection}>
                    <View style={styles.pricingCard}>
                        <View style={styles.pricingHeader}>
                            <Text style={styles.pricingTitle}>月額プラン</Text>
                            <View style={styles.trialBadge}>
                                <Text style={styles.trialBadgeText}>初回1週間無料</Text>
                            </View>
                        </View>
                        <View style={styles.pricingAmount}>
                            <Text style={styles.currency}>¥</Text>
                            <Text style={styles.price}>780</Text>
                            <Text style={styles.period}>/月</Text>
                        </View>
                        <Text style={styles.pricingNote}>
                            無料トライアル後、月額¥780で自動更新されます
                        </Text>
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
                            <Ionicons name="information-circle-outline" size={24} color={COLORS.text.muted} />
                            <Text style={styles.unavailableText}>
                                この環境では課金機能をご利用いただけません。{'\n'}
                                ネイティブビルドでお試しください。
                            </Text>
                        </View>
                    )}
                </View>

                {/* 利用規約・プライバシーポリシー */}
                <View style={styles.legalSection}>
                    <Text style={styles.legalText}>
                        購入を行うことで、
                        <Text style={styles.legalLink}> 利用規約 </Text>
                        および
                        <Text style={styles.legalLink}> プライバシーポリシー </Text>
                        に同意したことになります。
                    </Text>
                    <Text style={styles.legalNote}>
                        サブスクリプションは期間終了の24時間前までにキャンセルしない限り自動更新されます。
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingVertical: 12,
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
    },
    heroSection: {
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
    },
    heroIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
    featuresSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    featureContent: {
        flex: 1,
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: COLORS.text.secondary,
    },
    pricingSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    pricingCard: {
        backgroundColor: COLORS.background.light,
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: COLORS.premium,
    },
    pricingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    pricingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    trialBadge: {
        backgroundColor: COLORS.premium,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trialBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    pricingAmount: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    currency: {
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    price: {
        fontSize: 48,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    period: {
        fontSize: 16,
        color: COLORS.text.secondary,
        marginLeft: 4,
    },
    pricingNote: {
        fontSize: 13,
        color: COLORS.text.muted,
    },
    purchaseSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    purchaseButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    purchaseButtonDisabled: {
        opacity: 0.7,
    },
    purchaseButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    purchaseButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    restoreButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    restoreButtonText: {
        fontSize: 15,
        color: COLORS.text.secondary,
    },
    unavailableContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background.light,
        padding: 16,
        borderRadius: 12,
    },
    unavailableText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text.muted,
        marginLeft: 12,
        lineHeight: 18,
    },
    legalSection: {
        paddingHorizontal: 20,
    },
    legalText: {
        fontSize: 12,
        color: COLORS.text.muted,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 8,
    },
    legalLink: {
        color: COLORS.primary,
    },
    legalNote: {
        fontSize: 11,
        color: COLORS.text.muted,
        textAlign: 'center',
        lineHeight: 16,
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
    },
    premiumActiveIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    premiumActiveTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    premiumActiveDescription: {
        fontSize: 15,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    manageButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    manageButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text.primary,
    },
});
