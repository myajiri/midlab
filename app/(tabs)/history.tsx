// ============================================
// Zone2Peak 履歴画面
// テスト結果一覧とeTP推移グラフ
// ============================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTestResults, useAppStore } from '../../store/useAppStore';
import { formatTime, formatKmPace, estimateVO2max } from '../../utils/calculations';
import { LIMITER_CONFIG } from '../../constants';

// ============================================
// eTP推移グラフコンポーネント
// ============================================

interface EtpChartProps {
    results: { date: string; etp: number }[];
}

const EtpChart = ({ results }: EtpChartProps) => {
    if (results.length === 0) return null;

    // 最新10件を逆順（古い順）に
    const data = results.slice(0, 10).reverse();
    const etpValues = data.map((r) => r.etp);
    const maxEtp = Math.max(...etpValues);
    const minEtp = Math.min(...etpValues);
    const range = maxEtp - minEtp || 10;

    // 高さを計算（0%〜100%）
    const getHeight = (etp: number) => {
        return 20 + ((maxEtp - etp) / range) * 60; // 低いほど高い位置（ペースが速い）
    };

    return (
        <View style={chartStyles.container}>
            <Text style={chartStyles.title}>📈 eTP推移</Text>
            <View style={chartStyles.chartArea}>
                {/* Y軸ラベル */}
                <View style={chartStyles.yAxis}>
                    <Text style={chartStyles.yLabel}>{formatKmPace(minEtp)}</Text>
                    <Text style={chartStyles.yLabelCenter}>速い</Text>
                    <Text style={chartStyles.yLabel}>{formatKmPace(maxEtp)}</Text>
                </View>

                {/* グラフ本体 */}
                <View style={chartStyles.chart}>
                    {data.map((item, index) => {
                        const height = getHeight(item.etp);
                        const date = new Date(item.date);
                        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

                        return (
                            <View key={item.date} style={chartStyles.barContainer}>
                                <View style={chartStyles.barWrapper}>
                                    <LinearGradient
                                        colors={['#3B82F6', '#8B5CF6']}
                                        style={[chartStyles.bar, { height: `${100 - height}%` }]}
                                    />
                                </View>
                                <Text style={chartStyles.barLabel}>{dateStr}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* 凡例 */}
            <View style={chartStyles.legend}>
                <Text style={chartStyles.legendText}>
                    最速: {formatKmPace(minEtp)} → 最新: {formatKmPace(data[data.length - 1]?.etp || 0)}
                </Text>
            </View>
        </View>
    );
};

const chartStyles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    chartArea: {
        flexDirection: 'row',
        height: 140,
    },
    yAxis: {
        width: 50,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 8,
        paddingBottom: 20,
    },
    yLabel: {
        color: '#6b7280',
        fontSize: 9,
    },
    yLabelCenter: {
        color: '#9ca3af',
        fontSize: 10,
    },
    chart: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        paddingBottom: 20,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        width: '100%',
        height: 100,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        color: '#6b7280',
        fontSize: 8,
        marginTop: 4,
    },
    legend: {
        marginTop: 12,
        alignItems: 'center',
    },
    legendText: {
        color: '#9ca3af',
        fontSize: 12,
    },
});

// ============================================
// 結果カードコンポーネント
// ============================================

interface ResultCardProps {
    result: {
        id: string;
        date: string;
        testType: string;
        etp: number;
        limiterType: string;
        limiterConfidence: string;
        level?: string;
        completedLaps?: number;
    };
    onDelete: (id: string) => void;
}

const ResultCard = ({ result, onDelete }: ResultCardProps) => {
    const date = new Date(result.date);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    const limiter = LIMITER_CONFIG[result.limiterType as keyof typeof LIMITER_CONFIG];
    const vo2max = estimateVO2max(result.etp);

    return (
        <View style={cardStyles.container}>
            <View style={cardStyles.header}>
                <Text style={cardStyles.date}>{dateStr}</Text>
                <View style={cardStyles.badge}>
                    <Text style={cardStyles.badgeText}>
                        {result.testType === 'rise' ? 'RISE' : 'Zone2Peak'}
                    </Text>
                </View>
            </View>

            <View style={cardStyles.mainRow}>
                <View style={cardStyles.etpSection}>
                    <Text style={cardStyles.etpLabel}>eTP</Text>
                    <Text style={cardStyles.etpValue}>{result.etp}秒</Text>
                    <Text style={cardStyles.etpPace}>{formatKmPace(result.etp)}</Text>
                </View>

                {vo2max && (
                    <View style={cardStyles.vo2Section}>
                        <Text style={cardStyles.vo2Label}>VO2max</Text>
                        <Text style={cardStyles.vo2Value}>{vo2max}</Text>
                    </View>
                )}

                <View style={cardStyles.limiterSection}>
                    <Text style={cardStyles.limiterIcon}>{limiter?.icon || '⚖️'}</Text>
                    <Text style={cardStyles.limiterName}>{limiter?.name || 'バランス型'}</Text>
                </View>
            </View>

            {result.testType === 'rise' && result.level && (
                <View style={cardStyles.detailRow}>
                    <Text style={cardStyles.detailText}>
                        レベル{result.level} / {result.completedLaps}周完走
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={cardStyles.deleteButton}
                onPress={() => onDelete(result.id)}
            >
                <Text style={cardStyles.deleteText}>削除</Text>
            </TouchableOpacity>
        </View>
    );
};

const cardStyles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    date: {
        color: '#9ca3af',
        fontSize: 13,
    },
    badge: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#60a5fa',
        fontSize: 11,
        fontWeight: '600',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    etpSection: {
        flex: 1,
    },
    etpLabel: {
        color: '#6b7280',
        fontSize: 11,
        marginBottom: 2,
    },
    etpValue: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
    },
    etpPace: {
        color: '#9ca3af',
        fontSize: 12,
    },
    vo2Section: {
        alignItems: 'center',
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    vo2Label: {
        color: '#6b7280',
        fontSize: 11,
        marginBottom: 2,
    },
    vo2Value: {
        color: '#22c55e',
        fontSize: 18,
        fontWeight: '700',
    },
    limiterSection: {
        alignItems: 'center',
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    limiterIcon: {
        fontSize: 24,
        marginBottom: 2,
    },
    limiterName: {
        color: '#9ca3af',
        fontSize: 10,
    },
    detailRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    detailText: {
        color: '#6b7280',
        fontSize: 12,
    },
    deleteButton: {
        position: 'absolute',
        top: 12,
        right: 60,
    },
    deleteText: {
        color: '#ef4444',
        fontSize: 12,
    },
});

// ============================================
// メイン画面
// ============================================

export default function HistoryScreen() {
    const testResults = useTestResults();
    const deleteTestResult = useAppStore((state) => state.deleteTestResult);

    const handleDelete = (id: string) => {
        deleteTestResult(id);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.title}>テスト履歴</Text>
                    <Text style={styles.subtitle}>
                        {testResults.length > 0
                            ? `${testResults.length}件のテスト結果`
                            : 'まだテスト結果がありません'}
                    </Text>
                </View>

                {/* eTP推移グラフ */}
                {testResults.length >= 2 && (
                    <EtpChart
                        results={testResults.map((r) => ({
                            date: r.date,
                            etp: r.etp,
                        }))}
                    />
                )}

                {/* 結果一覧 */}
                {testResults.length > 0 ? (
                    <View style={styles.resultsList}>
                        {testResults.map((result) => (
                            <ResultCard
                                key={result.id}
                                result={result}
                                onDelete={handleDelete}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📊</Text>
                        <Text style={styles.emptyTitle}>テスト結果がありません</Text>
                        <Text style={styles.emptyDesc}>
                            RISEテストを実施して、あなたのフィットネスレベルを測定しましょう
                        </Text>
                    </View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================================
// スタイル
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 14,
    },
    resultsList: {
        marginBottom: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyDesc: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomSpacer: {
        height: 40,
    },
});
