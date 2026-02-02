// ============================================
// Plan Screen - トレーニング計画 (rise-test準拠)
// ============================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlanStore,
  useProfileStore,
  useEffectiveValues,
} from '../../src/stores/useAppStore';
import { formatTime, formatKmPace, parseTime } from '../../src/utils';
import { Card, Button, SwipeableRow } from '../../src/components/ui';
import { PremiumGate } from '../../components/PremiumGate';
import { useIsPremium } from '../../store/useSubscriptionStore';
import {
  COLORS,
  PHASE_CONFIG,
  PHASE_DISTRIBUTION,
  DISTRIBUTION_BY_LIMITER,
  KEY_WORKOUTS_BY_PHASE,
  WEEKLY_DISTANCE_BY_EVENT,
  TAPER_CONFIG,
  PHYSIOLOGICAL_FOCUS_CATEGORIES,
} from '../../src/constants';
import {
  RacePlan,
  RaceDistance,
  Phase,
  PhaseType,
  WeeklyPlan,
  ScheduledWorkout,
  LimiterType,
  LoadDistribution,
} from '../../src/types';

type ViewType = 'overview' | 'create' | 'weekly' | 'full' | 'calendar';

// リミッターラベル
const LIMITER_LABEL: Record<LimiterType, string> = {
  cardio: '心肺リミッター型',
  muscular: '筋持久力リミッター型',
  balanced: 'バランス型',
};

// DistributionBar コンポーネント
function DistributionBar({ distribution }: { distribution: LoadDistribution }) {
  const total = distribution.easy + distribution.threshold + distribution.vo2max + distribution.speed;
  return (
    <View style={styles.distributionBar}>
      <View style={[styles.distributionSegment, { flex: distribution.easy, backgroundColor: '#3B82F6' }]} />
      <View style={[styles.distributionSegment, { flex: distribution.threshold, backgroundColor: '#EAB308' }]} />
      <View style={[styles.distributionSegment, { flex: distribution.vo2max, backgroundColor: '#F97316' }]} />
      <View style={[styles.distributionSegment, { flex: distribution.speed, backgroundColor: '#EF4444' }]} />
    </View>
  );
}

// DistributionLegend コンポーネント
function DistributionLegend({ distribution }: { distribution: LoadDistribution }) {
  return (
    <View style={styles.distributionLegend}>
      <View style={styles.distributionLegendItem}>
        <View style={[styles.distributionDot, { backgroundColor: '#3B82F6' }]} />
        <Text style={styles.distributionLegendText}>Easy {distribution.easy}%</Text>
      </View>
      <View style={styles.distributionLegendItem}>
        <View style={[styles.distributionDot, { backgroundColor: '#EAB308' }]} />
        <Text style={styles.distributionLegendText}>T {distribution.threshold}%</Text>
      </View>
      <View style={styles.distributionLegendItem}>
        <View style={[styles.distributionDot, { backgroundColor: '#F97316' }]} />
        <Text style={styles.distributionLegendText}>I {distribution.vo2max}%</Text>
      </View>
      <View style={styles.distributionLegendItem}>
        <View style={[styles.distributionDot, { backgroundColor: '#EF4444' }]} />
        <Text style={styles.distributionLegendText}>R {distribution.speed}%</Text>
      </View>
    </View>
  );
}

// PhaseBarV4 コンポーネント（現在週マーカー付き）
function PhaseBarV4({ phases, currentWeek, totalWeeks }: { phases: Phase[]; currentWeek: number; totalWeeks: number }) {
  const currentPosition = ((currentWeek - 0.5) / totalWeeks) * 100;

  return (
    <View style={styles.phaseBarContainer}>
      <View style={styles.phaseBar}>
        {phases.map((phase, i) => (
          <View
            key={i}
            style={[
              styles.phaseSegment,
              {
                flex: phase.weeks,
                backgroundColor: PHASE_CONFIG[phase.type].color,
              },
            ]}
          />
        ))}
      </View>
      {/* 現在週マーカー */}
      <View style={[styles.currentWeekMarker, { left: `${currentPosition}%` }]}>
        <View style={styles.currentWeekDot} />
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const isPremium = useIsPremium();
  const activePlan = usePlanStore((state) => state.activePlan);
  const setPlan = usePlanStore((state) => state.setPlan);
  const clearPlan = usePlanStore((state) => state.clearPlan);
  const markWorkoutComplete = usePlanStore((state) => state.markWorkoutComplete);
  const { etp, limiter } = useEffectiveValues();

  const [view, setView] = useState<ViewType>(activePlan ? 'overview' : 'create');

  // プレミアム機能チェック
  if (!isPremium) {
    return (
      <PremiumGate featureName="トレーニング計画">
        <View />
      </PremiumGate>
    );
  }
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // 計画作成フォーム
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [distance, setDistance] = useState<RaceDistance>(1500);
  const [targetTime, setTargetTime] = useState('');

  // 日付バリデーション
  const validateDate = (dateStr: string): { valid: boolean; error?: string } => {
    if (!dateStr) return { valid: false };

    // YYYY-MM-DD形式チェック
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateStr)) {
      return { valid: false, error: 'YYYY-MM-DD形式で入力' };
    }

    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, error: '無効な日付' };
    }

    // 過去日付チェック（今日以降であること）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return { valid: false, error: '過去の日付です' };
    }

    // 最低4週間後であること
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 28);
    if (parsedDate < minDate) {
      return { valid: false, error: '最低4週間後' };
    }

    return { valid: true };
  };

  const dateValidation = useMemo(() => validateDate(raceDate), [raceDate]);

  const handleCreatePlan = () => {
    if (!raceName || !dateValidation.valid) {
      Alert.alert('エラー', 'レース名と有効な日付を入力してください');
      return;
    }

    const parsedTarget = parseTime(targetTime);
    if (!parsedTarget) {
      Alert.alert('エラー', '目標タイムをM:SS形式で入力してください');
      return;
    }

    const plan = generatePlan({
      race: {
        name: raceName,
        date: new Date(raceDate).toISOString(),
        distance,
        targetTime: parsedTarget,
      },
      baseline: { etp, limiterType: limiter },
    });

    setPlan(plan);
    setView('overview');
  };

  const handleDeletePlan = () => {
    Alert.alert(
      '計画を削除',
      'この計画を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            clearPlan();
            setView('create');
          },
        },
      ]
    );
  };

  // 計画作成画面
  if (view === 'create') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PremiumGate featureName="トレーニング計画">
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          <Text style={styles.sectionTitle}>計画作成</Text>

          {/* レース名 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>レース名</Text>
            <TextInput
              style={styles.input}
              value={raceName}
              onChangeText={setRaceName}
              placeholder="〇〇記録会"
              placeholderTextColor={COLORS.text.muted}
            />
          </View>

          {/* レース日 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>レース日</Text>
            <TextInput
              style={[styles.input, dateValidation.error && styles.inputError]}
              value={raceDate}
              onChangeText={setRaceDate}
              placeholder="2024-06-15"
              placeholderTextColor={COLORS.text.muted}
            />
            {dateValidation.error && (
              <Text style={styles.inputErrorText}>{dateValidation.error}</Text>
            )}
          </View>

          {/* 種目 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>種目</Text>
            <View style={styles.distanceTabs}>
              {([800, 1500, 3000, 5000] as RaceDistance[]).map((d) => (
                <Pressable
                  key={d}
                  style={[styles.distanceTab, distance === d && styles.distanceTabActive]}
                  onPress={() => setDistance(d)}
                >
                  <Text style={[styles.distanceTabText, distance === d && styles.distanceTabTextActive]}>
                    {d}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 目標タイム */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>目標タイム</Text>
            <TextInput
              style={styles.input}
              value={targetTime}
              onChangeText={setTargetTime}
              placeholder="4:15"
              placeholderTextColor={COLORS.text.muted}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* 現在の状態 */}
          <View style={styles.currentStatus}>
            <Text style={styles.currentStatusTitle}>現在の状態</Text>
            <Text style={styles.currentStatusText}>eTP: {formatKmPace(etp)} ({etp}秒/400m)</Text>
            <Text style={styles.currentStatusText}>リミッター: {LIMITER_LABEL[limiter]}</Text>
          </View>

          <Button
            title="計画を生成"
            onPress={handleCreatePlan}
            fullWidth
            disabled={!raceName || !dateValidation.valid || !parseTime(targetTime)}
            style={StyleSheet.flatten([
              styles.createBtn,
              (!raceName || !dateValidation.valid || !parseTime(targetTime)) && styles.createBtnDisabled,
            ])}
          />

          {activePlan && (
            <Button
              title="戻る"
              onPress={() => setView('overview')}
              variant="outline"
              fullWidth
              style={styles.backBtn}
            />
          )}
        </ScrollView>
        </PremiumGate>
      </SafeAreaView>
    );
  }

  // 計画がない場合
  if (!activePlan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          <Text style={styles.sectionTitle}>計画</Text>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>まだ計画がありません</Text>
            <Button
              title="計画を作成"
              onPress={() => setView('create')}
              style={styles.createEmptyBtn}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 計算
  const raceDateObj = new Date(activePlan.race.date);
  const daysUntilRace = Math.ceil((raceDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = activePlan.weeklyPlans?.length || 0;

  // 現在の週を計算
  const firstWeekStart = activePlan.weeklyPlans?.[0]?.startDate
    ? new Date(activePlan.weeklyPlans[0].startDate)
    : new Date();
  const currentWeekNumber = totalWeeks > 0
    ? Math.min(
        Math.max(1, Math.ceil((new Date().getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1),
        totalWeeks
      )
    : 1;
  const currentWeekPlan = activePlan.weeklyPlans?.[currentWeekNumber - 1];

  // カレンダービュー
  if (view === 'calendar') {
    const calendarDays = generateCalendarDays(calendarMonth, activePlan);
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* ヘッダー */}
          <View style={styles.weeklyHeader}>
            <Pressable style={styles.backButton} onPress={() => setView('overview')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.weeklyTitle}>カレンダー</Text>
          </View>

          {/* 月ナビゲーション */}
          <View style={styles.calendarNav}>
            <Pressable
              style={styles.calendarNavBtn}
              onPress={() => {
                const prev = new Date(calendarMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCalendarMonth(prev);
              }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.calendarNavTitle}>
              {calendarMonth.getFullYear()}年 {monthNames[calendarMonth.getMonth()]}
            </Text>
            <Pressable
              style={styles.calendarNavBtn}
              onPress={() => {
                const next = new Date(calendarMonth);
                next.setMonth(next.getMonth() + 1);
                setCalendarMonth(next);
              }}
            >
              <Ionicons name="chevron-forward" size={24} color={COLORS.text.primary} />
            </Pressable>
          </View>

          {/* 曜日ヘッダー */}
          <View style={styles.calendarWeekHeader}>
            {['月', '火', '水', '木', '金', '土', '日'].map((day, i) => (
              <Text key={i} style={styles.calendarWeekDay}>{day}</Text>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, i) => (
              <Pressable
                key={i}
                style={[
                  styles.calendarCell,
                  day.isCurrentMonth && styles.calendarCellActive,
                  day.phaseColor && { borderLeftColor: day.phaseColor, borderLeftWidth: 3 },
                ]}
                onPress={() => {
                  if (day.weekNumber) {
                    setSelectedWeek(day.weekNumber);
                    setView('weekly');
                  }
                }}
              >
                <Text style={[
                  styles.calendarCellDate,
                  !day.isCurrentMonth && styles.calendarCellDateMuted,
                  day.isToday && styles.calendarCellDateToday,
                ]}>
                  {day.date}
                </Text>
                {day.workout && (
                  <View style={styles.calendarWorkoutIndicator}>
                    {(() => {
                      const iconInfo = getWorkoutIconInfo(day.workout.type);
                      return <Ionicons name={iconInfo.name as any} size={10} color={iconInfo.color} />;
                    })()}
                    {day.workout.completed && (
                      <View style={styles.calendarCompletedMark} />
                    )}
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* 凡例 */}
          <View style={styles.calendarLegend}>
            <Text style={styles.calendarLegendTitle}>凡例</Text>
            <View style={styles.calendarLegendItems}>
              <View style={styles.calendarLegendItem}>
                <Ionicons name="fitness" size={14} color="#F97316" style={styles.calendarLegendIcon} />
                <Text style={styles.calendarLegendText}>ワークアウト</Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <Ionicons name="walk" size={14} color="#3B82F6" style={styles.calendarLegendIcon} />
                <Text style={styles.calendarLegendText}>Easy</Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <Ionicons name="footsteps" size={14} color="#22C55E" style={styles.calendarLegendIcon} />
                <Text style={styles.calendarLegendText}>Long</Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <Ionicons name="bed" size={14} color="#6B7280" style={styles.calendarLegendIcon} />
                <Text style={styles.calendarLegendText}>休養</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 週間スケジュール画面
  if (view === 'weekly') {
    const weekPlan = activePlan.weeklyPlans?.[selectedWeek - 1];

    // 週間データがない場合のフォールバック表示
    if (!weekPlan) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
            <View style={styles.weeklyHeader}>
              <Pressable style={styles.backButton} onPress={() => setView('overview')}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </Pressable>
              <Text style={styles.weeklyTitle}>週間スケジュール</Text>
            </View>
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>週間データがありません</Text>
              <Text style={styles.emptySubText}>新しい計画を作成してください</Text>
              <Button
                title="計画を再作成"
                onPress={() => setView('create')}
                style={{ marginTop: 16 }}
              />
            </Card>
          </ScrollView>
        </SafeAreaView>
      );
    }

    const phase = PHASE_CONFIG[weekPlan.phaseType];

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* ヘッダー */}
          <View style={styles.weeklyHeader}>
            <Pressable style={styles.backButton} onPress={() => setView('overview')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.weeklyTitle}>
              第{weekPlan.weekNumber}週 ({phase?.label})
            </Text>
          </View>

          {/* 週間情報 */}
          <View style={styles.weekInfo}>
            <View style={styles.weekInfoRow}>
              <Text style={styles.weekInfoLabel}>フェーズ</Text>
              <Text style={[styles.weekInfoValue, { color: phase?.color }]}>{phase?.label}</Text>
            </View>
            {weekPlan.targetDistance != null && (
              <View style={styles.weekInfoRow}>
                <Text style={styles.weekInfoLabel}>目標距離</Text>
                <Text style={styles.weekInfoValue}>{Math.round(weekPlan.targetDistance / 1000)}km</Text>
              </View>
            )}
            {weekPlan.loadPercent != null && (
              <View style={styles.weekInfoRow}>
                <Text style={styles.weekInfoLabel}>負荷率</Text>
                <Text style={styles.weekInfoValue}>{weekPlan.loadPercent}%</Text>
              </View>
            )}
            {weekPlan.isRecoveryWeek && (
              <View style={styles.recoveryBadge}>
                <Text style={styles.recoveryBadgeText}>回復週</Text>
              </View>
            )}
            {weekPlan.isRiseTestWeek && (
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>ランプテスト週</Text>
              </View>
            )}
          </View>

          {/* 負荷配分バー */}
          {weekPlan.distribution && (
            <View style={styles.distributionSection}>
              <Text style={styles.distributionTitle}>負荷配分</Text>
              <DistributionBar distribution={weekPlan.distribution} />
              <DistributionLegend distribution={weekPlan.distribution} />
            </View>
          )}

          {/* 生理学的焦点 */}
          {weekPlan.focusKeys && weekPlan.focusKeys.length > 0 && (
            <View style={styles.focusSection}>
              <Text style={styles.focusTitle}>今週の生理学的焦点</Text>
              <View style={styles.focusItems}>
                  {weekPlan.focusKeys.map((focusKey, i) => {
                  const focus = PHYSIOLOGICAL_FOCUS_CATEGORIES[focusKey];
                  if (!focus) return null;
                  return (
                    <View key={i} style={[styles.focusItem, { borderColor: focus.color }]}>
                      <Ionicons name={focus.iconName as any} size={16} color={focus.color} style={styles.focusIconStyle} />
                      <Text style={styles.focusName}>{focus.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 日別スケジュール */}
          <View style={styles.daysContainer}>
            {weekPlan.days.map((day, i) => {
              if (!day) return null;
              const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
              const focus = day.focusKey ? PHYSIOLOGICAL_FOCUS_CATEGORIES[day.focusKey] : null;
              const isRestDay = day.type === 'rest';
              return (
                <SwipeableRow
                  key={i}
                  onSwipeComplete={() => markWorkoutComplete(weekPlan.weekNumber, day.id)}
                  disabled={isRestDay}
                  completed={day.completed}
                >
                  <View
                    style={[
                      styles.dayRow,
                      day.completed && styles.dayRowCompleted,
                      focus && { borderLeftColor: focus.color, borderLeftWidth: 3 },
                    ]}
                  >
                    <Text style={styles.dayName}>{dayNames[i]}</Text>
                    <View style={styles.dayContent}>
                      <View style={styles.dayMainRow}>
                        {(() => {
                          const iconInfo = getWorkoutIconInfo(day.type);
                          return <Ionicons name={iconInfo.name as any} size={14} color={iconInfo.color} style={styles.dayIconStyle} />;
                        })()}
                        <Text style={[styles.dayLabel, day.isKey && styles.dayLabelKey]}>
                          {day.label}
                        </Text>
                        {day.isKey && <Text style={styles.dayKeyBadge}>Key</Text>}
                      </View>
                      {focus && day.type === 'workout' && (
                        <Text style={[styles.dayFocusDesc, { color: focus.color }]}>
                          {focus.description}
                        </Text>
                      )}
                    </View>
                    {day.completed ? (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    ) : isRestDay ? (
                      <View style={styles.dayRestIndicator} />
                    ) : (
                      <Text style={styles.swipeHint}>→</Text>
                    )}
                  </View>
                </SwipeableRow>
              );
            })}
          </View>

          {/* スワイプヒント */}
          <Text style={styles.swipeHintText}>← 右にスワイプで完了</Text>

          {/* ナビゲーション */}
          <View style={styles.weekNavigation}>
            <Pressable
              style={[styles.weekNavBtn, selectedWeek <= 1 && styles.weekNavBtnDisabled]}
              onPress={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek <= 1}
            >
              <Text style={[styles.weekNavBtnText, selectedWeek <= 1 && styles.weekNavBtnTextDisabled]}>
                ← 前週
              </Text>
            </Pressable>
            <Pressable
              style={[styles.weekNavBtn, selectedWeek >= totalWeeks && styles.weekNavBtnDisabled]}
              onPress={() => setSelectedWeek((w) => Math.min(totalWeeks, w + 1))}
              disabled={selectedWeek >= totalWeeks}
            >
              <Text style={[styles.weekNavBtnText, selectedWeek >= totalWeeks && styles.weekNavBtnTextDisabled]}>
                次週 →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 全体俯瞰画面
  if (view === 'full') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* ヘッダー */}
          <View style={styles.weeklyHeader}>
            <Pressable style={styles.backButton} onPress={() => setView('overview')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.weeklyTitle}>全体計画 ({totalWeeks}週間)</Text>
          </View>

          {/* 予実サマリー */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>進捗サマリー</Text>
            {(() => {
              const totalKeyWorkouts = activePlan.weeklyPlans?.reduce((sum, w) =>
                sum + w.days.filter(d => d?.isKey).length, 0) || 0;
              const completedKeyWorkouts = activePlan.weeklyPlans?.reduce((sum, w) =>
                sum + w.days.filter(d => d?.isKey && d?.completed).length, 0) || 0;
              const progressPercent = totalKeyWorkouts > 0 ? Math.round((completedKeyWorkouts / totalKeyWorkouts) * 100) : 0;

              return (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>キーワークアウト達成</Text>
                    <Text style={styles.summaryValue}>{completedKeyWorkouts} / {totalKeyWorkouts}</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progressPercent}%達成</Text>
                </>
              );
            })()}
          </View>

          {/* 週一覧 */}
          <View style={styles.fullWeeksList}>
            {activePlan.weeklyPlans?.map((week, i) => {
              const phase = PHASE_CONFIG[week.phaseType];
              const isCurrent = week.weekNumber === currentWeekNumber;
              const completedCount = week.days.filter((d) => d?.completed).length;
              const totalCount = week.days.filter((d) => d && d.type !== 'rest').length;

              return (
                <Pressable
                  key={i}
                  style={[styles.fullWeekItem, isCurrent && styles.fullWeekItemCurrent]}
                  onPress={() => {
                    setSelectedWeek(week.weekNumber);
                    setView('weekly');
                  }}
                >
                  <View style={[styles.fullWeekPhaseBar, { backgroundColor: phase?.color }]} />
                  <View style={styles.fullWeekContent}>
                    <View style={styles.fullWeekHeader}>
                      <Text style={styles.fullWeekNumber}>W{week.weekNumber}</Text>
                      <Text style={styles.fullWeekPhase}>{phase?.label}</Text>
                      {week.isRecoveryWeek && <Text style={styles.fullWeekRecovery}>回復週</Text>}
                      {week.isRiseTestWeek && <Text style={styles.fullWeekTest}>Test</Text>}
                    </View>
                    {(week.targetDistance != null || week.loadPercent != null) && (
                      <View style={styles.fullWeekMeta}>
                        {week.targetDistance != null && (
                          <Text style={styles.fullWeekDistance}>{Math.round(week.targetDistance / 1000)}km</Text>
                        )}
                        {week.loadPercent != null && (
                          <Text style={styles.fullWeekLoad}>{week.loadPercent}%</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <Text style={styles.fullWeekProgress}>
                    {completedCount}/{totalCount}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 概要画面（overview）
  // 古いプランデータの検出
  const isPlanValid = activePlan.weeklyPlans && activePlan.weeklyPlans.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <Text style={styles.sectionTitle}>計画</Text>

        {/* 古いデータ警告 */}
        {!isPlanValid && (
          <Card style={styles.warningCard}>
            <Ionicons name="warning" size={32} color="#F59E0B" style={styles.warningIconStyle} />
            <Text style={styles.warningText}>古い形式の計画データです</Text>
            <Text style={styles.warningSubText}>
              新しい機能を使用するには計画を再作成してください
            </Text>
            <Button
              title="計画を再作成"
              onPress={() => setView('create')}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* レースカウントダウン */}
        <View style={styles.raceCountdown}>
          <View style={styles.raceCountdownLabelRow}>
            <Ionicons name="flag" size={14} color="#F97316" style={styles.raceIcon} />
            <Text style={styles.raceCountdownLabel}>{activePlan.race.name}</Text>
          </View>
          <Text style={styles.raceCountdownDays}>
            あと {daysUntilRace}日 ({Math.ceil(daysUntilRace / 7)}週間)
          </Text>
          <Text style={styles.raceCountdownTarget}>
            目標: {formatTime(activePlan.race.targetTime)}
          </Text>
        </View>

        {/* フェーズ進捗（PhaseBarV4） */}
        {activePlan.phases && (
          <View style={styles.phaseSection}>
            <Text style={styles.phaseSectionTitle}>フェーズ進捗</Text>
            <PhaseBarV4
              phases={activePlan.phases}
              currentWeek={currentWeekNumber}
              totalWeeks={totalWeeks}
            />
            <View style={styles.phaseLegend}>
              {activePlan.phases.map((phase, i) => (
                <View key={i} style={styles.phaseLegendItem}>
                  <View style={[styles.phaseLegendDot, { backgroundColor: PHASE_CONFIG[phase.type].color }]} />
                  <Text style={styles.phaseLegendText}>{PHASE_CONFIG[phase.type].label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.phaseCurrentText}>
              現在: 第{currentWeekNumber}週 / {currentWeekPlan ? PHASE_CONFIG[currentWeekPlan.phaseType].label : ''}
            </Text>
          </View>
        )}

        {/* 今週のカード */}
        {currentWeekPlan && (
          <View style={styles.thisWeekCard}>
            <View style={styles.thisWeekHeader}>
              <Text style={styles.thisWeekTitle}>
                今週: {PHASE_CONFIG[currentWeekPlan.phaseType].label}
              </Text>
              {currentWeekPlan.isRecoveryWeek && (
                <View style={styles.recoveryBadgeSmall}>
                  <Text style={styles.recoveryBadgeSmallText}>回復週</Text>
                </View>
              )}
            </View>

            {/* 週間サマリー */}
            {(currentWeekPlan.targetDistance != null || currentWeekPlan.loadPercent != null) && (
              <View style={styles.weekSummary}>
                {currentWeekPlan.targetDistance != null && (
                  <View style={styles.weekSummaryItem}>
                    <Text style={styles.weekSummaryLabel}>目標距離</Text>
                    <Text style={styles.weekSummaryValue}>{Math.round(currentWeekPlan.targetDistance / 1000)}km</Text>
                  </View>
                )}
                {currentWeekPlan.loadPercent != null && (
                  <View style={styles.weekSummaryItem}>
                    <Text style={styles.weekSummaryLabel}>負荷率</Text>
                    <Text style={styles.weekSummaryValue}>{currentWeekPlan.loadPercent}%</Text>
                  </View>
                )}
              </View>
            )}

            {/* 負荷配分バー */}
            {currentWeekPlan.distribution && (
              <View style={styles.thisWeekDistribution}>
                <DistributionBar distribution={currentWeekPlan.distribution} />
                <DistributionLegend distribution={currentWeekPlan.distribution} />
              </View>
            )}

            {/* 生理学的焦点 */}
            {currentWeekPlan.focusKeys && currentWeekPlan.focusKeys.length > 0 && (
              <View style={styles.thisWeekFocus}>
                <View style={styles.focusTitleRow}>
                  <Ionicons name="flame" size={14} color="#F97316" />
                  <Text style={styles.thisWeekFocusTitle}>生理学的焦点</Text>
                </View>
                <View style={styles.focusItems}>
                  {currentWeekPlan.focusKeys.map((focusKey, i) => {
                    const focus = PHYSIOLOGICAL_FOCUS_CATEGORIES[focusKey];
                    if (!focus) return null;
                    return (
                      <View key={i} style={[styles.focusItemSmall, { borderColor: focus.color }]}>
                        <Ionicons name={focus.iconName as any} size={12} color={focus.color} style={styles.focusIconSmallStyle} />
                        <Text style={styles.focusNameSmall}>{focus.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* キーワークアウト */}
            <View style={styles.keyWorkoutsSection}>
              <View style={styles.keyWorkoutsTitleRow}>
                <Ionicons name="document-text" size={14} color="#F97316" />
                <Text style={styles.keyWorkoutsTitle}>今週のキーワークアウト</Text>
              </View>
              {currentWeekPlan.days.filter((d) => d?.isKey).map((d, i) => {
                const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
                if (!d) return null;
                const focus = d.focusKey ? PHYSIOLOGICAL_FOCUS_CATEGORIES[d.focusKey] : null;
                return (
                  <View key={i} style={styles.keyWorkoutItem}>
                    {(() => {
                      const iconInfo = getWorkoutIconInfo(d.type);
                      return <Ionicons name={iconInfo.name as any} size={14} color={iconInfo.color} />;
                    })()}
                    <Text style={styles.keyWorkoutDay}>{dayNames[d.dayOfWeek]}</Text>
                    <Text style={[styles.keyWorkoutLabel, focus && { color: focus.color }]}>{d.label}</Text>
                    {d.completed && (
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              setSelectedWeek(currentWeekNumber);
              setView('weekly');
            }}
          >
            <Text style={styles.actionBtnText}>今週の詳細</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => setView('calendar')}
          >
            <Text style={styles.actionBtnText}>カレンダー</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => setView('full')}
          >
            <Text style={styles.actionBtnText}>全体を見る</Text>
          </Pressable>
        </View>

        {/* 管理ボタン */}
        <View style={styles.managementButtons}>
          <Pressable style={styles.mgmtBtn} onPress={() => setView('create')}>
            <Text style={styles.mgmtBtnText}>新規作成</Text>
          </Pressable>
          <Pressable style={styles.mgmtBtn} onPress={handleDeletePlan}>
            <Text style={styles.mgmtBtnText}>計画を削除</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Helper Functions
// ============================================

interface WorkoutIconInfo {
  name: string;
  color: string;
}

function getWorkoutIconInfo(type: string): WorkoutIconInfo {
  switch (type) {
    case 'workout': return { name: 'fitness', color: '#F97316' };
    case 'easy': return { name: 'walk', color: '#3B82F6' };
    case 'long': return { name: 'footsteps', color: '#22C55E' };
    case 'rest': return { name: 'bed', color: '#6B7280' };
    case 'test': return { name: 'stats-chart', color: '#8B5CF6' };
    default: return { name: 'fitness', color: '#F97316' };
  }
}

interface GeneratePlanParams {
  race: {
    name: string;
    date: string;
    distance: RaceDistance;
    targetTime: number;
  };
  baseline: {
    etp: number;
    limiterType: LimiterType;
  };
}

function generatePlan({ race, baseline }: GeneratePlanParams): RacePlan {
  const today = new Date();
  const raceDate = new Date(race.date);
  const weeksUntilRace = Math.floor((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));

  // 準備期間分類
  const distribution = weeksUntilRace >= 16 ? 'long'
    : weeksUntilRace >= 10 ? 'medium'
    : weeksUntilRace >= 6 ? 'short'
    : 'minimal';

  const phaseConfig = PHASE_DISTRIBUTION[distribution as keyof typeof PHASE_DISTRIBUTION];
  const phases: Array<{ type: PhaseType; startWeek: number; endWeek: number; weeks: number }> = [];
  let currentWeek = 1;

  // フェーズ配分（ピリオダイゼーションの原則）
  (['base', 'build', 'peak', 'taper'] as PhaseType[]).forEach(type => {
    const [min, max] = phaseConfig[type].weeks;
    const weeks = Math.min(max, Math.max(min, Math.floor(weeksUntilRace * (max / 16))));
    if (weeks > 0) {
      phases.push({
        type,
        startWeek: currentWeek,
        endWeek: currentWeek + weeks - 1,
        weeks,
      });
      currentWeek += weeks;
    }
  });

  // 月1回のランプテストを設定（約4週間ごと）
  const riseTestWeeks: number[] = [];
  const testInterval = 4;
  for (let w = testInterval; w <= weeksUntilRace && w < 20; w += testInterval) {
    const weekPhase = phases.find(p => w >= p.startWeek && w <= p.endWeek);
    if (weekPhase && weekPhase.type !== 'taper') {
      riseTestWeeks.push(w);
    }
  }
  // 基礎期の終わりにもテストを推奨
  const basePhase = phases.find(p => p.type === 'base');
  if (basePhase && !riseTestWeeks.includes(basePhase.endWeek)) {
    riseTestWeeks.push(basePhase.endWeek);
    riseTestWeeks.sort((a, b) => a - b);
  }

  // 週間プラン生成
  const weeklyPlans: WeeklyPlan[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // 次の月曜日

  // 種目別週間距離を取得
  const eventDistance = WEEKLY_DISTANCE_BY_EVENT[race.distance] || WEEKLY_DISTANCE_BY_EVENT[1500];

  for (let w = 0; w < weeksUntilRace && w < 20; w++) {
    const weekNumber = w + 1;
    const phase = phases.find(p => weekNumber >= p.startWeek && weekNumber <= p.endWeek);
    const phaseType = phase?.type || 'base';
    const dist = DISTRIBUTION_BY_LIMITER[phaseType]?.[baseline.limiterType] || DISTRIBUTION_BY_LIMITER.base.balanced;

    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // フェーズ内での週の位置（0〜1）を計算
    const weeksIntoPhase = weekNumber - (phase?.startWeek || 1);
    const phaseLength = phase?.weeks || 1;
    const phaseProgress = weeksIntoPhase / phaseLength;

    // 回復週判定（3週ごと）
    const isRecoveryWeek = weeksIntoPhase > 0 && weeksIntoPhase % 3 === 0;

    // 基準距離を計算
    let baseDistance = eventDistance[phaseType] || 50000;

    // テーパー期の負荷減衰
    if (phaseType === 'taper') {
      const taperConfig = TAPER_CONFIG[baseline.limiterType] || TAPER_CONFIG.balanced;
      const volumeMultiplier = 1 - (taperConfig.volumeReduction * phaseProgress);
      baseDistance = Math.round(eventDistance.peak * volumeMultiplier);
    } else if (isRecoveryWeek) {
      baseDistance = Math.round(baseDistance * 0.7);
    } else {
      const progressionMultiplier = 1 + (phaseProgress * 0.1);
      baseDistance = Math.round(baseDistance * progressionMultiplier);
    }

    // 負荷率計算
    const loadPercent = isRecoveryWeek ? 70 :
      phaseType === 'taper' ? Math.round(100 - (phaseProgress * 50)) :
      Math.round(PHASE_CONFIG[phaseType].loadRange[0] + (phaseProgress * 10));

    // キーワークアウトカテゴリを取得
    const phaseKeyCategories = KEY_WORKOUTS_BY_PHASE[phaseType]?.categories || ['有酸素ベース'];
    const phaseFocusKeys = KEY_WORKOUTS_BY_PHASE[phaseType]?.focusKeys || ['aerobic'];

    // ランプテストの週かどうか
    const isRiseTestWeek = riseTestWeeks.includes(weekNumber);

    // 日ごとのスケジュール
    const days = generateWeeklySchedule(
      phaseType,
      phaseFocusKeys,
      isRecoveryWeek,
      isRiseTestWeek,
      baseline.limiterType,
      weekNumber
    );

    weeklyPlans.push({
      weekNumber,
      phaseType,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      targetDistance: baseDistance,
      loadPercent,
      distribution: dist,
      days,
      workouts: days.filter((d): d is ScheduledWorkout => d !== null),
      keyWorkouts: days.filter(d => d?.isKey).map(d => d?.focusKey || d?.label || ''),
      keyFocusCategories: phaseKeyCategories,
      focusKeys: phaseFocusKeys,
      isRecoveryWeek,
      isRiseTestWeek,
    });
  }

  // Phase型に変換
  const phasesForPlan: Phase[] = phases.map(p => {
    const weekPlan = weeklyPlans.find(w => w.weekNumber === p.startWeek);
    const endWeekPlan = weeklyPlans.find(w => w.weekNumber === p.endWeek);
    return {
      type: p.type,
      startDate: weekPlan?.startDate || startDate.toISOString(),
      endDate: endWeekPlan?.endDate || startDate.toISOString(),
      weeks: p.weeks,
    };
  });

  // ランプテスト日程をISO文字列に変換
  const riseTestDates = riseTestWeeks.map(w => {
    const weekPlan = weeklyPlans.find(wp => wp.weekNumber === w);
    if (weekPlan) {
      const testDate = new Date(weekPlan.startDate);
      testDate.setDate(testDate.getDate() + 3); // 木曜日
      return testDate.toISOString();
    }
    return '';
  }).filter(d => d !== '');

  return {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    race: {
      name: race.name,
      date: race.date,
      distance: race.distance,
      targetTime: race.targetTime,
    },
    baseline: {
      etp: baseline.etp,
      limiterType: baseline.limiterType,
    },
    phases: phasesForPlan,
    weeklyPlans,
    riseTestDates,
  };
}

function generateWeeklySchedule(
  phaseType: PhaseType,
  focusKeys: string[],
  isRecoveryWeek: boolean,
  isRiseTestWeek: boolean,
  limiterType: LimiterType,
  weekNumber: number
): (ScheduledWorkout | null)[] {
  const days: (ScheduledWorkout | null)[] = [];

  if (isRecoveryWeek) {
    // 回復週：キーワークアウトを減らす
    const focus = PHYSIOLOGICAL_FOCUS_CATEGORIES[focusKeys[0]];
    days.push(
      { id: `w${weekNumber}-d0`, dayOfWeek: 0, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d1`, dayOfWeek: 1, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d2`, dayOfWeek: 2, type: 'rest', label: '休養', isKey: false, completed: false },
      { id: `w${weekNumber}-d3`, dayOfWeek: 3, type: 'workout', label: focus?.name || '有酸素ベース', isKey: true, completed: false, focusKey: focusKeys[0], focusCategory: focus?.menuCategory },
      { id: `w${weekNumber}-d4`, dayOfWeek: 4, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d5`, dayOfWeek: 5, type: 'long', label: '有酸素ベース（Long）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d6`, dayOfWeek: 6, type: 'rest', label: '休養', isKey: false, completed: false },
    );
  } else if (isRiseTestWeek) {
    // ランプテスト週
    const focus = PHYSIOLOGICAL_FOCUS_CATEGORIES[focusKeys[0]];
    days.push(
      { id: `w${weekNumber}-d0`, dayOfWeek: 0, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d1`, dayOfWeek: 1, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d2`, dayOfWeek: 2, type: 'rest', label: '休養', isKey: false, completed: false },
      { id: `w${weekNumber}-d3`, dayOfWeek: 3, type: 'test', label: 'ランプテスト', isKey: true, completed: false, focusKey: 'test' },
      { id: `w${weekNumber}-d4`, dayOfWeek: 4, type: 'rest', label: '休養', isKey: false, completed: false },
      { id: `w${weekNumber}-d5`, dayOfWeek: 5, type: 'workout', label: focus?.name || '有酸素ベース', isKey: true, completed: false, focusKey: focusKeys[0], focusCategory: focus?.menuCategory },
      { id: `w${weekNumber}-d6`, dayOfWeek: 6, type: 'rest', label: '休養', isKey: false, completed: false },
    );
  } else {
    // 通常週：フェーズに応じた2つのキーワークアウト
    const primaryFocus = focusKeys[0] || 'aerobic';
    const secondaryFocus = focusKeys[1] || focusKeys[0] || 'threshold';
    const primary = PHYSIOLOGICAL_FOCUS_CATEGORIES[primaryFocus];
    const secondary = PHYSIOLOGICAL_FOCUS_CATEGORIES[secondaryFocus];

    days.push(
      { id: `w${weekNumber}-d0`, dayOfWeek: 0, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d1`, dayOfWeek: 1, type: 'workout', label: primary?.name || '有酸素ベース', isKey: true, completed: false, focusKey: primaryFocus, focusCategory: primary?.menuCategory },
      { id: `w${weekNumber}-d2`, dayOfWeek: 2, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d3`, dayOfWeek: 3, type: 'workout', label: secondary?.name || '乳酸閾値', isKey: true, completed: false, focusKey: secondaryFocus, focusCategory: secondary?.menuCategory },
      { id: `w${weekNumber}-d4`, dayOfWeek: 4, type: 'easy', label: '有酸素ベース（Easy）', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d5`, dayOfWeek: 5, type: 'long', label: '有酸素ベース（Long）', isKey: true, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
      { id: `w${weekNumber}-d6`, dayOfWeek: 6, type: 'rest', label: '休養', isKey: false, completed: false },
    );
  }

  return days;
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  weekNumber?: number;
  phaseColor?: string;
  workout?: ScheduledWorkout;
}

function generateCalendarDays(month: Date, plan: RacePlan): CalendarDay[] {
  const days: CalendarDay[] = [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  // 月の最初の日の曜日（0=日, 1=月, ...）を月曜始まりに変換
  let startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 前月の日付を埋める
  const prevMonth = new Date(year, monthIndex, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonth.getDate() - i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // 今月の日付
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currentDate = new Date(year, monthIndex, d);
    currentDate.setHours(0, 0, 0, 0);

    // 週を見つける
    let weekNumber: number | undefined;
    let phaseColor: string | undefined;
    let workout: ScheduledWorkout | undefined;

    for (const week of plan.weeklyPlans || []) {
      const weekStart = new Date(week.startDate);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(week.endDate);
      weekEnd.setHours(23, 59, 59, 999);

      if (currentDate >= weekStart && currentDate <= weekEnd) {
        weekNumber = week.weekNumber;
        phaseColor = PHASE_CONFIG[week.phaseType].color;

        const dayOfWeek = (currentDate.getDay() + 6) % 7;
        workout = week.days[dayOfWeek] || undefined;
        break;
      }
    }

    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: currentDate.getTime() === today.getTime(),
      weekNumber,
      phaseColor,
      workout,
    });
  }

  // 来月の日付を埋める（6週間分になるように）
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return days;
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

  // Create Screen
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  distanceTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 4,
  },
  distanceTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  distanceTabActive: {
    backgroundColor: COLORS.primary,
  },
  distanceTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  distanceTabTextActive: {
    color: '#fff',
  },
  currentStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  currentStatusTitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  currentStatusText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  createBtn: {
    marginBottom: 12,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  backBtn: {
    marginTop: 4,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  createEmptyBtn: {
    minWidth: 160,
  },
  // Warning Card
  warningCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningIconStyle: {
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningSubText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Race Countdown
  raceCountdown: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  raceCountdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  raceIcon: {
    marginRight: 2,
  },
  raceCountdownLabel: {
    fontSize: 14,
    color: '#F97316',
  },
  raceCountdownDays: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  raceCountdownTarget: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // Phase Bar Container
  phaseBarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  phaseBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  phaseSegment: {
    height: '100%',
  },
  currentWeekMarker: {
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },
  currentWeekDot: {
    width: 12,
    height: 16,
    backgroundColor: COLORS.text.primary,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: COLORS.background.dark,
  },

  // Phase Section
  phaseSection: {
    marginBottom: 20,
  },
  phaseSectionTitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  phaseLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  phaseLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phaseLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseLegendText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  phaseCurrentText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Distribution Bar
  distributionBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  distributionSegment: {
    height: '100%',
  },
  distributionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  distributionLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distributionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  distributionLegendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  distributionSection: {
    marginBottom: 16,
  },
  distributionTitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 8,
  },

  // Focus Section
  focusSection: {
    marginBottom: 16,
  },
  focusTitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  focusItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  focusIconStyle: {
    marginRight: 6,
  },
  focusName: {
    fontSize: 13,
    color: COLORS.text.primary,
  },
  focusItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  focusIconSmallStyle: {
    marginRight: 4,
  },
  focusNameSmall: {
    fontSize: 11,
    color: COLORS.text.primary,
  },

  // This Week Card
  thisWeekCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  thisWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thisWeekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  weekSummary: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  weekSummaryItem: {
    flex: 1,
  },
  weekSummaryLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  weekSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  thisWeekDistribution: {
    marginBottom: 12,
  },
  thisWeekFocus: {
    marginBottom: 12,
  },
  focusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  thisWeekFocusTitle: {
    fontSize: 12,
    color: '#F97316',
  },
  keyWorkoutsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
  },
  keyWorkoutsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  keyWorkoutsTitle: {
    fontSize: 12,
    color: '#F97316',
  },
  keyWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  // keyWorkoutIcon removed - using Ionicons directly
  keyWorkoutDay: {
    fontSize: 13,
    color: COLORS.text.secondary,
    width: 24,
  },
  keyWorkoutLabel: {
    fontSize: 14,
    color: '#60A5FA',
    flex: 1,
  },

  // Recovery/Test Badges
  recoveryBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  recoveryBadgeText: {
    fontSize: 12,
    color: '#22C55E',
  },
  recoveryBadgeSmall: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  recoveryBadgeSmallText: {
    fontSize: 10,
    color: '#22C55E',
  },
  testBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testBadgeText: {
    fontSize: 12,
    color: '#3B82F6',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },

  // Management Buttons
  managementButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mgmtBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    alignItems: 'center',
  },
  mgmtBtnText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // Weekly View
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  weeklyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  weekInfo: {
    marginBottom: 20,
  },
  weekInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weekInfoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  weekInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  daysContainer: {
    marginBottom: 24,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderLeftWidth: 0,
  },
  dayRowCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  dayName: {
    fontSize: 14,
    color: COLORS.text.secondary,
    width: 24,
  },
  dayContent: {
    flex: 1,
  },
  dayMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayIconStyle: {
    marginRight: 4,
  },
  dayLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  dayLabelKey: {
    color: '#60A5FA',
    fontWeight: '500',
  },
  dayFocusDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  dayKeyBadge: {
    fontSize: 10,
    color: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  dayCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    borderRadius: 12,
  },
  dayRestIndicator: {
    width: 24,
    height: 24,
  },
  swipeHint: {
    fontSize: 18,
    color: COLORS.text.muted,
    opacity: 0.5,
  },
  swipeHintText: {
    fontSize: 11,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekNavBtn: {
    padding: 12,
  },
  weekNavBtnDisabled: {
    opacity: 0.3,
  },
  weekNavBtnText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  weekNavBtnTextDisabled: {
    color: COLORS.text.muted,
  },

  // Full View
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.success,
    textAlign: 'center',
  },
  fullWeeksList: {
    gap: 8,
  },
  fullWeekItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  fullWeekItemCurrent: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  fullWeekPhaseBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  fullWeekContent: {
    flex: 1,
  },
  fullWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullWeekNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  fullWeekPhase: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  fullWeekRecovery: {
    fontSize: 10,
    color: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  fullWeekTest: {
    fontSize: 10,
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  fullWeekMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  fullWeekDistance: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  fullWeekLoad: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  fullWeekProgress: {
    fontSize: 13,
    color: COLORS.text.muted,
  },

  // Calendar View
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavBtn: {
    padding: 8,
  },
  calendarNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text.muted,
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarCellActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  calendarCellDate: {
    fontSize: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  calendarCellDateMuted: {
    color: COLORS.text.muted,
  },
  calendarCellDateToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  calendarWorkoutIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  // calendarWorkoutIcon removed - using Ionicons directly
  calendarCompletedMark: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.success,
    marginLeft: 2,
  },
  calendarLegend: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
  },
  calendarLegendTitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  calendarLegendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarLegendIcon: {
    marginRight: 2,
  },
  calendarLegendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
});
