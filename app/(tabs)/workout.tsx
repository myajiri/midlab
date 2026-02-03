// ============================================
// Workout Screen - ワークアウト画面（簡素化版）
// ============================================

import React, { useState, useMemo } from 'react';
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
} from '../../src/constants';
import { WorkoutTemplate, WorkoutSegment, ZoneName, LimiterType } from '../../src/types';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);

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
      <WorkoutDetailScreen
        workout={selectedWorkout}
        etp={etp}
        limiter={limiter}
        onBack={() => setSelectedWorkout(null)}
      />
    );
  }

  // 一覧画面
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <FadeIn>
          <Text style={styles.sectionTitle}>トレーニング</Text>

          {/* eTP表示（コンパクト） */}
          <View style={styles.etpBox}>
            <View style={styles.etpRow}>
              <Text style={styles.etpText}>eTP {formatKmPace(etp)}</Text>
              <View style={styles.limiterBadge}>
                <Ionicons name={LIMITER_CONFIG[limiter].icon as any} size={14} color={COLORS.primary} />
                <Text style={styles.etpText}>{LIMITER_CONFIG[limiter].label}</Text>
              </View>
            </View>
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
                  <View style={styles.workoutCardHeader}>
                    <Text style={styles.workoutCardName}>{workout.name}</Text>
                    <Text style={styles.workoutCardCategory}>
                      {CATEGORY_LABELS[workout.category] || workout.category}
                    </Text>
                  </View>
                  <IntensityGraph segments={expanded} height={36} />
                  <Text style={styles.workoutCardDistance}>
                    {Math.round(totalDistance / 100) / 10}km
                  </Text>
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
              {Math.round(totalDistance / 100) / 10}km
            </Text>
            {variant?.note && (
              <View style={styles.limiterNoteRow}>
                <Ionicons name={LIMITER_CONFIG[limiter].icon as any} size={12} color={COLORS.text.muted} />
                <Text style={styles.limiterNote}>{LIMITER_CONFIG[limiter].label}調整</Text>
              </View>
            )}
          </View>

          <Text style={styles.detailDescription}>{workout.description}</Text>
        </SlideIn>

        {/* セグメント一覧 */}
        <SlideIn delay={200} direction="up">
          <Text style={styles.sectionLabel}>メニュー</Text>
          <View style={styles.segmentsContainer}>
            {expandedSegments.map((seg, i) => {
              const pace =
                seg.zone !== 'rest' ? calculateWorkoutPace(etp, seg.zone, limiter) : 0;
              const zoneConfig = seg.zone !== 'rest' ? ZONE_COEFFICIENTS_V3[seg.zone] : null;

              return (
                <View
                  key={i}
                  style={[
                    styles.segmentItem,
                    { borderLeftColor: zoneConfig?.color || '#4B5563' },
                  ]}
                >
                  <View style={styles.segmentItemMain}>
                    <Text style={styles.segmentItemLabel}>{seg.label}</Text>
                    <Text style={styles.segmentItemDistance}>{seg.distance}m</Text>
                  </View>
                  {seg.zone !== 'rest' && pace > 0 && (
                    <Text style={styles.segmentItemPace}>{formatKmPace(pace)}</Text>
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

  // eTP表示（コンパクト）
  etpBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  etpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  limiterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etpText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
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
    gap: 10,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  workoutCardCategory: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  workoutCardDistance: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: 6,
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
  limiterNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  limiterNote: {
    fontSize: 12,
    color: COLORS.text.muted,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentItemMain: {
    flex: 1,
  },
  segmentItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  segmentItemDistance: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  segmentItemPace: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
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
