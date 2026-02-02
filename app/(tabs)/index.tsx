// ============================================
// Dashboard - MidLabホーム画面
// ============================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useProfileStore,
  useTestResultsStore,
  usePlanStore,
  useEffectiveValues,
  useUserStage,
  useTrainingZones,
} from '../../src/stores/useAppStore';
import {
  formatTime,
  formatKmPace,
  estimateVO2max,
  getLevelFromEtp,
  getTodayWorkout,
  getWeekProgress,
  getNextTestRecommendation,
} from '../../src/utils';
import { Button } from '../../src/components/ui';
import { COLORS, ZONE_COEFFICIENTS_V3, RACE_COEFFICIENTS } from '../../src/constants';
import { ZoneName, LimiterType } from '../../src/types';

const { width } = Dimensions.get('window');

// 距離ごとの色
const DISTANCE_COLORS: Record<string, string> = {
  m800: '#EF4444',   // 赤
  m1500: '#F97316',  // オレンジ
  m3000: '#22C55E',  // 緑
  m5000: '#3B82F6',  // 青
};

// リミッターのIoniconsアイコン
const LIMITER_ICON: Record<LimiterType, { name: string; color: string }> = {
  cardio: { name: 'fitness', color: '#EF4444' },
  muscular: { name: 'barbell', color: '#F97316' },
  balanced: { name: 'scale', color: '#22C55E' },
};

const LIMITER_LABEL: Record<LimiterType, string> = {
  cardio: '心肺リミッター型',
  muscular: '筋持久力リミッター型',
  balanced: 'バランス型',
};

export default function HomeScreen() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const results = useTestResultsStore((state) => state.results);
  const activePlan = usePlanStore((state) => state.activePlan);

  const { etp, limiter, source } = useEffectiveValues();
  const stage = useUserStage();
  const zones = useTrainingZones();
  const vo2max = estimateVO2max(etp);
  const level = getLevelFromEtp(etp);

  const todayWorkout = activePlan ? getTodayWorkout(activePlan) : null;
  const weekProgress = activePlan ? getWeekProgress(activePlan) : null;
  const testRecommendation = getNextTestRecommendation(results);
  const latestResult = results.length > 0 ? results[0] : null;

  // 新規ユーザー向けガイド
  if (stage === 'new') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* MidLab Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MidLab</Text>
            <Text style={styles.logoSubtitle}>Middle Distance Training Lab</Text>
          </View>

          {/* Empty State */}
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>まだプロファイルが設定されていません</Text>
            <Button
              title="プロファイルを設定"
              onPress={() => router.push('/settings')}
              style={styles.emptyButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <Text style={styles.pageTitle}>ダッシュボード</Text>

        {/* ステータスカード */}
        <View style={styles.statusCard}>
          <View style={styles.etpDisplay}>
            <View style={styles.etpLabelRow}>
              <Text style={styles.etpLabel}>eTP</Text>
              <View style={styles.etpSourceBadge}>
                <Text style={styles.etpSourceText}>
                  {source === 'estimated' ? '推定' : source === 'measured' ? '測定' : 'デフォルト'}
                </Text>
              </View>
            </View>
            <Text style={styles.etpValue}>{etp}秒</Text>
            <Text style={styles.etpKmPace}>{formatKmPace(etp)}</Text>

            {/* リミッターバッジ */}
            <View style={styles.limiterBadge}>
              <Ionicons
                name={LIMITER_ICON[limiter].name as any}
                size={18}
                color={LIMITER_ICON[limiter].color}
              />
              <Text style={styles.limiterLabel}>{LIMITER_LABEL[limiter]}</Text>
            </View>

            {/* レベルとVO2max */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>レベル</Text>
                <Text style={styles.metricValueBlue}>{level || '-'}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>推定VO2max</Text>
                <Text style={styles.metricValueGreen}>{vo2max || '-'}</Text>
              </View>
            </View>

            {/* 最終測定日 */}
            {latestResult && (
              <Text style={styles.lastTestDate}>
                最終測定: {new Date(latestResult.date).toLocaleDateString('ja-JP')}
              </Text>
            )}
          </View>
        </View>

        {/* アクティブ計画カード */}
        {activePlan && (
          <View style={styles.planCard}>
            <Text style={styles.sectionLabel}>目標レース</Text>
            <Pressable
              style={styles.planContent}
              onPress={() => router.push('/plan')}
            >
              <Text style={styles.planName}>{activePlan.race.name}</Text>
              <Text style={styles.planMeta}>
                {new Date(activePlan.race.date).toLocaleDateString('ja-JP')} | {activePlan.race.distance}m
              </Text>
              <Text style={styles.planTarget}>
                目標: {formatTime(activePlan.race.targetTime)}
              </Text>
            </Pressable>
          </View>
        )}

        {/* 今日のメニュー */}
        {todayWorkout && todayWorkout.type !== 'rest' && (
          <View style={styles.todayWorkout}>
            <Text style={styles.sectionLabel}>今日のメニュー</Text>
            <Pressable
              style={styles.todayContent}
              onPress={() => router.push('/workout')}
            >
              <Text style={styles.todayLabel}>{todayWorkout.label}</Text>
              <Text style={styles.todayHint}>タップして詳細を見る →</Text>
            </Pressable>
          </View>
        )}

        {/* 週間進捗 */}
        {weekProgress && (
          <View style={styles.weekProgress}>
            <Text style={styles.sectionLabel}>
              今週の進捗 ({weekProgress.completed}/{weekProgress.total})
            </Text>
            <View style={styles.progressBar}>
              {weekProgress.days.map((completed, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDay,
                    completed && styles.progressDayCompleted,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 次回ランプテスト推奨 */}
        {testRecommendation && (
          <Pressable
            style={styles.testRecommendation}
            onPress={() => router.push('/test')}
          >
            <Text style={styles.testRecommendationTitle}>次回ランプテスト推奨</Text>
            <Text style={styles.testRecommendationText}>{testRecommendation.reason}</Text>
          </Pressable>
        )}

        {/* 自己ベスト */}
        {profile?.pbs && Object.values(profile.pbs).some(v => v) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>自己ベスト</Text>
            <View style={styles.gridContainer}>
              {(['m800', 'm1500', 'm3000', 'm5000'] as const).map((key) => {
                const pb = profile.pbs?.[key];
                if (!pb) return null;
                return (
                  <View
                    key={key}
                    style={[
                      styles.gridItem,
                      { borderLeftColor: DISTANCE_COLORS[key] },
                    ]}
                  >
                    <Text style={[styles.gridLabel, { color: DISTANCE_COLORS[key] }]}>
                      {RACE_COEFFICIENTS[key].label}
                    </Text>
                    <Text style={styles.gridValue}>{formatTime(pb)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* トレーニングゾーン */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>トレーニングゾーン</Text>
          <Text style={styles.etpBadge}>eTP: {formatKmPace(etp)} ({etp}秒/400m)</Text>
          <View style={styles.zonesTable}>
            {(Object.entries(zones) as [ZoneName, number][]).map(([zone, pace]) => (
              <View key={zone} style={styles.zoneRow}>
                <View style={styles.zoneInfo}>
                  <View
                    style={[
                      styles.zoneIndicator,
                      { backgroundColor: ZONE_COEFFICIENTS_V3[zone].color },
                    ]}
                  />
                  <Text style={styles.zoneName}>
                    {ZONE_COEFFICIENTS_V3[zone].label}
                    {zone === 'jog' && (
                      <Text style={styles.zoneNote}> (目安)</Text>
                    )}
                  </Text>
                </View>
                <View style={styles.zonePaces}>
                  <Text style={styles.zonePaceKm}>{formatKmPace(pace)}</Text>
                  <Text style={styles.zonePace400}>({pace}秒/400m)</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* レース予測タイム */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>レース予測タイム</Text>
          <View style={styles.gridContainer}>
            {Object.entries(RACE_COEFFICIENTS).map(([key, coef]) => {
              const predictedTime = Math.round(etp * coef.coefficient * coef.laps);
              return (
                <View
                  key={key}
                  style={[
                    styles.gridItem,
                    { borderLeftColor: DISTANCE_COLORS[key] },
                  ]}
                >
                  <Text style={[styles.gridLabel, { color: DISTANCE_COLORS[key] }]}>
                    {coef.label}
                  </Text>
                  <Text style={styles.gridValue}>{formatTime(predictedTime)}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.limiterNote}>
            {LIMITER_LABEL[limiter]}として調整
          </Text>
        </View>

        {/* クイックアクション */}
        <View style={styles.quickActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/test')}
          >
            <Ionicons name="stats-chart" size={18} color="#8B5CF6" />
            <Text style={styles.actionText}>ランプテスト</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/plan')}
          >
            <Ionicons name="document-text" size={18} color="#F97316" />
            <Text style={styles.actionText}>計画を見る</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Logo (for new users)
  logoContainer: {
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 4,
  },
  logoSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  emptyButton: {
    minWidth: 180,
  },

  // Page Title
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 20,
  },

  // Status Card
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  etpDisplay: {
    padding: 20,
    alignItems: 'center',
  },
  etpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  etpLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  etpSourceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  etpSourceText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  etpValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  etpKmPace: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  limiterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  // limiterIcon removed - using Ionicons directly
  limiterLabel: {
    fontSize: 13,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  metricValueBlue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  metricValueGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastTestDate: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 8,
  },

  // Section Label
  sectionLabel: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 8,
  },

  // Plan Card
  planCard: {
    marginBottom: 20,
  },
  planContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  planMeta: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  planTarget: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 8,
  },

  // Today Workout
  todayWorkout: {
    marginBottom: 20,
  },
  todayContent: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  todayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  todayHint: {
    fontSize: 13,
    color: '#a78bfa',
    marginTop: 4,
  },

  // Week Progress
  weekProgress: {
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDay: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressDayCompleted: {
    backgroundColor: COLORS.primary,
  },

  // Test Recommendation
  testRecommendation: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    marginBottom: 20,
  },
  testRecommendationTitle: {
    fontSize: 14,
    color: COLORS.warning,
    marginBottom: 4,
  },
  testRecommendationText: {
    fontSize: 13,
    color: COLORS.text.muted,
  },

  // Card Style
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  etpBadge: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },

  // Grid Layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: (width - 64) / 2 - 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  limiterNote: {
    fontSize: 11,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 12,
  },

  // Zones Table
  zonesTable: {
    gap: 4,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  zoneName: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  zoneNote: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
  zonePaces: {
    alignItems: 'flex-end',
  },
  zonePaceKm: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  zonePace400: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  // actionEmoji removed - using Ionicons directly
  actionText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
});
