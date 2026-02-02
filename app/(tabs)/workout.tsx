// ============================================
// Workout Screen - ワークアウト画面
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
import Svg, { Rect } from 'react-native-svg';
import { useEffectiveValues } from '../../src/stores/useAppStore';
import { formatTime, formatKmPace, calculateWorkoutPace } from '../../src/utils';
import { Card, Chip } from '../../src/components/ui';
import { PremiumGate } from '../../components/PremiumGate';
import { useIsPremium } from '../../store/useSubscriptionStore';
import {
  COLORS,
  WORKOUTS,
  ZONE_COEFFICIENTS_V3,
  WORKOUT_LIMITER_CONFIG,
} from '../../src/constants';
import { WorkoutTemplate, WorkoutSegment, ZoneName, LimiterType } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CategoryFilter = 'all' | 'vo2max' | 'threshold' | 'neuromuscular' | 'aerobic' | 'mixed';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'すべて',
  vo2max: 'VO2max',
  threshold: '乳酸閾値',
  '乳酸閾値': '乳酸閾値',
  neuromuscular: '神経筋系',
  '神経筋系': '神経筋系',
  aerobic: '有酸素ベース',
  '有酸素ベース': '有酸素ベース',
  mixed: '総合',
  '総合': '総合',
  VO2max: 'VO2max',
};

// ゾーン別の高さ（強度表現）
const ZONE_HEIGHTS: Record<ZoneName, number> = {
  jog: 20,
  easy: 35,
  marathon: 50,
  threshold: 70,
  interval: 85,
  repetition: 100,
};

// FTP%（強度グラフ用）
const FTP_PERCENT: Record<ZoneName | 'rest', number> = {
  jog: 55,
  easy: 70,
  marathon: 85,
  threshold: 95,
  interval: 105,
  repetition: 125,
  rest: 40,
};

// リミッター絵文字
const LIMITER_EMOJI: Record<LimiterType, string> = {
  cardio: '🫁',
  muscular: '🦵',
  balanced: '⚖️',
};

const LIMITER_LABEL: Record<LimiterType, string> = {
  cardio: '心肺リミッター型',
  muscular: '筋持久力リミッター型',
  balanced: 'バランス型',
};

interface ExpandedSegment {
  zone: ZoneName | 'rest';
  distance: number;
  label: string;
  isRecovery?: boolean;
}

export default function WorkoutScreen() {
  const isPremium = useIsPremium();
  const { etp, limiter } = useEffectiveValues();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);

  // プレミアム機能チェック
  if (!isPremium) {
    return (
      <PremiumGate featureName="トレーニング">
        <View />
      </PremiumGate>
    );
  }

  // カテゴリ一覧を取得
  const categories = useMemo(() => {
    const cats = new Set(WORKOUTS.map((w) => w.category));
    return ['all', ...cats] as string[];
  }, []);

  const filteredWorkouts = useMemo(() => {
    if (selectedCategory === 'all') return WORKOUTS;
    return WORKOUTS.filter((w) => {
      const categoryMap: Record<string, string[]> = {
        'vo2max': ['VO2max', 'vo2max'],
        'threshold': ['乳酸閾値', 'threshold'],
        'neuromuscular': ['神経筋系', 'neuromuscular'],
        'aerobic': ['有酸素ベース', 'aerobic'],
        'mixed': ['総合', 'mixed'],
      };
      const matches = categoryMap[selectedCategory] || [selectedCategory];
      return matches.includes(w.category);
    });
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
        <Text style={styles.sectionTitle}>トレーニング</Text>

        {/* eTP/リミッター設定ボックス */}
        <View style={styles.etpBox}>
          <View style={styles.etpRow}>
            <Text style={styles.etpLabel}>eTP: {formatKmPace(etp)} ({etp}秒/400m)</Text>
            <View style={styles.limiterBadge}>
              <Text style={styles.limiterEmoji}>{LIMITER_EMOJI[limiter]}</Text>
              <Text style={styles.limiterText}>{LIMITER_LABEL[limiter]}</Text>
            </View>
          </View>
        </View>

        {/* ゾーン凡例 */}
        <ZoneLegend />

        {/* カテゴリフィルター */}
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
                onPress={() => setSelectedCategory(cat as CategoryFilter)}
              >
                <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ワークアウトカード一覧 */}
        <View style={styles.workoutList}>
          {filteredWorkouts.map((workout) => (
            <WorkoutCardV4
              key={workout.id}
              workout={workout}
              etp={etp}
              limiter={limiter}
              onPress={() => setSelectedWorkout(workout)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Zone Legend
// ============================================

function ZoneLegend() {
  return (
    <View style={styles.zoneLegend}>
      {(Object.entries(ZONE_COEFFICIENTS_V3) as [ZoneName, typeof ZONE_COEFFICIENTS_V3[ZoneName]][]).map(
        ([key, zone]) => (
          <View key={key} style={styles.zoneLegendItem}>
            <View style={[styles.zoneLegendBox, { backgroundColor: zone.color }]} />
            <Text style={styles.zoneLegendText}>{zone.name}</Text>
          </View>
        )
      )}
    </View>
  );
}

// ============================================
// Workout Card V4
// ============================================

interface WorkoutCardV4Props {
  workout: WorkoutTemplate;
  etp: number;
  limiter: LimiterType;
  onPress: () => void;
}

function WorkoutCardV4({ workout, etp, limiter, onPress }: WorkoutCardV4Props) {
  const variant = workout.limiterVariants?.[limiter];
  const totalDistance = calculateTotalDistance(workout.segments, variant);

  return (
    <Pressable style={styles.workoutCard} onPress={onPress}>
      <View style={styles.workoutCardHeader}>
        <View style={styles.workoutCardInfo}>
          <Text style={styles.workoutCardName}>{workout.name}</Text>
          <Text style={styles.workoutCardDistance}>
            総距離: {Math.round(totalDistance / 100) / 10}km
          </Text>
        </View>
        <View style={styles.workoutCardCategory}>
          <Text style={styles.workoutCardCategoryText}>
            {CATEGORY_LABELS[workout.category] || workout.category}
          </Text>
        </View>
      </View>
      {variant?.note && (
        <View style={styles.workoutCardNote}>
          <Text style={styles.workoutCardNoteText}>
            {LIMITER_EMOJI[limiter]} {variant.note}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ============================================
// Workout Detail Screen
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

  // インターバルセグメントを探す（ラップ表用）
  const intervalSegment = workout.segments.find(
    (s) => s.zone === 'interval' || s.zone === 'repetition'
  );
  const intervalPace = intervalSegment
    ? calculateWorkoutPace(etp, intervalSegment.zone, limiter)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        {/* ヘッダー */}
        <View style={styles.detailHeader}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </Pressable>
          <Text style={styles.detailTitle}>{workout.name}</Text>
        </View>

        {/* WorkoutProfile（SVGグラフ） */}
        <WorkoutProfile segments={expandedSegments} />

        {/* WorkoutIntensityGraph（FTP%棒グラフ） */}
        <WorkoutIntensityGraph segments={expandedSegments} etp={etp} limiter={limiter} />

        {/* ゾーン凡例 */}
        <ZoneLegend />

        {/* カテゴリ・総距離 */}
        <View style={styles.detailMeta}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {CATEGORY_LABELS[workout.category] || workout.category}
            </Text>
          </View>
          <Text style={styles.detailDistance}>
            総距離: {Math.round(totalDistance / 100) / 10}km
          </Text>
        </View>

        {/* リミッター調整パネル */}
        {variant?.note && (
          <View style={styles.limiterPanel}>
            <Text style={styles.limiterPanelTitle}>
              {LIMITER_EMOJI[limiter]} {LIMITER_LABEL[limiter]}調整
            </Text>
            <Text style={styles.limiterPanelText}>{variant.note}</Text>
          </View>
        )}

        {/* 説明 */}
        <Text style={styles.detailDescription}>{workout.description}</Text>

        {/* トレーニング詳細セクション */}
        <Text style={styles.sectionLabel}>トレーニング詳細</Text>
        <View style={styles.segmentsContainer}>
          {expandedSegments.map((seg, i) => {
            const pace =
              seg.zone !== 'rest'
                ? calculateWorkoutPace(etp, seg.zone, limiter)
                : 0;
            const zoneConfig =
              seg.zone !== 'rest' ? ZONE_COEFFICIENTS_V3[seg.zone] : null;

            return (
              <View
                key={i}
                style={[
                  styles.segmentItem,
                  {
                    borderLeftColor: zoneConfig?.color || '#4B5563',
                  },
                ]}
              >
                <View style={styles.segmentItemMain}>
                  <Text style={styles.segmentItemLabel}>{seg.label}</Text>
                  <Text style={styles.segmentItemDistance}>{seg.distance}m</Text>
                </View>
                {seg.zone !== 'rest' && pace > 0 && (
                  <View style={styles.segmentItemPace}>
                    <Text style={styles.segmentItemPaceKm}>{formatKmPace(pace)}</Text>
                    <Text style={styles.segmentItemPaceValue}>({pace}秒/400m)</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ラップ早見表（インターバル時） */}
        {intervalSegment && intervalPace && (
          <LapTableV4
            distance={intervalSegment.distance}
            pace400m={intervalPace}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Workout Profile (SVG Graph)
// ============================================

interface WorkoutProfileProps {
  segments: ExpandedSegment[];
}

function WorkoutProfile({ segments }: WorkoutProfileProps) {
  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
  const graphWidth = SCREEN_WIDTH - 32;
  const graphHeight = 60;
  const maxHeight = 100;

  let xOffset = 0;

  return (
    <View style={styles.profileContainer}>
      <Svg width={graphWidth} height={graphHeight} preserveAspectRatio="none">
        {segments.map((seg, i) => {
          const width = (seg.distance / totalDistance) * graphWidth;
          const height =
            seg.zone !== 'rest'
              ? (ZONE_HEIGHTS[seg.zone] / maxHeight) * graphHeight
              : 15;
          const color =
            seg.zone !== 'rest'
              ? ZONE_COEFFICIENTS_V3[seg.zone].color
              : '#4B5563';
          const x = xOffset;
          xOffset += width;

          return (
            <Rect
              key={i}
              x={x}
              y={graphHeight - height}
              width={Math.max(width - 1, 1)}
              height={height}
              fill={color}
              rx={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// ============================================
// Workout Intensity Graph (FTP% Bar Chart)
// ============================================

interface WorkoutIntensityGraphProps {
  segments: ExpandedSegment[];
  etp: number;
  limiter: LimiterType;
}

function WorkoutIntensityGraph({ segments, etp, limiter }: WorkoutIntensityGraphProps) {
  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
  const graphWidth = SCREEN_WIDTH - 32;
  const maxBarHeight = 100;

  const getBarHeight = (ftpPercent: number): number => {
    const normalized = Math.min(150, Math.max(40, ftpPercent));
    return 15 + ((normalized - 40) / 110) * (maxBarHeight - 15);
  };

  const getBarColor = (ftpPercent: number, zone: ZoneName | 'rest'): string => {
    if (zone === 'rest') return '#4B5563';
    if (ftpPercent >= 120) return '#EF4444';
    if (ftpPercent >= 100) return '#F97316';
    if (ftpPercent >= 90) return '#EAB308';
    if (ftpPercent >= 80) return '#22C55E';
    if (ftpPercent >= 65) return '#3B82F6';
    return '#9CA3AF';
  };

  let xOffset = 0;

  return (
    <View style={styles.intensityContainer}>
      <Text style={styles.intensitySectionLabel}>強度プロファイル</Text>
      <View style={styles.intensityGraph}>
        {segments.map((seg, i) => {
          const widthPercent = (seg.distance / totalDistance) * 100;
          const ftpPercent = FTP_PERCENT[seg.zone];
          const barHeight = getBarHeight(ftpPercent);
          const barColor = getBarColor(ftpPercent, seg.zone);

          return (
            <View
              key={i}
              style={[
                styles.intensityBar,
                {
                  width: `${widthPercent}%`,
                  height: barHeight,
                  backgroundColor: barColor,
                },
              ]}
            />
          );
        })}
      </View>
      {/* FTPライン */}
      <View style={styles.ftpLineContainer}>
        <View style={styles.ftpLine100} />
        <Text style={styles.ftpLineLabel}>100% FTP</Text>
      </View>
    </View>
  );
}

// ============================================
// Lap Table V4
// ============================================

interface LapTableV4Props {
  distance: number;
  pace400m: number;
}

function LapTableV4({ distance, pace400m }: LapTableV4Props) {
  const splits: { distance: number; time: string }[] = [];
  for (let d = 200; d <= distance; d += 200) {
    const time = (d / 400) * pace400m;
    splits.push({ distance: d, time: formatTime(time) });
  }
  const pace100m = (pace400m / 4).toFixed(1);

  return (
    <View style={styles.lapTable}>
      <Text style={styles.sectionLabel}>ラップ早見表</Text>
      <Text style={styles.lapTablePace100}>100m: {pace100m}秒</Text>
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
        expanded.push({
          zone: seg.zone,
          distance: seg.distance,
          label: seg.label,
        });
        if (i < reps - 1 && recovery > 0) {
          expanded.push({
            zone: 'jog',
            distance: recovery,
            label: '回復',
            isRecovery: true,
          });
        }
      }
    } else {
      expanded.push({
        zone: seg.zone,
        distance: seg.distance,
        label: seg.label,
      });
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

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
    marginTop: 16,
  },

  // eTP Box
  etpBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  etpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etpLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  limiterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  limiterEmoji: {
    fontSize: 18,
  },
  limiterText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // Zone Legend
  zoneLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    marginBottom: 16,
  },
  zoneLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoneLegendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  zoneLegendText: {
    fontSize: 12,
    color: '#D1D5DB',
  },

  // Filter
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
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  filterBtnActive: {
    backgroundColor: '#F97316',
  },
  filterBtnText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#fff',
  },

  // Workout List
  workoutList: {
    gap: 12,
  },

  // Workout Card
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutCardInfo: {
    flex: 1,
  },
  workoutCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  workoutCardDistance: {
    fontSize: 13,
    color: COLORS.text.muted,
  },
  workoutCardCategory: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  workoutCardCategoryText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '500',
  },
  workoutCardNote: {
    marginTop: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  workoutCardNoteText: {
    fontSize: 13,
    color: '#60A5FA',
  },

  // Detail Screen
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  // Profile Container
  profileContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  // Intensity Graph
  intensityContainer: {
    marginBottom: 16,
  },
  intensitySectionLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  intensityGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  intensityBar: {
    borderRadius: 2,
  },
  ftpLineContainer: {
    position: 'relative',
    marginTop: -60,
    marginBottom: 60,
    paddingLeft: 4,
  },
  ftpLine100: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 2,
  },
  ftpLineLabel: {
    fontSize: 10,
    color: '#666',
  },

  // Detail Meta
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
  detailDistance: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },

  // Limiter Panel
  limiterPanel: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  limiterPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 4,
  },
  limiterPanelText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // Description
  detailDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },

  // Segments
  segmentsContainer: {
    gap: 8,
  },
  segmentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentItemMain: {
    flex: 1,
  },
  segmentItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  segmentItemDistance: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  segmentItemPace: {
    alignItems: 'flex-end',
  },
  segmentItemPaceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  segmentItemPaceKm: {
    fontSize: 12,
    color: COLORS.text.muted,
  },

  // Lap Table
  lapTable: {
    marginTop: 8,
  },
  lapTablePace100: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 8,
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
