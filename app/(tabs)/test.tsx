import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/useAppStore';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import {
    LEVELS,
    LIMITER_CONFIG,
    PACE_INCREMENT,
    ETP_COEFFICIENT,
    type LevelKey,
    type LimiterType
} from '../../constants';
import { formatTime, formatKmPace, calculateZones, calculatePredictions } from '../../utils/calculations';

const SWIPE_THRESHOLD = 80;

// ============================================
// RISE Test計算関数
// ============================================

// ラップスケジュール生成
const generateLapSchedule = (level: LevelKey) => {
    const config = LEVELS[level];
    const laps = [];
    for (let i = 0; i < config.maxLaps; i++) {
        const pace400m = config.startPace - i * PACE_INCREMENT;
        laps.push({
            lap: i + 1,
            pace400m,
            pace100m: (pace400m / 4).toFixed(1),
            kmPace: formatKmPace(pace400m),
        });
    }
    return laps;
};

// LCP（Last Completed Pace）計算
const calculateLCP = (level: LevelKey, completedLaps: number): number => {
    const config = LEVELS[level];
    return config.startPace - (completedLaps - 1) * PACE_INCREMENT;
};

// eTP計算
const calculateETP = (lcp: number): number => Math.round(lcp * ETP_COEFFICIENT);

// レベル調整（初回テスト用）
const adjustLevel = (level: LevelKey, isFirstTest: boolean): LevelKey => {
    if (!isFirstTest) return level;
    const order: LevelKey[] = ['SS', 'S', 'A', 'B', 'C'];
    const idx = order.indexOf(level);
    return order[Math.min(idx + 1, order.length - 1)];
};

// リミッター判定
type ReasonType = 'breath' | 'legs' | 'both' | 'other';
type RecoveryTime = '<30' | '30-60' | '>60';

const determineLimiter = (
    reason: ReasonType,
    q1: boolean,
    q2: boolean,
    q3: RecoveryTime
): { type: LimiterType; confidence: 'confirmed' | 'tentative' } => {
    if (reason === 'both') return { type: 'balanced', confidence: 'confirmed' };
    if (reason === 'breath') {
        return { type: 'cardio', confidence: q3 === '>60' ? 'confirmed' : 'tentative' };
    }
    if (reason === 'legs') {
        return { type: 'muscular', confidence: q1 && q2 ? 'confirmed' : 'tentative' };
    }
    return { type: 'balanced', confidence: 'tentative' };
};

// ============================================
// ランプテストグラフコンポーネント（Zwiftライク）
// ============================================

interface RampTestGraphProps {
    schedule: ReturnType<typeof generateLapSchedule>;
    levelConfig: typeof LEVELS[LevelKey];
}

const RampTestGraph = ({ schedule, levelConfig }: RampTestGraphProps) => {
    const maxPace = levelConfig.startPace; // 最も遅いペース
    const minPace = levelConfig.startPace - (schedule.length - 1) * PACE_INCREMENT; // 最も速いペース

    // ペースを高さに変換（速いほど高い）
    const getHeightPercent = (pace: number) => {
        // 最も遅いペースを30%、最も速いペースを100%とする
        const range = maxPace - minPace;
        const position = maxPace - pace;
        return 30 + (position / range) * 70;
    };

    // 強度に応じた色（速いほど赤く）
    const getColor = (index: number, total: number) => {
        const intensity = index / (total - 1); // 0 to 1
        if (intensity < 0.3) return '#22C55E'; // 緑
        if (intensity < 0.5) return '#EAB308'; // 黄
        if (intensity < 0.7) return '#F97316'; // オレンジ
        return '#EF4444'; // 赤
    };

    return (
        <View style={rampStyles.container}>
            <Text style={rampStyles.title}>🏔️ ランプテストプロファイル</Text>
            <View style={rampStyles.graphContainer}>
                {/* Y軸ラベル */}
                <View style={rampStyles.yAxis}>
                    <Text style={rampStyles.yLabel}>高</Text>
                    <Text style={rampStyles.yLabelSub}>強度</Text>
                    <Text style={rampStyles.yLabel}>低</Text>
                </View>

                {/* グラフ本体 */}
                <View style={rampStyles.graph}>
                    {schedule.map((lap, index) => {
                        const heightPercent = getHeightPercent(lap.pace400m);
                        const color = getColor(index, schedule.length);

                        return (
                            <View key={lap.lap} style={rampStyles.barContainer}>
                                <View
                                    style={[
                                        rampStyles.bar,
                                        {
                                            height: `${heightPercent}%`,
                                            backgroundColor: color,
                                        },
                                    ]}
                                >
                                    {index === schedule.length - 1 && (
                                        <Text style={rampStyles.barLabel}>MAX</Text>
                                    )}
                                </View>
                                <Text style={rampStyles.lapLabel}>{lap.lap}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* 凡例 */}
            <View style={rampStyles.legend}>
                <View style={rampStyles.legendItem}>
                    <View style={[rampStyles.legendColor, { backgroundColor: '#22C55E' }]} />
                    <Text style={rampStyles.legendText}>ウォームアップ</Text>
                </View>
                <View style={rampStyles.legendItem}>
                    <View style={[rampStyles.legendColor, { backgroundColor: '#EAB308' }]} />
                    <Text style={rampStyles.legendText}>テンポ</Text>
                </View>
                <View style={rampStyles.legendItem}>
                    <View style={[rampStyles.legendColor, { backgroundColor: '#F97316' }]} />
                    <Text style={rampStyles.legendText}>閾値</Text>
                </View>
                <View style={rampStyles.legendItem}>
                    <View style={[rampStyles.legendColor, { backgroundColor: '#EF4444' }]} />
                    <Text style={rampStyles.legendText}>最大</Text>
                </View>
            </View>

            <Text style={rampStyles.description}>
                各周回でペースが4秒ずつ速くなります。限界まで継続してください。
            </Text>
        </View>
    );
};

const rampStyles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    graphContainer: {
        flexDirection: 'row',
        height: 120,
        marginBottom: 12,
    },
    yAxis: {
        width: 30,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
    },
    yLabel: {
        color: '#6b7280',
        fontSize: 10,
    },
    yLabelSub: {
        color: '#6b7280',
        fontSize: 8,
    },
    graph: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 4,
    },
    barLabel: {
        color: '#ffffff',
        fontSize: 7,
        fontWeight: '700',
    },
    lapLabel: {
        color: '#9ca3af',
        fontSize: 9,
        marginTop: 4,
        position: 'absolute',
        bottom: -16,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 2,
        marginRight: 4,
    },
    legendText: {
        color: '#9ca3af',
        fontSize: 10,
    },
    description: {
        color: '#6b7280',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 4,
    },
});

// ============================================
// メインコンポーネント
// ============================================

export default function TestScreen() {
    // Zustandストア
    const addTestResult = useAppStore((state) => state.addTestResult);
    const setSubScreenOpen = useSetSubScreenOpen();

    // 画面状態
    const [showInput, setShowInput] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // テスト設定
    const [level, setLevel] = useState<LevelKey>('A');
    const [isFirstTest, setIsFirstTest] = useState(false);

    // 結果入力
    const [completedLaps, setCompletedLaps] = useState(5);
    const [reason, setReason] = useState<ReasonType>('both');
    const [q1, setQ1] = useState(false);
    const [q2, setQ2] = useState(false);
    const [q3, setQ3] = useState<RecoveryTime>('30-60');

    // 計算結果
    const [result, setResult] = useState<{
        etp: number;
        lcp: number;
        limiterType: LimiterType;
        limiterConfidence: 'confirmed' | 'tentative';
    } | null>(null);

    // サブ画面表示時にタブスワイプを無効化
    useEffect(() => {
        setSubScreenOpen(showInput || showResult);
        return () => setSubScreenOpen(false);
    }, [showInput, showResult, setSubScreenOpen]);

    // 有効レベル（初回テスト調整後）
    const effectiveLevel = adjustLevel(level, isFirstTest);
    const config = LEVELS[effectiveLevel];
    const schedule = generateLapSchedule(effectiveLevel);
    const maxLaps = config.maxLaps;

    // 現在のLCP計算
    const currentLcp = calculateLCP(effectiveLevel, completedLaps);

    // 戻る処理
    const handleBack = () => {
        if (showResult) {
            setShowResult(false);
        } else if (showInput) {
            setShowInput(false);
        }
    };

    // 右スワイプで戻るためのPanResponder（関数参照を使用）
    const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);

    // PanResponderを毎回作成（状態を正しくキャプチャ）
    const createPanResponder = () => PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 10;
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx > SWIPE_THRESHOLD) {
                handleBack();
            }
        },
    });

    panResponderRef.current = createPanResponder();

    // 結果算出
    const handleSubmit = () => {
        const lcp = currentLcp;
        const etp = calculateETP(lcp);
        const limiter = determineLimiter(reason, q1, q2, q3);
        const zones = calculateZones(etp, limiter.type);
        const predictions = calculatePredictions(etp, limiter.type);

        setResult({
            etp,
            lcp,
            limiterType: limiter.type,
            limiterConfidence: limiter.confidence,
        });
        setShowResult(true);

        // ストアに保存
        addTestResult({
            testType: 'rise',
            level: effectiveLevel,
            completedLaps,
            lcp,
            etp,
            limiterType: limiter.type,
            limiterConfidence: limiter.confidence,
            zones,
            predictions: { m5000: predictions.m5000?.min || 0 },
        });
    };

    // リセット
    const handleReset = () => {
        setShowInput(false);
        setShowResult(false);
        setCompletedLaps(5);
        setReason('both');
        setQ1(false);
        setQ2(false);
        setQ3('30-60');
        setResult(null);
    };

    const limiter = result ? LIMITER_CONFIG[result.limiterType] : null;

    // ============================================
    // 結果入力画面
    // ============================================
    if (showInput && !showResult) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} {...panResponderRef.current!.panHandlers}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* ヘッダー */}
                        <View style={styles.inputHeader}>
                            <TouchableOpacity onPress={() => setShowInput(false)} style={styles.backButton}>
                                <Text style={styles.backButtonText}>← 戻る</Text>
                            </TouchableOpacity>
                            <Text style={styles.title}>結果入力</Text>
                        </View>

                        {/* 完遂周回数 */}
                        <View style={styles.inputSection}>
                            <Text style={styles.sectionTitle}>完遂周回数</Text>
                            <View style={styles.lapsSelector}>
                                <TouchableOpacity
                                    style={styles.lapsButton}
                                    onPress={() => setCompletedLaps(Math.max(1, completedLaps - 1))}
                                >
                                    <Text style={styles.lapsButtonText}>−</Text>
                                </TouchableOpacity>
                                <View style={styles.lapsDisplay}>
                                    <Text style={styles.lapsValue}>{completedLaps}</Text>
                                    <Text style={styles.lapsLabel}>周 / {maxLaps}周</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.lapsButton}
                                    onPress={() => setCompletedLaps(Math.min(maxLaps, completedLaps + 1))}
                                >
                                    <Text style={styles.lapsButtonText}>+</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.lcpDisplay}>
                                <Text style={styles.lcpText}>
                                    → LCP: <Text style={styles.lcpValue}>{currentLcp}秒</Text> ({formatKmPace(currentLcp)})
                                </Text>
                            </View>
                        </View>

                        {/* 終了理由 */}
                        <View style={styles.inputSection}>
                            <Text style={styles.sectionTitle}>なぜ止まりましたか？</Text>
                            {[
                                { value: 'breath' as ReasonType, label: '😮‍💨 息が苦しい' },
                                { value: 'legs' as ReasonType, label: '🦵 脚が重い' },
                                { value: 'both' as ReasonType, label: '⚖️ 両方' },
                                { value: 'other' as ReasonType, label: '❓ その他' },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.radioOption, reason === opt.value && styles.radioOptionSelected]}
                                    onPress={() => setReason(opt.value)}
                                >
                                    <View style={[styles.radioCircle, reason === opt.value && styles.radioCircleSelected]} />
                                    <Text style={[styles.radioLabel, reason === opt.value && styles.radioLabelSelected]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 補助質問 */}
                        <View style={styles.inputSection}>
                            <Text style={styles.sectionTitle}>補助質問</Text>

                            {/* Q1 */}
                            <View style={styles.subQuestion}>
                                <Text style={styles.questionText}>Q1. もう1周できそうだった？</Text>
                                <View style={styles.boolOptions}>
                                    <TouchableOpacity
                                        style={[styles.boolButton, q1 && styles.boolButtonSelected]}
                                        onPress={() => setQ1(true)}
                                    >
                                        <Text style={[styles.boolButtonText, q1 && styles.boolButtonTextSelected]}>はい</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.boolButton, !q1 && styles.boolButtonSelected]}
                                        onPress={() => setQ1(false)}
                                    >
                                        <Text style={[styles.boolButtonText, !q1 && styles.boolButtonTextSelected]}>いいえ</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Q2 */}
                            <View style={styles.subQuestion}>
                                <Text style={styles.questionText}>Q2. 5秒遅ければ続けられた？</Text>
                                <View style={styles.boolOptions}>
                                    <TouchableOpacity
                                        style={[styles.boolButton, q2 && styles.boolButtonSelected]}
                                        onPress={() => setQ2(true)}
                                    >
                                        <Text style={[styles.boolButtonText, q2 && styles.boolButtonTextSelected]}>はい</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.boolButton, !q2 && styles.boolButtonSelected]}
                                        onPress={() => setQ2(false)}
                                    >
                                        <Text style={[styles.boolButtonText, !q2 && styles.boolButtonTextSelected]}>いいえ</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Q3 */}
                            <View style={styles.subQuestion}>
                                <Text style={styles.questionText}>Q3. 息が落ち着くまで？</Text>
                                <View style={styles.tripleOptions}>
                                    {(['<30', '30-60', '>60'] as RecoveryTime[]).map((v) => (
                                        <TouchableOpacity
                                            key={v}
                                            style={[styles.tripleButton, q3 === v && styles.tripleButtonSelected]}
                                            onPress={() => setQ3(v)}
                                        >
                                            <Text style={[styles.tripleButtonText, q3 === v && styles.tripleButtonTextSelected]}>
                                                {v === '<30' ? '30秒未満' : v === '30-60' ? '30-60秒' : '60秒以上'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* 算出ボタン */}
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <LinearGradient
                                colors={['#3B82F6', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButtonGradient}
                            >
                                <Text style={styles.submitButtonText}>結果を算出</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // ============================================
    // 結果表示画面
    // ============================================
    if (showResult && result && limiter) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} {...panResponderRef.current!.panHandlers}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.title}>テスト結果</Text>
                    </View>

                    {/* 保存通知 */}
                    <View style={styles.savedNotice}>
                        <Text style={styles.savedNoticeText}>✅ 結果を保存しました</Text>
                    </View>

                    {/* eTPカード */}
                    <View style={styles.etpResultCard}>
                        <Text style={styles.resultLabel}>あなたのeTP</Text>
                        <View style={styles.etpResultRow}>
                            <Text style={styles.etpResultValue}>{result.etp}</Text>
                            <Text style={styles.etpResultUnit}>秒/400m</Text>
                        </View>
                        <Text style={styles.etpResultKm}>{formatKmPace(result.etp)}</Text>
                        <Text style={styles.lcpNote}>LCP: {result.lcp}秒 × 1.12</Text>
                    </View>

                    {/* リミッタータイプ */}
                    <View style={[styles.limiterResultCard, { borderColor: limiter.color }]}>
                        <View style={styles.limiterHeader}>
                            <Text style={styles.limiterIcon}>{limiter.icon}</Text>
                            <View style={styles.limiterInfo}>
                                <Text style={[styles.limiterName, { color: limiter.color }]}>
                                    {limiter.name}
                                </Text>
                                <Text style={styles.limiterConfidence}>
                                    信頼度: {result.limiterConfidence === 'confirmed' ? '確定' : '暫定'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.limiterDescription}>{limiter.description}</Text>
                    </View>

                    {/* 再テストボタン */}
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                        <Text style={styles.resetButtonText}>🔄 ホームに戻る</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ============================================
    // テスト準備画面（メイン）
    // ============================================
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.title}>RISE Test</Text>
                    <Text style={styles.subtitle}>400mトラックで測定</Text>
                </View>

                {/* レベル選択 */}
                <View style={styles.levelSection}>
                    <Text style={styles.sectionTitle}>テストレベル</Text>
                    <View style={styles.levelTabs}>
                        {(Object.keys(LEVELS) as LevelKey[]).map((key) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.levelTab, level === key && styles.levelTabActive]}
                                onPress={() => setLevel(key)}
                            >
                                <Text style={[styles.levelTabText, level === key && styles.levelTabTextActive]}>
                                    {key}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.levelDescription}>{LEVELS[level].description}</Text>
                </View>

                {/* 初回テストチェック */}
                <TouchableOpacity
                    style={styles.firstTestOption}
                    onPress={() => setIsFirstTest(!isFirstTest)}
                >
                    <View style={[styles.checkbox, isFirstTest && styles.checkboxChecked]} />
                    <Text style={styles.firstTestLabel}>初回テスト（1段階遅いレベルで開始）</Text>
                </TouchableOpacity>

                {isFirstTest && level !== effectiveLevel && (
                    <View style={styles.adjustedNotice}>
                        <Text style={styles.adjustedNoticeText}>→ 調整後: レベル {effectiveLevel}</Text>
                    </View>
                )}

                {/* ランプテストグラフ（Zwiftライク） */}
                <RampTestGraph schedule={schedule} levelConfig={config} />

                {/* 進行表 */}
                <View style={styles.scheduleSection}>
                    <View style={styles.scheduleHeader}>
                        <Text style={styles.sectionTitle}>レベル{effectiveLevel} 進行表</Text>
                        <Text style={styles.scheduleInfo}>
                            開始: {config.startPace}秒 ({formatKmPace(config.startPace)}) / 最大: {maxLaps}周
                        </Text>
                    </View>

                    <View style={styles.scheduleTable}>
                        {/* ヘッダー */}
                        <View style={styles.scheduleRow}>
                            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.colLap]}>周</Text>
                            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.col400]}>400m</Text>
                            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.col100]}>100m</Text>
                            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.colKm]}>キロ換算</Text>
                        </View>
                        {/* データ行 */}
                        {schedule.map((lap) => (
                            <View key={lap.lap} style={styles.scheduleRow}>
                                <Text style={[styles.scheduleCell, styles.colLap]}>{lap.lap}</Text>
                                <Text style={[styles.scheduleCell, styles.col400]}>{lap.pace400m}秒</Text>
                                <Text style={[styles.scheduleCell, styles.col100]}>{lap.pace100m}秒</Text>
                                <Text style={[styles.scheduleCell, styles.colKm]}>{lap.kmPace}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.terminationNote}>⚠️ 終了条件: 設定タイムより2秒以上遅延</Text>
                </View>

                {/* 結果入力ボタン */}
                <TouchableOpacity style={styles.inputButton} onPress={() => setShowInput(true)}>
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.inputButtonGradient}
                    >
                        <Text style={styles.inputButtonText}>✏️ 結果を入力する</Text>
                    </LinearGradient>
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
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 20,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        gap: 16,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 4,
    },

    // セクション
    inputSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
    },

    // レベル選択
    levelSection: {
        marginBottom: 20,
    },
    levelTabs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    levelTab: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        alignItems: 'center',
    },
    levelTabActive: {
        backgroundColor: '#3B82F6',
    },
    levelTabText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '600',
    },
    levelTabTextActive: {
        color: '#ffffff',
    },
    levelDescription: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
    },

    // 初回テスト
    firstTestOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#6b7280',
    },
    checkboxChecked: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    firstTestLabel: {
        color: '#ffffff',
        fontSize: 15,
    },
    adjustedNotice: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    adjustedNoticeText: {
        color: '#EAB308',
        fontSize: 14,
        textAlign: 'center',
    },

    // 進行表
    scheduleSection: {
        marginBottom: 20,
    },
    scheduleHeader: {
        marginBottom: 12,
    },
    scheduleInfo: {
        color: '#6b7280',
        fontSize: 13,
        marginTop: 4,
    },
    scheduleTable: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    scheduleRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    scheduleCell: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        color: '#ffffff',
        fontSize: 14,
        textAlign: 'center',
    },
    scheduleCellHeader: {
        color: '#9ca3af',
        fontWeight: '600',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    colLap: { width: 40 },
    col400: { flex: 1 },
    col100: { flex: 1 },
    colKm: { flex: 1.2 },
    terminationNote: {
        color: '#EAB308',
        fontSize: 13,
        marginTop: 12,
        textAlign: 'center',
    },

    // 周回選択
    lapsSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 12,
    },
    lapsButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lapsButtonText: {
        color: '#3B82F6',
        fontSize: 28,
        fontWeight: '600',
    },
    lapsDisplay: {
        alignItems: 'center',
    },
    lapsValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    lapsLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    lcpDisplay: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    lcpText: {
        color: '#9ca3af',
        fontSize: 15,
    },
    lcpValue: {
        color: '#8B5CF6',
        fontWeight: '600',
    },

    // ラジオボタン
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        marginBottom: 8,
        gap: 12,
    },
    radioOptionSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#6b7280',
    },
    radioCircleSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
    },
    radioLabel: {
        color: '#9ca3af',
        fontSize: 15,
    },
    radioLabelSelected: {
        color: '#ffffff',
    },

    // 補助質問
    subQuestion: {
        marginBottom: 16,
    },
    questionText: {
        color: '#ffffff',
        fontSize: 14,
        marginBottom: 8,
    },
    boolOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    boolButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        alignItems: 'center',
    },
    boolButtonSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    boolButtonText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    boolButtonTextSelected: {
        color: '#ffffff',
    },
    tripleOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    tripleButton: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        alignItems: 'center',
    },
    tripleButtonSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    tripleButtonText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    tripleButtonTextSelected: {
        color: '#ffffff',
    },

    // ボタン
    inputButton: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    inputButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    inputButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    submitButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },

    // 結果画面
    savedNotice: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        alignItems: 'center',
    },
    savedNoticeText: {
        color: '#22C55E',
        fontSize: 14,
        fontWeight: '500',
    },
    etpResultCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 8,
    },
    etpResultRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    etpResultValue: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    etpResultUnit: {
        fontSize: 16,
        color: '#6b7280',
        marginLeft: 8,
    },
    etpResultKm: {
        fontSize: 20,
        color: '#3B82F6',
        marginTop: 4,
    },
    lcpNote: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
    },
    limiterResultCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
    },
    limiterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
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
        marginBottom: 2,
    },
    limiterConfidence: {
        fontSize: 12,
        color: '#6b7280',
    },
    limiterDescription: {
        fontSize: 14,
        color: '#9ca3af',
        lineHeight: 20,
    },
    resetButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#9ca3af',
    },
    bottomSpacer: {
        height: 40,
    },
});
