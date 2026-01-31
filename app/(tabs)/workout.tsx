import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, PanResponder, Animated, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore, useCurrentEtp, useCurrentLimiter } from '../../store/useAppStore';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { ZONE_COEFFICIENTS, LIMITER_CONFIG, type ZoneKey, type LimiterType } from '../../constants';
import { formatTime, formatKmPace, calculateZones } from '../../utils/calculations';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80; // スワイプ検知の閾値

// ============================================
// ワークアウトセグメント定義（rise-test互換）
// ============================================

interface WorkoutSegment {
    zone: ZoneKey;
    distance: number; // メートル
    label?: string;
    reps?: number;           // 反復回数
    recoveryDistance?: number; // 回復走の距離（メートル）
}

interface LimiterVariant {
    reps?: number;           // 本数変更
    recoveryDistance?: number; // 回復距離変更
    note: string;            // 説明
}

interface WorkoutMenu {
    id: string;
    name: string;
    category: TrainingCategory;
    type: 'interval' | 'tempo' | 'long' | 'easy' | 'recovery';
    zone: ZoneKey;
    icon: string;
    description: string;
    segments: WorkoutSegment[];
    targetLimiter?: LimiterType;
    limiterVariants: {
        cardio: LimiterVariant;
        muscular: LimiterVariant;
        balanced: LimiterVariant;
    };
}

// ============================================
// トレーニング焦点カテゴリ定義
// ============================================

type TrainingCategory = '有酸素ベース' | '乳酸閾値' | 'VO2max' | '神経筋系' | '総合';

const TRAINING_CATEGORIES: Record<TrainingCategory, { icon: string; color: string; description: string }> = {
    '有酸素ベース': { icon: '🫀', color: '#3B82F6', description: '毛細血管発達・ミトコンドリア増加' },
    '乳酸閾値': { icon: '💪', color: '#EAB308', description: '乳酸処理能力の向上' },
    'VO2max': { icon: '🔥', color: '#F97316', description: '最大酸素摂取量の向上' },
    '神経筋系': { icon: '⚡', color: '#EF4444', description: '神経筋協調性・ランニングエコノミー' },
    '総合': { icon: '🎯', color: '#8B5CF6', description: '複合的なトレーニング効果' },
};

const WORKOUT_MENUS: WorkoutMenu[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 有酸素ベース
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'easy-6000',
        name: 'Easy 6000m',
        category: '有酸素ベース',
        type: 'easy',
        zone: 'easy',
        icon: '🏃',
        description: '基礎的な有酸素能力を構築するイージーペースでの持続走。会話ができるペースで脂肪燃焼と毛細血管発達を促進。',
        segments: [
            { zone: 'jog', distance: 800, label: 'W-up 2周' },
            { zone: 'easy', distance: 4400, label: 'Easy 11周' },
            { zone: 'jog', distance: 800, label: 'C-down 2周' },
        ],
        limiterVariants: {
            cardio: { note: 'ペースを10秒/km遅めに維持' },
            muscular: { note: '後半2周をMペースに上げてOK' },
            balanced: { note: '標準ペースで実施' },
        },
    },
    {
        id: 'long-10000',
        name: 'Long Run 10000m',
        category: '有酸素ベース',
        type: 'long',
        zone: 'marathon',
        icon: '🏔️',
        description: 'プログレッシブ・ロングラン。後半にかけてペースを上げ、疲労状態でのペース維持能力を養成。',
        segments: [
            { zone: 'jog', distance: 800, label: 'W-up 2周' },
            { zone: 'easy', distance: 4000, label: 'Easy 10周' },
            { zone: 'easy', distance: 2400, label: 'Easy→M 6周' },
            { zone: 'marathon', distance: 2000, label: 'M 5周' },
            { zone: 'jog', distance: 800, label: 'C-down 2周' },
        ],
        limiterVariants: {
            cardio: { note: 'Mペース区間を1600mに短縮' },
            muscular: { note: 'Mペース区間を2400mに延長可' },
            balanced: { note: '標準で実施' },
        },
    },
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 乳酸閾値
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'tempo-4000',
        name: 'Tempo 4000m',
        category: '乳酸閾値',
        type: 'tempo',
        zone: 'threshold',
        icon: '💪',
        description: '閾値ペースでの持続走。乳酸処理能力を向上させ、レースペースの維持能力を高める。「快適にきつい」ペースを維持。',
        segments: [
            { zone: 'jog', distance: 1200, label: 'W-up 3周' },
            { zone: 'threshold', distance: 4000, label: 'T 10周' },
            { zone: 'jog', distance: 1200, label: 'C-down 3周' },
        ],
        limiterVariants: {
            cardio: { note: '3200m(8周)に短縮、ペース+2秒' },
            muscular: { note: '4800m(12周)に延長可' },
            balanced: { note: '標準で実施' },
        },
    },
    {
        id: 'cruise-1600x3',
        name: 'Cruise 1600m×3',
        category: '乳酸閾値',
        type: 'tempo',
        zone: 'threshold',
        icon: '🌊',
        description: '閾値ペースでのクルーズインターバル。回復を挟むことで質の高い閾値刺激を維持。',
        segments: [
            { zone: 'jog', distance: 1200, label: 'W-up 3周' },
            { zone: 'threshold', distance: 1600, label: 'T 1600m', reps: 3, recoveryDistance: 400 },
            { zone: 'jog', distance: 1200, label: 'C-down 3周' },
        ],
        limiterVariants: {
            cardio: { reps: 3, recoveryDistance: 600, note: '回復600mに延長' },
            muscular: { reps: 4, recoveryDistance: 400, note: '4本に増量' },
            balanced: { reps: 3, recoveryDistance: 400, note: '標準で実施' },
        },
    },
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VO2max
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'vo2max-1000x5',
        name: '1000m×5 Intervals',
        category: 'VO2max',
        targetLimiter: 'cardio',
        type: 'interval',
        zone: 'interval',
        icon: '🔥',
        description: 'インターバルペースでの高強度反復。VO2maxを刺激し最大酸素摂取量を向上。🫁心肺リミッター型の改善に効果的。',
        segments: [
            { zone: 'jog', distance: 1600, label: 'W-up 4周' },
            { zone: 'interval', distance: 1000, label: 'I 1000m', reps: 5, recoveryDistance: 400 },
            { zone: 'jog', distance: 1200, label: 'C-down 3周' },
        ],
        limiterVariants: {
            cardio: { reps: 4, recoveryDistance: 600, note: '4本に減、回復600m' },
            muscular: { reps: 6, recoveryDistance: 400, note: '6本に増量' },
            balanced: { reps: 5, recoveryDistance: 400, note: '標準で実施' },
        },
    },
    {
        id: 'vo2max-800x6',
        name: '800m×6 Intervals',
        category: 'VO2max',
        type: 'interval',
        zone: 'interval',
        icon: '⚡',
        description: '800mインターバル。1000mより速いペースで短時間の高強度刺激。スピード持久力の養成に。',
        segments: [
            { zone: 'jog', distance: 1600, label: 'W-up 4周' },
            { zone: 'interval', distance: 800, label: 'I 800m', reps: 6, recoveryDistance: 400 },
            { zone: 'jog', distance: 1200, label: 'C-down 3周' },
        ],
        limiterVariants: {
            cardio: { reps: 5, recoveryDistance: 600, note: '5本に減、回復600m' },
            muscular: { reps: 7, recoveryDistance: 400, note: '7本に増量' },
            balanced: { reps: 6, recoveryDistance: 400, note: '標準で実施' },
        },
    },
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 神経筋系
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'reps-200x10',
        name: '200m×10 Reps',
        category: '神経筋系',
        targetLimiter: 'muscular',
        type: 'interval',
        zone: 'repetition',
        icon: '💨',
        description: 'レペティションペースでの短距離反復。神経筋協調性とランニングエコノミーを改善。🦵筋持久力リミッター型のスピード強化に効果的。',
        segments: [
            { zone: 'jog', distance: 1600, label: 'W-up 4周' },
            { zone: 'repetition', distance: 200, label: 'R 200m', reps: 10, recoveryDistance: 200 },
            { zone: 'jog', distance: 1200, label: 'C-down 3周' },
        ],
        limiterVariants: {
            cardio: { reps: 8, recoveryDistance: 400, note: '8本に減、回復400m' },
            muscular: { reps: 12, recoveryDistance: 200, note: '12本に増量' },
            balanced: { reps: 10, recoveryDistance: 200, note: '標準で実施' },
        },
    },
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 総合
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'pyramid',
        name: 'Pyramid',
        category: '総合',
        type: 'interval',
        zone: 'interval',
        icon: '📐',
        description: '段階的に距離を上げ下げするピラミッド。400→800→1200→800→400で多様なペース刺激。スピードと持久力を同時養成。',
        segments: [
            { zone: 'jog', distance: 1600, label: 'W-up 4周' },
            { zone: 'interval', distance: 400, label: 'I 400m' },
            { zone: 'jog', distance: 400, label: '回復 1周' },
            { zone: 'interval', distance: 800, label: 'I 800m' },
            { zone: 'jog', distance: 400, label: '回復 1周' },
            { zone: 'threshold', distance: 1200, label: 'T 1200m' },
            { zone: 'jog', distance: 400, label: '回復 1周' },
            { zone: 'interval', distance: 800, label: 'I 800m' },
            { zone: 'jog', distance: 400, label: '回復 1周' },
            { zone: 'interval', distance: 400, label: 'I 400m' },
            { zone: 'jog', distance: 1200, label: 'C-down 3周' },
        ],
        limiterVariants: {
            cardio: { note: '各回復を600mに延長' },
            muscular: { note: '1200mを1600mに延長' },
            balanced: { note: '標準で実施' },
        },
    },
];

// ============================================
// ワークアウトグラフコンポーネント（距離ベース）
// ============================================

interface WorkoutGraphProps {
    segments: WorkoutSegment[];
    totalDistance: number; // 総距離（メートル）
    zones: Record<ZoneKey, number>;
}

const WorkoutGraph = ({ segments, totalDistance, zones }: WorkoutGraphProps) => {
    // ゾーンの高さを計算（ペースが速いほど高い）
    const getZoneHeight = (zone: ZoneKey): number => {
        const heights: Record<ZoneKey, number> = {
            jog: 30,
            easy: 45,
            marathon: 60,
            threshold: 75,
            interval: 90,
            repetition: 100,
        };
        return heights[zone];
    };

    // ラベル変換（W-up/C-down→R、周回数→距離m）
    const formatLabel = (label: string | undefined, distance: number): string => {
        if (!label) return '';
        let result = label
            .replace(/W-up/g, 'R')
            .replace(/C-down/g, 'R');
        // 周回数を距離（m）に変換
        result = result.replace(/\d+周/, `${distance}m`);
        return result;
    };

    // ペースを「xx秒/400m(x:xx/km)」形式でフォーマット
    // zones値は400m秒単位
    const formatPaceWith400m = (pace400m: number): string => {
        const per400m = Math.round(pace400m);
        const perKm = formatKmPace(pace400m);
        return `${per400m}秒/400m (${perKm})`;
    };

    return (
        <View style={graphStyles.container}>
            <Text style={graphStyles.title}>ワークアウト構成</Text>
            <View style={graphStyles.graphContainer}>
                {/* グラフ本体 */}
                <View style={graphStyles.graph}>
                    {segments.map((segment, index) => {
                        const widthPercent = (segment.distance / totalDistance) * 100;
                        const heightPercent = getZoneHeight(segment.zone);
                        const color = ZONE_COEFFICIENTS[segment.zone].color;

                        return (
                            <View
                                key={index}
                                style={[
                                    graphStyles.segment,
                                    {
                                        width: `${widthPercent}%`,
                                        height: `${heightPercent}%`,
                                        backgroundColor: color,
                                    },
                                ]}
                            >
                                {segment.label && widthPercent > 10 && (
                                    <Text style={graphStyles.segmentLabel}>{formatLabel(segment.label, segment.distance)}</Text>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* 距離ライン */}
                <View style={graphStyles.timeline}>
                    <Text style={graphStyles.timeText}>0</Text>
                    <Text style={graphStyles.timeText}>{Math.round(totalDistance / 2000)}km</Text>
                    <Text style={graphStyles.timeText}>{Math.round(totalDistance / 1000)}km</Text>
                </View>
            </View>

            {/* 凡例（ペース付き） */}
            <View style={graphStyles.legend}>
                {segments
                    .filter((s, i, arr) => arr.findIndex(x => x.zone === s.zone) === i)
                    .map((segment) => (
                        <View key={segment.zone} style={graphStyles.legendItem}>
                            <View style={[graphStyles.legendColor, { backgroundColor: ZONE_COEFFICIENTS[segment.zone].color }]} />
                            <Text style={graphStyles.legendText}>
                                {ZONE_COEFFICIENTS[segment.zone].name}
                            </Text>
                            <Text style={graphStyles.legendPace}>
                                {formatPaceWith400m(zones[segment.zone])}
                            </Text>
                        </View>
                    ))}
            </View>
        </View>
    );
};

const graphStyles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        color: '#9ca3af',
        fontSize: 13,
        marginBottom: 12,
    },
    graphContainer: {
        marginBottom: 12,
    },
    graph: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    segment: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: 'rgba(0, 0, 0, 0.2)',
    },
    segmentLabel: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    timeline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    timeText: {
        color: '#6b7280',
        fontSize: 10,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 6,
    },
    legendText: {
        color: '#9ca3af',
        fontSize: 11,
        marginRight: 4,
    },
    legendPace: {
        color: '#6b7280',
        fontSize: 10,
    },
});

// ============================================
// メインコンポーネント
// ============================================

export default function WorkoutScreen() {
    const router = useRouter();
    const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
    const currentEtp = useCurrentEtp();
    const currentLimiter = useCurrentLimiter();
    const setSubScreenOpen = useSetSubScreenOpen();
    const hasTestResult = currentEtp !== null;

    const [selectedMenu, setSelectedMenu] = useState<WorkoutMenu | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<TrainingCategory | null>(null);

    // 完了モーダル用ステート
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [actualDistance, setActualDistance] = useState('');
    const [actualDuration, setActualDuration] = useState('');
    const [notes, setNotes] = useState('');

    const addWorkoutLog = useAppStore((state) => state.addWorkoutLog);

    // URLパラメータからカテゴリを設定
    useEffect(() => {
        if (categoryParam && Object.keys(TRAINING_CATEGORIES).includes(categoryParam)) {
            setSelectedCategory(categoryParam as TrainingCategory);
        }
    }, [categoryParam]);

    // サブ画面表示時にタブスワイプを無効化
    useEffect(() => {
        setSubScreenOpen(selectedMenu !== null);
        return () => setSubScreenOpen(false);
    }, [selectedMenu, setSubScreenOpen]);

    // ゾーンペース計算
    const etp = currentEtp ?? 95;
    const limiter: LimiterType = currentLimiter ?? 'balanced';
    const zones = calculateZones(etp, limiter);
    const limiterConfig = LIMITER_CONFIG[limiter];

    // メニュー詳細を閉じる
    const closeDetail = () => setSelectedMenu(null);

    // 右スワイプで戻るためのPanResponder
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // 水平方向のスワイプのみ（右方向 = dx > 0）
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 10;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > SWIPE_THRESHOLD) {
                    closeDetail();
                }
            },
        })
    ).current;

    // ============================================
    // メニュー詳細モーダル
    // ============================================
    if (selectedMenu) {
        const zoneConfig = ZONE_COEFFICIENTS[selectedMenu.zone];
        const pace = zones[selectedMenu.zone];

        return (
            <SafeAreaView style={styles.container} edges={['top']} {...panResponder.panHandlers}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* ヘッダー */}
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={closeDetail} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← 戻る</Text>
                        </TouchableOpacity>
                    </View>

                    {/* メニュー情報 */}
                    <View style={styles.detailCard}>
                        <Text style={styles.detailIcon}>{selectedMenu.icon}</Text>
                        <Text style={styles.detailName}>{selectedMenu.name}</Text>
                        <Text style={styles.detailDescription}>{selectedMenu.description}</Text>
                    </View>

                    {/* ゾーン・ペース */}
                    <View style={[styles.paceCard, { borderColor: zoneConfig.color }]}>
                        <View style={styles.paceHeader}>
                            <View style={[styles.zoneBadge, { backgroundColor: zoneConfig.color }]}>
                                <Text style={styles.zoneBadgeText}>{zoneConfig.name}</Text>
                            </View>
                            <Text style={styles.paceLabel}>目標ペース</Text>
                        </View>
                        <View style={styles.paceValues}>
                            <View style={styles.paceItem}>
                                <Text style={styles.paceValue}>{pace}秒</Text>
                                <Text style={styles.paceUnit}>/400m</Text>
                            </View>
                            <View style={styles.paceDivider} />
                            <View style={styles.paceItem}>
                                <Text style={styles.paceValue}>{formatKmPace(pace).replace('/km', '')}</Text>
                                <Text style={styles.paceUnit}>/km</Text>
                            </View>
                        </View>
                    </View>

                    {/* ワークアウトグラフ */}
                    <WorkoutGraph
                        segments={selectedMenu.segments}
                        totalDistance={selectedMenu.segments.reduce((sum, s) => sum + s.distance, 0)}
                        zones={zones}
                    />

                    {/* リミッター別バリアント */}
                    {selectedMenu.limiterVariants && (
                        <View style={styles.variantCard}>
                            <Text style={styles.variantLabel}>📊 リミッター別調整</Text>
                            <View style={styles.variantList}>
                                {(['cardio', 'muscular', 'balanced'] as const).map((key) => {
                                    const variant = selectedMenu.limiterVariants![key];
                                    const isCurrentLimiter = limiter === key;
                                    const limiterInfo = LIMITER_CONFIG[key];
                                    return (
                                        <View
                                            key={key}
                                            style={[
                                                styles.variantItem,
                                                isCurrentLimiter && styles.variantItemActive,
                                            ]}
                                        >
                                            <Text style={styles.variantIcon}>{limiterInfo.icon}</Text>
                                            <View style={styles.variantInfo}>
                                                <Text
                                                    style={[
                                                        styles.variantName,
                                                        isCurrentLimiter && { color: limiterInfo.color },
                                                    ]}
                                                >
                                                    {limiterInfo.name}
                                                    {isCurrentLimiter && ' (あなた)'}
                                                </Text>
                                                <Text style={styles.variantNote}>{variant.note}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    <View style={styles.adviceCard}>
                        <View style={styles.adviceHeader}>
                            <Text style={styles.adviceIcon}>{limiterConfig.icon}</Text>
                            <Text style={[styles.adviceTitle, { color: limiterConfig.color }]}>
                                {limiterConfig.name}へのアドバイス
                            </Text>
                        </View>
                        <Text style={styles.adviceText}>
                            {limiter === 'cardio' && selectedMenu.type === 'interval' &&
                                'インターバルではレストを長めに取り、各本の質を重視しましょう。'}
                            {limiter === 'cardio' && selectedMenu.type === 'tempo' &&
                                'テンポランは得意領域。ペースを維持して長めに走ることができます。'}
                            {limiter === 'muscular' && selectedMenu.type === 'interval' &&
                                'スピードは得意ですが、本数を増やして持久力を養いましょう。'}
                            {limiter === 'muscular' && selectedMenu.type === 'long' &&
                                'ロング走は苦手かもしれませんが、有酸素ベースを作る重要なメニューです。'}
                            {limiter === 'balanced' &&
                                'バランスよくトレーニングを進めましょう。'}
                            {!['cardio', 'muscular'].includes(limiter) &&
                                '目標ペースを維持して走りましょう。'}
                        </Text>
                    </View>

                    {/* セッション開始ボタン */}
                    <TouchableOpacity style={styles.startButton}>
                        <LinearGradient
                            colors={[zoneConfig.color, adjustColor(zoneConfig.color, -30)]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.startButtonGradient}
                        >
                            <Text style={styles.startButtonText}>🏃 セッションを開始</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ワークアウト完了ボタン */}
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => {
                            // 予想距離をデフォルト値として設定
                            const totalDistance = selectedMenu.segments.reduce((sum, s) => sum + s.distance, 0);
                            setActualDistance((totalDistance / 1000).toFixed(1));
                            setActualDuration('');
                            setNotes('');
                            setShowCompleteModal(true);
                        }}
                    >
                        <Text style={styles.completeButtonText}>✅ 完了として記録</Text>
                    </TouchableOpacity>

                    {/* 完了入力モーダル */}
                    <Modal
                        visible={showCompleteModal}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowCompleteModal(false)}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalOverlay}
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>🎉 ワークアウト完了</Text>
                                <Text style={styles.modalSubtitle}>{selectedMenu.name}</Text>

                                {/* 距離入力 */}
                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>走行距離 (km)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={actualDistance}
                                        onChangeText={setActualDistance}
                                        keyboardType="decimal-pad"
                                        placeholder="例: 5.0"
                                        placeholderTextColor="#6b7280"
                                    />
                                </View>

                                {/* 時間入力 */}
                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>所要時間 (分)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={actualDuration}
                                        onChangeText={setActualDuration}
                                        keyboardType="decimal-pad"
                                        placeholder="例: 25"
                                        placeholderTextColor="#6b7280"
                                    />
                                </View>

                                {/* メモ入力 */}
                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>メモ（任意）</Text>
                                    <TextInput
                                        style={[styles.modalInput, { height: 60 }]}
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder="感想やコンディションなど"
                                        placeholderTextColor="#6b7280"
                                        multiline
                                    />
                                </View>

                                {/* ボタン */}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.modalCancelButton}
                                        onPress={() => setShowCompleteModal(false)}
                                    >
                                        <Text style={styles.modalCancelText}>キャンセル</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalSaveButton}
                                        onPress={() => {
                                            addWorkoutLog({
                                                date: new Date().toISOString(),
                                                workoutType: selectedMenu.id,
                                                workoutName: selectedMenu.name,
                                                completed: true,
                                                actualDistance: parseFloat(actualDistance) || undefined,
                                                actualDuration: parseFloat(actualDuration) || undefined,
                                                notes: notes || undefined,
                                            });
                                            setShowCompleteModal(false);
                                            Alert.alert('記録しました！', '素晴らしい！ワークアウトを完了しました 🎉');
                                            setSelectedMenu(null);
                                        }}
                                    >
                                        <Text style={styles.modalSaveText}>保存</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ============================================
    // メニュー一覧
    // ============================================
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.title}>ワークアウト</Text>
                    <Text style={styles.subtitle}>トレーニングメニューを選択</Text>
                </View>

                {/* テスト未実施通知 */}
                {!hasTestResult && (
                    <View style={styles.noResultCard}>
                        <Text style={styles.noResultTitle}>📊 テスト未実施</Text>
                        <Text style={styles.noResultText}>
                            正確なペースを表示するにはテストを実施してください。
                            現在は仮のデータで表示しています。
                        </Text>
                    </View>
                )}

                {/* ゾーン一覧 */}
                <View style={styles.zonesSection}>
                    <Text style={styles.sectionTitle}>トレーニングゾーン</Text>
                    <View style={styles.zonesGrid}>
                        {(Object.entries(ZONE_COEFFICIENTS) as [ZoneKey, { name: string; color: string }][]).map(
                            ([key, config]) => (
                                <View key={key} style={styles.zoneItem}>
                                    <View style={[styles.zoneColor, { backgroundColor: config.color }]} />
                                    <Text style={styles.zoneName}>{config.name}</Text>
                                    <Text style={styles.zonePace}>{formatKmPace(zones[key])}</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>

                {/* ワークアウトメニュー（カテゴリ別） */}
                <View style={styles.menusSection}>
                    <Text style={styles.sectionTitle}>ワークアウトメニュー</Text>

                    {/* カテゴリフィルター */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 16, marginHorizontal: -20, paddingHorizontal: 20 }}
                    >
                        <TouchableOpacity
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 20,
                                marginRight: 8,
                                backgroundColor: !selectedCategory ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                                borderWidth: 1,
                                borderColor: !selectedCategory ? '#8B5CF6' : 'transparent',
                            }}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <Text style={{ color: !selectedCategory ? '#8B5CF6' : '#9ca3af', fontSize: 13 }}>
                                すべて
                            </Text>
                        </TouchableOpacity>
                        {(Object.keys(TRAINING_CATEGORIES) as TrainingCategory[]).map((category) => {
                            const config = TRAINING_CATEGORIES[category];
                            const isActive = selectedCategory === category;
                            return (
                                <TouchableOpacity
                                    key={category}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        marginRight: 8,
                                        backgroundColor: isActive ? config.color + '30' : 'rgba(255,255,255,0.05)',
                                        borderWidth: 1,
                                        borderColor: isActive ? config.color : 'transparent',
                                    }}
                                    onPress={() => setSelectedCategory(isActive ? null : category)}
                                >
                                    <Text style={{ marginRight: 4 }}>{config.icon}</Text>
                                    <Text style={{ color: isActive ? config.color : '#9ca3af', fontSize: 13 }}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {(Object.keys(TRAINING_CATEGORIES) as TrainingCategory[])
                        .filter(category => !selectedCategory || selectedCategory === category)
                        .map((category) => {
                            const categoryConfig = TRAINING_CATEGORIES[category];
                            const categoryMenus = WORKOUT_MENUS.filter((m) => m.category === category);
                            if (categoryMenus.length === 0) return null;

                            return (
                                <View key={category} style={styles.categorySection}>
                                    <View style={styles.categoryHeader}>
                                        <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
                                        <View style={styles.categoryInfo}>
                                            <Text style={[styles.categoryName, { color: categoryConfig.color }]}>
                                                {category}
                                            </Text>
                                            <Text style={styles.categoryDesc}>{categoryConfig.description}</Text>
                                        </View>
                                    </View>

                                    {categoryMenus.map((menu) => {
                                        const zoneConfig = ZONE_COEFFICIENTS[menu.zone];
                                        const isRecommended = menu.targetLimiter === limiter;
                                        return (
                                            <TouchableOpacity
                                                key={menu.id}
                                                style={[styles.menuCard, isRecommended && styles.menuCardRecommended]}
                                                onPress={() => setSelectedMenu(menu)}
                                            >
                                                <View style={[styles.menuZone, { backgroundColor: zoneConfig.color }]} />
                                                <View style={styles.menuInfo}>
                                                    <View style={styles.menuHeader}>
                                                        <Text style={styles.menuIcon}>{menu.icon}</Text>
                                                        <Text style={styles.menuName}>{menu.name}</Text>
                                                        {isRecommended && (
                                                            <View style={styles.recommendedBadge}>
                                                                <Text style={styles.recommendedText}>おすすめ</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.menuDescription} numberOfLines={2}>
                                                        {menu.description}
                                                    </Text>
                                                </View>
                                                <View style={styles.menuPace}>
                                                    <Text style={styles.menuPaceValue}>{formatKmPace(zones[menu.zone])}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            );
                        })}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// 色を暗くするヘルパー
const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
    },

    // テスト未実施
    noResultCard: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    noResultTitle: {
        color: '#EAB308',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    noResultText: {
        color: '#9ca3af',
        fontSize: 13,
        lineHeight: 18,
    },

    // ゾーン一覧
    zonesSection: {
        marginBottom: 24,
    },
    zonesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    zoneItem: {
        width: '31%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    zoneColor: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginBottom: 8,
    },
    zoneName: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    zonePace: {
        color: '#6b7280',
        fontSize: 11,
    },

    // メニュー一覧
    menusSection: {
        marginBottom: 20,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    categoryIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryDesc: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    menuCardRecommended: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    menuZone: {
        width: 4,
        height: 48,
        borderRadius: 2,
        marginRight: 14,
    },
    menuInfo: {
        flex: 1,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        flexWrap: 'wrap',
        gap: 6,
    },
    menuIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    menuName: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    recommendedBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    recommendedText: {
        color: '#a78bfa',
        fontSize: 10,
        fontWeight: '600',
    },
    menuDescription: {
        color: '#6b7280',
        fontSize: 13,
    },
    menuPace: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    menuPaceValue: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '500',
    },

    // 詳細画面
    detailHeader: {
        marginTop: 20,
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
    },
    detailCard: {
        alignItems: 'center',
        marginBottom: 24,
    },
    detailIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    detailName: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    detailDescription: {
        color: '#9ca3af',
        fontSize: 15,
        textAlign: 'center',
    },
    paceCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
    },
    paceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    zoneBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 12,
    },
    zoneBadgeText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    paceLabel: {
        color: '#9ca3af',
        fontSize: 14,
    },
    paceValues: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paceItem: {
        alignItems: 'center',
    },
    paceValue: {
        color: '#ffffff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    paceUnit: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
    },
    paceDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 32,
    },
    structureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    structureLabel: {
        color: '#9ca3af',
        fontSize: 13,
        marginBottom: 8,
    },
    structureValue: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },

    // トレーニング目的
    purposeCard: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    purposeLabel: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    purposeText: {
        color: '#9ca3af',
        fontSize: 13,
        lineHeight: 20,
    },

    // リミッター別バリアント
    variantCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    variantLabel: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    variantList: {
        gap: 8,
    },
    variantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 8,
        padding: 10,
    },
    variantItemActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    variantIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    variantInfo: {
        flex: 1,
    },
    variantName: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '500',
    },
    variantNote: {
        color: '#6b7280',
        fontSize: 11,
        marginTop: 2,
    },

    adviceCard: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    adviceIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    adviceTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    adviceText: {
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 20,
    },
    startButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    startButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    completeButton: {
        marginTop: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    completeButtonText: {
        color: '#22c55e',
        fontSize: 16,
        fontWeight: '600',
    },

    // 完了モーダル
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 20,
    },
    modalInputGroup: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 13,
        color: '#9ca3af',
        marginBottom: 6,
    },
    modalInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#9ca3af',
        fontSize: 15,
        fontWeight: '600',
    },
    modalSaveButton: {
        flex: 1,
        backgroundColor: '#22c55e',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    bottomSpacer: {
        height: 40,
    },
});
