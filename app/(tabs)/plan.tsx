// ============================================
// Plan Screen - トレーニング計画画面（簡素化版）
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
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
import { Card, Button, DatePickerModal } from '../../src/components/ui';
import { FadeIn, SlideIn, AnimatedPressable } from '../../src/components/ui/Animated';
import { PremiumGate } from '../../components/PremiumGate';
import { useIsPremium } from '../../store/useSubscriptionStore';
import {
  COLORS,
  PHASE_CONFIG,
} from '../../src/constants';
import {
  RacePlan,
  RaceDistance,
  ScheduledWorkout,
} from '../../src/types';
import { generatePlan } from '../../src/utils/planGenerator';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { SwipeBackView } from '../../components/SwipeBackView';
import { useIsFocused } from '@react-navigation/native';

// シンプルなビュータイプ（3つに削減）
type ViewType = 'overview' | 'create' | 'weekly';

export default function PlanScreen() {
  const router = useRouter();
  const isPremium = useIsPremium();
  const activePlan = usePlanStore((state) => state.activePlan);
  const setPlan = usePlanStore((state) => state.setPlan);
  const clearPlan = usePlanStore((state) => state.clearPlan);
  const toggleWorkoutComplete = usePlanStore((state) => state.toggleWorkoutComplete);
  const { etp, limiter } = useEffectiveValues();
  const profile = useProfileStore((state) => state.profile);

  const [view, setView] = useState<ViewType>(activePlan ? 'overview' : 'create');
  const setSubScreenOpen = useSetSubScreenOpen();
  const isFocused = useIsFocused();

  // フォーカス中のタブのみフラグを制御（タブ間の競合を防止）
  useEffect(() => {
    if (isFocused) {
      setSubScreenOpen(view === 'weekly');
    }
  }, [view, isFocused, setSubScreenOpen]);

  const [selectedWeek, setSelectedWeek] = useState(1);

  // 計画作成フォーム
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState<Date | null>(null);
  const [distance, setDistance] = useState<RaceDistance>(1500);
  const [restDay, setRestDay] = useState<number>(6); // 休養日: デフォルト日曜（6）
  const [keyDays, setKeyDays] = useState<number[]>([2, 5]); // Key曜日: デフォルト水・土
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 日付バリデーション
  // ※ Hooks（useMemo）は条件分岐の前に配置する必要がある（Rules of Hooks）
  const validateDate = (date: Date | null): { valid: boolean; error?: string } => {
    if (!date) return { valid: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return { valid: false, error: '過去の日付です' };
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 28);
    if (date < minDate) return { valid: false, error: '最低4週間後の日付を選択してください' };
    return { valid: true };
  };

  const dateValidation = useMemo(() => validateDate(raceDate), [raceDate]);

  const minDateForPicker = useMemo(() => {
    const min = new Date();
    min.setDate(min.getDate() + 28);
    return min;
  }, []);

  // プレミアム機能チェック
  if (!isPremium) {
    return (
      <PremiumGate featureName="トレーニング計画">
        <View />
      </PremiumGate>
    );
  }

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const handleCreatePlan = () => {
    if (!raceName || !dateValidation.valid || !raceDate) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }
    const plan = generatePlan({
      race: { name: raceName, date: raceDate.toISOString(), distance },
      baseline: { etp, limiterType: limiter },
      restDay,
      keyWorkoutDays: keyDays,
      ageCategory: profile.ageCategory,
      experience: profile.experience,
    });
    setPlan(plan);
    setView('overview');
  };

  const handleDeletePlan = () => {
    Alert.alert('計画を削除', 'この計画を削除してもよろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => { clearPlan(); setView('create'); } },
    ]);
  };

  // ============================================
  // 計画作成画面
  // ============================================
  if (view === 'create') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PremiumGate featureName="トレーニング計画">
          <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
            <FadeIn>
              <Text style={styles.pageTitle}>計画を作成</Text>
              <Text style={styles.pageSubtitle}>目標レースに向けたトレーニング計画を作成します</Text>
            </FadeIn>

            <SlideIn delay={100} direction="up">
              <View style={styles.formCard}>
                {/* レース名 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>レース名</Text>
                  <TextInput
                    style={styles.input}
                    value={raceName}
                    onChangeText={setRaceName}
                    placeholder="例: 〇〇記録会"
                    placeholderTextColor={COLORS.text.muted}
                  />
                </View>

                {/* レース日 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>レース日</Text>
                  <Pressable
                    style={[styles.inputButton, dateValidation.error && styles.inputError]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[styles.inputButtonText, !raceDate && styles.inputPlaceholder]}>
                      {raceDate ? formatDateDisplay(raceDate) : '日付を選択'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.text.muted} />
                  </Pressable>
                  {dateValidation.error && <Text style={styles.errorText}>{dateValidation.error}</Text>}
                </View>

                {/* 種目 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>種目</Text>
                  <View style={styles.distanceSelector}>
                    {([800, 1500, 3000, 5000] as RaceDistance[]).map((d) => (
                      <Pressable
                        key={d}
                        style={[styles.distanceOption, distance === d && styles.distanceOptionActive]}
                        onPress={() => setDistance(d)}
                      >
                        <Text style={[styles.distanceOptionText, distance === d && styles.distanceOptionTextActive]}>
                          {d}m
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* 休養日 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>休養日</Text>
                  <View style={styles.restDaySelector}>
                    {(['月', '火', '水', '木', '金', '土', '日']).map((name, i) => (
                      <Pressable
                        key={i}
                        style={[styles.restDayOption, restDay === i && styles.restDayOptionActive]}
                        onPress={() => setRestDay(i)}
                      >
                        <Text style={[styles.restDayOptionText, restDay === i && styles.restDayOptionTextActive]}>
                          {name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Key曜日 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ポイント練習日（2日選択）</Text>
                  <View style={styles.restDaySelector}>
                    {(['月', '火', '水', '木', '金', '土', '日']).map((name, i) => {
                      const isSelected = keyDays.includes(i);
                      const isRestDayConflict = i === restDay;
                      return (
                        <Pressable
                          key={i}
                          style={[
                            styles.restDayOption,
                            isSelected && styles.keyDayOptionActive,
                            isRestDayConflict && styles.keyDayOptionDisabled,
                          ]}
                          onPress={() => {
                            if (isRestDayConflict) return;
                            if (isSelected) {
                              if (keyDays.length > 1) {
                                setKeyDays(keyDays.filter(d => d !== i));
                              }
                            } else {
                              if (keyDays.length >= 2) {
                                setKeyDays([keyDays[1], i]);
                              } else {
                                setKeyDays([...keyDays, i]);
                              }
                            }
                          }}
                          disabled={isRestDayConflict}
                        >
                          <Text style={[
                            styles.restDayOptionText,
                            isSelected && styles.keyDayOptionTextActive,
                            isRestDayConflict && styles.keyDayOptionTextDisabled,
                          ]}>
                            {name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 月間走行距離 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>月間走行距離（km）</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.monthlyMileage ? String(profile.monthlyMileage) : ''}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      if (!isNaN(num) && num > 0) {
                        useProfileStore.getState().updateAttributes({ monthlyMileage: num });
                      } else if (text === '') {
                        useProfileStore.getState().updateAttributes({ monthlyMileage: undefined });
                      }
                    }}
                    placeholder="例: 200"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="numeric"
                  />
                  <Text style={styles.hintText}>走力に応じたメニューの本数調整に使用します</Text>
                </View>

              </View>
            </SlideIn>

            <SlideIn delay={200} direction="up">
              <Pressable
                style={[styles.createButton, (!raceName || !dateValidation.valid) && styles.createButtonDisabled]}
                onPress={handleCreatePlan}
                disabled={!raceName || !dateValidation.valid}
              >
                <Text style={styles.createButtonText}>計画を生成</Text>
              </Pressable>

              {activePlan && (
                <Pressable style={styles.cancelButton} onPress={() => setView('overview')}>
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </Pressable>
              )}
            </SlideIn>

            <DatePickerModal
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSelect={(date) => setRaceDate(date)}
              value={raceDate || undefined}
              minDate={minDateForPicker}
              title="レース日を選択"
            />
          </ScrollView>
        </PremiumGate>
      </SafeAreaView>
    );
  }

  // 計画がない場合
  if (!activePlan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <FadeIn>
            <Ionicons name="calendar-outline" size={64} color={COLORS.text.muted} />
            <Text style={styles.emptyTitle}>まだ計画がありません</Text>
            <Text style={styles.emptySubtitle}>目標レースを設定して{'\n'}トレーニング計画を作成しましょう</Text>
            <Pressable style={styles.createButton} onPress={() => setView('create')}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>計画を作成</Text>
            </Pressable>
          </FadeIn>
        </View>
      </SafeAreaView>
    );
  }

  // 計算
  const raceDateObj = new Date(activePlan.race.date);
  const daysUntilRace = Math.ceil((raceDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = activePlan.weeklyPlans?.length || 0;
  const firstWeekStart = activePlan.weeklyPlans?.[0]?.startDate ? new Date(activePlan.weeklyPlans[0].startDate) : new Date();
  const currentWeekNumber = totalWeeks > 0
    ? Math.min(Math.max(1, Math.floor((new Date().getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1), totalWeeks)
    : 1;
  const currentWeekPlan = activePlan.weeklyPlans?.[currentWeekNumber - 1];

  // ============================================
  // 週間スケジュール画面
  // ============================================
  if (view === 'weekly') {
    const weekPlan = activePlan.weeklyPlans?.[selectedWeek - 1];
    if (!weekPlan) {
      return (
        <SwipeBackView onSwipeBack={() => setView('overview')}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => setView('overview')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>週間スケジュール</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>データがありません</Text>
          </View>
        </SafeAreaView>
        </SwipeBackView>
      );
    }

    const phase = PHASE_CONFIG[weekPlan.phaseType];
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
    const isCurrentWeek = selectedWeek === currentWeekNumber;

    return (
      <SwipeBackView onSwipeBack={() => setView('overview')}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setView('overview')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>第{weekPlan.weekNumber}週</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* 週ナビゲーション */}
          <FadeIn>
            <View style={styles.weekNav}>
              <Pressable
                style={[styles.weekNavButton, selectedWeek <= 1 && styles.weekNavButtonDisabled]}
                onPress={() => setSelectedWeek(w => Math.max(1, w - 1))}
                disabled={selectedWeek <= 1}
              >
                <Ionicons name="chevron-back" size={20} color={selectedWeek <= 1 ? COLORS.text.muted : COLORS.text.primary} />
              </Pressable>
              <View style={styles.weekNavCenter}>
                <Text style={styles.weekNavLabel}>{phase?.label}</Text>
                {isCurrentWeek && <View style={styles.currentWeekBadge}><Text style={styles.currentWeekBadgeText}>今週</Text></View>}
              </View>
              <Pressable
                style={[styles.weekNavButton, selectedWeek >= totalWeeks && styles.weekNavButtonDisabled]}
                onPress={() => setSelectedWeek(w => Math.min(totalWeeks, w + 1))}
                disabled={selectedWeek >= totalWeeks}
              >
                <Ionicons name="chevron-forward" size={20} color={selectedWeek >= totalWeeks ? COLORS.text.muted : COLORS.text.primary} />
              </Pressable>
            </View>
          </FadeIn>

          {/* 週間プログレス */}
          <SlideIn delay={100} direction="up">
            <View style={styles.weekProgress}>
              <View style={styles.weekProgressBar}>
                {Array.from({ length: totalWeeks }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.weekProgressDot,
                      i + 1 < currentWeekNumber && styles.weekProgressDotCompleted,
                      i + 1 === selectedWeek && styles.weekProgressDotActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.weekProgressText}>{selectedWeek} / {totalWeeks} 週</Text>
            </View>
          </SlideIn>

          {/* バッジ */}
          {(weekPlan.isRecoveryWeek || weekPlan.isRampTestWeek) && (
            <SlideIn delay={150} direction="up">
              <View style={styles.weekBadges}>
                {weekPlan.isRecoveryWeek && (
                  <View style={styles.recoveryBadge}>
                    <Ionicons name="leaf" size={14} color="#22C55E" />
                    <Text style={styles.recoveryBadgeText}>回復週</Text>
                  </View>
                )}
                {weekPlan.isRampTestWeek && (
                  <View style={styles.testBadge}>
                    <Ionicons name="analytics" size={14} color="#8B5CF6" />
                    <Text style={styles.testBadgeText}>テスト週</Text>
                  </View>
                )}
              </View>
            </SlideIn>
          )}

          {/* 日別スケジュール */}
          <View style={styles.scheduleList}>
            {weekPlan.days.map((day, i) => {
              if (!day) return null;
              const isRestDay = day.type === 'rest';
              const iconInfo = getWorkoutIconInfo(day.type);
              return (
                <SlideIn key={i} delay={200 + i * 50} direction="up">
                  <View style={[styles.dayCard, day.completed && styles.dayCardCompleted]}>
                    <Pressable
                      style={styles.dayContent}
                      onPress={() => {
                        if (!isRestDay && day.type !== 'test') {
                          router.push({
                            pathname: '/(tabs)/workout',
                            params: { category: day.focusCategory || 'all' },
                          });
                        }
                      }}
                    >
                      <View style={styles.dayLeft}>
                        <Text style={styles.dayName}>{dayNames[i]}</Text>
                        <View style={[styles.dayIcon, { backgroundColor: iconInfo.color + '20' }]}>
                          <Ionicons name={iconInfo.name as any} size={16} color={iconInfo.color} />
                        </View>
                      </View>
                      <View style={styles.dayCenter}>
                        <Text style={[styles.dayLabel, day.isKey && styles.dayLabelKey]}>{day.label}</Text>
                        {day.isKey && <Text style={styles.keyBadge}>Key</Text>}
                      </View>
                    </Pressable>
                    {!isRestDay && (
                      <Pressable
                        style={styles.checkButton}
                        onPress={() => toggleWorkoutComplete(weekPlan.weekNumber, day.id)}
                      >
                        <Ionicons
                          name={day.completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={28}
                          color={day.completed ? COLORS.success : COLORS.text.muted}
                        />
                      </Pressable>
                    )}
                  </View>
                </SlideIn>
              );
            })}
          </View>

          <FadeIn delay={600}>
            <Text style={styles.completionHintText}>タップで完了マーク</Text>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
      </SwipeBackView>
    );
  }

  // ============================================
  // 概要画面
  // ============================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        {/* レースカウントダウン */}
        <FadeIn>
          <View style={styles.raceCard}>
            <View style={styles.raceCardHeader}>
              <Ionicons name="flag" size={20} color="#F97316" />
              <Text style={styles.raceName}>{activePlan.race.name}</Text>
            </View>
            <Text style={styles.raceCountdown}>あと {daysUntilRace} 日</Text>
            <View style={styles.raceDetails}>
              <Text style={styles.raceDetailText}>{activePlan.race.distance}m</Text>
            </View>
          </View>
        </FadeIn>

        {/* フェーズバー */}
        {activePlan.phases && (
          <SlideIn delay={100} direction="up">
            <View style={styles.phaseCard}>
              <Text style={styles.sectionLabel}>トレーニングフェーズ</Text>
              <View style={styles.phaseBar}>
                {activePlan.phases.map((phase, i) => (
                  <View
                    key={i}
                    style={[
                      styles.phaseSegment,
                      { flex: phase.weeks, backgroundColor: PHASE_CONFIG[phase.type].color },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.currentMarker}>
                <View style={[styles.markerLine, { left: `${((currentWeekNumber - 0.5) / totalWeeks) * 100}%` }]} />
              </View>
              <View style={styles.phaseLegend}>
                {activePlan.phases.map((phase, i) => (
                  <View key={i} style={styles.phaseLegendItem}>
                    <View style={[styles.phaseDot, { backgroundColor: PHASE_CONFIG[phase.type].color }]} />
                    <Text style={styles.phaseLegendText}>{PHASE_CONFIG[phase.type].label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </SlideIn>
        )}

        {/* 今週のカード */}
        {currentWeekPlan && (
          <SlideIn delay={200} direction="up">
            <Pressable
              style={styles.thisWeekCard}
              onPress={() => { setSelectedWeek(currentWeekNumber); setView('weekly'); }}
            >
              <View style={styles.thisWeekHeader}>
                <View>
                  <Text style={styles.thisWeekLabel}>今週</Text>
                  <Text style={styles.thisWeekPhase}>
                    第{currentWeekNumber}週 - {PHASE_CONFIG[currentWeekPlan.phaseType].label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.muted} />
              </View>

              {/* キートレーニング */}
              <View style={styles.keyWorkouts}>
                {currentWeekPlan.days.filter(d => d?.isKey).slice(0, 3).map((d, i) => {
                  if (!d) return null;
                  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
                  const iconInfo = getWorkoutIconInfo(d.type);
                  return (
                    <View key={i} style={styles.keyWorkoutItem}>
                      <Ionicons name={iconInfo.name as any} size={14} color={iconInfo.color} />
                      <Text style={styles.keyWorkoutDay}>{dayNames[d.dayOfWeek]}</Text>
                      <Text style={styles.keyWorkoutLabel}>{d.label}</Text>
                      {d.completed && <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />}
                    </View>
                  );
                })}
              </View>
            </Pressable>
          </SlideIn>
        )}

        {/* 全週一覧（コンパクト） */}
        <SlideIn delay={300} direction="up">
          <View style={styles.weeksOverview}>
            <Text style={styles.sectionLabel}>全体進捗</Text>
            <View style={styles.weeksGrid}>
              {activePlan.weeklyPlans?.map((week, i) => {
                const isCurrent = week.weekNumber === currentWeekNumber;
                const isPast = week.weekNumber < currentWeekNumber;
                const completedCount = week.days.filter(d => d?.completed).length;
                const totalCount = week.days.filter(d => d && d.type !== 'rest').length;
                const progress = totalCount > 0 ? completedCount / totalCount : 0;
                return (
                  <Pressable
                    key={i}
                    style={[styles.weekDot, isCurrent && styles.weekDotCurrent]}
                    onPress={() => { setSelectedWeek(week.weekNumber); setView('weekly'); }}
                  >
                    <View
                      style={[
                        styles.weekDotFill,
                        { backgroundColor: PHASE_CONFIG[week.phaseType].color },
                        isPast && progress === 1 && styles.weekDotComplete,
                      ]}
                    />
                    <Text style={[styles.weekDotText, isCurrent && styles.weekDotTextCurrent]}>
                      {week.weekNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SlideIn>

        {/* 管理ボタン */}
        <SlideIn delay={400} direction="up">
          <Pressable style={styles.actionButton} onPress={handleDeletePlan}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>削除</Text>
          </Pressable>
        </SlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// ヘルパー関数
// ============================================

function getWorkoutIconInfo(type: string): { name: string; color: string } {
  switch (type) {
    case 'workout': return { name: 'fitness', color: '#F97316' };
    case 'easy': return { name: 'walk', color: '#3B82F6' };
    case 'long': return { name: 'footsteps', color: '#22C55E' };
    case 'recovery': return { name: 'leaf', color: '#9CA3AF' };
    case 'rest': return { name: 'moon', color: '#6B7280' };
    case 'test': return { name: 'analytics', color: '#8B5CF6' };
    default: return { name: 'fitness', color: '#F97316' };
  }
}


// ============================================
// スタイル
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
    padding: 20,
    paddingBottom: 40,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  // ページタイトル
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 28,
  },

  // フォームカード
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputButtonText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputPlaceholder: {
    color: COLORS.text.muted,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 6,
  },

  // 種目セレクター
  distanceSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  distanceOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  distanceOptionActive: {
    backgroundColor: COLORS.primary,
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  distanceOptionTextActive: {
    color: '#fff',
  },

  // 休養日セレクター
  restDaySelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  restDayOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  restDayOptionActive: {
    backgroundColor: COLORS.primary,
  },
  restDayOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  restDayOptionTextActive: {
    color: '#fff',
  },

  // Key曜日セレクター
  keyDayOptionActive: {
    backgroundColor: '#F97316',
  },
  keyDayOptionDisabled: {
    opacity: 0.3,
  },
  keyDayOptionTextActive: {
    color: '#fff',
  },
  keyDayOptionTextDisabled: {
    color: COLORS.text.muted,
  },

  // 作成ボタン
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // 空状態
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
  },

  // レースカード
  raceCard: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  raceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  raceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  raceCountdown: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  raceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  raceDetailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  raceDetailDivider: {
    color: COLORS.text.muted,
  },

  // セクションラベル
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 12,
  },

  // フェーズカード
  phaseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  phaseBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  phaseSegment: {
    height: '100%',
  },
  currentMarker: {
    position: 'relative',
    height: 0,
    marginTop: -16,
    marginBottom: 12,
  },
  markerLine: {
    position: 'absolute',
    width: 3,
    height: 16,
    backgroundColor: COLORS.text.primary,
    borderRadius: 1.5,
    marginLeft: -1.5,
  },
  phaseLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  phaseLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseLegendText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  // 今週カード
  thisWeekCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  thisWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  thisWeekLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 2,
  },
  thisWeekPhase: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  keyWorkouts: {
    gap: 10,
  },
  keyWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
  },
  keyWorkoutDay: {
    fontSize: 13,
    color: COLORS.text.muted,
    width: 20,
  },
  keyWorkoutLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
  },

  // 週一覧
  weeksOverview: {
    marginBottom: 24,
  },
  weeksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  weekDotCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  weekDotFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  weekDotComplete: {
    opacity: 0.4,
  },
  weekDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  weekDotTextCurrent: {
    color: COLORS.primary,
  },

  // アクションボタン
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // 週ナビゲーション
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavButtonDisabled: {
    opacity: 0.3,
  },
  weekNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weekNavLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  currentWeekBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  currentWeekBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // 週間プログレス
  weekProgress: {
    marginBottom: 20,
  },
  weekProgressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  weekProgressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  weekProgressDotCompleted: {
    backgroundColor: COLORS.success,
  },
  weekProgressDotActive: {
    backgroundColor: COLORS.primary,
  },
  weekProgressText: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
  },

  // バッジ
  weekBadges: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  recoveryBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#22C55E',
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  testBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
  },

  // スケジュールリスト
  scheduleList: {
    gap: 10,
    marginBottom: 16,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
  },
  dayCardCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 70,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    width: 20,
  },
  dayIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  dayLabelKey: {
    fontWeight: '500',
  },
  keyBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  dayContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionHintText: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    opacity: 0.7,
  },
});
