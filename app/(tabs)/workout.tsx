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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffectiveValues, usePlanStore, useTrainingLogsStore, useCustomWorkoutsStore } from '../../src/stores/useAppStore';
import { formatTime, formatKmPace, calculateWorkoutPace, getWorkoutRationale } from '../../src/utils';
import { PremiumGate } from '../../components/PremiumGate';
import { useIsPremium } from '../../store/useSubscriptionStore';
import { FadeIn, SlideIn } from '../../src/components/ui/Animated';
import { useToast } from '../../src/components/ui/Toast';
import {
  COLORS,
  WORKOUTS,
  ZONE_COEFFICIENTS_V3,
  WORKOUT_LIMITER_CONFIG,
  LIMITER_RATIONALE,
} from '../../src/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutTemplate, WorkoutSegment, ZoneName, LimiterType, TrainingLog, CustomWorkout } from '../../src/types';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { SwipeBackView } from '../../components/SwipeBackView';
import { useIsFocused } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// カテゴリラベル（簡素化）
const CATEGORY_LABELS: Record<string, string> = {
  all: 'すべて',
  VO2max: 'VO2max',
  '乳酸閾値': '乳酸閾値',
  'スピード・スプリント': 'スピード・スプリント',
  '有酸素ベース': '有酸素ベース',
  '総合': '総合',
  'オリジナル': 'オリジナル',
};

// ゾーン表示名
const ZONE_LABELS: Record<string, string> = {
  jog: 'リカバリー',
  easy: 'イージー',
  marathon: 'マラソン',
  threshold: '閾値',
  interval: 'インターバル',
  repetition: 'レペティション',
};

// リミッター設定
const LIMITER_CONFIG: Record<LimiterType, { icon: string; label: string }> = {
  cardio: { icon: 'fitness', label: '心肺リミッター型' },
  muscular: { icon: 'barbell', label: '筋持久力リミッター型' },
  balanced: { icon: 'scale', label: 'バランス型' },
};

interface ExpandedSegment {
  zone: ZoneName | 'rest';
  distance: number;
  label: string;
}

export default function WorkoutScreen() {
  const isPremium = useIsPremium();
  const { showToast } = useToast();
  const { etp, limiter } = useEffectiveValues();
  const activePlan = usePlanStore((state) => state.activePlan);
  const replaceWorkoutInPlan = usePlanStore((state) => state.replaceWorkout);
  const addTrainingLog = useTrainingLogsStore((state) => state.addLog);
  const customWorkouts = useCustomWorkoutsStore((state) => state.customWorkouts);
  const addCustomWorkout = useCustomWorkoutsStore((state) => state.addCustomWorkout);
  const updateCustomWorkout = useCustomWorkoutsStore((state) => state.updateCustomWorkout);
  const deleteCustomWorkout = useCustomWorkoutsStore((state) => state.deleteCustomWorkout);
  const params = useLocalSearchParams<{ category?: string; workoutId?: string; replaceWeek?: string; replaceDayId?: string; replaceDayLabel?: string; fromPlan?: string; t?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const setSubScreenOpen = useSetSubScreenOpen();
  const isFocused = useIsFocused();
  const router = useRouter();

  // オリジナルメニュー作成モーダル
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('オリジナル');
  const [customSegments, setCustomSegments] = useState<Array<{ zone: ZoneName; distance: string; label: string; reps: string; recoveryDistance: string }>>([
    { zone: 'jog', distance: '1600', label: 'W-up', reps: '1', recoveryDistance: '' },
  ]);

  // 差し替えモード判定
  const isReplaceMode = !!(params.replaceWeek && params.replaceDayId);
  const replaceWeek = params.replaceWeek ? parseInt(params.replaceWeek, 10) : 0;
  const replaceDayId = params.replaceDayId || '';
  const replaceDayLabel = params.replaceDayLabel || '';
  const isFromPlan = params.fromPlan === 'true';

  // 処理済みのパラメータタイムスタンプを記録（タブ切り替え時の再適用を防止）
  const [lastProcessedT, setLastProcessedT] = useState<string | null>(null);

  // 詳細画面を開いた時の遷移元を記録（戻る先を正しく判断するため）
  const [openedFromPlan, setOpenedFromPlan] = useState(false);

  // メニューを実施選択する
  const handleSelectForTraining = (workout: WorkoutTemplate) => {
    const log: TrainingLog = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
      workoutId: workout.id,
      workoutName: workout.name,
      workoutCategory: workout.category,
      status: 'planned',
      planId: activePlan?.id,
    };
    addTrainingLog(log);
    showToast('計画タブの「トレーニング記録」に追加しました', 'success');
  };

  // 計画内メニューを差し替える
  const handleReplaceWorkout = (workout: WorkoutTemplate) => {
    replaceWorkoutInPlan(replaceWeek, replaceDayId, workout.id, workout.name, workout.category);
    showToast(`${replaceDayLabel}のメニューを「${workout.name}」に変更しました`, 'success');
    // 計画タブの週間表示に戻り、他のメニューも変更できるようにする
    router.navigate({
      pathname: '/(tabs)/plan',
      params: {
        view: 'weekly',
        weekNumber: replaceWeek.toString(),
        t: Date.now().toString(),
      },
    });
  };

  // フォーカス中のタブのみフラグを制御（タブ間の競合を防止）
  useEffect(() => {
    if (isFocused) {
      setSubScreenOpen(selectedWorkout !== null);
    }
  }, [selectedWorkout, isFocused, setSubScreenOpen]);

  // 他画面からのカテゴリパラメータ変更に対応（タイムスタンプで強制更新）
  useEffect(() => {
    if (isFocused && params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category, params.t, isFocused]);

  // workoutIdパラメータが渡された場合、該当メニューの詳細画面を自動表示
  // タブ切り替え時の再適用を防止するため、処理済みのtを記録する
  useEffect(() => {
    if (isFocused && params.workoutId && params.t && params.t !== lastProcessedT) {
      const workout = WORKOUTS.find((w) => w.id === params.workoutId) || customWorkoutsAsTemplates.find((w) => w.id === params.workoutId);
      if (workout) {
        setSelectedWorkout(workout as WorkoutTemplate);
        setOpenedFromPlan(isFromPlan);
      }
      setLastProcessedT(params.t);
    }
  }, [params.workoutId, params.t, isFocused, customWorkoutsAsTemplates, lastProcessedT]);

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

  // 全ワークアウト（プリセット + カスタム）
  const allWorkouts = useMemo(() => {
    return [...WORKOUTS, ...customWorkoutsAsTemplates] as WorkoutTemplate[];
  }, [customWorkoutsAsTemplates]);

  // カテゴリ一覧
  // ※ Hooks（useMemo）は条件分岐の前に配置する必要がある（Rules of Hooks）
  const categories = useMemo(() => {
    const cats = new Set(WORKOUTS.map((w) => w.category));
    // カスタムワークアウトがある場合、またはデフォルトで「オリジナル」タブを表示
    cats.add('オリジナル');
    return ['all', ...cats] as string[];
  }, []);

  const filteredWorkouts = useMemo(() => {
    if (selectedCategory === 'all') return allWorkouts;
    if (selectedCategory === 'オリジナル') return customWorkoutsAsTemplates;
    return allWorkouts.filter((w) => w.category === selectedCategory);
  }, [selectedCategory, allWorkouts, customWorkoutsAsTemplates]);

  if (!isPremium) {
    return (
      <PremiumGate featureName="トレーニング">
        <View />
      </PremiumGate>
    );
  }

  // 詳細画面
  if (selectedWorkout) {
    return (
      <SwipeBackView onSwipeBack={() => {
        // スワイプバック: 計画タブから開いた場合のみ計画タブに戻る
        setSelectedWorkout(null);
        if (openedFromPlan) {
          router.navigate('/(tabs)/plan');
        }
      }}>
        <WorkoutDetailScreen
          workout={selectedWorkout}
          etp={etp}
          limiter={limiter}
          onBack={() => {
            // 戻るボタン: 計画タブから開いた場合のみ計画タブに戻る
            setSelectedWorkout(null);
            if (openedFromPlan) {
              router.navigate('/(tabs)/plan');
            }
          }}
          onReplaceWorkout={isReplaceMode ? handleReplaceWorkout : undefined}
          replaceDayLabel={replaceDayLabel}
        />
      </SwipeBackView>
    );
  }

  // 一覧画面
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <FadeIn>
          <Text style={styles.sectionTitle}>{isReplaceMode ? 'メニューを変更' : 'トレーニング'}</Text>

          {/* 差し替えモードのバナー */}
          {isReplaceMode && (
            <View style={styles.replaceBanner}>
              <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
              <Text style={styles.replaceBannerText}>{replaceDayLabel}のメニューを選択してください</Text>
            </View>
          )}

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

        {/* オリジナルメニュー作成ボタン */}
        {selectedCategory === 'オリジナル' && (
          <SlideIn delay={150} direction="up">
            <Pressable
              style={styles.createCustomButton}
              onPress={() => {
                setEditingCustomId(null);
                setCustomName('');
                setCustomDescription('');
                setCustomCategory('オリジナル');
                setCustomSegments([
                  { zone: 'jog', distance: '1600', label: 'W-up', reps: '1', recoveryDistance: '' },
                ]);
                setCreateModalVisible(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.createCustomButtonText}>新規メニューを作成</Text>
            </Pressable>
          </SlideIn>
        )}

        {/* ワークアウト一覧 */}
        <SlideIn delay={200} direction="up">
          <View style={styles.workoutList}>
            {filteredWorkouts.map((workout) => {
              const variant = workout.limiterVariants?.[limiter];
              const totalDistance = calculateTotalDistance(workout.segments, variant);
              const expanded = expandSegments(workout.segments, variant);
              const isCustom = workout.id.startsWith('custom-');

              return (
                <View key={workout.id} style={styles.workoutCard}>
                  <Pressable onPress={() => { setSelectedWorkout(workout); setOpenedFromPlan(false); }}>
                    <IntensityGraph segments={expanded} height={80} />
                    <View style={styles.workoutCardBody}>
                      <View style={styles.workoutCardNameRow}>
                        <Text style={styles.workoutCardName}>{workout.name}</Text>
                        {isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>自作</Text>
                          </View>
                        )}
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
                  <View style={styles.workoutCardActions}>
                    <Pressable
                      style={styles.workoutDetailButton}
                      onPress={() => { setSelectedWorkout(workout); setOpenedFromPlan(false); }}
                    >
                      <Ionicons name="information-circle-outline" size={16} color={COLORS.text.secondary} />
                      <Text style={styles.workoutDetailButtonText}>詳細</Text>
                    </Pressable>
                    {isReplaceMode && (
                      <Pressable
                        style={styles.workoutReplaceButton}
                        onPress={() => handleReplaceWorkout(workout)}
                      >
                        <Ionicons name="swap-horizontal" size={16} color="#fff" />
                        <Text style={styles.workoutStartButtonText}>このメニューに変更</Text>
                      </Pressable>
                    )}
                    {isCustom && !isReplaceMode && (
                      <>
                        <Pressable
                          style={styles.workoutDetailButton}
                          onPress={() => {
                            // 編集モードでモーダルを開く
                            const cw = customWorkouts.find(c => c.id === workout.id);
                            if (cw) {
                              setEditingCustomId(cw.id);
                              setCustomName(cw.name);
                              setCustomDescription(cw.description);
                              setCustomCategory(cw.category);
                              setCustomSegments(cw.segments.map(s => ({
                                zone: s.zone,
                                distance: String(s.distance),
                                label: s.label,
                                reps: String(s.reps || 1),
                                recoveryDistance: s.recoveryDistance ? String(s.recoveryDistance) : '',
                              })));
                              setCreateModalVisible(true);
                            }
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color={COLORS.text.secondary} />
                          <Text style={styles.workoutDetailButtonText}>編集</Text>
                        </Pressable>
                        <Pressable
                          style={styles.workoutDetailButton}
                          onPress={() => {
                            Alert.alert('メニューを削除', `「${workout.name}」を削除しますか？`, [
                              { text: 'キャンセル', style: 'cancel' },
                              { text: '削除', style: 'destructive', onPress: () => deleteCustomWorkout(workout.id) },
                            ]);
                          }}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          <Text style={[styles.workoutDetailButtonText, { color: '#EF4444' }]}>削除</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </SlideIn>
      </ScrollView>

      {/* オリジナルメニュー作成・編集モーダル */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.createModalOverlay}
        >
          <Pressable style={styles.createModalOverlayPress} onPress={() => setCreateModalVisible(false)}>
            <Pressable style={styles.createModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.createModalHeader}>
                <Text style={styles.createModalTitle}>{editingCustomId ? 'メニューを編集' : '新規メニュー作成'}</Text>
                <Pressable onPress={() => setCreateModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </Pressable>
              </View>

              <ScrollView style={styles.createModalScroll} showsVerticalScrollIndicator={false}>
              {/* メニュー名 */}
              <Text style={styles.createFieldLabel}>メニュー名</Text>
              <TextInput
                style={styles.createFieldInput}
                value={customName}
                onChangeText={setCustomName}
                placeholder="例: 500m×5 スピード持久力"
                placeholderTextColor={COLORS.text.muted}
              />

              {/* メニュー概要 */}
              <Text style={styles.createFieldLabel}>メニュー概要</Text>
              <TextInput
                style={[styles.createFieldInput, { minHeight: 60, textAlignVertical: 'top' }]}
                value={customDescription}
                onChangeText={setCustomDescription}
                placeholder="メニューの目的や説明"
                placeholderTextColor={COLORS.text.muted}
                multiline
              />

              {/* カテゴリ選択 */}
              <Text style={styles.createFieldLabel}>カテゴリ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {['オリジナル', 'VO2max', '乳酸閾値', 'スピード・スプリント', '有酸素ベース'].map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.createCategoryChip, customCategory === cat && styles.createCategoryChipActive]}
                    onPress={() => setCustomCategory(cat)}
                  >
                    <Text style={[styles.createCategoryChipText, customCategory === cat && styles.createCategoryChipTextActive]}>
                      {CATEGORY_LABELS[cat] || cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* セグメント */}
              <Text style={styles.createFieldLabel}>セグメント（練習内容）</Text>
              {customSegments.map((seg, idx) => (
                <View key={idx} style={styles.createSegmentRow}>
                  <View style={styles.createSegmentHeader}>
                    <Text style={styles.createSegmentIndex}>#{idx + 1}</Text>
                    {customSegments.length > 1 && (
                      <Pressable onPress={() => setCustomSegments(prev => prev.filter((_, i) => i !== idx))}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.createSegmentFields}>
                    {/* ゾーン選択 */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      {(['jog', 'easy', 'marathon', 'threshold', 'interval', 'repetition'] as ZoneName[]).map((z) => (
                        <Pressable
                          key={z}
                          style={[styles.createZoneChip, seg.zone === z && { backgroundColor: ZONE_COEFFICIENTS_V3[z].color + '30', borderColor: ZONE_COEFFICIENTS_V3[z].color }]}
                          onPress={() => setCustomSegments(prev => prev.map((s, i) => i === idx ? { ...s, zone: z } : s))}
                        >
                          <View style={[styles.createZoneDot, { backgroundColor: ZONE_COEFFICIENTS_V3[z].color }]} />
                          <Text style={[styles.createZoneChipText, seg.zone === z && { color: ZONE_COEFFICIENTS_V3[z].color }]}>{ZONE_LABELS[z]}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <View style={styles.createSegmentInputRow}>
                      <View style={styles.createSegmentInputGroup}>
                        <Text style={styles.createSegmentInputLabel}>距離(m)</Text>
                        <TextInput
                          style={styles.createSegmentInput}
                          value={seg.distance}
                          onChangeText={(t) => setCustomSegments(prev => prev.map((s, i) => i === idx ? { ...s, distance: t } : s))}
                          keyboardType="numeric"
                          placeholder="1000"
                          placeholderTextColor={COLORS.text.muted}
                        />
                      </View>
                      <View style={styles.createSegmentInputGroup}>
                        <Text style={styles.createSegmentInputLabel}>本数</Text>
                        <TextInput
                          style={styles.createSegmentInput}
                          value={seg.reps}
                          onChangeText={(t) => setCustomSegments(prev => prev.map((s, i) => i === idx ? { ...s, reps: t } : s))}
                          keyboardType="numeric"
                          placeholder="1"
                          placeholderTextColor={COLORS.text.muted}
                        />
                      </View>
                      <View style={styles.createSegmentInputGroup}>
                        <Text style={styles.createSegmentInputLabel}>レスト(m)</Text>
                        <TextInput
                          style={styles.createSegmentInput}
                          value={seg.recoveryDistance}
                          onChangeText={(t) => setCustomSegments(prev => prev.map((s, i) => i === idx ? { ...s, recoveryDistance: t } : s))}
                          keyboardType="numeric"
                          placeholder="200"
                          placeholderTextColor={COLORS.text.muted}
                        />
                      </View>
                    </View>
                    <TextInput
                      style={[styles.createSegmentInput, { marginTop: 4 }]}
                      value={seg.label}
                      onChangeText={(t) => setCustomSegments(prev => prev.map((s, i) => i === idx ? { ...s, label: t } : s))}
                      placeholder="ラベル（例: W-up 4周）"
                      placeholderTextColor={COLORS.text.muted}
                    />
                  </View>
                </View>
              ))}
              <Pressable
                style={styles.createAddSegmentButton}
                onPress={() => setCustomSegments(prev => [...prev, { zone: 'jog', distance: '', label: '', reps: '1', recoveryDistance: '' }])}
              >
                <Ionicons name="add" size={18} color={COLORS.primary} />
                <Text style={styles.createAddSegmentText}>セグメントを追加</Text>
              </Pressable>
            </ScrollView>

            {/* 保存ボタン */}
            <Pressable
              style={[styles.createSaveButton, !customName.trim() && { opacity: 0.5 }]}
              disabled={!customName.trim()}
              onPress={() => {
                const segments: WorkoutSegment[] = customSegments
                  .filter(s => s.distance && parseInt(s.distance, 10) > 0)
                  .map(s => ({
                    zone: s.zone,
                    distance: parseInt(s.distance, 10) || 0,
                    label: s.label || `${ZONE_LABELS[s.zone]} ${s.distance}m`,
                    ...(parseInt(s.reps, 10) > 1 ? { reps: parseInt(s.reps, 10) } : {}),
                    ...(s.recoveryDistance && parseInt(s.recoveryDistance, 10) > 0 ? { recoveryDistance: parseInt(s.recoveryDistance, 10) } : {}),
                  }));

                if (segments.length === 0) {
                  showToast('少なくとも1つのセグメントが必要です', 'error');
                  return;
                }

                if (editingCustomId) {
                  updateCustomWorkout(editingCustomId, {
                    name: customName.trim(),
                    description: customDescription.trim(),
                    category: customCategory,
                    segments,
                  });
                  showToast('メニューを更新しました', 'success');
                } else {
                  const newWorkout: CustomWorkout = {
                    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    name: customName.trim(),
                    description: customDescription.trim(),
                    category: customCategory,
                    segments,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  addCustomWorkout(newWorkout);
                  showToast('メニューを作成しました', 'success');
                }
                setCreateModalVisible(false);
              }}
            >
              <Text style={styles.createSaveButtonText}>{editingCustomId ? '更新' : '作成'}</Text>
            </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  onStartTraining?: (workout: WorkoutTemplate) => void;
  onReplaceWorkout?: (workout: WorkoutTemplate) => void;
  replaceDayLabel?: string;
}

function WorkoutDetailScreen({ workout, etp, limiter, onBack, onStartTraining, onReplaceWorkout, replaceDayLabel }: WorkoutDetailScreenProps) {
  const variant = workout.limiterVariants?.[limiter];
  const expandedSegments = expandSegments(workout.segments, variant);
  const totalDistance = calculateTotalDistance(workout.segments, variant);
  const rationale = getWorkoutRationale(workout.category, limiter);
  const limiterInfo = LIMITER_RATIONALE[limiter];

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

        {/* 選択ガイド（同カテゴリ内での差分・選び方） */}
        {workout.selectionGuide && (
          <SlideIn delay={170} direction="up">
            <View style={styles.selectionGuideCard}>
              <View style={styles.selectionGuideHeader}>
                <Ionicons name="git-compare-outline" size={18} color="#3B82F6" />
                <Text style={styles.selectionGuideTitle}>このメニューの選び方</Text>
              </View>
              <Text style={styles.selectionGuideText}>{workout.selectionGuide}</Text>
            </View>
          </SlideIn>
        )}

        {/* なぜこのメニューか */}
        <SlideIn delay={180} direction="up">
          <View style={styles.rationaleCard}>
            <View style={styles.rationaleHeader}>
              <Ionicons name="bulb-outline" size={18} color="#EAB308" />
              <Text style={styles.rationaleTitle}>なぜこのメニューか</Text>
            </View>
            <Text style={styles.rationaleText}>{rationale.headline}</Text>
            <View style={styles.rationaleLimiterRow}>
              <Ionicons name={WORKOUT_LIMITER_CONFIG[limiter].icon as any} size={14} color={WORKOUT_LIMITER_CONFIG[limiter].color} />
              <Text style={styles.rationaleLimiterText}>{rationale.detail}</Text>
            </View>
          </View>
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
                      <Text style={styles.segmentPaceKm}>{formatKmPace(pace)}</Text>
                      <Text style={styles.segmentPace400}>{Math.round(pace)}秒/400m</Text>
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

        {/* メニュー差し替えボタン（計画画面から遷移した場合） */}
        {onReplaceWorkout && (
          <SlideIn delay={400} direction="up">
            <Pressable
              style={styles.replaceTrainingButton}
              onPress={() => onReplaceWorkout(workout)}
            >
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
              <Text style={styles.startTrainingButtonText}>
                {replaceDayLabel ? `${replaceDayLabel}をこのメニューに変更` : 'このメニューに変更'}
              </Text>
            </Pressable>
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
  workoutCardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  workoutDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  workoutDetailButtonText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  workoutStartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  workoutStartButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
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

  // 選択ガイドセクション
  selectionGuideCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  selectionGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectionGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  selectionGuideText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  // 根拠セクション
  rationaleCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  rationaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rationaleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAB308',
  },
  rationaleText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  rationaleLimiterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
  },
  rationaleLimiterText: {
    fontSize: 13,
    color: COLORS.text.primary,
    lineHeight: 20,
    flex: 1,
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
  segmentPaceKm: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  segmentPace400: {
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

  // 実施ボタン（詳細画面）
  startTrainingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
  },
  startTrainingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  startTrainingButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
  },
  startTrainingButtonTextSecondary: {
    color: COLORS.text.secondary,
  },

  // 差し替えボタン（詳細画面）
  replaceTrainingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: '#EAB308',
    borderRadius: 14,
  },

  // 差し替えモードバナー
  replaceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(45, 159, 45, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 159, 45, 0.25)',
  },
  replaceBannerText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },

  // 差し替えボタン（一覧画面）
  workoutReplaceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EAB308',
  },

  // カスタムバッジ
  customBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // オリジナルメニュー作成ボタン
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  createCustomButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // 作成モーダル
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  createModalOverlayPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalContent: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 20,
    padding: 24,
    width: '92%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  createModalScroll: {
    maxHeight: 500,
  },
  createFieldLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  createFieldInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text.primary,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createCategoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 8,
  },
  createCategoryChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  createCategoryChipText: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  createCategoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  createSegmentRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  createSegmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  createSegmentIndex: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontWeight: '600',
  },
  createSegmentFields: {},
  createZoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  createZoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  createZoneChipText: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  createSegmentInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  createSegmentInputGroup: {
    flex: 1,
  },
  createSegmentInputLabel: {
    fontSize: 10,
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  createSegmentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  createAddSegmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  createAddSegmentText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  createSaveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginTop: 8,
  },
  createSaveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
