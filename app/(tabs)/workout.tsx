// ============================================
// Workout Screen - ワークアウト画面（簡素化版）
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffectiveValues } from '../../src/stores/useAppStore';
import { formatTime, formatKmPace, calculateWorkoutPace } from '../../src/utils';
import { PremiumGate } from '../../components/PremiumGate';
import { useIsPremium } from '../../store/useSubscriptionStore';
import { FadeIn, SlideIn } from '../../src/components/ui/Animated';
import {
  COLORS,
  WORKOUTS,
  ZONE_COEFFICIENTS_V3,
  WORKOUT_LIMITER_CONFIG,
} from '../../src/constants';
import { useLocalSearchParams } from 'expo-router';
import { WorkoutTemplate, WorkoutSegment, ZoneName, LimiterType } from '../../src/types';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { SwipeBackView } from '../../components/SwipeBackView';
import { useIsFocused } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// カテゴリラベル（簡素化）
const CATEGORY_LABELS: Record<string, string> = {
  all: 'すべて',
  VO2max: 'VO2max',
  '乳酸閾値': '乳酸閾値',
  '神経筋系': '神経筋系',
  '有酸素ベース': '有酸素ベース',
  '総合': '総合',
};

// リミッター設定
const LIMITER_CONFIG: Record<LimiterType, { icon: string; label: string }> = {
  cardio: { icon: 'fitness', label: '心肺型' },
  muscular: { icon: 'barbell', label: '筋型' },
  balanced: { icon: 'scale', label: 'バランス型' },
};

interface ExpandedSegment {
  zone: ZoneName | 'rest';
  distance: number;
  label: string;
}

export default function WorkoutScreen() {
  const isPremium = useIsPremium();
  const { etp, limiter } = useEffectiveValues();
  const params = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const setSubScreenOpen = useSetSubScreenOpen();
  const isFocused = useIsFocused();

  // フォーカス中のタブのみフラグを制御（タブ間の競合を防止）
  useEffect(() => {
    if (isFocused) {
      setSubScreenOpen(selectedWorkout !== null);
    }
  }, [selectedWorkout, isFocused, setSubScreenOpen]);

  // 他画面からのカテゴリパラメータ変更に対応
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  if (!isPremium) {
    return (
      <PremiumGate featureName="トレーニング">
        <View />
      </PremiumGate>
    );
  }

  // カテゴリ一覧
  const categories = useMemo(() => {
    const cats = new Set(WORKOUTS.map((w) => w.category));
    return ['all', ...cats] as string[];
  }, []);

  const filteredWorkouts = useMemo(() => {
    if (selectedCategory === 'all') return WORKOUTS;
    return WORKOUTS.filter((w) => w.category === selectedCategory);
  }, [selectedCategory]);

  // 詳細画面
  if (selectedWorkout) {
    return (
      <SwipeBackView onSwipeBack={() => setSelectedWorkout(null)}>
        <WorkoutDetailScreen
          workout={selectedWorkout}
          etp={etp}
          limiter={limiter}
          onBack={() => setSelectedWorkout(null)}
        />
      </SwipeBackView>
    );
  }

  // 一覧画面
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <FadeIn>
          <Text style={styles.sectionTitle}>トレーニング</Text>

          {/* ETP表示（2行テーブル） */}
          <View style={styles.etpBox}>
            <View style={styles.etpTableRow}>
              <Text style={styles.etpLabel}>ETP</Text>
              <Text style={styles.etpValue}>{Math.round(etp)}秒 ({formatKmPace(etp)})</Text>
            </View>
            <View style={styles.etpDivider} />
            <View style={styles.etpTableRow}>
              <Text style={styles.etpLabel}>リミッター</Text>
              <View style={styles.etpLimiterValue}>
                <Ionicons name={WORKOUT_LIMITER_CONFIG[limiter].icon as any} size={16} color={WORKOUT_LIMITER_CONFIG[limiter].color} />
                <Text style={styles.etpValue}>{WORKOUT_LIMITER_CONFIG[limiter].name}</Text>
              </View>
            </View>
          </View>

          {/* ゾーン凡例 */}
          <View style={styles.zoneLegend}>
            {Object.entries(ZONE_COEFFICIENTS_V3).map(([key, zone]) => (
              <View key={key} style={styles.zoneLegendItem}>
                <View style={[styles.zoneLegendDot, { backgroundColor: zone.color }]} />
                <Text style={styles.zoneLegendText}>{zone.label}</Text>
              </View>
            ))}
          </View>
        </FadeIn>

        {/* カテゴリフィルター */}
        <SlideIn delay={100} direction="up">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                    {CATEGORY_LABELS[cat] || cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </SlideIn>

        {/* ワークアウト一覧 */}
        <SlideIn delay={200} direction="up">
          <View style={styles.workoutList}>
            {filteredWorkouts.map((workout) => {
              const variant = workout.limiterVariants?.[limiter];
              const totalDistance = calculateTotalDistance(workout.segments, variant);
              const expanded = expandSegments(workout.segments, variant);

              return (
                <Pressable
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => setSelectedWorkout(workout)}
                >
                  <IntensityGraph segments={expanded} height={80} />
                  <View style={styles.workoutCardBody}>
                    <View style={styles.workoutCardNameRow}>
                      <Text style={styles.workoutCardName}>{workout.name}</Text>
                      <View style={styles.workoutCardCategoryBadge}>
                        <Text style={styles.workoutCardCategoryText}>
                          {CATEGORY_LABELS[workout.category] || workout.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.workoutCardDistance}>
                      {totalDistance.toLocaleString()}m ({(totalDistance / 400).toFixed(0)}周)
                    </Text>
                    {variant?.note && (
                      <View style={styles.workoutCardNote}>
                        <Ionicons name={WORKOUT_LIMITER_CONFIG[limiter].icon as any} size={14} color={WORKOUT_LIMITER_CONFIG[limiter].color} />
                        <Text style={styles.workoutCardNoteText}>{variant.note}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Workout Detail Screen（簡素化）
// ============================================

interface WorkoutDetailScreenProps {
  workout: WorkoutTemplate;
  etp: number;
  limiter: LimiterType;
  onBack: () => void;
}

function WorkoutDetailScreen({ workout, etp, limiter, onBack }: WorkoutDetailScreenProps) {
  const variant = workout.limiterVariants?.[limiter];
  const expandedSegments = expandSegments(workout.segments, variant);
  const totalDistance = calculateTotalDistance(workout.segments, variant);

  // インターバルペース計算
  const intervalSegment = workout.segments.find(
    (s) => s.zone === 'interval' || s.zone === 'repetition'
  );
  const intervalPace = intervalSegment
    ? calculateWorkoutPace(etp, intervalSegment.zone, limiter)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <FadeIn>
          {/* ヘッダー */}
          <View style={styles.detailHeader}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.detailTitle}>{workout.name}</Text>
          </View>
        </FadeIn>

        {/* 強度グラフ */}
        <SlideIn delay={100} direction="up">
          <IntensityGraph segments={expandedSegments} />
        </SlideIn>

        {/* メタ情報 */}
        <SlideIn delay={150} direction="up">
          <View style={styles.detailMeta}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {CATEGORY_LABELS[workout.category] || workout.category}
              </Text>
            </View>
            <Text style={styles.detailDistance}>
              総距離 {totalDistance.toLocaleString()}m ({(totalDistance / 400).toFixed(1)}周)
            </Text>
          </View>

          {variant?.note && (
            <View style={styles.limiterCard}>
              <Ionicons name={LIMITER_CONFIG[limiter].icon as any} size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.limiterCardTitle}>{LIMITER_CONFIG[limiter].label}リミッター向け調整</Text>
                <Text style={styles.limiterCardNote}>{variant.note}</Text>
              </View>
            </View>
          )}

          <Text style={styles.detailDescription}>{workout.description}</Text>
        </SlideIn>

        {/* セグメント一覧 */}
        <SlideIn delay={200} direction="up">
          <Text style={styles.sectionLabel}>メニュー詳細</Text>
          <View style={styles.segmentsContainer}>
            {workout.segments.map((seg, i) => {
              const pace = calculateWorkoutPace(etp, seg.zone, limiter);
              const zoneConfig = ZONE_COEFFICIENTS_V3[seg.zone];
              const reps = seg.reps ? (variant?.reps || seg.reps) : undefined;
              const recovery = seg.recoveryDistance ? (variant?.recoveryDistance || seg.recoveryDistance) : undefined;

              return (
                <View
                  key={i}
                  style={[
                    styles.segmentItem,
                    { borderLeftColor: zoneConfig?.color || '#4B5563' },
                  ]}
                >
                  <View style={styles.segmentRow}>
                    <View style={styles.segmentLeft}>
                      <Text style={styles.segmentLabel}>
                        {seg.label}{reps && reps > 1 ? ` × ${reps}本` : ''}
                      </Text>
                      <Text style={styles.segmentZone}>{zoneConfig?.label || seg.zone}</Text>
                    </View>
                    <View style={styles.segmentRight}>
                      <Text style={styles.segmentPace400}>{Math.round(pace)}秒/400m</Text>
                      <Text style={styles.segmentPaceKm}>{formatKmPace(pace)}</Text>
                    </View>
                  </View>
                  {reps && reps > 1 && recovery && (
                    <Text style={styles.segmentRecovery}>回復 {recovery}m</Text>
                  )}
                </View>
              );
            })}
          </View>
        </SlideIn>

        {/* ラップ早見表（インターバル時、最初の4件のみ） */}
        {intervalSegment && intervalPace && (
          <SlideIn delay={300} direction="up">
            <CompactLapTable distance={intervalSegment.distance} pace400m={intervalPace} />
          </SlideIn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Intensity Graph（シンプル版）
// ============================================

interface IntensityGraphProps {
  segments: ExpandedSegment[];
  height?: number;
}

function IntensityGraph({ segments, height = 100 }: IntensityGraphProps) {
  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
  const scale = height / 100;

  const getBarHeight = (zone: ZoneName | 'rest'): number => {
    const heights: Record<string, number> = {
      repetition: 95,
      interval: 80,
      threshold: 65,
      marathon: 50,
      easy: 35,
      jog: 25,
      rest: 15,
    };
    return (heights[zone] || 30) * scale;
  };

  const getBarColor = (zone: ZoneName | 'rest'): string => {
    if (zone === 'rest') return '#4B5563';
    return ZONE_COEFFICIENTS_V3[zone]?.color || '#6B7280';
  };

  return (
    <View style={[styles.intensityContainer, height !== 100 && { marginBottom: 0 }]}>
      <View style={[styles.intensityGraph, { height }]}>
        {segments.map((seg, i) => {
          const widthPercent = (seg.distance / totalDistance) * 100;
          return (
            <View
              key={i}
              style={[
                styles.intensityBar,
                {
                  width: `${widthPercent}%`,
                  height: getBarHeight(seg.zone),
                  backgroundColor: getBarColor(seg.zone),
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

// ============================================
// Compact Lap Table（最初の4件のみ）
// ============================================

interface CompactLapTableProps {
  distance: number;
  pace400m: number;
}

function CompactLapTable({ distance, pace400m }: CompactLapTableProps) {
  const splits: { distance: number; time: string }[] = [];
  for (let d = 200; d <= distance && splits.length < 4; d += 200) {
    const time = (d / 400) * pace400m;
    splits.push({ distance: d, time: formatTime(time) });
  }

  return (
    <View style={styles.lapTable}>
      <Text style={styles.sectionLabel}>ラップ目安</Text>
      <View style={styles.lapTableGrid}>
        {splits.map((split, i) => (
          <View key={i} style={styles.lapTableItem}>
            <Text style={styles.lapTableDistance}>{split.distance}m</Text>
            <Text style={styles.lapTableTime}>{split.time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================
// Helper Functions
// ============================================

function expandSegments(
  segments: WorkoutSegment[],
  variant?: { reps?: number; recoveryDistance?: number; note?: string }
): ExpandedSegment[] {
  const expanded: ExpandedSegment[] = [];

  segments.forEach((seg) => {
    if (seg.reps && seg.reps > 1) {
      const reps = variant?.reps || seg.reps;
      const recovery = variant?.recoveryDistance || seg.recoveryDistance || 200;

      for (let i = 0; i < reps; i++) {
        expanded.push({ zone: seg.zone, distance: seg.distance, label: seg.label });
        if (i < reps - 1 && recovery > 0) {
          expanded.push({ zone: 'jog', distance: recovery, label: '回復' });
        }
      }
    } else {
      expanded.push({ zone: seg.zone, distance: seg.distance, label: seg.label });
    }
  });

  return expanded;
}

function calculateTotalDistance(
  segments: WorkoutSegment[],
  variant?: { reps?: number; recoveryDistance?: number; note?: string }
): number {
  return segments.reduce((sum, seg) => {
    if (seg.reps && seg.reps > 1) {
      const reps = variant?.reps || seg.reps;
      const recovery = variant?.recoveryDistance || seg.recoveryDistance || 0;
      return sum + seg.distance * reps + recovery * (reps - 1);
    }
    return sum + seg.distance;
  }, 0);
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    paddingBottom: 32,
  },

  // タイトル
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
    marginTop: 20,
  },

  // eTP表示（2行テーブル）
  etpBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  etpTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  etpLabel: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  etpValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  etpLimiterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etpDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },

  // ゾーン凡例
  zoneLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  zoneLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneLegendText: {
    fontSize: 12,
    color: COLORS.text.muted,
  },

  // フィルター
  filterScroll: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#fff',
  },

  // ワークアウト一覧
  workoutList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  workoutCardBody: {
    padding: 14,
  },
  workoutCardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
  },
  workoutCardCategoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  workoutCardCategoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  workoutCardDistance: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  workoutCardNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  workoutCardNoteText: {
    fontSize: 12,
    color: '#F97316',
  },

  // 詳細画面
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
  },

  // 強度グラフ
  intensityContainer: {
    marginBottom: 16,
  },
  intensityGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 4,
  },
  intensityBar: {
    borderRadius: 4,
    marginHorizontal: 1,
  },

  // メタ情報
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  detailDistance: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  limiterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  limiterCardTitle: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  limiterCardNote: {
    fontSize: 13,
    color: '#22C55E',
    marginTop: 2,
  },
  detailDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  // セグメント
  segmentsContainer: {
    gap: 6,
  },
  segmentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  segmentLeft: {
    flex: 1,
  },
  segmentRight: {
    alignItems: 'flex-end',
  },
  segmentLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  segmentZone: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  segmentPace400: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  segmentPaceKm: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  segmentRecovery: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 6,
  },

  // ラップ表
  lapTable: {
    marginTop: 4,
  },
  lapTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lapTableItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lapTableDistance: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  lapTableTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
});
