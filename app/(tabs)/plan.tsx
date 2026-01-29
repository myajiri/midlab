import { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    useAppStore,
    useCurrentEtp,
    useCurrentLimiter,
    type TrainingPlan,
    type WeeklyPlan,
} from '../../store/useAppStore';
import { ZONE_COEFFICIENTS, PHASE_CONFIG, LIMITER_CONFIG, type ZoneKey, type PhaseType } from '../../constants';
import { formatKmPace, calculateZones, generatePlan, parseTimeInput, formatTime } from '../../utils/calculations';

// ============================================
// ユーティリティ関数
// ============================================

const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

const getWeekDayJa = (dayOfWeek: number) => {
    return ['月', '火', '水', '木', '金', '土', '日'][dayOfWeek];
};

const getCurrentWeek = (plan: TrainingPlan): number => {
    const now = new Date();
    for (const week of plan.weeklyPlans) {
        const start = new Date(week.startDate);
        const end = new Date(week.endDate);
        if (now >= start && now <= end) {
            return week.weekNumber;
        }
    }
    return 1;
};

// ============================================
// フェーズバーコンポーネント
// ============================================

interface PhaseBarProps {
    phases: TrainingPlan['phases'];
    currentWeek: number;
    totalWeeks: number;
}

const PhaseBar = ({ phases, currentWeek, totalWeeks }: PhaseBarProps) => {
    if (!phases || phases.length === 0) return null;

    let accumulated = 0;

    return (
        <View style={styles.phaseBarContainer}>
            <View style={styles.phaseBar}>
                {phases.map((phase, i) => {
                    const width = (phase.weeks / totalWeeks) * 100;
                    const isPast = accumulated + phase.weeks < currentWeek;
                    const isCurrent = currentWeek >= phase.startWeek && currentWeek <= phase.endWeek;
                    accumulated += phase.weeks;

                    return (
                        <View
                            key={i}
                            style={[
                                styles.phaseSegment,
                                {
                                    width: `${width}%`,
                                    backgroundColor: isPast || isCurrent
                                        ? PHASE_CONFIG[phase.type].color
                                        : 'rgba(255,255,255,0.1)',
                                    borderWidth: isCurrent ? 2 : 0,
                                    borderColor: '#fff',
                                },
                            ]}
                        >
                            {width > 15 && (
                                <Text style={styles.phaseLabel}>{PHASE_CONFIG[phase.type].name}</Text>
                            )}
                        </View>
                    );
                })}
            </View>
            {/* 現在週マーカー */}
            <View style={[styles.currentWeekMarker, { left: `${((currentWeek - 0.5) / totalWeeks) * 100}%` }]}>
                <View style={styles.markerArrow} />
            </View>
        </View>
    );
};

// ============================================
// 週カードコンポーネント
// ============================================

interface WeekCardProps {
    week: WeeklyPlan;
    isCurrentWeek: boolean;
    onPress: () => void;
    zones: Record<ZoneKey, number>;
}

const WeekCard = ({ week, isCurrentWeek, onPress, zones }: WeekCardProps) => {
    const phase = PHASE_CONFIG[week.phaseType];

    return (
        <TouchableOpacity
            style={[
                styles.weekCard,
                isCurrentWeek && styles.weekCardCurrent,
                { borderLeftColor: phase.color },
            ]}
            onPress={onPress}
        >
            <View style={styles.weekHeader}>
                <View style={styles.weekTitle}>
                    <Text style={styles.weekNumber}>第{week.weekNumber}週</Text>
                    <View style={[styles.phaseBadge, { backgroundColor: phase.color + '30' }]}>
                        <Text style={[styles.phaseBadgeText, { color: phase.color }]}>{phase.name}</Text>
                    </View>
                    {week.isRecoveryWeek && (
                        <View style={styles.recoveryBadge}>
                            <Text style={styles.recoveryBadgeText}>🔄 回復週</Text>
                        </View>
                    )}
                    {week.isRiseTestWeek && (
                        <View style={styles.testBadge}>
                            <Text style={styles.testBadgeText}>📊 Test</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.weekDistance}>{Math.round(week.targetDistance / 1000)}km</Text>
            </View>
            <View style={styles.weekDays}>
                {week.days.map((day, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dayDot,
                            day.isKey && styles.dayDotKey,
                            day.completed && styles.dayDotCompleted,
                            day.type === 'rest' && styles.dayDotRest,
                        ]}
                    >
                        <Text style={styles.dayDotText}>{getWeekDayJa(day.dayOfWeek)}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
};

// ============================================
// 計画作成フォーム
// ============================================

interface CreatePlanFormProps {
    etp: number;
    limiter: string;
    onCreatePlan: (plan: TrainingPlan) => void;
}

const CreatePlanForm = ({ etp, limiter, onCreatePlan }: CreatePlanFormProps) => {
    const [raceName, setRaceName] = useState('');
    const [raceDate, setRaceDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [raceDistance, setRaceDistance] = useState<800 | 1500 | 3000 | 5000>(1500);
    const [targetTime, setTargetTime] = useState('');

    const weeksUntilRace = useMemo(() => {
        const now = new Date();
        const diff = raceDate.getTime() - now.getTime();
        return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
    }, [raceDate]);

    const handleCreatePlan = () => {
        const targetSeconds = parseTimeInput(targetTime);
        if (!raceName.trim()) {
            Alert.alert('エラー', 'レース名を入力してください');
            return;
        }
        if (!targetSeconds) {
            Alert.alert('エラー', '目標タイムを MM:SS 形式で入力してください');
            return;
        }
        if (weeksUntilRace < 2) {
            Alert.alert('エラー', 'レース日は少なくとも2週間後を選択してください');
            return;
        }

        const plan = generatePlan({
            race: {
                name: raceName,
                date: raceDate.toISOString(),
                distance: raceDistance,
                targetTime: targetSeconds,
            },
            baseline: { etp, limiterType: limiter as any },
            weeksUntilRace,
        });

        onCreatePlan(plan);
    };

    return (
        <View style={styles.createForm}>
            <Text style={styles.formTitle}>🎯 レース計画を作成</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>レース名</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="〇〇記録会"
                    placeholderTextColor="#666"
                    value={raceName}
                    onChangeText={setRaceName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>レース日</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.dateButtonText}>
                        {raceDate.getFullYear()}年{raceDate.getMonth() + 1}月{raceDate.getDate()}日
                        ({weeksUntilRace}週間後)
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={raceDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_event: any, date?: Date) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (date) setRaceDate(date);
                        }}
                        minimumDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
                        themeVariant="dark"
                    />
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>種目</Text>
                <View style={styles.distanceButtons}>
                    {([800, 1500, 3000, 5000] as const).map((d) => (
                        <TouchableOpacity
                            key={d}
                            style={[
                                styles.distanceButton,
                                raceDistance === d && styles.distanceButtonActive,
                            ]}
                            onPress={() => setRaceDistance(d)}
                        >
                            <Text
                                style={[
                                    styles.distanceButtonText,
                                    raceDistance === d && styles.distanceButtonTextActive,
                                ]}
                            >
                                {d}m
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>目標タイム (MM:SS)</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="4:15"
                    placeholderTextColor="#666"
                    value={targetTime}
                    onChangeText={setTargetTime}
                    keyboardType="numbers-and-punctuation"
                />
            </View>

            <View style={styles.currentStatus}>
                <Text style={styles.currentStatusLabel}>現在の状態</Text>
                <Text style={styles.currentStatusValue}>
                    eTP: {etp}秒 ({formatKmPace(etp)})
                </Text>
                <Text style={styles.currentStatusValue}>
                    リミッター: {LIMITER_CONFIG[limiter as keyof typeof LIMITER_CONFIG]?.name || 'バランス型'}
                </Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreatePlan}>
                <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createButtonGradient}
                >
                    <Text style={styles.createButtonText}>📅 計画を生成</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// ============================================
// メインコンポーネント
// ============================================

export default function PlanScreen() {
    const router = useRouter();
    const currentEtp = useCurrentEtp();
    const currentLimiter = useCurrentLimiter();
    const activePlan = useAppStore((state) => state.activePlan);
    const setActivePlan = useAppStore((state) => state.setActivePlan);
    const updateDayCompletion = useAppStore((state) => state.updateDayCompletion);
    const hasTestResult = currentEtp !== null;

    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'create'>('overview');

    // 現在週を計算
    const currentWeek = useMemo(() => {
        if (!activePlan) return 1;
        return getCurrentWeek(activePlan);
    }, [activePlan]);

    // ゾーンペース計算
    const etp = currentEtp ?? 95;
    const limiter = currentLimiter ?? 'balanced';
    const zones = calculateZones(etp, limiter);

    // 計画がない場合は作成モード
    useEffect(() => {
        if (!activePlan && hasTestResult) {
            setViewMode('create');
        } else if (activePlan) {
            setViewMode('overview');
        }
    }, [activePlan, hasTestResult]);

    const handleCreatePlan = (plan: TrainingPlan) => {
        setActivePlan(plan);
        setViewMode('overview');
        Alert.alert('計画作成完了', `${plan.weeklyPlans.length}週間のトレーニング計画を作成しました！`);
    };

    const handleDeletePlan = () => {
        Alert.alert(
            '計画を削除',
            '現在の計画を削除しますか？この操作は取り消せません。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除',
                    style: 'destructive',
                    onPress: () => {
                        setActivePlan(null);
                        setViewMode('create');
                    },
                },
            ]
        );
    };

    const selectedWeekData = useMemo(() => {
        if (!activePlan || selectedWeek === null) return null;
        return activePlan.weeklyPlans.find((w) => w.weekNumber === selectedWeek);
    }, [activePlan, selectedWeek]);

    // テスト未実施の場合
    if (!hasTestResult) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <Text style={styles.title}>トレーニング計画</Text>
                    </View>
                    <View style={styles.noResultCard}>
                        <Text style={styles.noResultTitle}>⚠️ テスト未実施</Text>
                        <Text style={styles.noResultText}>
                            計画を作成するにはまずRISE Testを実施してください。
                        </Text>
                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={() => router.push('/(tabs)/test')}
                        >
                            <Text style={styles.testButtonText}>テスト画面へ</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 計画作成モード
    if (viewMode === 'create' || !activePlan) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <Text style={styles.title}>トレーニング計画</Text>
                    </View>
                    <CreatePlanForm etp={etp} limiter={limiter} onCreatePlan={handleCreatePlan} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 週詳細モード
    if (viewMode === 'detail' && selectedWeekData) {
        const phase = PHASE_CONFIG[selectedWeekData.phaseType];
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setViewMode('overview')}>
                            <Text style={styles.backButton}>← 戻る</Text>
                        </TouchableOpacity>
                        <Text style={styles.detailTitle}>
                            第{selectedWeekData.weekNumber}週 ({phase.name})
                        </Text>
                    </View>

                    <View style={styles.weekMeta}>
                        <Text style={styles.weekMetaText}>
                            📅 {formatDateShort(selectedWeekData.startDate)} - {formatDateShort(selectedWeekData.endDate)}
                        </Text>
                        <Text style={styles.weekMetaText}>
                            📏 目標: {Math.round(selectedWeekData.targetDistance / 1000)}km
                        </Text>
                        <Text style={styles.weekMetaText}>
                            📊 負荷: {selectedWeekData.loadPercent}%
                        </Text>
                    </View>

                    <View style={styles.daysList}>
                        {selectedWeekData.days.map((day, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.dayItem,
                                    day.isKey && styles.dayItemKey,
                                    day.completed && styles.dayItemCompleted,
                                ]}
                                onPress={() => {
                                    updateDayCompletion(selectedWeekData.weekNumber, day.dayOfWeek, !day.completed);
                                }}
                            >
                                <View style={styles.dayItemLeft}>
                                    <Text style={[styles.dayItemDay, day.completed && styles.dayItemDayCompleted]}>
                                        {getWeekDayJa(day.dayOfWeek)}
                                    </Text>
                                    <View>
                                        <Text style={[styles.dayItemLabel, day.completed && styles.dayItemLabelCompleted]}>
                                            {day.label}
                                        </Text>
                                        {day.focusCategory && (
                                            <Text style={styles.dayItemCategory}>{day.focusCategory}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.dayItemRight}>
                                    {day.isKey && <Text style={styles.keyBadge}>Key</Text>}
                                    <Text style={styles.checkMark}>{day.completed ? '✅' : '⬜'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 計画概要モード
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>トレーニング計画</Text>
                        <Text style={styles.subtitle}>
                            🎯 {activePlan.race.name} ({formatTime(activePlan.race.targetTime)})
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleDeletePlan}>
                        <Text style={styles.deleteButton}>🗑️</Text>
                    </TouchableOpacity>
                </View>

                {/* フェーズバー */}
                <View style={styles.phaseSection}>
                    <Text style={styles.sectionTitle}>期分け</Text>
                    <PhaseBar
                        phases={activePlan.phases}
                        currentWeek={currentWeek}
                        totalWeeks={activePlan.weeklyPlans.length}
                    />
                    <View style={styles.phaseInfo}>
                        {activePlan.phases.map((phase, i) => (
                            <View key={i} style={styles.phaseInfoItem}>
                                <View style={[styles.phaseInfoDot, { backgroundColor: PHASE_CONFIG[phase.type].color }]} />
                                <Text style={styles.phaseInfoText}>
                                    {PHASE_CONFIG[phase.type].name} {phase.weeks}週
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 週一覧 */}
                <View style={styles.weeksSection}>
                    <Text style={styles.sectionTitle}>
                        全体計画 ({activePlan.weeklyPlans.length}週間)
                    </Text>
                    {activePlan.weeklyPlans.map((week) => (
                        <WeekCard
                            key={week.weekNumber}
                            week={week}
                            isCurrentWeek={week.weekNumber === currentWeek}
                            zones={zones}
                            onPress={() => {
                                setSelectedWeek(week.weekNumber);
                                setViewMode('detail');
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.newPlanButton}
                    onPress={() => setViewMode('create')}
                >
                    <Text style={styles.newPlanButtonText}>+ 新しい計画を作成</Text>
                </TouchableOpacity>

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
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
    deleteButton: {
        fontSize: 24,
        padding: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
    },

    // テスト未実施
    noResultCard: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    noResultTitle: {
        color: '#EAB308',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    noResultText: {
        color: '#9ca3af',
        fontSize: 14,
        marginBottom: 16,
    },
    testButton: {
        backgroundColor: '#EAB308',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    testButtonText: {
        color: '#000',
        fontWeight: '600',
    },

    // 計画作成フォーム
    createForm: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 20,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#9ca3af',
        fontSize: 14,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dateButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dateButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    distanceButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    distanceButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    distanceButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    distanceButtonText: {
        color: '#9ca3af',
        fontWeight: '500',
    },
    distanceButtonTextActive: {
        color: '#fff',
    },
    currentStatus: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    currentStatusLabel: {
        color: '#6b7280',
        fontSize: 13,
        marginBottom: 4,
    },
    currentStatusValue: {
        color: '#d1d5db',
        fontSize: 14,
    },
    createButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    createButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // フェーズバー
    phaseSection: {
        marginBottom: 24,
    },
    phaseBarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    phaseBar: {
        flexDirection: 'row',
        height: 40,
        borderRadius: 8,
        overflow: 'hidden',
    },
    phaseSegment: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    phaseLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    currentWeekMarker: {
        position: 'absolute',
        bottom: -8,
        transform: [{ translateX: -6 }],
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#fff',
    },
    phaseInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    phaseInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    phaseInfoDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    phaseInfoText: {
        color: '#9ca3af',
        fontSize: 12,
    },

    // 週一覧
    weeksSection: {
        marginBottom: 20,
    },
    weekCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    weekCardCurrent: {
        backgroundColor: 'rgba(249,115,22,0.15)',
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    weekTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weekNumber: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    weekDistance: {
        color: '#9ca3af',
        fontSize: 14,
    },
    phaseBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    phaseBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    recoveryBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    recoveryBadgeText: {
        color: '#3B82F6',
        fontSize: 10,
    },
    testBadge: {
        backgroundColor: 'rgba(34,197,94,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    testBadgeText: {
        color: '#22c55e',
        fontSize: 10,
    },
    weekDays: {
        flexDirection: 'row',
        gap: 6,
    },
    dayDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayDotKey: {
        backgroundColor: 'rgba(249,115,22,0.3)',
    },
    dayDotCompleted: {
        backgroundColor: 'rgba(34,197,94,0.3)',
    },
    dayDotRest: {
        opacity: 0.5,
    },
    dayDotText: {
        color: '#9ca3af',
        fontSize: 11,
    },

    // 週詳細
    detailHeader: {
        marginTop: 20,
        marginBottom: 20,
    },
    backButton: {
        color: '#3B82F6',
        fontSize: 16,
        marginBottom: 8,
    },
    detailTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    weekMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
    },
    weekMetaText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    daysList: {
        gap: 8,
    },
    dayItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayItemKey: {
        borderLeftWidth: 3,
        borderLeftColor: '#F97316',
    },
    dayItemCompleted: {
        opacity: 0.6,
    },
    dayItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dayItemDay: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        width: 24,
    },
    dayItemDayCompleted: {
        textDecorationLine: 'line-through',
    },
    dayItemLabel: {
        color: '#fff',
        fontSize: 15,
    },
    dayItemLabelCompleted: {
        textDecorationLine: 'line-through',
        color: '#9ca3af',
    },
    dayItemCategory: {
        color: '#6b7280',
        fontSize: 12,
    },
    dayItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    keyBadge: {
        backgroundColor: '#F97316',
        color: '#fff',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    checkMark: {
        fontSize: 18,
    },

    // その他
    newPlanButton: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    newPlanButtonText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    bottomSpacer: {
        height: 100,
    },
});
