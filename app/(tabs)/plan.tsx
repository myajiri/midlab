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
import { getWeeklyPlanRationale, calculateTrainingAnalytics, getWorkoutZoneDistances, calculateZoneTimes, AnalyticsPeriod } from '../../src/utils';
import { ZoneName } from '../../src/types';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { SwipeBackView } from '../../components/SwipeBackView';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// タイムゾーン安全なローカル日付文字列ヘルパー（YYYY-MM-DD）
const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// レース距離ラベル
const RACE_DISTANCE_OPTIONS: { value: RaceDistance; labelKey: string }[] = [
  { value: 400, labelKey: '400m' },
  { value: 800, labelKey: '800m' },
  { value: 1500, labelKey: '1500m' },
  { value: 3000, labelKey: '3000m' },
  { value: 5000, labelKey: '5000m' },
  { value: 10000, labelKey: '10000m' },
  { value: 21097, labelKey: 'plan.distanceHalf' },
  { value: 42195, labelKey: 'plan.distanceMarathon' },
  { value: 'custom', labelKey: 'plan.distanceCustom' },
];

// レース距離の表示ラベル - コンポーネント内でformatRaceDistance(t, ...)として使用
function formatRaceDistance(tFn: (key: string) => string, distance: RaceDistance, customDistance?: number): string {
  if (distance === 'custom') return customDistance ? `${customDistance}m` : tFn('plan.customDistance');
  if (distance === 21097) return tFn('plan.halfMarathon');
  if (distance === 42195) return tFn('plan.marathon');
  return `${distance}m`;
}

// ビュータイプ
type ViewType = 'overview' | 'create' | 'weekly' | 'log';

// 体感レベル設定
const FEELING_CONFIG: Record<FeelingLevel, { labelKey: string; icon: string; color: string }> = {
  great: { labelKey: 'plan.feeling.great', icon: 'happy', color: '#22C55E' },
  good: { labelKey: 'plan.feeling.good', icon: 'thumbs-up', color: '#3B82F6' },
  normal: { labelKey: 'plan.feeling.normal', icon: 'remove', color: '#EAB308' },
  tough: { labelKey: 'plan.feeling.tough', icon: 'thumbs-down', color: '#F97316' },
  bad: { labelKey: 'plan.feeling.bad', icon: 'sad', color: '#EF4444' },
};

export default function PlanScreen() {
  const { t } = useTranslation();
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
        cardio: { note: t('plan.customWorkout') },
        muscular: { note: t('plan.customWorkout') },
        balanced: { note: t('plan.customWorkout') },
      },
    }));
  }, [customWorkouts]);

  // メニュー更新通知の非表示フラグ
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);
  const showUpdateBanner = activePlan && !updateBannerDismissed && (activePlan.planVersion || 0) < PLAN_VERSION;

  // メニュー更新: 計画を再生成
  const handleRegeneratePlan = () => {
    Alert.alert(
      t('plan.updateMenu'),
      t('plan.updateMenuDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('plan.update'),
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
  const updateTrainingLog = useTrainingLogsStore((state) => state.updateLog);

  const [view, setView] = useState<ViewType>(activePlan ? 'overview' : 'create');
  const setSubScreenOpen = useSetSubScreenOpen();
  const isFocused = useIsFocused();

  // 結果記録モーダル
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [recordingLogId, setRecordingLogId] = useState<string | null>(null);
  const [recordDistance, setRecordDistance] = useState('');
  const [recordDurationMin, setRecordDurationMin] = useState('');
  const [recordDurationSec, setRecordDurationSec] = useState('');
  const [recordFeeling, setRecordFeeling] = useState<FeelingLevel>('normal');
  const [recordNotes, setRecordNotes] = useState('');

  // 事後記録モーダル（完了時のゾーン別実績距離入力）
  const [actualDataModalVisible, setActualDataModalVisible] = useState(false);
  const [actualDataTarget, setActualDataTarget] = useState<{ weekNumber: number; dayId: string; label: string; zoneDistances?: Record<string, number> } | null>(null);
  const [actualZoneInputs, setActualZoneInputs] = useState<Record<string, string>>({});
  const [actualNotes, setActualNotes] = useState('');

  // 記録編集モーダル
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDistance, setEditDistance] = useState('');
  const [editDurationMin, setEditDurationMin] = useState('');
  const [editDurationSec, setEditDurationSec] = useState('');
  const [editFeeling, setEditFeeling] = useState<FeelingLevel>('normal');
  const [editNotes, setEditNotes] = useState('');

  // 記録編集モーダルを開く
  const openEditModal = (log: TrainingLog) => {
    setEditingLogId(log.id);
    setEditDistance(log.result?.distance != null ? String(log.result.distance) : '');
    // 秒を分:秒に分解してセット
    if (log.result?.duration != null) {
      setEditDurationMin(String(Math.floor(log.result.duration / 60)));
      setEditDurationSec(String(log.result.duration % 60));
    } else {
      setEditDurationMin('');
      setEditDurationSec('');
    }
    setEditFeeling(log.result?.feeling || 'normal');
    setEditNotes(log.result?.notes || '');
    setEditModalVisible(true);
  };

  // 編集を保存
  const handleSaveEdit = () => {
    if (!editingLogId) return;
    const min = editDurationMin ? parseInt(editDurationMin, 10) : 0;
    const sec = editDurationSec ? parseInt(editDurationSec, 10) : 0;
    const totalSec = min * 60 + sec;
    updateTrainingLog(editingLogId, {
      result: {
        distance: editDistance ? parseInt(editDistance, 10) : undefined,
        duration: totalSec > 0 ? totalSec : undefined,
        feeling: editFeeling,
        notes: editNotes || undefined,
      },
    });
    setEditModalVisible(false);
    setEditingLogId(null);
    showToast(t('plan.recordUpdated'), 'success');
  };

  // 記録を削除して未完了に戻す
  const handleDeleteRecord = () => {
    if (!editingLogId) return;
    const log = trainingLogs.find((l) => l.id === editingLogId);
    if (log) {
      // 計画内の完了状態も未完了に戻す
      if (log.weekNumber != null && log.planId === activePlan?.id) {
        const wp = activePlan?.weeklyPlans.find((w) => w.weekNumber === log.weekNumber);
        if (wp) {
          // 日付とworkoutIdの両方でマッチングして正確に特定する
          const dayData = wp.days.find((d) => {
            if (!d) return false;
            const wpStart = new Date(wp.startDate); const startParts = [wpStart.getFullYear(), wpStart.getMonth() + 1, wpStart.getDate()];
            const dayDate = new Date(startParts[0], startParts[1] - 1, startParts[2] + d.dayOfWeek);
            const dateStr = toLocalDateStr(dayDate);
            return dateStr === log.date && (d.workoutId === log.workoutId || d.id === log.workoutId);
          });
          if (dayData && dayData.completed) {
            toggleWorkoutComplete(log.weekNumber, dayData.id);
          }
        }
      }
      deleteTrainingLog(log.id);
    }
    setEditModalVisible(false);
    setEditingLogId(null);
    showToast(t('plan.recordDeleted'), 'success');
  };

  // メニュー追加モーダル
  const [menuSelectModalVisible, setMenuSelectModalVisible] = useState(false);
  const [menuSelectDate, setMenuSelectDate] = useState<string>(toLocalDateStr(new Date()));
  const [menuSelectCategory, setMenuSelectCategory] = useState('all');
  const [menuDatePickerVisible, setMenuDatePickerVisible] = useState(false);

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
    // メニュー追加後、結果記録モーダルを自動表示
    setTimeout(() => openRecordModal(log.id), 300);
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

  // 結果記録モーダルを開く（ゾーン距離から距離・タイムを自動算出）
  const openRecordModal = (logId: string) => {
    setRecordingLogId(logId);
    setRecordFeeling('normal');
    setRecordNotes('');

    // ワークアウトのゾーン別距離から合計距離と推定タイムを算出
    const log = trainingLogs.find((l) => l.id === logId);
    if (log?.workoutId && etp) {
      const zoneDistances = getWorkoutZoneDistances(log.workoutId, limiter, customWorkoutsAsTemplates);
      if (Object.keys(zoneDistances).length > 0) {
        // 合計距離
        const totalDistance = Object.values(zoneDistances).reduce((sum, d) => sum + (d || 0), 0);
        setRecordDistance(totalDistance > 0 ? String(totalDistance) : '');

        // ゾーン別タイムの合計（秒→分:秒に変換）
        const zoneTimes = calculateZoneTimes(zoneDistances, etp, limiter);
        const totalSeconds = Math.round(Object.values(zoneTimes).reduce((sum, t) => sum + (t || 0), 0));
        if (totalSeconds > 0) {
          setRecordDurationMin(String(Math.floor(totalSeconds / 60)));
          setRecordDurationSec(String(totalSeconds % 60));
        } else {
          setRecordDurationMin('');
          setRecordDurationSec('');
        }
      } else {
        setRecordDistance('');
        setRecordDurationMin('');
        setRecordDurationSec('');
      }
    } else {
      setRecordDistance('');
      setRecordDurationMin('');
      setRecordDurationSec('');
    }

    setRecordModalVisible(true);
  };

  // 結果を保存
  const handleSaveRecord = () => {
    if (!recordingLogId) return;
    // 分と秒を合算して秒で保存
    const min = recordDurationMin ? parseInt(recordDurationMin, 10) : 0;
    const sec = recordDurationSec ? parseInt(recordDurationSec, 10) : 0;
    const totalSec = min * 60 + sec;
    completeTrainingLog(recordingLogId, {
      distance: recordDistance ? parseInt(recordDistance, 10) : undefined,
      duration: totalSec > 0 ? totalSec : undefined,
      feeling: recordFeeling,
      notes: recordNotes || undefined,
    });
    setRecordModalVisible(false);
    setRecordingLogId(null);
  };

  // ログを日付でグループ化（現在の計画に紐づくログのみ）
  const groupedLogs = useMemo(() => {
    const groups: Record<string, TrainingLog[]> = {};
    for (const log of trainingLogs) {
      // 計画がある場合は、その計画のログのみ表示
      if (activePlan && log.planId !== activePlan.id) continue;
      const date = log.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    }
    // 日付降順でソート
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [trainingLogs, activePlan]);

  // プラン関連のログのみフィルタ
  const planLogs = useMemo(() => {
    if (!activePlan) return groupedLogs;
    const raceDateObj = new Date(activePlan.race.date);
    const raceDate = toLocalDateStr(raceDateObj);
    const startDateObj = activePlan.weeklyPlans?.[0]?.startDate ? new Date(activePlan.weeklyPlans[0].startDate) : null;
    const startDate = startDateObj ? toLocalDateStr(startDateObj) : '';
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

  // トレーニング分析の期間フィルタ
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('all');

  // 日付バリデーション
  // ※ Hooks（useMemo）は条件分岐の前に配置する必要がある（Rules of Hooks）
  const validateDate = (date: Date | null): { valid: boolean; error?: string } => {
    if (!date) return { valid: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return { valid: false, error: t('plan.errorPastDate') };
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 28);
    if (date < minDate) return { valid: false, error: t('plan.errorMinDate') };
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (date > maxDate) return { valid: false, error: t('plan.errorMaxDate') };
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
      <PremiumGate featureName={t('plan.featureName')}>
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
      Alert.alert(t('common.error'), t('plan.errorFillAll'));
      return;
    }
    if (distance === 'custom' && (!customDistanceInput || parseInt(customDistanceInput, 10) <= 0)) {
      Alert.alert(t('common.error'), t('plan.errorCustomDistance'));
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
    Alert.alert(t('plan.deletePlan'), t('plan.deletePlanConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { clearPlan(); setView('create'); } },
    ]);
  };

  // ============================================
  // 計画作成画面
  // ============================================
  if (view === 'create') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PremiumGate featureName={t('plan.featureName')}>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
            <FadeIn>
              <Text style={styles.pageTitle}>{t('plan.createTitle')}</Text>
              <Text style={styles.pageSubtitle}>{t('plan.createSubtitle')}</Text>
            </FadeIn>

            <SlideIn delay={100} direction="up">
              <View style={styles.formCard}>
                {/* レース名 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('plan.raceName')}</Text>
                  <TextInput
                    style={styles.input}
                    value={raceName}
                    onChangeText={setRaceName}
                    placeholder={t('plan.raceNamePlaceholder')}
                    placeholderTextColor={COLORS.text.muted}
                  />
                </View>

                {/* レース日 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('plan.raceDate')}</Text>
                  <Pressable
                    style={[styles.inputButton, dateValidation.error && styles.inputError]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[styles.inputButtonText, !raceDate && styles.inputPlaceholder]}>
                      {raceDate ? formatDateDisplay(raceDate) : t('plan.selectDate')}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.text.muted} />
                  </Pressable>
                  {dateValidation.error && <Text style={styles.errorText}>{dateValidation.error}</Text>}
                </View>

                {/* 種目 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('plan.event')}</Text>
                  <View style={styles.distanceSelector}>
                    {RACE_DISTANCE_OPTIONS.map((opt) => (
                      <Pressable
                        key={String(opt.value)}
                        style={[styles.distanceOption, distance === opt.value && styles.distanceOptionActive]}
                        onPress={() => setDistance(opt.value)}
                      >
                        <Text style={[styles.distanceOptionText, distance === opt.value && styles.distanceOptionTextActive]}>
                          {t(opt.labelKey)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {distance === 'custom' && (
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={customDistanceInput}
                      onChangeText={setCustomDistanceInput}
                      placeholder={t('plan.customDistancePlaceholder')}
                      placeholderTextColor={COLORS.text.muted}
                      keyboardType="numeric"
                    />
                  )}
                </View>

                {/* 休養日 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('plan.restDay')}</Text>
                  <View style={styles.restDaySelector}>
                    {([t('plan.mon'), t('plan.tue'), t('plan.wed'), t('plan.thu'), t('plan.fri'), t('plan.sat'), t('plan.sun')]).map((name, i) => (
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
                  <Text style={styles.inputLabel}>{t('plan.restDayFrequency')}</Text>
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
                  <Text style={styles.inputLabel}>{t('plan.keyWorkoutDays')}</Text>
                  <View style={styles.restDaySelector}>
                    {([t('plan.mon'), t('plan.tue'), t('plan.wed'), t('plan.thu'), t('plan.fri'), t('plan.sat'), t('plan.sun')]).map((name, i) => {
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
                  <Text style={styles.inputLabel}>{t('plan.monthlyMileage')}</Text>
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
                    placeholder={t('plan.mileagePlaceholder')}
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="numeric"
                  />
                  <Text style={styles.hintText}>{t('plan.mileageHint')}</Text>
                </View>

              </View>
            </SlideIn>

            <SlideIn delay={200} direction="up">
              <Pressable
                style={[styles.createButton, (!raceName || !dateValidation.valid) && styles.createButtonDisabled]}
                onPress={handleCreatePlan}
                disabled={!raceName || !dateValidation.valid}
              >
                <Text style={styles.createButtonText}>{t('plan.generate')}</Text>
              </Pressable>

              {activePlan && (
                <Pressable style={styles.cancelButton} onPress={() => setView('overview')}>
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </Pressable>
              )}
            </SlideIn>

            <DatePickerModal
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSelect={(date) => setRaceDate(date)}
              value={raceDate || undefined}
              minDate={minDateForPicker}
              title={t('plan.selectRaceDate')}
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
            <Text style={styles.emptyTitle}>{t('plan.noPlan')}</Text>
            <Text style={styles.emptySubtitle}>{t('plan.noPlanSubtitle')}</Text>
            <Pressable style={styles.createButton} onPress={() => setView('create')}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>{t('plan.createPlan')}</Text>
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
            <Text style={styles.headerTitle}>{t('plan.weeklySchedule')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('plan.noData')}</Text>
          </View>
        </SafeAreaView>
        </SwipeBackView>
      );
    }

    const phase = PHASE_CONFIG[weekPlan.phaseType];
    const dayNames = [t('plan.mon'), t('plan.tue'), t('plan.wed'), t('plan.thu'), t('plan.fri'), t('plan.sat'), t('plan.sun')];
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
            <Text style={styles.headerTitle}>{t('plan.weekNumber', { week: weekPlan.weekNumber })}</Text>
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
                {isCurrentWeek && <View style={styles.currentWeekBadge}><Text style={styles.currentWeekBadgeText}>{t('plan.thisWeek')}</Text></View>}
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
              <Text style={styles.weekProgressText}>{t('plan.weekProgress', { current: selectedWeek, total: totalWeeks })}</Text>
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
                      {weekPlan.subRace.name} ({formatRaceDistance(t, weekPlan.subRace.distance, weekPlan.subRace.customDistance)})
                    </Text>
                  </View>
                )}
                {weekPlan.isRecoveryWeek && (
                  <View style={styles.recoveryBadge}>
                    <Ionicons name="leaf" size={14} color="#22C55E" />
                    <Text style={styles.recoveryBadgeText}>{t('plan.recoveryWeek')}</Text>
                  </View>
                )}
                {weekPlan.isRampTestWeek && (
                  <View style={styles.testBadge}>
                    <Ionicons name="analytics" size={14} color="#8B5CF6" />
                    <Text style={styles.testBadgeText}>{t('plan.testWeek')}</Text>
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
                <Text style={styles.weekRationaleTitle}>{t('plan.weekGoal')}</Text>
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
                              replaceDayLabel: t('plan.weekDayLabel', { week: weekPlan.weekNumber, day: dayNames[i] }),
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
                      dayDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isFutureDay = dayDate > today;
                      return (
                        <Pressable
                          style={[styles.checkButton, (isFutureDay || day.completed) && styles.checkButtonDisabled]}
                          onPress={() => {
                            if (!isFutureDay && !day.completed) {
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
                          }}
                          disabled={isFutureDay || day.completed}
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
            <Text style={styles.completionHintText}>{t('plan.completionHint')}</Text>
          </FadeIn>
        </ScrollView>

        {/* 事後記録モーダル */}
        <Modal
          visible={actualDataModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActualDataModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.actualDataModalOverlay}
          >
            <Pressable style={styles.actualDataModalOverlayPress} onPress={() => setActualDataModalVisible(false)}>
              <Pressable style={styles.actualDataModalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.actualDataModalHeader}>
                  <Text style={styles.actualDataModalTitle}>{t('plan.trainingRecord')}</Text>
                  <Pressable onPress={() => setActualDataModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                  </Pressable>
                </View>
              <Text style={styles.actualDataModalSubtitle}>{actualDataTarget?.label || ''}</Text>
              <Text style={styles.actualDataModalHint}>{t('plan.actualDataHint')}</Text>

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
                        {planned ? <Text style={styles.actualDataZonePlanned}>{t('plan.planned', { distance: planned })}</Text> : null}
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
                  <Text style={styles.actualDataNotesLabel}>{t('plan.notes')}</Text>
                  <TextInput
                    style={styles.actualDataNotesInput}
                    value={actualNotes}
                    onChangeText={setActualNotes}
                    placeholder={t('plan.notesPlaceholder')}
                    placeholderTextColor={COLORS.text.muted}
                    multiline
                  />
                </View>
              </ScrollView>

              <View style={styles.actualDataModalButtons}>
                <Pressable
                  style={styles.actualDataSkipButton}
                  onPress={() => {
                    // 記録なしで完了（計画値を実績としてセット）
                    if (actualDataTarget) {
                      const plannedZones = actualDataTarget.zoneDistances || {};
                      const plannedTotal = Object.values(plannedZones).reduce((s, d) => s + (d || 0), 0);
                      updateActualData(actualDataTarget.weekNumber, actualDataTarget.dayId, {
                        distance: plannedTotal > 0 ? plannedTotal : undefined,
                        zoneDistances: Object.keys(plannedZones).length > 0 ? plannedZones : undefined,
                      });
                      // TrainingLogにも記録を追加
                      const wp = activePlan?.weeklyPlans.find(w => w.weekNumber === actualDataTarget.weekNumber);
                      const dayData = wp?.days.find(d => d?.id === actualDataTarget.dayId);
                      if (dayData && wp) {
                        const wpStart = new Date(wp.startDate); const startParts = [wpStart.getFullYear(), wpStart.getMonth() + 1, wpStart.getDate()];
                        const dayDate = new Date(startParts[0], startParts[1] - 1, startParts[2] + dayData.dayOfWeek);
                        addTrainingLog({
                          id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                          date: toLocalDateStr(dayDate),
                          workoutId: dayData.workoutId || dayData.id,
                          workoutName: dayData.label,
                          workoutCategory: dayData.focusCategory || dayData.type,
                          status: 'completed',
                          planId: activePlan?.id,
                          weekNumber: actualDataTarget.weekNumber,
                          completedAt: new Date().toISOString(),
                        });
                      }
                    }
                    setActualDataModalVisible(false);
                  }}
                >
                  <Text style={styles.actualDataSkipButtonText}>{t('plan.completeWithoutRecord')}</Text>
                </Pressable>
                <Pressable
                  style={styles.actualDataSaveButton}
                  onPress={() => {
                    if (actualDataTarget) {
                      // ゾーン距離を数値に変換（入力がなければ計画値を使用）
                      const zoneDistances: Record<string, number> = {};
                      let totalDistance = 0;
                      const plannedZones = actualDataTarget.zoneDistances || {};
                      for (const zone of ['jog', 'easy', 'marathon', 'threshold', 'interval', 'repetition']) {
                        const inputVal = actualZoneInputs[zone];
                        const num = inputVal ? parseInt(inputVal, 10) : NaN;
                        const planned = plannedZones[zone] || 0;
                        if (!isNaN(num) && num > 0) {
                          // ユーザーが入力した値を使用
                          zoneDistances[zone] = num;
                          totalDistance += num;
                        } else if (planned > 0) {
                          // 入力なしの場合は計画値をデフォルトで使用
                          zoneDistances[zone] = planned;
                          totalDistance += planned;
                        }
                      }
                      updateActualData(actualDataTarget.weekNumber, actualDataTarget.dayId, {
                        distance: totalDistance > 0 ? totalDistance : undefined,
                        notes: actualNotes || undefined,
                        zoneDistances: Object.keys(zoneDistances).length > 0 ? zoneDistances : undefined,
                      });
                      // TrainingLogにも記録を追加
                      const wp = activePlan?.weeklyPlans.find(w => w.weekNumber === actualDataTarget.weekNumber);
                      const dayData = wp?.days.find(d => d?.id === actualDataTarget.dayId);
                      if (dayData && wp) {
                        const wpStart2 = new Date(wp.startDate); const startParts2 = [wpStart2.getFullYear(), wpStart2.getMonth() + 1, wpStart2.getDate()];
                        const dayDate = new Date(startParts2[0], startParts2[1] - 1, startParts2[2] + dayData.dayOfWeek);
                        addTrainingLog({
                          id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                          date: toLocalDateStr(dayDate),
                          workoutId: dayData.workoutId || dayData.id,
                          workoutName: dayData.label,
                          workoutCategory: dayData.focusCategory || dayData.type,
                          status: 'completed',
                          planId: activePlan?.id,
                          weekNumber: actualDataTarget.weekNumber,
                          result: {
                            distance: totalDistance > 0 ? totalDistance : undefined,
                            notes: actualNotes || undefined,
                          },
                          completedAt: new Date().toISOString(),
                        });
                      }
                    }
                    setActualDataModalVisible(false);
                  }}
                >
                  <Text style={styles.actualDataSaveButtonText}>{t('plan.recordAndComplete')}</Text>
                </Pressable>
              </View>
              </Pressable>
            </Pressable>
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
    const todayStr = toLocalDateStr(new Date());
    const todayLogs = trainingLogs.filter((l) => l.date === todayStr && l.planId === activePlan?.id);
    const plannedLogs = todayLogs.filter((l) => l.status === 'planned');

    return (
      <SwipeBackView onSwipeBack={() => setView('overview')}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => setView('overview')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>{t('plan.trainingRecord')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
            {/* 今日の実施予定 */}
            {plannedLogs.length > 0 && (
              <FadeIn>
                <Text style={styles.sectionLabel}>{t('plan.todayPlanned')}</Text>
                <View style={styles.logSection}>
                  {plannedLogs.map((log) => (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logCardHeader}>
                        <View style={styles.logCardInfo}>
                          <Text style={styles.logCardName}>{log.workoutName}</Text>
                          <Text style={styles.logCardCategory}>{log.workoutCategory}</Text>
                        </View>
                        <View style={[styles.logStatusBadge, styles.logStatusPlanned]}>
                          <Text style={styles.logStatusText}>{t('plan.statusPlanned')}</Text>
                        </View>
                      </View>
                      <View style={styles.logCardActions}>
                        <Pressable
                          style={styles.logRecordButton}
                          onPress={() => openRecordModal(log.id)}
                        >
                          <Ionicons name="create-outline" size={16} color="#fff" />
                          <Text style={styles.logRecordButtonText}>{t('plan.recordResult')}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.logSkipButton}
                          onPress={() => {
                            Alert.alert(t('plan.skip'), t('plan.skipConfirm'), [
                              { text: t('common.cancel'), style: 'cancel' },
                              { text: t('plan.skip'), onPress: () => skipTrainingLog(log.id) },
                            ]);
                          }}
                        >
                          <Text style={styles.logSkipButtonText}>{t('plan.skip')}</Text>
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
                <Text style={styles.addMenuButtonText}>{t('plan.addMenu')}</Text>
              </Pressable>
            </FadeIn>

            {/* 時系列記録 */}
            <SlideIn delay={100} direction="up">
              <Text style={styles.sectionLabel}>
                {activePlan ? t('plan.recordsUntilRace') : t('plan.allRecords')}
              </Text>
              {planLogs.length === 0 ? (
                <View style={styles.logEmptyState}>
                  <Ionicons name="book-outline" size={48} color={COLORS.text.muted} />
                  <Text style={styles.logEmptyText}>{t('plan.noRecords')}</Text>
                  <Text style={styles.logEmptySubText}>
                    {t('plan.noRecordsHint')}
                  </Text>
                </View>
              ) : (
                <View style={styles.logTimeline}>
                  {planLogs.map(([date, logs], groupIndex) => {
                    const dateObj = new Date(date + 'T00:00:00');
                    const isToday = date === todayStr;
                    const dayOfWeekNames = [t('plan.sun'), t('plan.mon'), t('plan.tue'), t('plan.wed'), t('plan.thu'), t('plan.fri'), t('plan.sat')];
                    const dateLabel = isToday
                      ? t('plan.today')
                      : `${dateObj.getMonth() + 1}/${dateObj.getDate()}（${dayOfWeekNames[dateObj.getDay()]}）`;

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
                                    {log.status === 'completed' ? t('plan.statusCompleted') : log.status === 'skipped' ? t('plan.statusSkipped') : t('plan.statusPlanned')}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.logTimelineCardCategory}>{log.workoutCategory}</Text>
                              {/* 記録距離がない場合、ワークアウトIDから予定距離を表示 */}
                              {!log.result?.distance && log.workoutId && (() => {
                                const zd = getWorkoutZoneDistances(log.workoutId, limiter, customWorkoutsAsTemplates);
                                const total = Object.values(zd).reduce((s, d) => s + (d || 0), 0);
                                return total > 0 ? (
                                  <View style={styles.logResultSummary}>
                                    <View style={styles.logResultItem}>
                                      <Ionicons name="trending-up" size={14} color={COLORS.text.muted} />
                                      <Text style={styles.logResultValue}>{total}m</Text>
                                    </View>
                                  </View>
                                ) : null;
                              })()}
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
                                      <Text style={styles.logResultValue}>{t('plan.durationFormat', { min: Math.floor(log.result.duration / 60), sec: log.result.duration % 60 })}</Text>
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
                                        {t(FEELING_CONFIG[log.result.feeling].labelKey)}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              )}
                              {log.result?.notes && (
                                <Text style={styles.logResultNotes}>{log.result.notes}</Text>
                              )}
                              {(log.status === 'completed' || log.status === 'skipped') && (
                                <View style={styles.logCardActions}>
                                  {log.status === 'completed' && (
                                    <Pressable
                                      style={styles.logEditButton}
                                      onPress={() => openEditModal(log)}
                                    >
                                      <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
                                      <Text style={styles.logEditButtonText}>{t('common.edit')}</Text>
                                    </Pressable>
                                  )}
                                  <Pressable
                                    style={styles.logDeleteButton}
                                    onPress={() => {
                                      Alert.alert(
                                        t('plan.deleteRecord'),
                                        log.status === 'completed'
                                          ? t('plan.deleteRecordCompleted')
                                          : t('plan.deleteRecordConfirm'),
                                        [
                                          { text: t('common.cancel'), style: 'cancel' },
                                          {
                                            text: t('common.delete'),
                                            style: 'destructive',
                                            onPress: () => {
                                              // 完了済みの場合は計画の完了状態も戻す
                                              if (log.status === 'completed' && log.weekNumber != null && log.planId === activePlan?.id) {
                                                const wp = activePlan?.weeklyPlans.find((w) => w.weekNumber === log.weekNumber);
                                                if (wp) {
                                                  const dayData = wp.days.find((d) => {
                                                    if (!d) return false;
                                                    const wpStartDel = new Date(wp.startDate); const sp = [wpStartDel.getFullYear(), wpStartDel.getMonth() + 1, wpStartDel.getDate()];
                                                    const dayDate = new Date(sp[0], sp[1] - 1, sp[2] + d.dayOfWeek);
                                                    const dateStr = toLocalDateStr(dayDate);
                                                    return dateStr === log.date && (d.workoutId === log.workoutId || d.id === log.workoutId);
                                                  });
                                                  if (dayData && dayData.completed) {
                                                    toggleWorkoutComplete(log.weekNumber, dayData.id);
                                                  }
                                                }
                                              }
                                              deleteTrainingLog(log.id);
                                              showToast(t('plan.recordDeleted'), 'success');
                                            },
                                          },
                                        ],
                                      );
                                    }}
                                  >
                                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                  </Pressable>
                                </View>
                              )}
                              {log.status === 'planned' && (
                                <View style={styles.logCardActions}>
                                  <Pressable
                                    style={[styles.logRecordButton, { flex: 1 }]}
                                    onPress={() => openRecordModal(log.id)}
                                  >
                                    <Ionicons name="create-outline" size={14} color="#fff" />
                                    <Text style={styles.logRecordButtonText}>{t('plan.record')}</Text>
                                  </Pressable>
                                  <Pressable
                                    style={styles.logDeleteButton}
                                    onPress={() => {
                                      Alert.alert(t('common.delete'), t('plan.deleteRecordConfirm'), [
                                        { text: t('common.cancel'), style: 'cancel' },
                                        { text: t('common.delete'), style: 'destructive', onPress: () => deleteTrainingLog(log.id) },
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
            feeling={recordFeeling}
            setFeeling={setRecordFeeling}
            notes={recordNotes}
            setNotes={setRecordNotes}
          />

          {/* メニュー追加モーダル */}
          <Modal
            visible={menuSelectModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuSelectModalVisible(false)}
          >
            <Pressable
              style={styles.menuSelectOverlay}
              onPress={() => setMenuSelectModalVisible(false)}
            >
              <Pressable style={styles.menuSelectContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.menuSelectHeader}>
                  <Text style={styles.menuSelectTitle}>{t('plan.addMenu')}</Text>
                  <Pressable onPress={() => setMenuSelectModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                  </Pressable>
                </View>

                {/* 日付選択 */}
                <Pressable
                  style={styles.menuSelectDateRow}
                  onPress={() => {
                    setMenuSelectModalVisible(false);
                    setTimeout(() => setMenuDatePickerVisible(true), 300);
                  }}
                >
                  <View style={styles.menuSelectDateLeft}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.menuSelectDateLabel}>{t('plan.date')}</Text>
                  </View>
                  <View style={styles.menuSelectDateRight}>
                    <Text style={styles.menuSelectDateValue}>
                      {(() => {
                        const d = new Date(menuSelectDate + 'T00:00:00');
                        const todayStr = toLocalDateStr(new Date());
                        const dateStr = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
                        return menuSelectDate === todayStr ? `${dateStr}（${t('plan.today')}）` : dateStr;
                      })()}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.text.muted} />
                  </View>
                </Pressable>

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
                        {cat === 'all' ? t('plan.all') : cat}
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

          {/* メニュー追加用の日付選択モーダル */}
          <DatePickerModal
            visible={menuDatePickerVisible}
            onClose={() => {
              setMenuDatePickerVisible(false);
              setTimeout(() => setMenuSelectModalVisible(true), 300);
            }}
            onSelect={(date) => {
              setMenuSelectDate(toLocalDateStr(date));
              setMenuDatePickerVisible(false);
              setTimeout(() => setMenuSelectModalVisible(true), 300);
            }}
            value={new Date(menuSelectDate + 'T00:00:00')}
            maxDate={new Date()}
            title={t('plan.selectRecordDate')}
          />

          {/* 記録編集モーダル */}
          <RecordResultModal
            visible={editModalVisible}
            onClose={() => setEditModalVisible(false)}
            onSave={handleSaveEdit}
            onDelete={handleDeleteRecord}
            distance={editDistance}
            feeling={editFeeling}
            setFeeling={setEditFeeling}
            notes={editNotes}
            setNotes={setEditNotes}
            title={t('plan.editRecord')}
          />
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
                <Text style={styles.targetRaceBadgeText}>{t('plan.targetRace')}</Text>
              </View>
            </View>
            <View style={styles.raceCardHeader}>
              <Ionicons name="flag" size={20} color="#F97316" />
              <Text style={styles.raceName}>{activePlan.race.name}</Text>
            </View>
            <Text style={styles.raceCountdown}>{t('plan.daysUntilRace', { days: daysUntilRace })}</Text>
            <View style={styles.raceDetails}>
              <Text style={styles.raceDetailText}>{formatRaceDistance(t, activePlan.race.distance, activePlan.race.customDistance)}</Text>
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
                  <Text style={styles.updateBannerTitle}>{t('plan.menuUpdated')}</Text>
                  <Text style={styles.updateBannerDesc}>{t('plan.menuUpdatedDesc')}</Text>
                </View>
              </View>
              <View style={styles.updateBannerActions}>
                <Pressable
                  style={styles.updateBannerButton}
                  onPress={handleRegeneratePlan}
                >
                  <Text style={styles.updateBannerButtonText}>{t('plan.update')}</Text>
                </Pressable>
                <Pressable
                  style={styles.updateBannerDismiss}
                  onPress={() => setUpdateBannerDismissed(true)}
                >
                  <Text style={styles.updateBannerDismissText}>{t('plan.later')}</Text>
                </Pressable>
              </View>
            </View>
          </SlideIn>
        )}

        {/* フェーズバー */}
        {activePlan.phases && (
          <SlideIn delay={100} direction="up">
            <View style={styles.phaseCard}>
              <Text style={styles.sectionLabel}>{t('plan.trainingPhase')}</Text>
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
                  <Text style={styles.thisWeekLabel}>{t('plan.thisWeek')}</Text>
                  <Text style={styles.thisWeekPhase}>
                    {t('plan.weekPhase', { week: currentWeekNumber, phase: PHASE_CONFIG[currentWeekPlan.phaseType].label })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.muted} />
              </View>

              {/* キートレーニング */}
              <View style={styles.keyWorkouts}>
                {currentWeekPlan.days.filter(d => d?.isKey).slice(0, 3).map((d, i) => {
                  if (!d) return null;
                  const dayNames = [t('plan.mon'), t('plan.tue'), t('plan.wed'), t('plan.thu'), t('plan.fri'), t('plan.sat'), t('plan.sun')];
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

        {/* トレーニング記録ボタン */}
        <SlideIn delay={230} direction="up">
          <Pressable
            style={styles.logEntryButton}
            onPress={() => setView('log')}
          >
            <View style={styles.logEntryButtonLeft}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.logEntryButtonTitle}>{t('plan.trainingRecord')}</Text>
                <Text style={styles.logEntryButtonSubtitle}>
                  {t('plan.recordCount', { count: trainingLogs.filter((l) => l.status === 'completed' && l.planId === activePlan?.id).length })}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
          </Pressable>
        </SlideIn>

        {/* トレーニング分析ダッシュボード */}
        {activePlan.weeklyPlans && (() => {
          // 現在の計画に紐づくログのみを分析対象にする（計画再生成時に古いログが混入しないように）
          const planLogs = trainingLogs.filter((l) => l.planId === activePlan.id);
          const analytics = calculateTrainingAnalytics(activePlan.weeklyPlans, activePlan.baseline.limiterType, planLogs, customWorkoutsAsTemplates, analyticsPeriod);
          if (analytics.completedCount === 0) return null;

          const ZONE_LABELS: Record<string, { label: string; color: string }> = {
            jog: { label: 'Jog', color: '#6B7280' },
            easy: { label: 'Easy', color: '#3B82F6' },
            marathon: { label: 'Marathon', color: '#22C55E' },
            threshold: { label: 'Threshold', color: '#EAB308' },
            interval: { label: 'Interval', color: '#F97316' },
            repetition: { label: 'Repetition', color: '#EF4444' },
          };

          // ゾーン別データを計算
          const zoneData = Object.entries(ZONE_LABELS).map(([zone, config]) => {
            const completed = analytics.completedZoneDistances[zone as ZoneName] || 0;
            const planned = analytics.plannedZoneDistances[zone as ZoneName] || 0;
            const ratio = planned > 0 ? completed / planned : 0;
            return { zone, config, completed, planned, ratio };
          }).filter(d => d.planned > 0 || d.completed > 0);

          // 全ゾーン中の最大距離（バーの最大幅計算用）
          const maxDistance = Math.max(...zoneData.map(d => Math.max(d.completed, d.planned)), 1);

          // 消化率用の合計距離
          const totalCompleted = zoneData.reduce((s, d) => s + d.completed, 0);

          return (
            <SlideIn delay={230} direction="up">
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsTitleRow}>
                  <Ionicons name="stats-chart-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.analyticsTitle}>{t('plan.trainingAnalytics')}</Text>
                </View>

                {/* 期間セレクター */}
                <View style={styles.analyticsPeriodRow}>
                  {([
                    { key: 'all' as AnalyticsPeriod, labelKey: 'plan.periodAll' },
                    { key: '30d' as AnalyticsPeriod, labelKey: 'plan.period30d' },
                    { key: '7d' as AnalyticsPeriod, labelKey: 'plan.period7d' },
                  ]).map((item) => (
                    <Pressable
                      key={item.key}
                      style={[styles.analyticsPeriodButton, analyticsPeriod === item.key && styles.analyticsPeriodButtonActive]}
                      onPress={() => setAnalyticsPeriod(item.key)}
                    >
                      <Text style={[styles.analyticsPeriodText, analyticsPeriod === item.key && styles.analyticsPeriodTextActive]}>
                        {t(item.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* 走行距離サマリー */}
                <View style={styles.analyticsDistanceRow}>
                  <View style={styles.analyticsDistanceItem}>
                    <Text style={styles.analyticsDistanceValue}>{(analytics.weeklyDistance / 1000).toFixed(1)}</Text>
                    <Text style={styles.analyticsDistanceLabel}>{t('plan.weeklyKm')}</Text>
                  </View>
                  <View style={styles.analyticsDistanceDivider} />
                  <View style={styles.analyticsDistanceItem}>
                    <Text style={styles.analyticsDistanceValue}>{(analytics.monthlyDistance / 1000).toFixed(1)}</Text>
                    <Text style={styles.analyticsDistanceLabel}>{t('plan.monthlyKm')}</Text>
                  </View>
                  <View style={styles.analyticsDistanceDivider} />
                  <View style={styles.analyticsDistanceItem}>
                    <Text style={styles.analyticsDistanceValue}>{analytics.completedCount}/{analytics.totalCount}</Text>
                    <Text style={styles.analyticsDistanceLabel}>{t('plan.completionRate')}</Text>
                  </View>
                </View>

                {/* ゾーン凡例 */}
                <View style={styles.azLegend}>
                  {zoneData.map(({ zone, config }) => (
                    <View key={zone} style={styles.azLegendItem}>
                      <View style={[styles.azLegendDot, { backgroundColor: config.color }]} />
                      <Text style={styles.azLegendText}>{config.label}</Text>
                    </View>
                  ))}
                </View>

                {/* ゾーン別横棒グラフ + 達成率・距離（一体型） */}
                <Text style={styles.analyticsZoneTitle}>{t('plan.zoneStimulus')}</Text>
                <View style={styles.azBarChartWrap}>
                  {zoneData.map(({ zone, config, completed, planned, ratio }) => {
                    const barWidth = Math.min((completed / maxDistance) * 100, 100);
                    const targetPos = (planned / maxDistance) * 100;
                    const isOver = ratio > 1;
                    const pct = Math.round(ratio * 100);
                    return (
                      <View
                        key={zone}
                        style={[styles.azBarRow, isOver && styles.azBarRowOver]}
                      >
                        <View style={styles.azBarTrack}>
                          {/* 実績バー */}
                          <View
                            style={[
                              styles.azBarFill,
                              {
                                width: `${barWidth}%`,
                                backgroundColor: config.color,
                              },
                            ]}
                          />
                          {/* 100%ターゲットライン */}
                          <View style={[styles.azBarTarget, { left: `${targetPos}%` }]} />
                        </View>
                        {/* 達成率 + 距離 */}
                        <Text style={[styles.azBarPct, isOver && styles.azBarTextOver]}>{pct}%</Text>
                        <Text style={[styles.azBarDist, isOver && styles.azBarTextOver]}>{(completed / 1000).toFixed(0)}km</Text>
                      </View>
                    );
                  })}
                  <Text style={styles.azBarTargetLabel}>--- {t('plan.targetLine100')}</Text>
                  <Text style={styles.azRatioCaption}>{t('plan.completionRate')}</Text>
                </View>

                {/* ゾーン比率（消化率・積み上げバー） */}
                <Text style={styles.analyticsZoneTitle}>{t('plan.zoneRatio')}</Text>
                {totalCompleted > 0 && (
                  <View style={styles.azRatioWrap}>
                    {/* パーセンテージラベル（バーの上） */}
                    <View style={styles.azRatioLabels}>
                      {zoneData.map(({ zone, completed }) => {
                        const pct = (completed / totalCompleted) * 100;
                        if (pct < 3) return null;
                        return (
                          <View key={zone} style={[styles.azRatioLabelItem, { width: `${pct}%` }]}>
                            <Text style={styles.azRatioLabelText}>{Math.round(pct)}%</Text>
                          </View>
                        );
                      })}
                    </View>
                    {/* 積み上げバー */}
                    <View style={styles.azRatioBar}>
                      {zoneData.map(({ zone, config, completed }) => {
                        const pct = (completed / totalCompleted) * 100;
                        if (pct < 1) return null;
                        return (
                          <View
                            key={zone}
                            style={[styles.azRatioSegment, { width: `${pct}%`, backgroundColor: config.color }]}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            </SlideIn>
          );
        })()}

        {/* サブレース（予定レース） */}
        <SlideIn delay={280} direction="up">
          <View style={styles.subRaceSection}>
            <View style={styles.subRaceSectionHeader}>
              <Text style={styles.sectionLabel}>{t('plan.raceSchedule')}</Text>
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
                <Text style={styles.addSubRaceButtonText}>{t('plan.addRace')}</Text>
              </Pressable>
            </View>

            {(!activePlan.subRaces || activePlan.subRaces.length === 0) ? (
              <View style={styles.subRaceEmpty}>
                <Text style={styles.subRaceEmptyText}>
                  {t('plan.subRaceEmptyText')}
                </Text>
              </View>
            ) : (
              <View style={styles.subRaceList}>
                {activePlan.subRaces.map((sr) => {
                  const srDate = new Date(sr.date);
                  const daysUntilSr = Math.ceil((srDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const priorityConfig = {
                    high: { label: t('plan.priorityHigh'), color: '#EF4444' },
                    medium: { label: t('plan.priorityMedium'), color: '#EAB308' },
                    low: { label: t('plan.priorityLow'), color: '#9CA3AF' },
                  };
                  return (
                    <View key={sr.id} style={styles.subRaceItem}>
                      <View style={styles.subRaceItemLeft}>
                        <View style={[styles.subRacePriorityDot, { backgroundColor: priorityConfig[sr.priority].color }]} />
                        <View>
                          <Text style={styles.subRaceItemName}>{sr.name}</Text>
                          <Text style={styles.subRaceItemDetail}>
                            {formatRaceDistance(t, sr.distance, sr.customDistance)}
                            {' '}·{' '}
                            {daysUntilSr > 0 ? t('plan.daysUntilRace', { days: daysUntilSr }) : t('plan.finished')}
                            {' '}·{' '}
                            {priorityConfig[sr.priority].label}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          Alert.alert(t('plan.deleteSubRace'), t('plan.deleteSubRaceConfirm', { name: sr.name }), [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: t('common.delete'), style: 'destructive', onPress: () => removeSubRace(sr.id) },
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
            <Text style={styles.sectionLabel}>{t('plan.overallProgress')}</Text>
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
                t('plan.newPlan'),
                t('plan.newPlanDesc'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('plan.create'), onPress: () => setView('create') },
                ],
              );
            }}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>{t('plan.newPlan')}</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { marginTop: 8 }]} onPress={handleDeletePlan}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>{t('plan.deletePlan')}</Text>
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
              <Text style={styles.modalTitle}>{t('plan.addRace')}</Text>
              <Pressable onPress={() => setShowSubRaceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* レース名 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('plan.raceName')}</Text>
                <TextInput
                  style={styles.input}
                  value={subRaceName}
                  onChangeText={setSubRaceName}
                  placeholder={t('plan.subRaceNamePlaceholder')}
                  placeholderTextColor={COLORS.text.muted}
                />
              </View>

              {/* レース日 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('plan.raceDate')}</Text>
                <Pressable
                  style={styles.inputButton}
                  onPress={() => setShowSubRaceDatePicker(true)}
                >
                  <Text style={[styles.inputButtonText, !subRaceDate && styles.inputPlaceholder]}>
                    {subRaceDate ? formatDateDisplay(subRaceDate) : t('plan.selectDate')}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.text.muted} />
                </Pressable>
              </View>

              {/* 種目 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('plan.event')}</Text>
                <View style={styles.distanceSelector}>
                  {RACE_DISTANCE_OPTIONS.map((opt) => (
                    <Pressable
                      key={String(opt.value)}
                      style={[styles.distanceOption, subRaceDistance === opt.value && styles.distanceOptionActive]}
                      onPress={() => setSubRaceDistance(opt.value)}
                    >
                      <Text style={[styles.distanceOptionText, subRaceDistance === opt.value && styles.distanceOptionTextActive]}>
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {subRaceDistance === 'custom' && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    value={subRaceCustomDistance}
                    onChangeText={setSubRaceCustomDistance}
                    placeholder={t('plan.customDistancePlaceholder')}
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="numeric"
                  />
                )}
              </View>

              {/* 重要度 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('plan.priority')}</Text>
                <View style={styles.prioritySelector}>
                  {([
                    { key: 'high' as const, labelKey: 'plan.priorityHigh', descKey: 'plan.priorityHighDesc', color: '#EF4444' },
                    { key: 'medium' as const, labelKey: 'plan.priorityMedium', descKey: 'plan.priorityMediumDesc', color: '#EAB308' },
                    { key: 'low' as const, labelKey: 'plan.priorityLow', descKey: 'plan.priorityLowDesc', color: '#9CA3AF' },
                  ]).map((p) => (
                    <Pressable
                      key={p.key}
                      style={[styles.priorityOption, subRacePriority === p.key && { borderColor: p.color, borderWidth: 1 }]}
                      onPress={() => setSubRacePriority(p.key)}
                    >
                      <View style={[styles.subRacePriorityDot, { backgroundColor: p.color }]} />
                      <View>
                        <Text style={[styles.priorityOptionText, subRacePriority === p.key && { color: COLORS.text.primary }]}>{t(p.labelKey)}</Text>
                        <Text style={styles.priorityOptionDesc}>{t(p.descKey)}</Text>
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
                // 過去の日付（今日以前）は設定不可
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const srDateOnly = new Date(subRaceDate);
                srDateOnly.setHours(0, 0, 0, 0);
                if (srDateOnly <= today) {
                  Alert.alert(t('common.error'), t('plan.errorSubRacePast'));
                  return;
                }
                // 完了済みの日には設定不可
                const srDayOfWeek = (subRaceDate.getDay() + 6) % 7;
                const targetWeek = activePlan.weeklyPlans?.find((week) => {
                  const weekStart = new Date(week.startDate);
                  const weekEnd = new Date(week.endDate);
                  return srDateOnly >= weekStart && srDateOnly <= weekEnd;
                });
                if (targetWeek) {
                  const targetDay = targetWeek.days[srDayOfWeek];
                  if (targetDay?.completed) {
                    Alert.alert(t('common.error'), t('plan.errorSubRaceCompleted'));
                    return;
                  }
                }
                if (planStart && srDateStr < planStart) {
                  Alert.alert(t('common.error'), t('plan.errorSubRaceBeforeStart'));
                  return;
                }
                if (srDateStr >= raceEnd) {
                  Alert.alert(t('common.error'), t('plan.errorSubRaceAfterTarget'));
                  return;
                }
                const subCustomDist = subRaceDistance === 'custom' ? parseInt(subRaceCustomDistance, 10) : undefined;
                if (subRaceDistance === 'custom' && (!subRaceCustomDistance || !subCustomDist || subCustomDist <= 0)) {
                  Alert.alert(t('common.error'), t('plan.errorCustomDistance'));
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
                // レースカテゴリへ遷移（W-up/C-downの編集・カスタムレースメニュー作成を促す）
                router.push({
                  pathname: '/(tabs)/workout',
                  params: { category: 'レース', t: Date.now().toString() },
                });
              }}
              disabled={!subRaceName || !subRaceDate}
            >
              <Text style={styles.createButtonText}>{t('common.add')}</Text>
            </Pressable>
          </View>
          </View>
        </KeyboardAvoidingView>

        <DatePickerModal
          visible={showSubRaceDatePicker}
          onClose={() => setShowSubRaceDatePicker(false)}
          onSelect={(date) => setSubRaceDate(date)}
          value={subRaceDate || undefined}
          title={t('plan.selectRaceDate')}
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
  feeling: FeelingLevel;
  setFeeling: (v: FeelingLevel) => void;
  notes: string;
  setNotes: (v: string) => void;
  title?: string;
  onDelete?: () => void;
}

function RecordResultModal({
  visible, onClose, onSave,
  distance,
  feeling, setFeeling,
  notes, setNotes,
  title,
  onDelete,
}: RecordResultModalProps) {
  const { t } = useTranslation();
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
              <Text style={styles.modalTitle}>{title || t('plan.recordResult')}</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 距離（メニューから自動取得・読み取り専用） */}
              {distance ? (
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>{t('plan.distance')}</Text>
                  <View style={[styles.modalInput, { backgroundColor: COLORS.background, justifyContent: 'center' }]}>
                    <Text style={{ color: COLORS.text.primary, fontSize: 15 }}>
                      {Number(distance) >= 1000 ? `${(Number(distance) / 1000).toFixed(1)} km` : `${distance} m`}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* 体感 */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>{t('plan.feelingSectionLabel')}</Text>
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
                          {t(config.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* メモ */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>{t('plan.notes')}</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('plan.notesPlaceholder')}
                  placeholderTextColor={COLORS.text.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* ボタン */}
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelButton} onPress={onClose}>
                <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={onSave}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.modalSaveButtonText}>{t('common.save')}</Text>
              </Pressable>
            </View>
            {onDelete && (
              <Pressable
                style={styles.modalDeleteButton}
                onPress={() => {
                  Alert.alert(
                    t('plan.deleteRecord'),
                    t('plan.deleteRecordConfirm'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('common.delete'), style: 'destructive', onPress: onDelete },
                    ],
                  );
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.modalDeleteButtonText}>{t('plan.deleteRecordRevert')}</Text>
              </Pressable>
            )}
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
  analyticsPeriodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  analyticsPeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  analyticsPeriodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  analyticsPeriodText: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  analyticsPeriodTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    marginTop: 12,
  },
  analyticsZoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ゾーン凡例
  azLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    rowGap: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  azLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  azLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  azLegendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },

  // ゾーン別横棒グラフ（達成率・距離一体型）
  azBarChartWrap: {
    gap: 5,
  },
  azBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  azBarRowOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  azBarTrack: {
    flex: 1,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'visible',
    position: 'relative',
  },
  azBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  azBarTarget: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  azBarPct: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.primary,
    width: 38,
    textAlign: 'right',
  },
  azBarDist: {
    fontSize: 12,
    color: COLORS.text.secondary,
    width: 42,
    textAlign: 'right',
  },
  azBarTextOver: {
    color: '#EF4444',
  },
  azBarTargetLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 2,
  },

  // ゾーン比率（消化率）積み上げバー
  azRatioWrap: {
    gap: 4,
  },
  azRatioBar: {
    flexDirection: 'row',
    height: 22,
    borderRadius: 6,
    overflow: 'hidden',
  },
  azRatioSegment: {
    height: '100%',
  },
  azRatioLabels: {
    flexDirection: 'row',
  },
  azRatioLabelItem: {
    alignItems: 'center',
  },
  azRatioLabelText: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
  azRatioCaption: {
    fontSize: 11,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 2,
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
  logEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  logEditButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
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
  modalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  modalDeleteButtonText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  actualDataModalOverlayPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actualDataModalContent: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 20,
    padding: 24,
    width: '92%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actualDataModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actualDataModalTitle: {
    fontSize: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  menuSelectContent: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 20,
    padding: 24,
    width: '92%',
    maxWidth: 400,
    height: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuSelectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  menuSelectDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuSelectDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuSelectDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  menuSelectDateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuSelectDateValue: {
    fontSize: 14,
    color: COLORS.text.secondary,
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
