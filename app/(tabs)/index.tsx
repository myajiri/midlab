import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, useProfile, useCurrentEtp, useCurrentLimiter } from '../../store/useAppStore';
import { LIMITER_CONFIG, ZONE_COEFFICIENTS, RACE_COEFFICIENTS, LIMITER_RACE_ADJUSTMENTS, type LimiterType, type ZoneKey } from '../../constants';
import { formatTime, formatKmPace, estimateVO2max, calculateZones } from '../../utils/calculations';

// ============================================
// メインコンポーネント
// ============================================

export default function HomeScreen() {
    const router = useRouter();

    // Zustandストアから取得
    const profile = useProfile();
    const currentEtp = useCurrentEtp();
    const currentLimiter = useCurrentLimiter();
    const getZones = useAppStore((state) => state.getZones);

    // デフォルト値（テスト未実施の場合）
    const etp = currentEtp ?? 95;
    const limiterType: LimiterType = currentLimiter ?? 'balanced';
    const limiter = LIMITER_CONFIG[limiterType];
    const hasTestResult = currentEtp !== null;

    // eTPからVO2maxを推定
    const vo2max = estimateVO2max(etp);

    // ゾーンペースを計算
    const zonesData = calculateZones(etp, limiterType);
    const zones = (Object.entries(ZONE_COEFFICIENTS) as [ZoneKey, { name: string; color: string }][]).map(
        ([key, config]) => ({
            key,
            name: config.name,
            color: config.color,
            pace400m: zonesData[key],
        })
    );

    // レース予測を計算（800m, 1500m, 3000m, 5000m）
    const racePredictions = [
        { distance: 800, label: '800m', laps: 2, coef: 0.835 },
        { distance: 1500, label: '1500m', laps: 3.75, coef: 0.90 },
        { distance: 3000, label: '3000m', laps: 7.5, coef: 0.98 },
        { distance: 5000, label: '5000m', laps: 12.5, coef: 1.02 },
    ].map(race => {
        const limiterAdj = LIMITER_RACE_ADJUSTMENTS[`m${race.distance}` as keyof typeof LIMITER_RACE_ADJUSTMENTS]?.[limiterType] || 0;
        const predictedTime = Math.round(etp * race.coef * race.laps + limiterAdj);
        return {
            ...race,
            time: predictedTime,
            formatted: formatTime(predictedTime),
        };
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>こんにちは、</Text>
                    <Text style={styles.userName}>{profile.displayName} さん</Text>
                </View>

                {/* テスト未実施の場合の通知 */}
                {!hasTestResult && (
                    <View style={styles.noResultCard}>
                        <Text style={styles.noResultText}>
                            ⚠️ まだテストを実施していません。下記は仮のデータです。
                        </Text>
                    </View>
                )}

                {/* eTP カード */}
                <View style={styles.etpCard}>
                    <LinearGradient
                        colors={['rgba(59, 130, 246, 0.15)', 'rgba(139, 92, 246, 0.15)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.etpGradient}
                    >
                        <Text style={styles.etpLabel}>
                            {hasTestResult ? '現在のeTP' : '仮のeTP'}
                        </Text>
                        <View style={styles.etpValueRow}>
                            <Text style={styles.etpValue}>{etp}</Text>
                            <Text style={styles.etpUnit}>秒/400m</Text>
                        </View>
                        <Text style={styles.etpKmPace}>{formatKmPace(etp)}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>推定VO2max</Text>
                                <Text style={styles.statValue}>{vo2max ?? '-'}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* レース予測 */}
                <View style={styles.predictionsSection}>
                    <Text style={styles.sectionTitle}>レース予測</Text>
                    <View style={styles.predictionsGrid}>
                        {racePredictions.map((race) => (
                            <View key={race.distance} style={styles.predictionCard}>
                                <Text style={styles.predictionDistance}>{race.label}</Text>
                                <Text style={styles.predictionTime}>{race.formatted}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* リミッタータイプ */}
                <View style={styles.limiterCard}>
                    <Text style={styles.sectionTitle}>持久力タイプ</Text>
                    <View style={styles.limiterContent}>
                        <Text style={styles.limiterIcon}>{limiter.icon}</Text>
                        <View style={styles.limiterInfo}>
                            <Text style={[styles.limiterName, { color: limiter.color }]}>
                                {limiter.name}
                            </Text>
                            <Text style={styles.limiterDescription}>
                                {limiter.description}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* トレーニングゾーン */}
                <View style={styles.zonesSection}>
                    <Text style={styles.sectionTitle}>トレーニングゾーン</Text>
                    <View style={styles.zonesContainer}>
                        {zones.map((zone) => (
                            <View key={zone.key} style={styles.zoneRow}>
                                <View style={[styles.zoneIndicator, { backgroundColor: zone.color }]} />
                                <Text style={styles.zoneName}>{zone.name}</Text>
                                <View style={styles.zonePaceContainer}>
                                    <Text style={styles.zonePace400}>{zone.pace400m}秒</Text>
                                    <Text style={styles.zonePaceKm}>{formatKmPace(zone.pace400m)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 最近のワークアウト */}
                {(() => {
                    const workoutLogs = useAppStore.getState().workoutLogs.slice(0, 3);
                    if (workoutLogs.length === 0) return null;

                    return (
                        <View style={styles.recentWorkouts}>
                            <Text style={styles.sectionTitle}>最近のワークアウト</Text>
                            {workoutLogs.map((log) => {
                                const logDate = new Date(log.date);
                                const dateStr = `${logDate.getMonth() + 1}/${logDate.getDate()}`;
                                return (
                                    <View key={log.id} style={styles.workoutLogItem}>
                                        <Text style={styles.workoutLogDate}>{dateStr}</Text>
                                        <Text style={styles.workoutLogName}>{log.workoutName}</Text>
                                        <Text style={styles.workoutLogBadge}>✓</Text>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })()}

                {/* テスト実施ボタン */}
                <TouchableOpacity
                    style={styles.testButton}
                    onPress={() => router.push('/test')}
                >
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.testButtonGradient}
                    >
                        <Text style={styles.testButtonText}>
                            {hasTestResult ? '🏃 再テストを実施' : '🏃 テストを実施'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* 下部の余白 */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================================
// スタイル定義
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
    greeting: {
        fontSize: 16,
        color: '#6b7280',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 4,
    },
    // テスト未実施通知
    noResultCard: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    noResultText: {
        color: '#EAB308',
        fontSize: 13,
        textAlign: 'center',
    },
    // eTPカード
    etpCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    etpGradient: {
        padding: 24,
    },
    etpLabel: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 8,
    },
    etpValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    etpValue: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    etpUnit: {
        fontSize: 16,
        color: '#6b7280',
        marginLeft: 8,
    },
    etpKmPace: {
        fontSize: 20,
        color: '#3B82F6',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
    },
    // レース予測
    predictionsSection: {
        marginBottom: 20,
    },
    predictionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    predictionCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    predictionDistance: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 4,
    },
    predictionTime: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
    },
    // リミッターカード
    limiterCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 16,
    },
    limiterContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    limiterIcon: {
        fontSize: 40,
        marginRight: 16,
    },
    limiterInfo: {
        flex: 1,
    },
    limiterName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    limiterDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    // トレーニングゾーン
    zonesSection: {
        marginBottom: 20,
    },
    zonesContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
    },
    zoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    zoneIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    zoneName: {
        flex: 1,
        fontSize: 15,
        color: '#ffffff',
        fontWeight: '500',
    },
    zonePaceContainer: {
        alignItems: 'flex-end',
    },
    zonePace400: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    zonePaceKm: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    // 最近のワークアウト
    recentWorkouts: {
        marginTop: 24,
    },
    workoutLogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    workoutLogDate: {
        width: 45,
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '500',
    },
    workoutLogName: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
    },
    workoutLogBadge: {
        color: '#22c55e',
        fontSize: 16,
        fontWeight: '600',
    },
    // テストボタン
    testButton: {
        marginTop: 8,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    testButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    testButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    bottomSpacer: {
        height: 40,
    },
});
