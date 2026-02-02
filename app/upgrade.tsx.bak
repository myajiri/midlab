// ============================================
// サブスクリプション購入画面
// ============================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSubscriptionStore, useIsPremium, useSubscriptionLoading, usePackages } from '../store/useSubscriptionStore';
import type { PurchasesPackage } from '../lib/purchases';

export default function UpgradeScreen() {
    const router = useRouter();
    const isPremium = useIsPremium();
    const loading = useSubscriptionLoading();
    const packages = usePackages();
    const { purchase, restore, refreshStatus } = useSubscriptionStore();

    useEffect(() => {
        refreshStatus();
    }, []);

    const handlePurchase = async (pkg: PurchasesPackage) => {
        const success = await purchase(pkg);
        if (success) {
            Alert.alert('🎉 購入完了', 'プレミアム会員になりました！', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
    };

    const handleRestore = async () => {
        const restored = await restore();
        if (restored) {
            Alert.alert('復元完了', '購入を復元しました', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } else {
            Alert.alert('復元', '復元可能な購入が見つかりませんでした');
        }
    };

    if (isPremium) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 戻る</Text>
                    </TouchableOpacity>
                    <View style={styles.premiumActive}>
                        <Text style={styles.premiumIcon}>👑</Text>
                        <Text style={styles.premiumTitle}>プレミアム会員</Text>
                        <Text style={styles.premiumDesc}>すべての機能をご利用いただけます</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← 戻る</Text>
                </TouchableOpacity>

                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.icon}>👑</Text>
                    <Text style={styles.title}>Zone2Peak Premium</Text>
                    <Text style={styles.subtitle}>
                        すべての機能をアンロックして、トレーニングを最大化
                    </Text>
                </View>

                {/* 特典リスト */}
                <View style={styles.featuresCard}>
                    <Text style={styles.featuresTitle}>プレミアム特典</Text>
                    {[
                        '✅ 無制限のRISEテスト',
                        '✅ 全ワークアウトメニュー',
                        '✅ 長期トレーニング計画',
                        '✅ 詳細な分析・レポート',
                        '✅ クラウドデータ同期',
                        '✅ 広告なし',
                    ].map((feature, i) => (
                        <Text key={i} style={styles.featureItem}>{feature}</Text>
                    ))}
                </View>

                {/* プラン選択 */}
                {loading ? (
                    <ActivityIndicator color="#F59E0B" size="large" style={{ marginVertical: 20 }} />
                ) : packages.length > 0 ? (
                    <View style={styles.plansContainer}>
                        {packages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.identifier}
                                style={styles.planCard}
                                onPress={() => handlePurchase(pkg)}
                            >
                                <LinearGradient
                                    colors={['rgba(245, 158, 11, 0.2)', 'rgba(234, 179, 8, 0.2)']}
                                    style={styles.planGradient}
                                >
                                    <Text style={styles.planTitle}>{pkg.product.title}</Text>
                                    <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                                    <Text style={styles.planDesc}>{pkg.product.description}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.plansContainer}>
                        {/* フォールバック: パッケージが取得できない場合のUI */}
                        <View style={styles.planCard}>
                            <LinearGradient
                                colors={['rgba(245, 158, 11, 0.2)', 'rgba(234, 179, 8, 0.2)']}
                                style={styles.planGradient}
                            >
                                <Text style={styles.planTitle}>月額プラン</Text>
                                <Text style={styles.planPrice}>¥980/月</Text>
                                <Text style={styles.planDesc}>いつでもキャンセル可能</Text>
                            </LinearGradient>
                        </View>
                        <View style={styles.planCard}>
                            <LinearGradient
                                colors={['rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)']}
                                style={styles.planGradient}
                            >
                                <View style={styles.bestValue}>
                                    <Text style={styles.bestValueText}>お得</Text>
                                </View>
                                <Text style={styles.planTitle}>年額プラン</Text>
                                <Text style={styles.planPrice}>¥7,800/年</Text>
                                <Text style={styles.planDesc}>2ヶ月分お得</Text>
                            </LinearGradient>
                        </View>
                    </View>
                )}

                {/* 復元ボタン */}
                <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
                    <Text style={styles.restoreText}>購入を復元</Text>
                </TouchableOpacity>

                {/* 利用規約 */}
                <Text style={styles.terms}>
                    購入すると利用規約とプライバシーポリシーに同意したことになります。
                    サブスクリプションは期間終了の24時間前までにキャンセルしない限り自動更新されます。
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 16,
        marginBottom: 16,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 56,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 22,
    },
    featuresCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    featureItem: {
        fontSize: 14,
        color: '#d1d5db',
        marginBottom: 8,
    },
    plansContainer: {
        gap: 12,
        marginBottom: 24,
    },
    planCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    planGradient: {
        padding: 20,
        alignItems: 'center',
    },
    planTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F59E0B',
        marginBottom: 4,
    },
    planDesc: {
        fontSize: 13,
        color: '#9ca3af',
    },
    bestValue: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bestValueText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    restoreButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    restoreText: {
        color: '#3B82F6',
        fontSize: 14,
    },
    terms: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 16,
    },
    premiumActive: {
        alignItems: 'center',
        marginTop: 60,
    },
    premiumIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    premiumTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F59E0B',
        marginBottom: 8,
    },
    premiumDesc: {
        fontSize: 15,
        color: '#9ca3af',
    },
});
