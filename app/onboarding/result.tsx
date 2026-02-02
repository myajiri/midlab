// ============================================
// オンボーディング: 結果・完了画面
// ============================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useProfileStore, useSettingsStore } from '../../src/stores/useAppStore';
import { estimateVO2max, formatKmPace } from '../../src/utils';
import { LIMITER_CONFIG } from '../../constants';
import { LimiterType } from '../../src/types';

// Speed Index計算（PBから推定）
const calculateSpeedIndex = (pbs: Record<string, number | undefined>): number | null => {
    const short = pbs.m400 || pbs.m800;
    const long = pbs.m3000 || pbs.m5000;
    if (!short || !long) return null;
    return short / (long / (pbs.m5000 ? 12.5 : 7.5));
};

// Speed Indexからリミッター推定
const estimateLimiterFromSpeedIndex = (speedIndex: number | null): { type: LimiterType; confidence: 'high' | 'medium' | 'low' } => {
    if (!speedIndex) return { type: 'balanced', confidence: 'low' };
    if (speedIndex < 0.95) return { type: 'muscular', confidence: speedIndex < 0.9 ? 'high' : 'medium' };
    if (speedIndex > 1.05) return { type: 'cardio', confidence: speedIndex > 1.1 ? 'high' : 'medium' };
    return { type: 'balanced', confidence: 'medium' };
};

export default function OnboardingResult() {
    const router = useRouter();
    const profile = useProfileStore((state) => state.profile);
    const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

    // ストアに保存された推定値を使用（attributes.tsxで選択したリミッタータイプを保持）
    const estimatedEtp = profile.estimated?.etp || null;
    const userSelectedLimiter = profile.estimated?.limiterType || 'balanced';
    const vo2max = estimatedEtp ? estimateVO2max(estimatedEtp) : null;

    // 表示用にユーザーが選択したリミッタータイプを使用
    const limiterConfig = LIMITER_CONFIG[userSelectedLimiter];

    const handleComplete = () => {
        // 既にストアに保存されているので、オンボーディング完了フラグのみ設定
        setOnboardingComplete(true);
        router.replace('/(tabs)');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 戻る</Text>
                    </TouchableOpacity>
                    <Text style={styles.step}>3 / 3</Text>
                </View>

                <Text style={styles.title}>準備完了！</Text>
                <Text style={styles.subtitle}>
                    {estimatedEtp
                        ? 'PBから推定したあなたの初期データです'
                        : 'ランプテストを実施してあなたのデータを取得しましょう'}
                </Text>

                {estimatedEtp ? (
                    <>
                        {/* eTPカード */}
                        <View style={styles.etpCard}>
                            <LinearGradient
                                colors={['rgba(59, 130, 246, 0.15)', 'rgba(139, 92, 246, 0.15)']}
                                style={styles.etpGradient}
                            >
                                <Text style={styles.etpLabel}>推定eTP</Text>
                                <View style={styles.etpRow}>
                                    <Text style={styles.etpValue}>{estimatedEtp}</Text>
                                    <Text style={styles.etpUnit}>秒/400m</Text>
                                </View>
                                <Text style={styles.etpPace}>{formatKmPace(estimatedEtp)}</Text>

                                {vo2max && (
                                    <View style={styles.vo2Section}>
                                        <Text style={styles.vo2Label}>推定VO2max</Text>
                                        <Text style={styles.vo2Value}>{vo2max}</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </View>

                        {/* リミッタータイプ */}
                        <View style={[styles.limiterCard, { borderColor: limiterConfig.color }]}>
                            <Text style={styles.limiterIcon}>{limiterConfig.icon}</Text>
                            <View style={styles.limiterInfo}>
                                <Text style={[styles.limiterName, { color: limiterConfig.color }]}>
                                    {limiterConfig.name}
                                </Text>
                                <Text style={styles.limiterDesc}>
                                    （選択したタイプ）
                                </Text>
                            </View>
                        </View>

                        <View style={styles.noteCard}>
                            <Text style={styles.noteText}>
                                💡 より正確なeTPとリミッター判定のために、ランプテストの実施をおすすめします
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.noDataCard}>
                        <Text style={styles.noDataIcon}>📊</Text>
                        <Text style={styles.noDataTitle}>データがありません</Text>
                        <Text style={styles.noDataText}>
                            ランプテストを実施すると、あなたの持久力タイプとトレーニングゾーンが判定されます
                        </Text>
                    </View>
                )}

                {/* 次のステップ */}
                <View style={styles.nextSteps}>
                    <Text style={styles.nextStepsTitle}>次のステップ</Text>
                    <View style={styles.stepItem}>
                        <Text style={styles.stepNumber}>1</Text>
                        <Text style={styles.stepText}>テストタブからランプテストを実施</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={styles.stepText}>ホームでトレーニングゾーンを確認</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <Text style={styles.stepNumber}>3</Text>
                        <Text style={styles.stepText}>メニュータブでワークアウトを選択</Text>
                    </View>
                </View>
            </ScrollView>

            {/* 完了ボタン */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                    <LinearGradient
                        colors={['#22c55e', '#16a34a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.completeButtonGradient}
                    >
                        <Text style={styles.completeButtonText}>アプリを始める</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
    },
    step: {
        color: '#6b7280',
        fontSize: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 32,
    },
    etpCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
    },
    etpGradient: {
        padding: 24,
        alignItems: 'center',
    },
    etpLabel: {
        color: '#6b7280',
        fontSize: 14,
        marginBottom: 8,
    },
    etpRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    etpValue: {
        fontSize: 48,
        fontWeight: '800',
        color: '#ffffff',
    },
    etpUnit: {
        fontSize: 16,
        color: '#9ca3af',
    },
    etpPace: {
        fontSize: 18,
        color: '#9ca3af',
        marginTop: 4,
    },
    vo2Section: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    vo2Label: {
        color: '#6b7280',
        fontSize: 13,
    },
    vo2Value: {
        color: '#22c55e',
        fontSize: 24,
        fontWeight: '700',
    },
    limiterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        marginBottom: 20,
    },
    limiterIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    limiterInfo: {
        flex: 1,
    },
    limiterName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    limiterDesc: {
        fontSize: 12,
        color: '#6b7280',
    },
    noteCard: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    noteText: {
        color: '#fbbf24',
        fontSize: 13,
        lineHeight: 20,
    },
    noDataCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 32,
        marginBottom: 24,
    },
    noDataIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noDataTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    noDataText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    nextSteps: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
    },
    nextStepsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 24,
        marginRight: 12,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#9ca3af',
    },
    buttonContainer: {
        padding: 24,
    },
    completeButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    completeButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
});
