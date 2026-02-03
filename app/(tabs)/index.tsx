// ============================================
// Dashboard - MidLabホーム画面
// コンテキスト対応・アニメーション強化版
// ============================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useProfileStore,
  useTestResultsStore,
  usePlanStore,
  useWorkoutLogsStore,
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
  calculateRacePredictions,
} from '../../src/utils';
import {
  Button,
  EmptyState,
  ActionCard,
  SectionHeader,
  StatCard,
  WeekProgress,
  EtpTrendChart,
  // アニメーション
  SlideIn,
  FadeIn,
} from '../../src/components/ui';
import { COLORS, ZONE_COEFFICIENTS_V3, RACE_COEFFICIENTS } from '../../src/constants';
import { ZoneName, LimiterType } from '../../src/types';

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
  const workoutLogs = useWorkoutLogsStore((state) => state.logs);

  const { etp, limiter, source } = useEffectiveValues();
  const stage = useUserStage();
  const zones = useTrainingZones();
  const vo2max = estimateVO2max(etp);
  const level = getLevelFromEtp(etp);

  const todayWorkout = activePlan ? getTodayWorkout(activePlan) : null;
  const weekProgress = activePlan ? getWeekProgress(activePlan) : null;
  const latestResult = results.length > 0 ? results[0] : null;

  // 新規ユーザー向けガイド（ウェルカム画面）
  if (stage === 'new') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.welcomeContent}>
          {/* ウェルカムヘッダー */}
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeIconContainer}>
              <Ionicons name="flash" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.welcomeTitle}>MidLabへようこそ</Text>
            <Text style={styles.welcomeSubtitle}>
              ETPテストであなたに最適なトレーニングを見つけましょう
            </Text>
          </View>

          {/* 3ステップガイド */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, styles.stepNumberActive]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>プロフィールを設定</Text>
                <Text style={styles.stepDesc}>基本情報と自己ベストを登録</Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberTextMuted}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitleMuted}>ETPテストを実施</Text>
                <Text style={styles.stepDesc}>持久力タイプを測定</Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberTextMuted}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitleMuted}>トレーニング開始</Text>
                <Text style={styles.stepDesc}>最適なペースで練習</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.welcomeCta}>
            <Button
              title="プロフィールを設定する"
              onPress={() => router.push('/settings')}
              fullWidth
              size="large"
            />
            <Text style={styles.welcomeHint}>
              約1分で完了します
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <FadeIn delay={0}>
          <Text style={styles.pageTitle}>ダッシュボード</Text>
        </FadeIn>

        {/* ステータスカード */}
        <SlideIn direction="up" delay={100}>
          <View style={styles.statusCard}>
          <View style={styles.etpDisplay}>
            <View style={styles.etpLabelRow}>
              <Text style={styles.etpLabel}>ETP</Text>
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
        </SlideIn>

        {/* ETP推移グラフ */}
        {results.length > 0 && (
          <SlideIn direction="up" delay={200}>
            <EtpTrendChart results={results} />
          </SlideIn>
        )}

        {/* 次のステップを促すカード */}
        {(source !== 'measured' || !activePlan) && (
          <View style={styles.nextStepsSection}>
            <SectionHeader
              title="次のステップ"
              icon="rocket-outline"
              iconColor={COLORS.secondary}
              variant="small"
            />

            {/* テスト未実施の場合の促進 */}
            {source !== 'measured' && (
              <ActionCard
                icon="analytics-outline"
                iconColor="#8B5CF6"
                title="ETPテストを実施"
                description="正確なETPとリミッタータイプを測定しましょう"
                onPress={() => router.push('/test')}
                variant="highlight"
                badge={source === 'estimated' ? '推奨' : undefined}
                style={styles.actionCardMargin}
              />
            )}

            {/* 計画未作成の場合の促進 */}
            {!activePlan && (
              <ActionCard
                icon="calendar-outline"
                iconColor="#F97316"
                title="トレーニング計画を作成"
                description="目標レースに向けた週間計画を自動生成"
                onPress={() => router.push('/plan')}
                variant={source === 'measured' ? 'highlight' : 'default'}
                style={styles.actionCardMargin}
              />
            )}
          </View>
        )}

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

        {/* 今日のトレーニング */}
        {todayWorkout && todayWorkout.type !== 'rest' && (
          <View style={styles.todayWorkout}>
            <Text style={styles.sectionLabel}>今日のトレーニング</Text>
            <Pressable
              style={styles.todayContent}
              onPress={() => router.push({
                pathname: '/(tabs)/workout',
                params: { category: todayWorkout.focusCategory || 'all' },
              })}
            >
              <Text style={styles.todayLabel}>{todayWorkout.label}</Text>
              <Text style={styles.todayHint}>タップして詳細を見る →</Text>
            </Pressable>
          </View>
        )}

        {/* 週間進捗 */}
        {weekProgress && (
          <View style={styles.weekProgressSection}>
            <SectionHeader
              title="今週の進捗"
              count={weekProgress.completed}
              subtitle={`${weekProgress.total}ワークアウト中`}
            />
            <View style={styles.weekProgressCard}>
              <WeekProgress
                completed={weekProgress.days}
                activeDay={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
                size="medium"
              />
            </View>
          </View>
        )}

        {/* レース予測タイム */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>レース予測タイム</Text>
          <View style={styles.predictionsGrid}>
            {(() => {
              const predictions = calculateRacePredictions(etp, limiter);
              return Object.entries(predictions).map(([key, prediction]) => {
                const pb = profile?.pbs?.[key as keyof typeof profile.pbs];
                return (
                  <View key={key} style={styles.predictionItem}>
                    <Text style={styles.predictionDistance}>
                      {RACE_COEFFICIENTS[key as keyof typeof RACE_COEFFICIENTS].label}
                    </Text>
                    <Text style={styles.predictionTime}>
                      {formatTime(prediction.min)}-{formatTime(prediction.max)}
                    </Text>
                    {pb && (
                      <Text style={styles.predictionPb}>PB: {formatTime(pb)}</Text>
                    )}
                  </View>
                );
              });
            })()}
          </View>
        </View>

        {/* トレーニングゾーン */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>トレーニングゾーン</Text>
          <Text style={styles.etpBadge}>ETP: {formatKmPace(etp)} ({etp}秒/400m)</Text>
          <View style={styles.zonesTable}>
            {(['jog', 'easy', 'marathon', 'threshold', 'interval', 'repetition'] as ZoneName[]).map((zone) => {
              const pace = zones[zone];
              return (
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
                    </Text>
                  </View>
                  <View style={styles.zonePaces}>
                    <Text style={styles.zonePaceKm}>{formatKmPace(pace)}</Text>
                    <Text style={styles.zonePace400}>({pace}秒/400m)</Text>
                  </View>
                </View>
              );
            })}
          </View>
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

  // ============================================
  // ウェルカム画面（新規ユーザー）
  // ============================================
  welcomeContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  stepsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepNumberTextMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  stepTitleMuted: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 15,
    marginVertical: 8,
  },
  welcomeCta: {
    alignItems: 'center',
  },
  welcomeHint: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: 12,
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

  // Week Progress（新デザイン）
  weekProgressSection: {
    marginBottom: 20,
  },
  weekProgressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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

  // レース予測・自己ベストグリッド（設定画面と同じ）
  predictionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  predictionItem: {
    width: '48%' as any,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  predictionDistance: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  predictionTime: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  predictionPb: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 4,
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

  // 次のステップセクション
  nextStepsSection: {
    marginBottom: 20,
  },
  actionCardMargin: {
    marginBottom: 10,
  },
});
