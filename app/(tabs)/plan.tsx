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
import { ZONE_COEFFICIENTS, PHASE_CONFIG, LIMITER_CONFIG, KEY_WORKOUTS_BY_PHASE, PHYSIOLOGICAL_FOCUS_CATEGORIES, type ZoneKey, type PhaseType, type FocusKey } from '../../constants';
import { formatKmPace, calculateZones, generatePlan, parseTimeInput, formatTime } from '../../utils/calculations';
import { SwipeBackView } from '../../components/SwipeBackView';
import { useSetSubScreenOpen } from '../../store/useUIStore';

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

    // 省略形ラベル
    const shortNames: Record<string, string> = {
        base: '基礎',
        build: '強化',
        peak: '試合',
        taper: 'TP',
    };

    return (
        <View style={styles.phaseBarContainer}>
            <View style={styles.phaseBar}>
                {phases.map((phase, i) => {
                    const width = (phase.weeks / totalWeeks) * 100;
                    const isPast = accumulated + phase.weeks < currentWeek;
                    const isCurrent = currentWeek >= phase.startWeek && currentWeek <= phase.endWeek;
                    const isFuture = !isPast && !isCurrent;
                    accumulated += phase.weeks;

                    // 幅に応じてラベルを選択
                    const label = width > 18 ? PHASE_CONFIG[phase.type].name : width > 8 ? shortNames[phase.type] : '';

                    return (
                        <View
                            key={i}
                            style={[
                                styles.phaseSegment,
                                {
                                    width: `${width}%`,
                                    backgroundColor: PHASE_CONFIG[phase.type].color,
                                    opacity: isFuture ? 0.5 : 1,
                                    borderWidth: isCurrent ? 2 : 0,
                                    borderColor: '#fff',
                                },
                            ]}
                        >
                            {label && (
                                <Text style={styles.phaseLabel}>{label}</Text>
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
// ゾーン配分バーコンポーネント (E/T/I/R)
// ============================================

interface DistributionBarProps {
    distribution?: { easy: number; threshold: number; vo2max: number; speed: number };
}

const DistributionBar = ({ distribution }: DistributionBarProps) => {
    if (!distribution) return null;

    const segments = [
        { key: 'easy', label: 'E', value: distribution.easy, color: '#3B82F6' },
        { key: 'threshold', label: 'T', value: distribution.threshold, color: '#EAB308' },
        { key: 'vo2max', label: 'I', value: distribution.vo2max, color: '#F97316' },
        { key: 'speed', label: 'R', value: distribution.speed, color: '#EF4444' },
    ];

    return (
        <View style={styles.distributionBar}>
            {segments.map((seg) => (
                <View
                    key={seg.key}
                    style={[
                        styles.distributionSegment,
                        { flex: seg.value || 1, backgroundColor: seg.color },
                    ]}
                >
                    {seg.value > 10 && (
                        <Text style={styles.distributionLabel}>
                            {seg.label} {seg.value}%
                        </Text>
                    )}
                </View>
            ))}
        </View>
    );
};

// ============================================
// 予実サマリーコンポーネント
// ============================================

interface BudgetActualSummaryProps {
    activePlan: TrainingPlan;
}

const BudgetActualSummary = ({ activePlan }: BudgetActualSummaryProps) => {
    // 予実サマリーを計算
    const summary = useMemo(() => {
        if (!activePlan?.weeklyPlans) return null;

        let totalPlanned = 0;
        let totalCompleted = 0;
        let keyWorkoutsPlanned = 0;
        let keyWorkoutsCompleted = 0;

        activePlan.weeklyPlans.forEach(week => {
            week.days.forEach(day => {
                if (day.type !== 'rest') {
                    totalPlanned++;
                    if (day.completed) totalCompleted++;
                    if (day.isKey) {
                        keyWorkoutsPlanned++;
                        if (day.completed) keyWorkoutsCompleted++;
                    }
                }
            });
        });

        return {
            totalPlanned,
            totalCompleted,
            keyWorkoutsPlanned,
            keyWorkoutsCompleted,
            completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
        };
    }, [activePlan]);

    if (!summary) return null;

    const rateColor = summary.completionRate >= 80 ? '#4ade80' : summary.completionRate >= 50 ? '#EAB308' : '#EF4444';

    return (
        <LinearGradient
            colors={['rgba(59, 130, 246, 0.15)', 'rgba(139, 92, 246, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
        >
            <Text style={styles.summaryTitle}>予実サマリー</Text>
            <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>全体達成率</Text>
                    <Text style={[styles.summaryValue, { color: rateColor }]}>
                        {summary.completionRate}%
                    </Text>
                    <Text style={styles.summarySubtext}>
                        {summary.totalCompleted} / {summary.totalPlanned} セッション
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>キーワークアウト</Text>
                    <Text style={[styles.summaryValue, { color: '#a78bfa' }]}>
                        {summary.keyWorkoutsCompleted}/{summary.keyWorkoutsPlanned}
                    </Text>
                    <Text style={styles.summarySubtext}>完了</Text>
                </View>
            </View>
            {/* プログレスバー */}
            <View style={styles.progressBarBg}>
                <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${summary.completionRate}%` }]}
                />
            </View>
        </LinearGradient>
    );
};

// ============================================
// トレーニングカレンダーコンポーネント
// ============================================

interface TrainingCalendarProps {
    activePlan: TrainingPlan;
    onSelectWeek: (weekNum: number) => void;
}

const TrainingCalendar = ({ activePlan, onSelectWeek }: TrainingCalendarProps) => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    // 月の日付を生成
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // 前月の日を埋める（月曜始まり）
        const startDayOfWeek = firstDay.getDay();
        const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        for (let i = adjustedStart - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({ date: d, isCurrentMonth: false });
        }

        // 当月の日
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // 次月の日を埋める
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
            }
        }

        return days;
    };

    // 特定の日のワークアウト計画を取得
    const getPlannedWorkout = (date: Date) => {
        if (!activePlan?.weeklyPlans) return null;

        for (const week of activePlan.weeklyPlans) {
            const weekStart = new Date(week.startDate);
            const weekEnd = new Date(week.endDate);

            if (date >= weekStart && date <= weekEnd) {
                const dayOfWeek = date.getDay();
                const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                return {
                    ...week.days[adjustedDayOfWeek],
                    phaseType: week.phaseType,
                    weekNumber: week.weekNumber,
                };
            }
        }
        return null;
    };

    const days = getDaysInMonth(selectedMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const changeMonth = (delta: number) => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + delta, 1));
    };

    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

    return (
        <View style={styles.calendarContainer}>
            {/* カレンダーヘッダー */}
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calendarNavBtn}>
                    <Text style={styles.calendarNavText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.calendarMonthText}>
                    {selectedMonth.getFullYear()}年 {selectedMonth.getMonth() + 1}月
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calendarNavBtn}>
                    <Text style={styles.calendarNavText}>→</Text>
                </TouchableOpacity>
            </View>

            {/* 曜日ヘッダー */}
            <View style={styles.calendarWeekHeader}>
                {dayNames.map((day, i) => (
                    <Text key={day} style={[styles.calendarDayName, i >= 5 && { color: '#EF4444' }]}>
                        {day}
                    </Text>
                ))}
            </View>

            {/* カレンダーグリッド */}
            <View style={styles.calendarGrid}>
                {days.map(({ date, isCurrentMonth }, i) => {
                    const planned = getPlannedWorkout(date);
                    const isToday = date.getTime() === today.getTime();
                    const phaseColor = planned ? PHASE_CONFIG[planned.phaseType]?.color : null;

                    return (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.calendarDay,
                                isToday && styles.calendarDayToday,
                                !isCurrentMonth && { opacity: 0.3 },
                                planned && { backgroundColor: `${phaseColor}15` },
                            ]}
                            onPress={() => planned && onSelectWeek(planned.weekNumber)}
                        >
                            <Text style={[
                                styles.calendarDayText,
                                isToday && { color: '#60a5fa', fontWeight: '700' },
                            ]}>
                                {date.getDate()}
                            </Text>
                            {planned && isCurrentMonth && (
                                <Text style={styles.calendarDayIcon}>
                                    {planned.type === 'workout' ? '🏃' : planned.type === 'long' ? '🏃‍♂️' : planned.type === 'rest' ? '😴' : '📋'}
                                </Text>
                            )}
                            {planned?.completed && (
                                <View style={styles.calendarCompleteMark}>
                                    <Text style={styles.calendarCompleteText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
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
    restDays: number[];
    onCreatePlan: (plan: TrainingPlan) => void;
}

const CreatePlanForm = ({ etp, limiter, restDays, onCreatePlan }: CreatePlanFormProps) => {
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
            restDays,
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
    const profile = useAppStore((state) => state.profile);
    const hasTestResult = currentEtp !== null;

    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'create' | 'full'>('overview');
    const setSubScreenOpen = useSetSubScreenOpen();

    // viewModeに応じてタブスワイプを制御
    useEffect(() => {
        // overview以外のモードの時はタブスワイプを無効化
        setSubScreenOpen(viewMode !== 'overview');
        return () => setSubScreenOpen(false);
    }, [viewMode, setSubScreenOpen]);

    // 現在週を計算
    const currentWeek = useMemo(() => {
        if (!activePlan) return 1;
        return getCurrentWeek(activePlan);
    }, [activePlan]);

    // ゾーンペース計算
    const etp = currentEtp ?? 95;
    const limiter = currentLimiter ?? 'balanced';
    const zones = calculateZones(etp, limiter);

    // 計画がない場合は作成モード（初回のみ）
    useEffect(() => {
        if (!activePlan && hasTestResult) {
            setViewMode('create');
        }
        // activePlanが存在する場合は現在のviewModeを維持（連続完了を可能にする）
    }, [hasTestResult]); // activePlanを依存から外す

    // 既存プランにテーパーフェーズがない場合はマイグレーション
    useEffect(() => {
        if (activePlan && activePlan.phases && activePlan.phases.length > 0) {
            const hasTaper = activePlan.phases.some(p => p.type === 'taper');
            if (!hasTaper) {
                console.log('Migration: Adding taper phase to existing plan');
                // 残り週数を計算（計画の総週数を使用）
                const totalWeeks = activePlan.weeklyPlans?.length || activePlan.phases.reduce((sum, p) => sum + p.weeks, 0);
                // phasesを再計算
                const newPlan = generatePlan({
                    race: activePlan.race,
                    baseline: { etp, limiterType: limiter },
                    weeksUntilRace: Math.max(4, totalWeeks),
                });
                console.log('Migration: New phases', newPlan.phases);
                // 既存のweeklyPlansを保持しつつphasesを更新
                setActivePlan({
                    ...activePlan,
                    phases: newPlan.phases,
                });
            }
        }
    }, [activePlan?.id]);

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
                    <CreatePlanForm etp={etp} limiter={limiter} restDays={profile.restDays || [2, 6]} onCreatePlan={handleCreatePlan} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 全体俯瞰モード
    if (viewMode === 'full') {
        return (
            <SwipeBackView onSwipeBack={() => setViewMode('overview')}>
                <SafeAreaView style={styles.container} edges={['top']}>
                    <ScrollView style={styles.scrollView}>
                        <View style={styles.detailHeader}>
                            <TouchableOpacity onPress={() => setViewMode('overview')}>
                                <Text style={styles.backButton}>← 戻る</Text>
                            </TouchableOpacity>
                            <Text style={styles.detailTitle}>
                                全体計画 ({activePlan.weeklyPlans.length}週間)
                            </Text>
                        </View>

                        {/* フェーズバー */}
                        <PhaseBar
                            phases={activePlan.phases}
                            currentWeek={currentWeek}
                            totalWeeks={activePlan.weeklyPlans.length}
                        />

                        {/* 週一覧（コンパクト） */}
                        <View style={styles.fullPlanList}>
                            {activePlan.weeklyPlans.map((week) => {
                                const phase = PHASE_CONFIG[week.phaseType];
                                const isCurrentWeek = week.weekNumber === currentWeek;
                                return (
                                    <TouchableOpacity
                                        key={week.weekNumber}
                                        style={[
                                            styles.fullPlanItem,
                                            isCurrentWeek && styles.fullPlanItemCurrent,
                                            { borderLeftColor: phase.color },
                                        ]}
                                        onPress={() => {
                                            setSelectedWeek(week.weekNumber);
                                            setViewMode('detail');
                                        }}
                                    >
                                        <Text style={styles.fullPlanWeekNum}>
                                            {isCurrentWeek && '→'}{week.weekNumber}
                                        </Text>
                                        <Text style={styles.fullPlanPhase}>{phase.name}</Text>
                                        <Text style={styles.fullPlanDistance}>
                                            {Math.round(week.targetDistance / 1000)}km
                                        </Text>
                                        {week.isRecoveryWeek && (
                                            <Text style={styles.fullPlanBadge}>🔄</Text>
                                        )}
                                        {week.isRiseTestWeek && (
                                            <Text style={styles.fullPlanBadge}>📊</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </SafeAreaView>
            </SwipeBackView>
        );
    }

    // 週詳細モード
    if (viewMode === 'detail' && selectedWeekData) {
        const phase = PHASE_CONFIG[selectedWeekData.phaseType];
        const currentPhase = activePlan.phases.find(
            (p) => selectedWeekData.weekNumber >= p.startWeek && selectedWeekData.weekNumber <= p.endWeek
        );
        const phaseWeek = currentPhase ? selectedWeekData.weekNumber - currentPhase.startWeek + 1 : 1;
        const phaseTotalWeeks = currentPhase?.weeks || 1;

        const handlePrevWeek = () => {
            if (selectedWeekData.weekNumber > 1) {
                setSelectedWeek(selectedWeekData.weekNumber - 1);
            }
        };

        const handleNextWeek = () => {
            if (selectedWeekData.weekNumber < activePlan.weeklyPlans.length) {
                setSelectedWeek(selectedWeekData.weekNumber + 1);
            }
        };

        return (
            <SwipeBackView onSwipeBack={() => setViewMode('overview')}>
                <SafeAreaView style={styles.container} edges={['top']}>
                    <ScrollView style={styles.scrollView}>
                        <View style={styles.detailHeader}>
                            <TouchableOpacity onPress={() => setViewMode('overview')}>
                                <Text style={styles.backButton}>← 戻る</Text>
                            </TouchableOpacity>
                            <Text style={styles.detailTitle}>
                                第{selectedWeekData.weekNumber}週 ({phase.name} {phaseWeek}/{phaseTotalWeeks}週目)
                            </Text>
                        </View>

                        {/* 日程 */}
                        <Text style={styles.weekDateRange}>
                            📅 {formatDateShort(selectedWeekData.startDate)} - {formatDateShort(selectedWeekData.endDate)}
                        </Text>

                        {/* 距離・負荷カード */}
                        <View style={styles.statsCards}>
                            <View style={styles.statsCard}>
                                <Text style={styles.statsCardLabel}>距離</Text>
                                <Text style={styles.statsCardValue}>
                                    {Math.round(selectedWeekData.targetDistance / 1000)}km
                                </Text>
                            </View>
                            <View style={styles.statsCard}>
                                <Text style={styles.statsCardLabel}>負荷</Text>
                                <Text style={styles.statsCardValue}>{selectedWeekData.loadPercent}%</Text>
                            </View>
                        </View>

                        {/* ゾーン配分バー */}
                        <DistributionBar distribution={(selectedWeekData as any).distribution} />

                        {/* この週のトレーニング焦点 */}
                        {KEY_WORKOUTS_BY_PHASE[selectedWeekData.phaseType] && (
                            <View style={styles.detailFocusSection}>
                                <Text style={styles.detailFocusSectionTitle}>🎯 この週のトレーニング焦点</Text>
                                <Text style={styles.detailFocusDescription}>
                                    {KEY_WORKOUTS_BY_PHASE[selectedWeekData.phaseType]?.description}
                                </Text>
                                <View style={styles.detailFocusIcons}>
                                    {KEY_WORKOUTS_BY_PHASE[selectedWeekData.phaseType]?.focusKeys.map((focusKey, idx) => {
                                        const focusInfo = PHYSIOLOGICAL_FOCUS_CATEGORIES[focusKey as FocusKey];
                                        if (!focusInfo) return null;
                                        return (
                                            <View key={idx} style={[styles.detailFocusItem, { backgroundColor: focusInfo.color + '20' }]}>
                                                <Text style={styles.detailFocusIcon}>{focusInfo.icon}</Text>
                                                <Text style={[styles.detailFocusName, { color: focusInfo.color }]}>{focusInfo.name}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* 日別スケジュール */}
                        <View style={styles.daysList}>
                            {selectedWeekData.days.map((day, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dayItem,
                                        day.isKey && styles.dayItemKey,
                                        day.completed && styles.dayItemCompleted,
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={styles.dayItemContent}
                                        onPress={() => {
                                            const category = day.focusCategory ? encodeURIComponent(day.focusCategory) : '';
                                            router.push(`/(tabs)/workout?category=${category}`);
                                        }}
                                    >
                                        <View style={styles.dayItemLeft}>
                                            <Text style={[styles.dayItemDay, day.completed && styles.dayItemDayCompleted]}>
                                                {getWeekDayJa(day.dayOfWeek)}
                                            </Text>
                                            {(() => {
                                                const focusInfo = day.focusKey ? PHYSIOLOGICAL_FOCUS_CATEGORIES[day.focusKey as FocusKey] : null;
                                                return focusInfo ? (
                                                    <Text style={{ fontSize: 16, marginRight: 8 }}>{focusInfo.icon}</Text>
                                                ) : null;
                                            })()}
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.dayItemLabel, day.completed && styles.dayItemLabelCompleted]}>
                                                    {day.label}
                                                </Text>
                                                {day.focusCategory && (
                                                    <Text style={styles.dayItemCategory}>{day.focusCategory}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.dayItemRight}>
                                        {day.isKey && <Text style={styles.keyBadge}>⭐</Text>}
                                        <TouchableOpacity
                                            onPress={() => {
                                                updateDayCompletion(selectedWeekData.weekNumber, day.dayOfWeek, !day.completed);
                                            }}
                                        >
                                            <Text style={styles.checkMark}>
                                                {day.completed ? '✅' : '⬜'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* 週ナビゲーション */}
                        <View style={styles.weekNav}>
                            <TouchableOpacity
                                style={[styles.weekNavButton, selectedWeekData.weekNumber <= 1 && styles.weekNavButtonDisabled]}
                                onPress={handlePrevWeek}
                                disabled={selectedWeekData.weekNumber <= 1}
                            >
                                <Text style={[styles.weekNavText, selectedWeekData.weekNumber <= 1 && styles.weekNavTextDisabled]}>
                                    ← 前週
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.weekNavButton, selectedWeekData.weekNumber >= activePlan.weeklyPlans.length && styles.weekNavButtonDisabled]}
                                onPress={handleNextWeek}
                                disabled={selectedWeekData.weekNumber >= activePlan.weeklyPlans.length}
                            >
                                <Text style={[styles.weekNavText, selectedWeekData.weekNumber >= activePlan.weeklyPlans.length && styles.weekNavTextDisabled]}>
                                    翌週 →
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </SafeAreaView>
            </SwipeBackView>
        );
    }

    // 計画概要モード
    const daysUntilRace = Math.ceil((new Date(activePlan.race.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const weeksUntilRace = Math.ceil(daysUntilRace / 7);
    const currentWeekPlan = activePlan.weeklyPlans[currentWeek - 1];
    const isRiseTestWeek = currentWeekPlan?.isRiseTestWeek;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>トレーニング計画</Text>
                    <TouchableOpacity onPress={handleDeletePlan}>
                        <Text style={styles.deleteButton}>🗑️</Text>
                    </TouchableOpacity>
                </View>

                {/* レースカウントダウンカード */}
                <LinearGradient
                    colors={['rgba(249,115,22,0.2)', 'rgba(234,179,8,0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.countdownCard}
                >
                    <Text style={styles.countdownRaceName}>🎯 {activePlan.race.name}</Text>
                    <Text style={styles.countdownDays}>
                        あと {daysUntilRace}日 ({weeksUntilRace}週間)
                    </Text>
                    <Text style={styles.countdownTarget}>
                        目標: {formatTime(activePlan.race.targetTime)}
                    </Text>
                </LinearGradient>

                {/* フェーズバー */}
                <View style={styles.phaseSection}>
                    <Text style={styles.sectionTitle}>フェーズ進捗</Text>
                    <PhaseBar
                        phases={activePlan.phases}
                        currentWeek={currentWeek}
                        totalWeeks={activePlan.weeklyPlans.length}
                    />
                    <Text style={styles.currentWeekLabel}>
                        現在: 第{currentWeek}週 / {currentWeekPlan ? PHASE_CONFIG[currentWeekPlan.phaseType].name : ''}
                    </Text>
                </View>

                {/* 今週のカード */}
                {currentWeekPlan && (
                    <View style={styles.thisWeekCard}>
                        <View style={styles.thisWeekHeader}>
                            <Text style={styles.thisWeekTitle}>
                                今週: {PHASE_CONFIG[currentWeekPlan.phaseType].name}
                            </Text>
                            <Text style={styles.thisWeekDistance}>
                                {Math.round(currentWeekPlan.targetDistance / 1000)}km
                            </Text>
                        </View>
                        {currentWeekPlan.isRecoveryWeek && (
                            <View style={styles.recoveryWeekBadge}>
                                <Text style={styles.recoveryWeekBadgeText}>🔄 回復週（超回復促進）</Text>
                            </View>
                        )}
                        <Text style={styles.thisWeekFocus}>
                            重点: {KEY_WORKOUTS_BY_PHASE[currentWeekPlan.phaseType]?.description || PHASE_CONFIG[currentWeekPlan.phaseType].name}
                        </Text>

                        {/* キーワークアウト */}
                        <View style={styles.keyWorkoutsBox}>
                            <Text style={styles.keyWorkoutsLabel}>🔥 今週のキーワークアウト</Text>
                            {currentWeekPlan.days.filter(d => d.isKey).map((d, i) => {
                                const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
                                const focusInfo = d.focusKey ? PHYSIOLOGICAL_FOCUS_CATEGORIES[d.focusKey as FocusKey] : null;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.keyWorkoutCard}
                                        onPress={() => {
                                            const category = d.focusCategory ? encodeURIComponent(d.focusCategory) : '';
                                            router.push(`/(tabs)/workout?category=${category}`);
                                        }}
                                    >
                                        <View style={[styles.keyWorkoutColorBar, { backgroundColor: focusInfo?.color || '#6b7280' }]} />
                                        <View style={styles.keyWorkoutCardContent}>
                                            <View style={styles.keyWorkoutCardHeader}>
                                                <Text style={styles.keyWorkoutDayBadge}>{dayNames[d.dayOfWeek]}</Text>
                                                <Text style={styles.keyWorkoutCardIcon}>{focusInfo?.icon || '🏃'}</Text>
                                                <Text style={styles.keyWorkoutCardName}>{d.label}</Text>
                                            </View>
                                            {focusInfo && (
                                                <Text style={styles.keyWorkoutCardDesc}>{focusInfo.description}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* RISE Test通知 */}
                {isRiseTestWeek && (
                    <TouchableOpacity
                        style={styles.riseTestBanner}
                        onPress={() => router.push('/(tabs)/test')}
                    >
                        <Text style={styles.riseTestBannerText}>
                            📊 今週はRISE Test推奨週です！タップしてテストを実施
                        </Text>
                    </TouchableOpacity>
                )}

                {/* アクションボタン */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            setSelectedWeek(currentWeek);
                            setViewMode('detail');
                        }}
                    >
                        <Text style={styles.actionButtonText}>今週の詳細</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setViewMode('full')}
                    >
                        <Text style={styles.actionButtonText}>全体を見る</Text>
                    </TouchableOpacity>
                </View>

                {/* 予実サマリー */}
                <BudgetActualSummary activePlan={activePlan} />

                {/* カレンダービュー */}
                <TrainingCalendar activePlan={activePlan} onSelectWeek={(weekNum) => {
                    setSelectedWeek(weekNum);
                    setViewMode('detail');
                }} />

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

    // 完了ボタン
    dayItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    arrowIcon: {
        color: '#6b7280',
        fontSize: 16,
        marginLeft: 8,
    },
    checkboxButton: {
        marginVertical: 8,
        padding: 8,
        alignItems: 'center',
    },
    checkboxIcon: {
        fontSize: 24,
    },

    // ゾーン配分バー
    distributionBar: {
        flexDirection: 'row',
        height: 28,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 16,
    },
    distributionSegment: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    distributionLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },

    // 距離・負荷カード
    weekDateRange: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    statsCards: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    statsCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
    },
    statsCardLabel: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 4,
    },
    statsCardValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },

    // 週ナビゲーション
    weekNav: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    weekNavButton: {
        flex: 1,
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        alignItems: 'center',
    },
    weekNavButtonDisabled: {
        opacity: 0.4,
    },
    weekNavText: {
        color: '#e8e8ed',
        fontSize: 14,
        fontWeight: '500',
    },
    weekNavTextDisabled: {
        color: '#666',
    },

    // レースカウントダウンカード
    countdownCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.3)',
    },
    countdownRaceName: {
        fontSize: 14,
        color: '#F97316',
        marginBottom: 4,
    },
    countdownDays: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    countdownTarget: {
        fontSize: 13,
        color: '#9ca3af',
    },

    // 現在週ラベル
    currentWeekLabel: {
        textAlign: 'center',
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 20,
    },

    // 今週のカード
    thisWeekCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: 18,
        marginBottom: 20,
    },
    thisWeekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    thisWeekTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    thisWeekDistance: {
        color: '#F97316',
        fontSize: 16,
        fontWeight: '700',
    },
    thisWeekFocus: {
        fontSize: 14,
        color: '#60A5FA',
        marginBottom: 12,
    },
    recoveryWeekBadge: {
        backgroundColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    recoveryWeekBadgeText: {
        fontSize: 12,
        color: '#10B981',
    },

    // キーワークアウト
    keyWorkoutsBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 12,
    },
    keyWorkoutsLabel: {
        fontSize: 12,
        color: '#F97316',
        marginBottom: 8,
    },
    keyWorkoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    keyWorkoutDay: {
        color: '#9ca3af',
        width: 20,
        fontSize: 14,
    },
    keyWorkoutLabel: {
        color: '#e8e8ed',
        fontSize: 14,
    },
    keyWorkoutContent: {
        flex: 1,
    },
    keyWorkoutDesc: {
        fontSize: 11,
        marginTop: 2,
        color: '#a1a1aa',
    },
    // 新しいカードスタイル
    keyWorkoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    keyWorkoutColorBar: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    keyWorkoutCardContent: {
        flex: 1,
    },
    keyWorkoutCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    keyWorkoutDayBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        color: '#e8e8ed',
        fontSize: 12,
        fontWeight: '600',
        overflow: 'hidden',
    },
    keyWorkoutCardIcon: {
        fontSize: 16,
    },
    keyWorkoutCardName: {
        color: '#e8e8ed',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    keyWorkoutCardDesc: {
        fontSize: 12,
        color: '#a1a1aa',
        marginTop: 4,
    },

    // RISE Test通知
    riseTestBanner: {
        backgroundColor: 'rgba(168,85,247,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.3)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    riseTestBannerText: {
        color: '#A855F7',
        fontSize: 14,
        textAlign: 'center',
    },

    // アクションボタン
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#e8e8ed',
        fontSize: 14,
        fontWeight: '500',
    },

    // 全体俯瞰モード
    fullPlanList: {
        marginTop: 16,
    },
    fullPlanItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 4,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        borderLeftWidth: 3,
    },
    fullPlanItemCurrent: {
        backgroundColor: 'rgba(249,115,22,0.1)',
    },
    fullPlanWeekNum: {
        width: 32,
        color: '#9ca3af',
        fontSize: 13,
    },
    fullPlanPhase: {
        flex: 1,
        color: '#e8e8ed',
        fontSize: 13,
    },
    fullPlanDistance: {
        width: 50,
        textAlign: 'right',
        color: '#F97316',
        fontSize: 13,
        fontWeight: '600',
    },
    fullPlanBadge: {
        marginLeft: 8,
        fontSize: 12,
    },

    // 予実サマリー
    summaryCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#666',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    summarySubtext: {
        fontSize: 11,
        color: '#888',
    },
    progressBarBg: {
        marginTop: 12,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },

    // カレンダー
    calendarContainer: {
        marginBottom: 20,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calendarNavBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    calendarNavText: {
        color: '#888',
        fontSize: 16,
    },
    calendarMonthText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e8e8ed',
    },
    calendarWeekHeader: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    calendarDayName: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        color: '#666',
        paddingVertical: 4,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 2,
    },
    calendarDayToday: {
        borderWidth: 2,
        borderColor: '#3b82f6',
    },
    calendarDayText: {
        fontSize: 12,
        color: '#e8e8ed',
    },
    calendarDayIcon: {
        fontSize: 8,
        marginTop: 2,
    },
    calendarCompleteMark: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ade80',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarCompleteText: {
        fontSize: 6,
        color: '#000',
    },

    // 週詳細のトレーニング焦点セクション
    detailFocusSection: {
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 16,
    },
    detailFocusSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e8e8ed',
        marginBottom: 8,
    },
    detailFocusDescription: {
        fontSize: 13,
        color: '#a1a1aa',
        marginBottom: 12,
    },
    detailFocusIcons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailFocusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 6,
    },
    detailFocusIcon: {
        fontSize: 16,
    },
    detailFocusName: {
        fontSize: 13,
        fontWeight: '500',
    },

    bottomSpacer: {
        height: 100,
    },
});
