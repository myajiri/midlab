import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, useProfile, useCurrentEtp, useCurrentLimiter, type TrainingPlan, type WeeklyPlan, type DaySchedule } from '../../store/useAppStore';
import { LIMITER_CONFIG, ZONE_COEFFICIENTS, LIMITER_RACE_ADJUSTMENTS, type LimiterType, type ZoneKey } from '../../constants';
import { formatKmPace, estimateVO2max, calculateZones, formatTime, getLevelFromEtp } from '../../utils/calculations';
import { useRef, useCallback } from 'react';

// ============================================
// アニメーション付きカードコンポーネント
// ============================================

interface AnimatedCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: any;
}

const AnimatedCard = ({ children, onPress, style }: AnimatedCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    }, [scaleAnim]);

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// メインコンポーネント
// ============================================

export default function HomeScreen() {
    const router = useRouter();

    // Zustandストアから取得
    const profile = useProfile();
    const currentEtp = useCurrentEtp();
    const currentLimiter = useCurrentLimiter();
    const activePlan = useAppStore((state) => state.activePlan);
    const workoutLogs = useAppStore((state) => state.workoutLogs);

    // デフォルト値
    const etp = currentEtp ?? 95;
    const limiterType: LimiterType = currentLimiter ?? 'balanced';
    const limiter = LIMITER_CONFIG[limiterType];
    const hasTestResult = currentEtp !== null;

    // VO2max・レベル
    const vo2max = estimateVO2max(etp);
    const level = getLevelFromEtp(etp);

    // 今日の日付
    const today = new Date();
    const todayStr = today.toDateString();
    const dayOfWeek = today.getDay();

    // 今日のワークアウトを取得
    const getTodayWorkout = (): DaySchedule | null => {
        if (!activePlan) return null;
        // 現在の週を探す
        const currentWeek = activePlan.weeklyPlans.find((w: WeeklyPlan) => {
            const weekStart = new Date(w.startDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return today >= weekStart && today <= weekEnd;
        });
        if (!currentWeek) return null;
        // 今日のスケジュール（日曜=0を日曜=6に変換）
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return currentWeek.days.find((d: DaySchedule) => d.dayOfWeek === dayIndex) ?? null;
    };

    const todayWorkout = getTodayWorkout();

    // 今週の進捗
    const getWeekProgress = () => {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const hasLog = workoutLogs.some(log => log.date.startsWith(dateStr));
            const isToday = i === dayOfWeek;
            days.push({ day: ['日', '月', '火', '水', '木', '金', '土'][i], done: hasLog, isToday });
        }
        return days;
    };

    const weekProgress = getWeekProgress();
    const completedCount = weekProgress.filter(d => d.done).length;

    // レースまでの日数
    const getDaysToRace = () => {
        if (!activePlan) return null;
        const raceDate = new Date(activePlan.race.date);
        const diff = Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : null;
    };

    const daysToRace = getDaysToRace();

    // ゾーン計算
    const zonesData = calculateZones(etp, limiterType);
    const zones = (Object.entries(ZONE_COEFFICIENTS) as [ZoneKey, { name: string; color: string }][]).map(
        ([key, config]) => ({
            key,
            name: config.name,
            color: config.color,
            pace400m: zonesData[key],
        })
    );

    // レース予測
    const racePredictions = [
        { distance: 800, label: '800m', laps: 2, coef: 0.835 },
        { distance: 1500, label: '1500m', laps: 3.75, coef: 0.90 },
        { distance: 3000, label: '3K', laps: 7.5, coef: 0.98 },
        { distance: 5000, label: '5K', laps: 12.5, coef: 1.02 },
    ].map(race => {
        const limiterAdj = LIMITER_RACE_ADJUSTMENTS[`m${race.distance}` as keyof typeof LIMITER_RACE_ADJUSTMENTS]?.[limiterType] || 0;
        const predictedTime = Math.round(etp * race.coef * race.laps + limiterAdj);
        return { ...race, time: predictedTime, formatted: formatTime(predictedTime) };
    });


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* ヘッダー */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>
                                {new Date().getHours() < 12 ? 'おはようございます' : new Date().getHours() < 18 ? 'こんにちは' : 'おつかれさまです'}
                            </Text>
                            <Text style={styles.userName}>{profile?.displayName || 'ランナー'}さん</Text>
                        </View>
                        {profile?.avatarUri ? (
                            <Image source={{ uri: profile.avatarUri }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerBadge, { backgroundColor: `${limiter.color}20`, borderColor: `${limiter.color}40` }]}>
                                <Text style={styles.headerBadgeIcon}>{limiter.icon}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* eTPステータス（コンパクト横並び） */}
                <View style={[styles.etpCompactContainer, { borderColor: `${limiter.color}30` }]}>
                    {/* 左: メインeTP */}
                    <View style={styles.etpCompactMain}>
                        <View style={[
                            styles.etpCompactCircle,
                            { borderColor: limiter.color, backgroundColor: `${limiter.color}20`, shadowColor: limiter.color }
                        ]}>
                            <Text style={styles.etpCompactValue}>{etp}</Text>
                        </View>
                        <View style={styles.etpCompactInfo}>
                            <Text style={styles.etpCompactLabel}>{hasTestResult ? 'eTP' : '推定eTP'}</Text>
                            <Text style={styles.etpCompactPace}>{formatKmPace(etp)}</Text>
                        </View>
                    </View>
                    {/* 右: サブ指標 */}
                    <View style={styles.etpCompactSubs}>
                        <View style={styles.etpCompactSubItem}>
                            <Text style={styles.etpCompactSubValue}>{level ?? '-'}</Text>
                            <Text style={styles.etpCompactSubLabel}>Lv</Text>
                        </View>
                        <View style={styles.etpCompactSubItem}>
                            <Text style={styles.etpCompactSubValue}>{vo2max ?? '-'}</Text>
                            <Text style={styles.etpCompactSubLabel}>VO2</Text>
                        </View>
                        <View style={styles.etpCompactSubItem}>
                            <Text style={[styles.etpCompactSubValue, { color: limiter.color }]}>{limiter.icon}</Text>
                            <Text style={styles.etpCompactSubLabel}>タイプ</Text>
                        </View>
                    </View>
                </View>

                {/* RISEテストCTA（マイページと統一デザイン） */}
                <TouchableOpacity style={styles.testCta} onPress={() => router.push('/test')}>
                    <Text style={styles.testCtaIcon}>🏃</Text>
                    <View style={styles.testCtaText}>
                        <Text style={styles.testCtaTitle}>テストを実施</Text>
                        <Text style={styles.testCtaDesc}>eTPとリミッターを測定</Text>
                    </View>
                    <Text style={styles.testCtaArrow}>→</Text>
                </TouchableOpacity>

                {/* テスト未実施時のガイドバナー */}
                {!hasTestResult && (
                    <TouchableOpacity
                        style={styles.testGuideCard}
                        onPress={() => router.push('/test')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['rgba(249, 115, 22, 0.15)', 'rgba(234, 88, 12, 0.25)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.testGuideGradient}
                        >
                            <View style={styles.testGuideHeader}>
                                <Text style={styles.testGuideIcon}>🎯</Text>
                                <Text style={styles.testGuideTitle}>まずはRISE Testを実施しよう</Text>
                            </View>
                            <Text style={styles.testGuideDescription}>
                                10〜15分のテストで持久力タイプを診断します
                            </Text>
                            <View style={styles.testGuideCta}>
                                <Text style={styles.testGuideCtaText}>テストを始める →</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* レースまでの日数 */}
                {daysToRace && (
                    <View style={styles.raceCountdown}>
                        <Text style={styles.raceCountdownLabel}>🏁 {activePlan?.race.name}</Text>
                        <Text style={styles.raceCountdownValue}>あと <Text style={styles.raceCountdownNumber}>{daysToRace}</Text> 日</Text>
                    </View>
                )}

                {/* 今日のワークアウト */}
                {todayWorkout ? (
                    <TouchableOpacity
                        style={styles.todayCard}
                        onPress={() => router.push('/(tabs)/plan')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['rgba(59, 130, 246, 0.15)', 'rgba(139, 92, 246, 0.15)']}
                            style={styles.todayCardGradient}
                        >
                            <Text style={styles.todayLabel}>📅 今日のワークアウト</Text>
                            {todayWorkout.type === 'rest' ? (
                                <View style={styles.todayContent}>
                                    <Text style={styles.todayRestIcon}>🛏</Text>
                                    <Text style={styles.todayRestText}>休養日</Text>
                                </View>
                            ) : (
                                <View style={styles.todayContent}>
                                    <Text style={styles.todayWorkoutName}>{todayWorkout.label}</Text>
                                </View>
                            )}
                            <Text style={styles.todayTapHint}>タップして詳細を見る →</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : hasTestResult && !activePlan ? (
                    <TouchableOpacity
                        style={styles.createPlanCard}
                        onPress={() => router.push('/(tabs)/plan')}
                    >
                        <Text style={styles.createPlanIcon}>📋</Text>
                        <View style={styles.createPlanText}>
                            <Text style={styles.createPlanTitle}>計画を作成しよう</Text>
                            <Text style={styles.createPlanDesc}>レース目標に向けたトレーニング計画を作成</Text>
                        </View>
                        <Text style={styles.createPlanArrow}>→</Text>
                    </TouchableOpacity>
                ) : null}

                {/* 今週の進捗 */}
                <View style={styles.weekProgressCard}>
                    <View style={styles.weekProgressHeader}>
                        <Text style={styles.weekProgressTitle}>📊 今週の進捗</Text>
                        <Text style={styles.weekProgressCount}>{completedCount}/7</Text>
                    </View>
                    <View style={styles.weekProgressDots}>
                        {weekProgress.map((day, i) => (
                            <View key={i} style={styles.weekProgressDay}>
                                <View style={[
                                    styles.weekProgressDot,
                                    day.done && styles.weekProgressDotDone,
                                    day.isToday && styles.weekProgressDotToday,
                                ]}>
                                    {day.done && <Text style={styles.weekProgressCheck}>✓</Text>}
                                </View>
                                <Text style={[styles.weekProgressDayLabel, day.isToday && styles.weekProgressDayLabelToday]}>
                                    {day.day}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>



                {/* 最近のワークアウト */}
                {workoutLogs.length > 0 && (
                    <View style={styles.recentSection}>
                        <Text style={styles.sectionTitle}>🏃 最近の記録</Text>
                        {workoutLogs.slice(0, 3).map((log) => {
                            const logDate = new Date(log.date);
                            const dateStr = `${logDate.getMonth() + 1}/${logDate.getDate()}`;
                            return (
                                <View key={log.id} style={styles.recentItem}>
                                    <Text style={styles.recentDate}>{dateStr}</Text>
                                    <Text style={styles.recentName}>{log.workoutName}</Text>
                                    <Text style={styles.recentCheck}>✓</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* レース予測（Bento Grid） */}
                <View style={styles.predictionsSection}>
                    <Text style={styles.sectionTitle}>🏁 レース予測</Text>
                    <View style={styles.bentoGrid}>
                        {racePredictions.map((race) => (
                            <View key={race.distance} style={styles.bentoCard}>
                                <Text style={styles.predictionDistance}>{race.label}</Text>
                                <Text style={styles.predictionTime}>{race.formatted}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* トレーニングゾーン */}
                <View style={styles.zonesSection}>
                    <Text style={styles.sectionTitle}>🎯 トレーニングゾーン</Text>
                    <View style={styles.zonesContainer}>
                        {zones.map((zone) => (
                            <View key={zone.key} style={styles.zoneRow}>
                                <View style={[styles.zoneIndicator, { backgroundColor: zone.color }]} />
                                <Text style={styles.zoneName}>{zone.name}</Text>
                                <Text style={styles.zonePace}>{zone.pace400m}秒 ({formatKmPace(zone.pace400m)})</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================================
// スタイル定義
// ============================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0f' },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    header: { marginTop: 16, marginBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 14, color: '#6b7280' },
    userName: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 2 },
    headerBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    headerBadgeIcon: { fontSize: 22 },
    headerAvatar: { width: 44, height: 44, borderRadius: 22 },

    // テストガイドバナー
    testGuideCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(249,115,22,0.4)' },
    testGuideGradient: { padding: 20 },
    testGuideHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    testGuideIcon: { fontSize: 22, marginRight: 8 },
    testGuideTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
    testGuideDescription: { fontSize: 13, color: '#d1d5db', marginBottom: 16 },
    testGuideCta: { backgroundColor: 'rgba(249,115,22,0.2)', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    testGuideCtaText: { color: '#F97316', fontSize: 15, fontWeight: '600' },

    // レースカウントダウン
    raceCountdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
    raceCountdownLabel: { color: '#22c55e', fontSize: 14, fontWeight: '500' },
    raceCountdownValue: { color: '#9ca3af', fontSize: 14 },
    raceCountdownNumber: { color: '#22c55e', fontSize: 22, fontWeight: '700' },

    // 今日のワークアウト
    todayCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
    todayCardGradient: { padding: 20 },
    todayLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 8 },
    todayContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    todayWorkoutName: { color: '#fff', fontSize: 20, fontWeight: '700' },
    todayWorkoutDistance: { color: '#60a5fa', fontSize: 16, marginLeft: 12 },
    todayRestIcon: { fontSize: 28, marginRight: 12 },
    todayRestText: { color: '#9ca3af', fontSize: 18 },
    todayTapHint: { color: '#6b7280', fontSize: 12 },

    // 計画作成カード
    createPlanCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
    createPlanIcon: { fontSize: 28, marginRight: 12 },
    createPlanText: { flex: 1 },
    createPlanTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
    createPlanDesc: { color: '#6b7280', fontSize: 12, marginTop: 2 },
    createPlanArrow: { color: '#8B5CF6', fontSize: 20 },

    // 進捗インジケータ
    weekProgressCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 16 },
    weekProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    weekProgressTitle: { color: '#9ca3af', fontSize: 13 },
    weekProgressCount: { color: '#6b7280', fontSize: 13 },
    weekProgressDots: { flexDirection: 'row', justifyContent: 'space-between' },
    weekProgressDay: { alignItems: 'center' },
    weekProgressDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    weekProgressDotDone: { backgroundColor: 'rgba(34,197,94,0.3)' },
    weekProgressDotToday: { borderWidth: 2, borderColor: '#3B82F6' },
    weekProgressCheck: { color: '#22c55e', fontSize: 14, fontWeight: '700' },
    weekProgressDayLabel: { color: '#6b7280', fontSize: 10 },
    weekProgressDayLabelToday: { color: '#3B82F6', fontWeight: '600' },

    // eTPコンパクト横並びレイアウト
    etpCompactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    etpCompactMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    etpCompactCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    etpCompactValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
    etpCompactInfo: { marginLeft: 12 },
    etpCompactLabel: { color: '#9ca3af', fontSize: 12 },
    etpCompactPace: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
    etpCompactSubs: {
        flexDirection: 'row',
        gap: 16,
    },
    etpCompactSubItem: { alignItems: 'center' },
    etpCompactSubValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
    etpCompactSubLabel: { color: '#6b7280', fontSize: 10, marginTop: 2 },

    // 最近のワークアウト
    recentSection: { marginBottom: 16 },
    sectionTitle: { color: '#9ca3af', fontSize: 13, marginBottom: 10 },
    recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, marginBottom: 6 },
    recentDate: { color: '#6b7280', fontSize: 12, width: 40 },
    recentName: { flex: 1, color: '#fff', fontSize: 13 },
    recentCheck: { color: '#22c55e', fontSize: 14 },

    // レース予測（Bento Grid）
    predictionsSection: { marginBottom: 20 },
    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    bentoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    predictionDistance: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
    predictionTime: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 6 },

    // トレーニングゾーン
    zonesSection: { marginBottom: 16 },
    zonesContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 },
    zoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    zoneIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    zoneName: { flex: 1, color: '#fff', fontSize: 13 },
    zonePace: { color: '#9ca3af', fontSize: 12 },

    // テストCTA（マイページと統一）
    testCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
    testCtaIcon: { fontSize: 24, marginRight: 12 },
    testCtaText: { flex: 1 },
    testCtaTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    testCtaDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    testCtaArrow: { color: '#3B82F6', fontSize: 20, fontWeight: '600' },

    bottomSpacer: { height: 40 },
});
