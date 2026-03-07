// ============================================
// Plan Screen - トレーニング計画画面（簡素化版）
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  usePlanStore,
  useProfileStore,
  useEffectiveValues,
  useTrainingLogsStore,
  useTestResultsStore,
  useCustomWorkoutsStore,
} from '../../src/stores/useAppStore';
import { Card, Button, DatePickerModal } from '../../src/components/ui';
import { FadeIn, SlideIn, AnimatedPressable } from '../../src/components/ui/Animated';
import { useToast } from '../../src/components/ui/Toast';
import { PremiumGate } from '../../components/PremiumGate';
import { useIsPremium } from '../../store/useSubscriptionStore';
import {
  COLORS,
  PHASE_CONFIG,
  PHASE_RATIONALE,
  LIMITER_RATIONALE,
  WORKOUT_LIMITER_CONFIG,
  FOCUS_RATIONALE,
  PHYSIOLOGICAL_FOCUS_CATEGORIES,
  REST_DAY_FREQUENCY_CONFIG,
  PLAN_VERSION,
  WORKOUTS,
  ZONE_COEFFICIENTS_V3,
} from '../../src/constants';
import {
  RacePlan,
  RaceDistance,
  RestDayFrequency,
  ScheduledWorkout,
  SubRace,
  TrainingLog,
  FeelingLevel,
  WorkoutTemplate,
} from '../../src/types';
import { generatePlan } from '../../src/utils/planGenerator';
import { getWeeklyPlanRationale, calculateTrainingAnalytics, getWorkoutZoneDistances } from '../../src/utils';
import { ZoneName } from '../../src/types';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { SwipeBackView } from '../../components/SwipeBackView';
import { useIsFocused } from '@react-navigation/native';

// レース距離ラベル
const RACE_DISTANCE_OPTIONS: { value: RaceDistance; label: string }[] = [
  { value: 400, label: '400m' },
  { value: 800, label: '800m' },
  { value: 1500, label: '1500m' },
  { value: 3000, label: '3000m' },
  { value: 5000, label: '5000m' },
  { value: 10000, label: '10000m' },
  { value: 21097, label: 'ハーフ' },
  { value: 42195, label: 'マラソン' },
  { value: 'custom', label: '任意' },
];

// レース距離の表示ラベル
function formatRaceDistance(distance: RaceDistance, customDistance?: number): string {
  if (distance === 'custom') return customDistance ? `${customDistance}m` : '任意距離';
  if (distance === 21097) return 'ハーフマラソン';
  if (distance === 42195) return 'マラソン';
  return `${distance}m`;
}

// ビュータイプ
type ViewType = 'overview' | 'create' | 'weekly' | 'log';

// 体感レベル設定
const FEELING_CONFIG: Record<FeelingLevel, { label: string; icon: string; color: string }> = {
  great: { label: '最高', icon: 'happy', color: '#22C55E' },
  good: { label: '良い', icon: 'thumbs-up', color: '#3B82F6' },
  normal: { label: '普通', icon: 'remove', color: '#EAB308' },
  tough: { label: 'きつい', icon: 'thumbs-down', color: '#F97316' },
  bad: { label: '不調', icon: 'sad', color: '#EF4444' },
};

export default function PlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string; weekNumber?: string; t?: string }>();
  const isPremium = useIsPremium();
  const { showToast } = useToast();
  const activePlan = usePlanStore((state) => state.activePlan);
  const setPlan = usePlanStore((state) => state.setPlan);
  const clearPlan = usePlanStore((state) => state.clearPlan);
  const toggleWorkoutComplete = usePlanStore((state) => state.toggleWorkoutComplete);
  const updateActualData = usePlanStore((state) => state.updateActualData);
  const regeneratePlan = usePlanStore((state) => state.regeneratePlan);
  const { etp, limiter } = useEffectiveValues();
  const profile = useProfileStore((state) => state.profile);
  const testResults = useTestResultsStore((state) => state.results);
  const customWorkouts = useCustomWorkoutsStore((state) => state.customWorkouts);

  // カスタムワークアウトをWorkoutTemplate形式に変換
  const customWorkoutsAsTemplates = useMemo(() => {
    return customWorkouts.map((cw): WorkoutTemplate => ({
      id: cw.id,
      name: cw.name,
      category: cw.category,
      description: cw.description,
      segments: cw.segments,
      limiterVariants: {
        cardio: { note: 'カスタムメニュー' },
        muscular: { note: 'カスタムメニュー' },
        balanced: { note: 'カスタムメニュー' },
      },
    }));
  }, [customWorkouts]);

  // メニュー更新通知の非表示フラグ
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);
  const showUpdateBanner = activePlan && !updateBannerDismissed && (activePlan.planVersion || 0) < PLAN_VERSION;

  // メニュー更新: 計画を再生成
  const handleRegeneratePlan = () => {
    Alert.alert(
      'メニューを更新',
      '最新のメニューで計画を再生成します。完了済みのマークは保持されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '更新する',
          onPress: () => {
            regeneratePlan(profile, testResults);
            setUpdateBannerDismissed(true);
          },
        },
      ],
    );
  };

  // トレーニングログ
  const trainingLogs = useTrainingLogsStore((state) => state.logs);
  const addTrainingLog = useTrainingLogsStore((state) => state.addLog);
  const completeTrainingLog = useTrainingLogsStore((state) => state.completeLog);
  const skipTrainingLog = useTrainingLogsStore((state) => state.skipLog);
  const deleteTrainingLog = useTrainingLogsStore((state) => state.deleteLog);

  const [view, setView] = useState<ViewType>(activePlan ? 'overview' : 'create');
  const setSubScreenOpen = useSetSubScreenOpen();
  const isFocused = useIsFocused();

  // 結果記録モーダル
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [recordingLogId, setRecordingLogId] = useState<string | null>(null);
  const [recordDistance, setRecordDistance] = useState('');
  const [recordDuration, setRecordDuration] = useState('');
  const [recordFeeling, setRecordFeeling] = useState<FeelingLevel>('normal');
  const [recordNotes, setRecordNotes] = useState('');

  // 事後記録モーダル（完了時のゾーン別実績距離入力）
  const [actualDataModalVisible, setActualDataModalVisible] = useState(false);
  const [actualDataTarget, setActualDataTarget] = useState<{ weekNumber: number; dayId: string; label: string; zoneDistances?: Record<string, number> } | null>(null);
  const [actualZoneInputs, setActualZoneInputs] = useState<Record<string, string>>({});
  const [actualNotes, setActualNotes] = useState('');

  // メニュー追加モーダル
  const [menuSelectModalVisible, setMenuSelectModalVisible] = useState(false);
  const [menuSelectDate, setMenuSelectDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [menuSelectCategory, setMenuSelectCategory] = useState('all');

  // メニュー追加用の全ワークアウトリスト
  const allWorkouts = useMemo(() => {
    return [...WORKOUTS, ...customWorkoutsAsTemplates] as WorkoutTemplate[];
  }, [customWorkoutsAsTemplates]);

  const menuCategories = useMemo(() => {
    const cats = new Set(allWorkouts.map((w) => w.category));
    return ['all', ...Array.from(cats)];
  }, [allWorkouts]);

  const filteredMenuWorkouts = useMemo(() => {
    if (menuSelectCategory === 'all') return allWorkouts;
    return allWorkouts.filter((w) => w.category === menuSelectCategory);
  }, [allWorkouts, menuSelectCategory]);

  const handleAddMenuToDate = (workout: WorkoutTemplate) => {
    const log: TrainingLog = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: menuSelectDate,
      workoutId: workout.id,
      workoutName: workout.name,
      workoutCategory: workout.category,
      status: 'planned',
      planId: activePlan?.id,
    };
    addTrainingLog(log);
    setMenuSelectModalVisible(false);
    showToast('メニューを追加しました', 'success');
  };

  // 他画面からのパラメータ変更に対応（メニュー変更後の遷移など）
  useEffect(() => {
    if (isFocused && params.view === 'weekly' && activePlan) {
      setView('weekly');
      if (params.weekNumber) {
        const wn = parseInt(params.weekNumber, 10);
        if (!isNaN(wn) && wn >= 1) setSelectedWeek(wn);
      }
    }
  }, [params.view, params.weekNumber, params.t, isFocused]);

  // フォーカス中のタブのみフラグを制御（タブ間の競合を防止）
  useEffect(() => {
    if (isFocused) {
      setSubScreenOpen(view === 'weekly' || view === 'log');
    }
  }, [view, isFocused, setSubScreenOpen]);

  // 結果記録モーダルを開く
  const openRecordModal = (logId: string) => {
    setRecordingLogId(logId);
    setRecordDistance('');
    setRecordDuration('');
    setRecordFeeling('normal');
    setRecordNotes('');
    setRecordModalVisible(true);
  };

  // 結果を保存
  const handleSaveRecord = () => {
    if (!recordingLogId) return;
    completeTrainingLog(recordingLogId, {
      distance: recordDistance ? parseInt(recordDistance, 10) : undefined,
      duration: recordDuration ? parseInt(recordDuration, 10) : undefined,
      feeling: recordFeeling,
      notes: recordNotes || undefined,
    });
    setRecordModalVisible(false);
    setRecordingLogId(null);
  };

  // ログを日付でグループ化
  const groupedLogs = useMemo(() => {
    const groups: Record<string, TrainingLog[]> = {};
    for (const log of trainingLogs) {
      const date = log.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    }
    // 日付降順でソート
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [trainingLogs]);

  // プラン関連のログのみフィルタ
  const planLogs = useMemo(() => {
    if (!activePlan) return groupedLogs;
    const raceDate = activePlan.race.date.split('T')[0];
    const startDate = activePlan.weeklyPlans?.[0]?.startDate?.split('T')[0] || '';
    return groupedLogs.filter(([date]) => date >= startDate && date <= raceDate);
  }, [groupedLogs, activePlan]);

  const [selectedWeek, setSelectedWeek] = useState(1);

  // 計画作成フォーム
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState<Date | null>(null);
  const [distance, setDistance] = useState<RaceDistance>(1500);
  const [customDistanceInput, setCustomDistanceInput] = useState<string>(''); // 任意距離入力
  const [restDay, setRestDay] = useState<number>(6); // 休養日: デフォルト日曜（6）
  const [restDayFrequency, setRestDayFrequency] = useState<RestDayFrequency>('auto'); // 休養日頻度
  const [keyDays, setKeyDays] = useState<number[]>([2, 5]); // Key曜日: デフォルト水・土
  const [showDatePicker, setShowDatePicker] = useState(false);

  // サブレースモーダル
  const [showSubRaceModal, setShowSubRaceModal] = useState(false);
  const [subRaceName, setSubRaceName] = useState('');
  const [subRaceDate, setSubRaceDate] = useState<Date | null>(null);
  const [subRaceDistance, setSubRaceDistance] = useState<RaceDistance>(1500);
  const [subRaceCustomDistance, setSubRaceCustomDistance] = useState<string>('');
  const [subRacePriority, setSubRacePriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showSubRaceDatePicker, setShowSubRaceDatePicker] = useState(false);
  const addSubRace = usePlanStore((state) => state.addSubRace);
  const removeSubRace = usePlanStore((state) => state.removeSubRace);

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
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (date > maxDate) return { valid: false, error: '6ヶ月以内のレースを設定してください。それ以上先の場合は、時期が近づいてから計画を作成することをお勧めします。' };
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
    if (distance === 'custom' && (!customDistanceInput || parseInt(customDistanceInput, 10) <= 0)) {
      Alert.alert('エラー', '任意距離を入力してください');
      return;
    }
    const customDist = distance === 'custom' ? parseInt(customDistanceInput, 10) : undefined;
    const plan = generatePlan({
      race: { name: raceName, date: raceDate.toISOString(), distance, customDistance: customDist },
      baseline: { etp, limiterType: limiter },
      restDay,
      keyWorkoutDays: keyDays,
      ageCategory: profile.ageCategory,
      experience: profile.experience,
      gender: profile.gender,
      restDayFrequency,
      monthlyMileage: profile.monthlyMileage,
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
              <Text style={styles.pageSubtitle}>6ヶ月以内の最も重要なレース（ターゲットレース）を設定します。{'\n'}途中のレースは計画作成後に追加できます。</Text>
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
                    {RACE_DISTANCE_OPTIONS.map((opt) => (
                      <Pressable
                        key={String(opt.value)}
                        style={[styles.distanceOption, distance === opt.value && styles.distanceOptionActive]}
                        onPress={() => setDistance(opt.value)}
                      >
                        <Text style={[styles.distanceOptionText, distance === opt.value && styles.distanceOptionTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {distance === 'custom' && (
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={customDistanceInput}
                      onChangeText={setCustomDistanceInput}
                      placeholder="距離をメートルで入力（例: 1000）"
                      placeholderTextColor={COLORS.text.muted}
                      keyboardType="numeric"
                    />
                  )}
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

                {/* 休養日頻度 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>休養日の頻度</Text>
                  <View style={styles.frequencySelector}>
                    {(['auto', 'weekly', 'biweekly', 'monthly'] as RestDayFrequency[]).map((freq) => {
                      const config = REST_DAY_FREQUENCY_CONFIG[freq];
                      const isSelected = restDayFrequency === freq;
                      return (
                        <Pressable
                          key={freq}
                          style={[styles.frequencyOption, isSelected && styles.frequencyOptionActive]}
                          onPress={() => setRestDayFrequency(freq)}
                        >
                          <Text style={[styles.frequencyOptionText, isSelected && styles.frequencyOptionTextActive]}>
                            {config.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.hintText}>
                    {REST_DAY_FREQUENCY_CONFIG[restDayFrequency].desc}
                  </Text>
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
          <View>
            <Text style={styles.headerTitle}>第{weekPlan.weekNumber}週</Text>
            <Text style={styles.headerSubtitle}>
              {(() => {
                const s = new Date(weekPlan.startDate);
                const e = new Date(weekPlan.endDate);
                return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
              })()}
            </Text>
          </View>
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
          {(weekPlan.isRecoveryWeek || weekPlan.isRampTestWeek || weekPlan.subRace) && (
            <SlideIn delay={150} direction="up">
              <View style={styles.weekBadges}>
                {weekPlan.subRace && (
                  <View style={styles.subRaceBadge}>
                    <Ionicons name="trophy" size={14} color="#F97316" />
                    <Text style={styles.subRaceBadgeText}>
                      {weekPlan.subRace.name} ({formatRaceDistance(weekPlan.subRace.distance, weekPlan.subRace.customDistance)})
                    </Text>
                  </View>
                )}
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

          {/* フェーズ根拠 */}
          <SlideIn delay={170} direction="up">
            <View style={styles.weekRationaleCard}>
              <View style={styles.weekRationaleHeader}>
                <Ionicons name="bulb-outline" size={16} color="#EAB308" />
                <Text style={styles.weekRationaleTitle}>この週のねらい</Text>
              </View>
              <Text style={styles.weekRationaleText}>
                {getWeeklyPlanRationale(weekPlan.phaseType, activePlan.baseline.limiterType, weekPlan.isRecoveryWeek, weekPlan.isRampTestWeek, weekPlan.subRace?.name, weekPlan.subRace?.priority)}
              </Text>
              {!weekPlan.isRecoveryWeek && !weekPlan.isRampTestWeek && (
                <View style={styles.weekRationaleLimiterRow}>
                  <Ionicons name={WORKOUT_LIMITER_CONFIG[activePlan.baseline.limiterType].icon as any} size={14} color={WORKOUT_LIMITER_CONFIG[activePlan.baseline.limiterType].color} />
                  <Text style={styles.weekRationaleLimiterText}>{LIMITER_RATIONALE[activePlan.baseline.limiterType].summary}</Text>
                </View>
              )}
            </View>
          </SlideIn>

          {/* 日別スケジュール */}
          <View style={styles.scheduleList}>
            {weekPlan.days.map((day, i) => {
              if (!day) return null;
              const isRestDay = day.type === 'rest';
              const iconInfo = getWorkoutIconInfo(day.type);
              // Key練習の根拠テキスト
              const dayFocusKey = day.focusKey;
              const focusInfo = dayFocusKey && dayFocusKey !== 'test' ? PHYSIOLOGICAL_FOCUS_CATEGORIES[dayFocusKey] : null;
              const focusRationale = dayFocusKey && dayFocusKey !== 'test' ? FOCUS_RATIONALE[dayFocusKey] : null;
              const limiterConnection = focusRationale?.limiterConnection[activePlan.baseline.limiterType];
              return (
                <SlideIn key={i} delay={200 + i * 50} direction="up">
                  <View style={[styles.dayCard, day.completed && styles.dayCardCompleted]}>
                    <Pressable
                      style={styles.dayContent}
                      onPress={() => {
                        // タップ: メニュー詳細を確認（差し替えモードではない）
                        if (!isRestDay && day.type !== 'test' && day.type !== 'race') {
                          router.push({
                            pathname: '/(tabs)/workout',
                            params: {
                              category: day.focusCategory || 'all',
                              ...(day.workoutId ? { workoutId: day.workoutId } : {}),
                              fromPlan: 'true',
                              t: Date.now().toString(),
                            },
                          });
                        }
                      }}
                    >
                      <View style={styles.dayLeft}>
                        <View style={styles.dayDateColumn}>
                          <Text style={styles.dayName}>{dayNames[i]}</Text>
                          <Text style={styles.dayDate}>
                            {(() => {
                              const d = new Date(weekPlan.startDate);
                              d.setDate(d.getDate() + i);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            })()}
                          </Text>
                        </View>
                        <View style={[styles.dayIcon, { backgroundColor: iconInfo.color + '20' }]}>
                          <Ionicons name={iconInfo.name as any} size={16} color={iconInfo.color} />
                        </View>
                      </View>
                      <View style={styles.dayCenter}>
                        <View style={styles.dayLabelRow}>
                          <Text style={[styles.dayLabel, day.isKey && styles.dayLabelKey]} numberOfLines={1}>{day.label}</Text>
                          {day.isKey && <Text style={styles.keyBadge}>Key</Text>}
                        </View>
                        {day.isKey && limiterConnection && (
                          <Text style={styles.dayRationaleHint} numberOfLines={1}>{focusInfo?.description || ''}</Text>
                        )}
                      </View>
                    </Pressable>
                    {!isRestDay && day.type !== 'test' && day.type !== 'race' && (
                      <Pressable
                        style={styles.dayReplaceButton}
                        onPress={() => {
                          // 変更ボタン: 差し替えモードでワークアウト画面へ
                          router.push({
                            pathname: '/(tabs)/workout',
                            params: {
                              category: day.focusCategory || 'all',
                              replaceWeek: weekPlan.weekNumber.toString(),
                              replaceDayId: day.id,
                              replaceDayLabel: `第${weekPlan.weekNumber}週 ${dayNames[i]}曜`,
                              t: Date.now().toString(),
                            },
                          });
                        }}
                      >
                        <Ionicons name="swap-horizontal" size={16} color={COLORS.text.muted} />
                      </Pressable>
                    )}
                    {!isRestDay && (() => {
                      const dayDate = new Date(weekPlan.startDate);
                      dayDate.setDate(dayDate.getDate() + i);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isFutureDay = dayDate > today;
                      return (
                        <Pressable
                          style={[styles.checkButton, isFutureDay && styles.checkButtonDisabled]}
                          onPress={() => {
                            if (!isFutureDay) {
                              if (day.completed) {
                                // 完了→未完了: トグルのみ
                                toggleWorkoutComplete(weekPlan.weekNumber, day.id);
                              } else {
                                // 未完了→完了: 事後記録モーダルを表示
                                // ワークアウトのゾーン別予定距離を取得（レスト距離含む）
                                const plannedZones = day.workoutId
                                  ? getWorkoutZoneDistances(day.workoutId, limiter, customWorkoutsAsTemplates)
                                  : {};
                                setActualDataTarget({
                                  weekNumber: weekPlan.weekNumber,
                                  dayId: day.id,
                                  label: day.label,
                                  zoneDistances: Object.keys(plannedZones).length > 0 ? plannedZones : undefined,
                                });
                                setActualZoneInputs({});
                                setActualNotes('');
                                setActualDataModalVisible(true);
                              }
                            }
                          }}
                          disabled={isFutureDay}
                        >
                          <Ionicons
                            name={day.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={28}
                            color={day.completed ? COLORS.success : isFutureDay ? 'rgba(255,255,255,0.1)' : COLORS.text.muted}
                          />
                        </Pressable>
                      );
                    })()}
                  </View>
                </SlideIn>
              );
            })}
          </View>

          <FadeIn delay={600}>
            <Text style={styles.completionHintText}>タップで詳細確認 ・ ⇄で変更 ・ ○で完了</Text>
          </FadeIn>
        </ScrollView>

        {/* 事後記録モーダル */}
        <Modal
          visible={actualDataModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setActualDataModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.actualDataModalOverlay}
          >
            <View style={styles.actualDataModalContent}>
              <View style={styles.actualDataModalHeader}>
                <Text style={styles.actualDataModalTitle}>トレーニング記録</Text>
                <Pressable onPress={() => setActualDataModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text.primary} />
                </Pressable>
              </View>
              <Text style={styles.actualDataModalSubtitle}>{actualDataTarget?.label || ''}</Text>
              <Text style={styles.actualDataModalHint}>実際に走った各ゾーンの距離（m）を入力してください。アップ・ダウンジョグも含めて記録できます。</Text>

              <ScrollView style={styles.actualDataZoneList}>
                {(['jog', 'easy', 'marathon', 'threshold', 'interval', 'repetition'] as const).map((zone) => {
                  const zoneInfo = ZONE_COEFFICIENTS_V3[zone];
                  const planned = actualDataTarget?.zoneDistances?.[zone];
                  const actualVal = parseInt(actualZoneInputs[zone] || '', 10);
                  const hasDiff = planned && !isNaN(actualVal) && actualVal > 0;
                  const diffPct = hasDiff ? Math.round(((actualVal - planned) / planned) * 100) : 0;
                  const diffColor = hasDiff
                    ? Math.abs(diffPct) > 20 ? '#FF4444' : Math.abs(diffPct) > 10 ? '#FF8800' : COLORS.text.muted
                    : COLORS.text.muted;
                  return (
                    <View key={zone} style={styles.actualDataZoneRow}>
                      <View style={styles.actualDataZoneLabel}>
                        <View style={[styles.actualDataZoneDot, { backgroundColor: zoneInfo.color }]} />
                        <Text style={styles.actualDataZoneName}>{zoneInfo.name}</Text>
                        {planned ? <Text style={styles.actualDataZonePlanned}>予定: {planned}m</Text> : null}
                        {hasDiff ? (
                          <Text style={[styles.actualDataZonePlanned, { color: diffColor, fontWeight: '600' }]}>
                            {diffPct >= 0 ? '+' : ''}{diffPct}%
                          </Text>
                        ) : null}
                      </View>
                      <TextInput
                        style={styles.actualDataZoneInput}
                        value={actualZoneInputs[zone] || ''}
                        onChangeText={(text) => setActualZoneInputs(prev => ({ ...prev, [zone]: text }))}
                        placeholder={planned ? String(planned) : '0'}
                        placeholderTextColor={COLORS.text.muted}
                        keyboardType="numeric"
                      />
                    </View>
                  );
                })}

                <View style={styles.actualDataNotesSection}>
                  <Text style={styles.actualDataNotesLabel}>メモ</Text>
                  <TextInput
                    style={styles.actualDataNotesInput}
                    value={actualNotes}
                    onChangeText={setActualNotes}
                    placeholder="体調やペースの感想など"
                    placeholderTextColor={COLORS.text.muted}
                    multiline
                  />
                </View>
              </ScrollView>

              <View style={styles.actualDataModalButtons}>
                <Pressable
                  style={styles.actualDataSkipButton}
                  onPress={() => {
                    // 記録なしで完了
                    if (actualDataTarget) {
                      toggleWorkoutComplete(actualDataTarget.weekNumber, actualDataTarget.dayId);
                    }
                    setActualDataModalVisible(false);
                  }}
                >
                  <Text style={styles.actualDataSkipButtonText}>記録せず完了</Text>
                </Pressable>
                <Pressable
                  style={styles.actualDataSaveButton}
                  onPress={() => {
                    if (actualDataTarget) {
                      // ゾーン距離を数値に変換
                      const zoneDistances: Record<string, number> = {};
                      let totalDistance = 0;
                      for (const [zone, val] of Object.entries(actualZoneInputs)) {
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 0) {
                          zoneDistances[zone] = num;
                          totalDistance += num;
                        }
                      }
                      updateActualData(actualDataTarget.weekNumber, actualDataTarget.dayId, {
                        distance: totalDistance > 0 ? totalDistance : undefined,
                        notes: actualNotes || undefined,
                        zoneDistances: Object.keys(zoneDistances).length > 0 ? zoneDistances : undefined,
                      });
                    }
                    setActualDataModalVisible(false);
                  }}
                >
                  <Text style={styles.actualDataSaveButtonText}>記録して完了</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
      </SwipeBackView>
    );
  }

  // ============================================
  // トレーニング記録画面（日誌）
  // ============================================
  if (view === 'log') {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = trainingLogs.filter((l) => l.date === todayStr);
    const plannedLogs = todayLogs.filter((l) => l.status === 'planned');

    return (
      <SwipeBackView onSwipeBack={() => setView('overview')}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => setView('overview')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>トレーニング記録</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
            {/* 今日の実施予定 */}
            {plannedLogs.length > 0 && (
              <FadeIn>
                <Text style={styles.sectionLabel}>今日の実施予定</Text>
                <View style={styles.logSection}>
                  {plannedLogs.map((log) => (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logCardHeader}>
                        <View style={styles.logCardInfo}>
                          <Text style={styles.logCardName}>{log.workoutName}</Text>
                          <Text style={styles.logCardCategory}>{log.workoutCategory}</Text>
                        </View>
                        <View style={[styles.logStatusBadge, styles.logStatusPlanned]}>
                          <Text style={styles.logStatusText}>予定</Text>
                        </View>
                      </View>
                      <View style={styles.logCardActions}>
                        <Pressable
                          style={styles.logRecordButton}
                          onPress={() => openRecordModal(log.id)}
                        >
                          <Ionicons name="create-outline" size={16} color="#fff" />
                          <Text style={styles.logRecordButtonText}>結果を記録</Text>
                        </Pressable>
                        <Pressable
                          style={styles.logSkipButton}
                          onPress={() => {
                            Alert.alert('スキップ', 'このメニューをスキップしますか？', [
                              { text: 'キャンセル', style: 'cancel' },
                              { text: 'スキップ', onPress: () => skipTrainingLog(log.id) },
                            ]);
                          }}
                        >
                          <Text style={styles.logSkipButtonText}>スキップ</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </FadeIn>
            )}

            {/* メニュー追加ボタン */}
            <FadeIn delay={50}>
              <Pressable
                style={styles.addMenuButton}
                onPress={() => {
                  setMenuSelectDate(todayStr);
                  setMenuSelectCategory('all');
                  setMenuSelectModalVisible(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addMenuButtonText}>メニューを追加</Text>
              </Pressable>
            </FadeIn>

            {/* 時系列記録 */}
            <SlideIn delay={100} direction="up">
              <Text style={styles.sectionLabel}>
                {activePlan ? 'レースまでの記録' : 'すべての記録'}
              </Text>
              {planLogs.length === 0 ? (
                <View style={styles.logEmptyState}>
                  <Ionicons name="book-outline" size={48} color={COLORS.text.muted} />
                  <Text style={styles.logEmptyText}>まだ記録がありません</Text>
                  <Text style={styles.logEmptySubText}>
                    トレーニングタブからメニューを選択して実施しましょう
                  </Text>
                </View>
              ) : (
                <View style={styles.logTimeline}>
                  {planLogs.map(([date, logs], groupIndex) => {
                    const dateObj = new Date(date + 'T00:00:00');
                    const isToday = date === todayStr;
                    const dateLabel = isToday
                      ? '今日'
                      : `${dateObj.getMonth() + 1}/${dateObj.getDate()}（${['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()]}）`;

                    return (
                      <SlideIn key={date} delay={150 + groupIndex * 50} direction="up">
                        <View style={styles.logDateGroup}>
                          <View style={styles.logDateHeader}>
                            <View style={[styles.logDateDot, isToday && styles.logDateDotToday]} />
                            <Text style={[styles.logDateText, isToday && styles.logDateTextToday]}>
                              {dateLabel}
                            </Text>
                          </View>
                          {logs.map((log) => (
                            <View key={log.id} style={styles.logTimelineCard}>
                              <View style={styles.logTimelineCardHeader}>
                                <Text style={styles.logTimelineCardName}>{log.workoutName}</Text>
                                <View style={[
                                  styles.logStatusBadge,
                                  log.status === 'completed' && styles.logStatusCompleted,
                                  log.status === 'skipped' && styles.logStatusSkipped,
                                  log.status === 'planned' && styles.logStatusPlanned,
                                ]}>
                                  <Text style={styles.logStatusText}>
                                    {log.status === 'completed' ? '完了' : log.status === 'skipped' ? 'スキップ' : '予定'}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.logTimelineCardCategory}>{log.workoutCategory}</Text>
                              {log.result && (
                                <View style={styles.logResultSummary}>
                                  {log.result.distance != null && (
                                    <View style={styles.logResultItem}>
                                      <Ionicons name="navigate-outline" size={14} color={COLORS.text.muted} />
                                      <Text style={styles.logResultValue}>{log.result.distance}m</Text>
                                    </View>
                                  )}
                                  {log.result.duration != null && (
                                    <View style={styles.logResultItem}>
                                      <Ionicons name="time-outline" size={14} color={COLORS.text.muted} />
                                      <Text style={styles.logResultValue}>{Math.floor(log.result.duration / 60)}分{log.result.duration % 60}秒</Text>
                                    </View>
                                  )}
                                  {log.result.feeling && (
                                    <View style={styles.logResultItem}>
                                      <Ionicons
                                        name={FEELING_CONFIG[log.result.feeling].icon as any}
                                        size={14}
                                        color={FEELING_CONFIG[log.result.feeling].color}
                                      />
                                      <Text style={[styles.logResultValue, { color: FEELING_CONFIG[log.result.feeling].color }]}>
                                        {FEELING_CONFIG[log.result.feeling].label}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              )}
                              {log.result?.notes && (
                                <Text style={styles.logResultNotes}>{log.result.notes}</Text>
                              )}
                              {log.status === 'planned' && (
                                <View style={styles.logCardActions}>
                                  <Pressable
                                    style={[styles.logRecordButton, { flex: 1 }]}
                                    onPress={() => openRecordModal(log.id)}
                                  >
                                    <Ionicons name="create-outline" size={14} color="#fff" />
                                    <Text style={styles.logRecordButtonText}>記録</Text>
                                  </Pressable>
                                  <Pressable
                                    style={styles.logDeleteButton}
                                    onPress={() => {
                                      Alert.alert('削除', 'この記録を削除しますか？', [
                                        { text: 'キャンセル', style: 'cancel' },
                                        { text: '削除', style: 'destructive', onPress: () => deleteTrainingLog(log.id) },
                                      ]);
                                    }}
                                  >
                                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                  </Pressable>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      </SlideIn>
                    );
                  })}
                </View>
              )}
            </SlideIn>
          </ScrollView>

          {/* 結果記録モーダル */}
          <RecordResultModal
            visible={recordModalVisible}
            onClose={() => setRecordModalVisible(false)}
            onSave={handleSaveRecord}
            distance={recordDistance}
            setDistance={setRecordDistance}
            duration={recordDuration}
            setDuration={setRecordDuration}
            feeling={recordFeeling}
            setFeeling={setRecordFeeling}
            notes={recordNotes}
            setNotes={setRecordNotes}
          />

          {/* メニュー追加モーダル */}
          <Modal
            visible={menuSelectModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setMenuSelectModalVisible(false)}
          >
            <Pressable
              style={styles.menuSelectOverlay}
              onPress={() => setMenuSelectModalVisible(false)}
            >
              <Pressable style={styles.menuSelectContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.menuSelectHeader}>
                  <Text style={styles.menuSelectTitle}>メニューを追加</Text>
                  <Pressable onPress={() => setMenuSelectModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text.primary} />
                  </Pressable>
                </View>

                {/* カテゴリフィルタ */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuSelectCategoryScroll}>
                  {menuCategories.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.menuSelectCategoryChip,
                        menuSelectCategory === cat && styles.menuSelectCategoryChipActive,
                      ]}
                      onPress={() => setMenuSelectCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.menuSelectCategoryChipText,
                          menuSelectCategory === cat && styles.menuSelectCategoryChipTextActive,
                        ]}
                      >
                        {cat === 'all' ? 'すべて' : cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* メニュー一覧 */}
                <ScrollView style={styles.menuSelectList}>
                  {filteredMenuWorkouts.map((workout) => (
                    <Pressable
                      key={workout.id}
                      style={styles.menuSelectItem}
                      onPress={() => handleAddMenuToDate(workout)}
                    >
                      <View style={styles.menuSelectItemInfo}>
                        <Text style={styles.menuSelectItemName}>{workout.name}</Text>
                        <Text style={styles.menuSelectItemCategory}>{workout.category}</Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    </Pressable>
                  ))}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
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
        {/* ターゲットレース カウントダウン */}
        <FadeIn>
          <View style={styles.raceCard}>
            <View style={styles.raceCardHeader}>
              <View style={styles.targetRaceBadge}>
                <Text style={styles.targetRaceBadgeText}>ターゲットレース</Text>
              </View>
            </View>
            <View style={styles.raceCardHeader}>
              <Ionicons name="flag" size={20} color="#F97316" />
              <Text style={styles.raceName}>{activePlan.race.name}</Text>
            </View>
            <Text style={styles.raceCountdown}>あと {daysUntilRace} 日</Text>
            <View style={styles.raceDetails}>
              <Text style={styles.raceDetailText}>{formatRaceDistance(activePlan.race.distance, activePlan.race.customDistance)}</Text>
            </View>
          </View>
        </FadeIn>

        {/* メニュー更新通知バナー */}
        {showUpdateBanner && (
          <SlideIn delay={80} direction="up">
            <View style={styles.updateBanner}>
              <View style={styles.updateBannerContent}>
                <Ionicons name="refresh-circle" size={22} color="#EAB308" />
                <View style={styles.updateBannerTextContainer}>
                  <Text style={styles.updateBannerTitle}>メニューが更新されました</Text>
                  <Text style={styles.updateBannerDesc}>走力に合わせた最新メニューに更新できます</Text>
                </View>
              </View>
              <View style={styles.updateBannerActions}>
                <Pressable
                  style={styles.updateBannerButton}
                  onPress={handleRegeneratePlan}
                >
                  <Text style={styles.updateBannerButtonText}>更新する</Text>
                </Pressable>
                <Pressable
                  style={styles.updateBannerDismiss}
                  onPress={() => setUpdateBannerDismissed(true)}
                >
                  <Text style={styles.updateBannerDismissText}>後で</Text>
                </Pressable>
              </View>
            </View>
          </SlideIn>
        )}

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

        {/* トレーニング分析ダッシュボード */}
        {activePlan.weeklyPlans && (() => {
          const analytics = calculateTrainingAnalytics(activePlan.weeklyPlans, activePlan.baseline.limiterType);
          if (analytics.completedCount === 0) return null;

          const ZONE_LABELS: Record<string, { label: string; color: string }> = {
            jog: { label: 'Jog', color: '#6B7280' },
            easy: { label: 'Easy', color: '#3B82F6' },
            marathon: { label: 'Marathon', color: '#22C55E' },
            threshold: { label: 'Threshold', color: '#EAB308' },
            interval: { label: 'Interval', color: '#F97316' },
            repetition: { label: 'Repetition', color: '#EF4444' },
          };

          return (
            <SlideIn delay={230} direction="up">
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsTitleRow}>
                  <Ionicons name="stats-chart-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.analyticsTitle}>トレーニング分析</Text>
                </View>

                {/* 走行距離サマリー */}
                <View style={styles.analyticsDistanceRow}>
                  <View style={styles.analyticsDistanceItem}>
                    <Text style={styles.analyticsDistanceValue}>{(analytics.weeklyDistance / 1000).toFixed(1)}</Text>
                    <Text style={styles.analyticsDistanceLabel}>週間km</Text>
                  </View>
                  <View style={styles.analyticsDistanceDivider} />
                  <View style={styles.analyticsDistanceItem}>
                    <Text style={styles.analyticsDistanceValue}>{(analytics.monthlyDistance / 1000).toFixed(1)}</Text>
                    <Text style={styles.analyticsDistanceLabel}>30日間km</Text>
                  </View>
                  <View style={styles.analyticsDistanceDivider} />
                  <View style={styles.analyticsDistanceItem}>
                    <Text style={styles.analyticsDistanceValue}>{analytics.completedCount}/{analytics.totalCount}</Text>
                    <Text style={styles.analyticsDistanceLabel}>完了率</Text>
                  </View>
                </View>

                {/* ゾーン別刺激バー */}
                <Text style={styles.analyticsZoneTitle}>ゾーン別刺激量</Text>
                {Object.entries(ZONE_LABELS).map(([zone, config]) => {
                  const completed = analytics.completedZoneDistances[zone as ZoneName] || 0;
                  const planned = analytics.plannedZoneDistances[zone as ZoneName] || 0;
                  if (planned === 0 && completed === 0) return null;
                  const ratio = planned > 0 ? Math.min(completed / planned, 1) : 0;
                  return (
                    <View key={zone} style={styles.analyticsZoneRow}>
                      <View style={styles.analyticsZoneLabelBox}>
                        <View style={[styles.analyticsZoneDot, { backgroundColor: config.color }]} />
                        <Text style={styles.analyticsZoneLabel}>{config.label}</Text>
                      </View>
                      <View style={styles.analyticsZoneBarBg}>
                        <View style={[styles.analyticsZoneBarFill, { width: `${ratio * 100}%`, backgroundColor: config.color }]} />
                      </View>
                      <Text style={styles.analyticsZoneValue}>{(completed / 1000).toFixed(1)}km</Text>
                    </View>
                  );
                })}
              </View>
            </SlideIn>
          );
        })()}

        {/* トレーニング記録ボタン */}
        <SlideIn delay={250} direction="up">
          <Pressable
            style={styles.logEntryButton}
            onPress={() => setView('log')}
          >
            <View style={styles.logEntryButtonLeft}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.logEntryButtonTitle}>トレーニング記録</Text>
                <Text style={styles.logEntryButtonSubtitle}>
                  {trainingLogs.filter((l) => l.status === 'completed').length}件の記録
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
          </Pressable>
        </SlideIn>

        {/* サブレース（予定レース） */}
        <SlideIn delay={280} direction="up">
          <View style={styles.subRaceSection}>
            <View style={styles.subRaceSectionHeader}>
              <Text style={styles.sectionLabel}>レーススケジュール</Text>
              <Pressable
                style={styles.addSubRaceButton}
                onPress={() => {
                  setSubRaceName('');
                  setSubRaceDate(null);
                  setSubRaceDistance(1500);
                  setSubRacePriority('medium');
                  setShowSubRaceModal(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.addSubRaceButtonText}>レース追加</Text>
              </Pressable>
            </View>

            {(!activePlan.subRaces || activePlan.subRaces.length === 0) ? (
              <View style={styles.subRaceEmpty}>
                <Text style={styles.subRaceEmptyText}>
                  ターゲットレースまでに出場予定のレースを追加できます。{'\n'}
                  レース前の練習負荷が自動調整されます。
                </Text>
              </View>
            ) : (
              <View style={styles.subRaceList}>
                {activePlan.subRaces.map((sr) => {
                  const srDate = new Date(sr.date);
                  const daysUntilSr = Math.ceil((srDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const priorityConfig = {
                    high: { label: '重要', color: '#EF4444' },
                    medium: { label: '中程度', color: '#EAB308' },
                    low: { label: '練習レース', color: '#9CA3AF' },
                  };
                  return (
                    <View key={sr.id} style={styles.subRaceItem}>
                      <View style={styles.subRaceItemLeft}>
                        <View style={[styles.subRacePriorityDot, { backgroundColor: priorityConfig[sr.priority].color }]} />
                        <View>
                          <Text style={styles.subRaceItemName}>{sr.name}</Text>
                          <Text style={styles.subRaceItemDetail}>
                            {formatRaceDistance(sr.distance, sr.customDistance)}
                            {' '}·{' '}
                            {daysUntilSr > 0 ? `あと${daysUntilSr}日` : '終了'}
                            {' '}·{' '}
                            {priorityConfig[sr.priority].label}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          Alert.alert('サブレース削除', `「${sr.name}」を削除しますか？`, [
                            { text: 'キャンセル', style: 'cancel' },
                            { text: '削除', style: 'destructive', onPress: () => removeSubRace(sr.id) },
                          ]);
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={20} color={COLORS.text.muted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </SlideIn>

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
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                '新しい計画を作成',
                '現在の計画を上書きして新しい計画を作成します。トレーニング記録やテスト結果は保持されます。',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: '作成する', onPress: () => setView('create') },
                ],
              );
            }}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>新しい計画を作成</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { marginTop: 8 }]} onPress={handleDeletePlan}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>計画を削除</Text>
          </Pressable>
        </SlideIn>
      </ScrollView>

      {/* サブレース追加モーダル */}
      <Modal
        visible={showSubRaceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubRaceModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlayPress}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>レースを追加</Text>
              <Pressable onPress={() => setShowSubRaceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* レース名 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>レース名</Text>
                <TextInput
                  style={styles.input}
                  value={subRaceName}
                  onChangeText={setSubRaceName}
                  placeholder="例: 県選手権"
                  placeholderTextColor={COLORS.text.muted}
                />
              </View>

              {/* レース日 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>レース日</Text>
                <Pressable
                  style={styles.inputButton}
                  onPress={() => setShowSubRaceDatePicker(true)}
                >
                  <Text style={[styles.inputButtonText, !subRaceDate && styles.inputPlaceholder]}>
                    {subRaceDate ? formatDateDisplay(subRaceDate) : '日付を選択'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.text.muted} />
                </Pressable>
              </View>

              {/* 種目 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>種目</Text>
                <View style={styles.distanceSelector}>
                  {RACE_DISTANCE_OPTIONS.map((opt) => (
                    <Pressable
                      key={String(opt.value)}
                      style={[styles.distanceOption, subRaceDistance === opt.value && styles.distanceOptionActive]}
                      onPress={() => setSubRaceDistance(opt.value)}
                    >
                      <Text style={[styles.distanceOptionText, subRaceDistance === opt.value && styles.distanceOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {subRaceDistance === 'custom' && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    value={subRaceCustomDistance}
                    onChangeText={setSubRaceCustomDistance}
                    placeholder="距離をメートルで入力（例: 1000）"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="numeric"
                  />
                )}
              </View>

              {/* 重要度 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>重要度</Text>
                <View style={styles.prioritySelector}>
                  {([
                    { key: 'high' as const, label: '重要', desc: 'しっかり調整して臨むレース', color: '#EF4444' },
                    { key: 'medium' as const, label: '中程度', desc: '軽い調整で臨むレース', color: '#EAB308' },
                    { key: 'low' as const, label: '練習レース', desc: '調整なし・練習の一環', color: '#9CA3AF' },
                  ]).map((p) => (
                    <Pressable
                      key={p.key}
                      style={[styles.priorityOption, subRacePriority === p.key && { borderColor: p.color, borderWidth: 1 }]}
                      onPress={() => setSubRacePriority(p.key)}
                    >
                      <View style={[styles.subRacePriorityDot, { backgroundColor: p.color }]} />
                      <View>
                        <Text style={[styles.priorityOptionText, subRacePriority === p.key && { color: COLORS.text.primary }]}>{p.label}</Text>
                        <Text style={styles.priorityOptionDesc}>{p.desc}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.createButton, (!subRaceName || !subRaceDate) && styles.createButtonDisabled]}
              onPress={() => {
                if (!subRaceName || !subRaceDate) return;
                // サブレースのバリデーション
                const planStart = activePlan.weeklyPlans?.[0]?.startDate;
                const raceEnd = activePlan.race.date;
                const srDateStr = subRaceDate.toISOString();
                if (planStart && srDateStr < planStart) {
                  Alert.alert('エラー', '計画開始日より前の日付は設定できません');
                  return;
                }
                if (srDateStr >= raceEnd) {
                  Alert.alert('エラー', 'ターゲットレース日以降の日付は設定できません');
                  return;
                }
                const subCustomDist = subRaceDistance === 'custom' ? parseInt(subRaceCustomDistance, 10) : undefined;
                if (subRaceDistance === 'custom' && (!subRaceCustomDistance || !subCustomDist || subCustomDist <= 0)) {
                  Alert.alert('エラー', '任意距離を入力してください');
                  return;
                }
                addSubRace({
                  id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  name: subRaceName,
                  date: srDateStr,
                  distance: subRaceDistance,
                  customDistance: subCustomDist,
                  priority: subRacePriority,
                });
                setShowSubRaceModal(false);
              }}
              disabled={!subRaceName || !subRaceDate}
            >
              <Text style={styles.createButtonText}>追加</Text>
            </Pressable>
          </View>
          </View>
        </KeyboardAvoidingView>

        <DatePickerModal
          visible={showSubRaceDatePicker}
          onClose={() => setShowSubRaceDatePicker(false)}
          onSelect={(date) => setSubRaceDate(date)}
          value={subRaceDate || undefined}
          title="レース日を選択"
        />
      </Modal>
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
    case 'race': return { name: 'trophy', color: '#EAB308' };
    default: return { name: 'fitness', color: '#F97316' };
  }
}

// ============================================
// 結果記録モーダル
// ============================================

interface RecordResultModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  distance: string;
  setDistance: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  feeling: FeelingLevel;
  setFeeling: (v: FeelingLevel) => void;
  notes: string;
  setNotes: (v: string) => void;
}

function RecordResultModal({
  visible, onClose, onSave,
  distance, setDistance,
  duration, setDuration,
  feeling, setFeeling,
  notes, setNotes,
}: RecordResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalOverlayPress} onPress={onClose}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            {/* ヘッダー */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>結果を記録</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 距離 */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>走行距離（m）</Text>
                <TextInput
                  style={styles.modalInput}
                  value={distance}
                  onChangeText={setDistance}
                  placeholder="例: 6000"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                />
              </View>

              {/* 所要時間 */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>所要時間（分）</Text>
                <TextInput
                  style={styles.modalInput}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="例: 25"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                />
              </View>

              {/* 体感 */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>体感</Text>
                <View style={styles.feelingSelector}>
                  {(Object.keys(FEELING_CONFIG) as FeelingLevel[]).map((key) => {
                    const config = FEELING_CONFIG[key];
                    const isActive = feeling === key;
                    return (
                      <Pressable
                        key={key}
                        style={[styles.feelingOption, isActive && { backgroundColor: config.color + '25', borderColor: config.color }]}
                        onPress={() => setFeeling(key)}
                      >
                        <Ionicons name={config.icon as any} size={18} color={isActive ? config.color : COLORS.text.muted} />
                        <Text style={[styles.feelingOptionText, isActive && { color: config.color }]}>
                          {config.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* メモ */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>メモ</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="練習の感想や気づきなど"
                  placeholderTextColor={COLORS.text.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* ボタン */}
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelButton} onPress={onClose}>
                <Text style={styles.modalCancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={onSave}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.modalSaveButtonText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
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
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
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
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  distanceOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 10,
    minWidth: '20%',
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

  // 休養日頻度セレクター
  frequencySelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  frequencyOptionActive: {
    backgroundColor: COLORS.primary,
  },
  frequencyOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  frequencyOptionTextActive: {
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

  // ターゲットレースバッジ
  targetRaceBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  targetRaceBadgeText: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
  },

  // サブレースセクション
  subRaceSection: {
    marginTop: 4,
  },
  subRaceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addSubRaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addSubRaceButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  subRaceEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  subRaceEmptyText: {
    fontSize: 13,
    color: COLORS.text.muted,
    lineHeight: 20,
    textAlign: 'center',
  },
  subRaceList: {
    gap: 8,
  },
  subRaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
  },
  subRaceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subRacePriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subRaceItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  subRaceItemDetail: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },

  // 重要度セレクター（モーダル）
  prioritySelector: {
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  priorityOptionDesc: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
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
  subRaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  subRaceBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F97316',
  },

  // 週間根拠カード
  weekRationaleCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  weekRationaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  weekRationaleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EAB308',
  },
  weekRationaleText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  weekRationaleLimiterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  weekRationaleLimiterText: {
    fontSize: 12,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  dayRationaleHint: {
    fontSize: 10,
    color: COLORS.text.muted,
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
    width: 90,
  },
  dayDateColumn: {
    alignItems: 'center',
    width: 30,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  dayDate: {
    fontSize: 10,
    color: COLORS.text.muted,
    marginTop: 1,
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
    gap: 2,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    flexShrink: 1,
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
  dayReplaceButton: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.3,
  },
  completionHintText: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    opacity: 0.7,
  },

  // トレーニング分析ダッシュボード
  analyticsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  analyticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  analyticsDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  analyticsDistanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsDistanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  analyticsDistanceLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  analyticsDistanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsZoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  analyticsZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  analyticsZoneLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 85,
  },
  analyticsZoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  analyticsZoneLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  analyticsZoneBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  analyticsZoneBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  analyticsZoneValue: {
    fontSize: 11,
    color: COLORS.text.muted,
    width: 50,
    textAlign: 'right',
  },

  // トレーニング記録ボタン（概要画面）
  logEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  logEntryButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logEntryButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  logEntryButtonSubtitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },

  // トレーニング記録画面
  logSection: {
    gap: 10,
    marginBottom: 24,
  },
  logCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logCardInfo: {
    flex: 1,
  },
  logCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  logCardCategory: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  logCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  logRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  logRecordButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  logSkipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  logSkipButtonText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  logDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
  },

  // ステータスバッジ
  logStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  logStatusPlanned: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  logStatusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  logStatusSkipped: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  logStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },

  // 空状態
  logEmptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  logEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  logEmptySubText: {
    fontSize: 13,
    color: COLORS.text.muted,
    textAlign: 'center',
  },

  // タイムライン
  logTimeline: {
    gap: 4,
  },
  logDateGroup: {
    marginBottom: 16,
  },
  logDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  logDateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.text.muted,
  },
  logDateDotToday: {
    backgroundColor: COLORS.primary,
  },
  logDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  logDateTextToday: {
    color: COLORS.primary,
  },
  logTimelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  logTimelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTimelineCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  logTimelineCardCategory: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  logResultSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  logResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logResultValue: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  logResultNotes: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },

  // 結果記録モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalOverlayPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 20,
    padding: 24,
    width: '92%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalInputGroup: {
    marginBottom: 18,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  feelingSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  feelingOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  feelingOptionText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.text.muted,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // メニュー更新通知バナー
  updateBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  updateBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  updateBannerTextContainer: {
    flex: 1,
  },
  updateBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAB308',
    marginBottom: 4,
  },
  updateBannerDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  updateBannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  updateBannerButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EAB308',
    alignItems: 'center',
  },
  updateBannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  updateBannerDismiss: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  updateBannerDismissText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },

  // 事後記録モーダル
  actualDataModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  actualDataModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  actualDataModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actualDataModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  actualDataModalSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  actualDataModalHint: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  actualDataZoneList: {
    maxHeight: 320,
  },
  actualDataZoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  actualDataZoneLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  actualDataZoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actualDataZoneName: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  actualDataZonePlanned: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  actualDataZoneInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 100,
    fontSize: 14,
    color: COLORS.text.primary,
    textAlign: 'right',
  },
  actualDataNotesSection: {
    marginTop: 16,
  },
  actualDataNotesLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 6,
  },
  actualDataNotesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actualDataModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actualDataSkipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  actualDataSkipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  actualDataSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  actualDataSaveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // メニュー追加ボタン
  addMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 159, 45, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(45, 159, 45, 0.05)',
  },
  addMenuButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // メニュー選択モーダル
  menuSelectOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  menuSelectContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  menuSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuSelectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  menuSelectCategoryScroll: {
    marginBottom: 12,
    maxHeight: 36,
  },
  menuSelectCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
  },
  menuSelectCategoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  menuSelectCategoryChipText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  menuSelectCategoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  menuSelectList: {
    flex: 1,
  },
  menuSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuSelectItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuSelectItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  menuSelectItemCategory: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
});
