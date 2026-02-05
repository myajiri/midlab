// ============================================
// Settings Screen - 設定画面（簡素化版）
// ============================================

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useProfileStore,
  useTestResultsStore,
  usePlanStore,
  useWorkoutLogsStore,
  useSettingsStore,
  useEffectiveValues,
} from '../../src/stores/useAppStore';
import { formatTime, formatKmPace, calculateSpeedIndex, estimateLimiterFromSpeedIndex, calculateEtp } from '../../src/utils';
import { TimePickerModal } from '../../src/components/ui';
import { FadeIn, SlideIn } from '../../src/components/ui/Animated';
import { COLORS, PB_COEFFICIENTS } from '../../src/constants';
import { AgeCategory, Experience, LimiterType, PBs } from '../../src/types';
import { useRouter } from 'expo-router';
import { useIsPremium, useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { useIsFocused } from '@react-navigation/native';

// ============================================
// 定数（簡素化）
// ============================================

const AGE_OPTIONS: { key: AgeCategory; label: string }[] = [
  { key: 'junior_high', label: '中学生' },
  { key: 'high_school', label: '高校生' },
  { key: 'collegiate', label: '大学生' },
  { key: 'senior', label: '一般' },
  { key: 'masters_40', label: '40代' },
  { key: 'masters_50', label: '50代' },
  { key: 'masters_60', label: '60歳〜' },
];

const EXPERIENCE_OPTIONS: { key: Experience; label: string }[] = [
  { key: 'beginner', label: '初心者' },
  { key: 'intermediate', label: '中級者' },
  { key: 'advanced', label: '上級者' },
];

const LIMITER_OPTIONS: { key: LimiterType; icon: string; label: string }[] = [
  { key: 'cardio', icon: 'fitness', label: '心肺' },
  { key: 'balanced', icon: 'scale', label: 'バランス' },
  { key: 'muscular', icon: 'barbell', label: '筋持久力' },
];

// PB距離設定
const PB_DISTANCES: { key: keyof PBs; label: string; minMinutes: number; maxMinutes: number; title: string }[] = [
  { key: 'm800', label: '800m PB', minMinutes: 1, maxMinutes: 5, title: '800mベストタイム' },
  { key: 'm1500', label: '1500m PB', minMinutes: 3, maxMinutes: 8, title: '1500mベストタイム' },
  { key: 'm3000', label: '3000m PB', minMinutes: 7, maxMinutes: 18, title: '3000mベストタイム' },
  { key: 'm5000', label: '5000m PB', minMinutes: 12, maxMinutes: 30, title: '5000mベストタイム' },
];

// 用語ヘルプ定義
const HELP_ITEMS: { term: string; description: string }[] = [
  {
    term: 'ETP（Estimated Threshold Pace）',
    description: '400mあたりの推定閾値ペース（秒）。ETPテストまたは自己ベストから算出されます。値が小さいほど走力が高いことを意味します。',
  },
  {
    term: 'リミッタータイプ',
    description: '持久力の制限要因を3タイプに分類したもの。心肺リミッター型（呼吸が先に限界）、筋持久力リミッター型（脚が先に限界）、バランス型（均等）の3種類があり、タイプに応じてトレーニングの重点が変わります。',
  },
  {
    term: 'トレーニングゾーン',
    description: 'ETPから算出された6段階の強度帯。ジョグ・イージー・マラソン・閾値・インターバル・レペティションの各ゾーンペースでトレーニングを行います。',
  },
  {
    term: '推定VO2max',
    description: '最大酸素摂取量の推定値（ml/kg/min）。ETPから簡易推定した有酸素能力の指標です。あくまで参考値です。',
  },
  {
    term: 'ETPテスト',
    description: 'レベルに応じた一定ペースで400mを繰り返し、持久力タイプとETPを測定するフィールドテスト。結果からリミッタータイプとトレーニングゾーンが自動算出されます。',
  },
  {
    term: 'フェーズ（基礎期・強化期・試合期・テーパー）',
    description: 'トレーニング計画を期分けした各段階。基礎期で土台を作り、強化期で負荷を上げ、試合期でレース特化し、テーパーで疲労を抜いてレースに臨みます。',
  },
];

// ============================================
// メインコンポーネント
// ============================================

export default function SettingsScreen() {
  const router = useRouter();
  const isPremium = useIsPremium();
  const { restore } = useSubscriptionStore();
  const setSubScreenOpen = useSetSubScreenOpen();
  const isFocused = useIsFocused();

  // 設定画面にはサブビューがないので、フォーカス時に必ずリセット
  useEffect(() => {
    if (isFocused) setSubScreenOpen(false);
  }, [isFocused, setSubScreenOpen]);

  // ストア
  const profile = useProfileStore((state) => state.profile);
  const updateAttributes = useProfileStore((state) => state.updateAttributes);
  const updatePBs = useProfileStore((state) => state.updatePBs);
  const setEstimated = useProfileStore((state) => state.setEstimated);
  const setCurrent = useProfileStore((state) => state.setCurrent);
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const testResults = useTestResultsStore((state) => state.results);
  const clearResults = useTestResultsStore((state) => state.clearResults);
  const clearPlan = usePlanStore((state) => state.clearPlan);
  const clearLogs = useWorkoutLogsStore((state) => state.clearLogs);
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

  const { etp, limiter, source } = useEffectiveValues();

  // 編集状態
  const [activePickerDistance, setActivePickerDistance] = useState<keyof PBs | null>(null);
  const [expandedHelp, setExpandedHelp] = useState<number | null>(null);

  // アクティブなピッカーの設定を取得
  const activePickerConfig = useMemo(() => {
    if (!activePickerDistance) return null;
    return PB_DISTANCES.find(d => d.key === activePickerDistance) || null;
  }, [activePickerDistance]);

  // 複数PBからの推定eTP
  const estimatedEtp = useMemo(() => {
    const etpResult = calculateEtp(profile.pbs, profile.ageCategory, profile.experience);
    return etpResult?.adjustedEtp || null;
  }, [profile.pbs, profile.ageCategory, profile.experience]);

  // スピード指標（800m + 1500m PBが両方ある場合）
  const speedIndex = useMemo(() => {
    return calculateSpeedIndex(profile.pbs);
  }, [profile.pbs]);

  // スピード指標からのリミッター推定
  const limiterFromPbs = useMemo(() => {
    return estimateLimiterFromSpeedIndex(speedIndex);
  }, [speedIndex]);

  // 年齢変更
  const handleAgeChange = useCallback((age: AgeCategory) => {
    updateAttributes({ ageCategory: age });
  }, [updateAttributes]);

  // 経験変更
  const handleExperienceChange = useCallback((exp: Experience) => {
    updateAttributes({ experience: exp });
  }, [updateAttributes]);

  // リミッター変更
  const handleLimiterChange = useCallback((lim: LimiterType) => {
    if (profile.current) {
      setCurrent(profile.current.etp, lim);
    } else if (estimatedEtp) {
      setEstimated(estimatedEtp, lim);
    }
  }, [profile.current, estimatedEtp, setCurrent, setEstimated]);

  // PB変更（ストア側でeTP・リミッター自動更新）
  const handlePbChange = useCallback((seconds: number) => {
    if (!activePickerDistance) return;
    updatePBs({ [activePickerDistance]: seconds } as PBs);
  }, [activePickerDistance, updatePBs]);

  // PBクリア
  const handlePbClear = useCallback((key: keyof PBs) => {
    updatePBs({ [key]: undefined } as any);
  }, [updatePBs]);

  // リセット処理
  const handleResetAll = useCallback(() => {
    Alert.alert(
      'データをリセット',
      'すべてのデータが削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            resetProfile();
            clearResults();
            clearPlan();
            clearLogs();
            setOnboardingComplete(false);
          },
        },
      ]
    );
  }, [resetProfile, clearResults, clearPlan, clearLogs, setOnboardingComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <FadeIn>
          <Text style={styles.title}>設定</Text>
        </FadeIn>

        {/* サブスクリプション */}
        <SlideIn delay={100} direction="up">
          <Pressable style={styles.card} onPress={() => router.push('/upgrade')}>
            <View style={styles.subRow}>
              <View style={styles.subInfo}>
                <Ionicons
                  name={isPremium ? 'trophy' : 'diamond-outline'}
                  size={20}
                  color={isPremium ? '#F59E0B' : COLORS.text.muted}
                />
                <Text style={styles.subLabel}>
                  {isPremium ? 'プレミアム会員' : '無料プラン'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
            </View>
            {!isPremium && (
              <Pressable
                style={styles.restoreBtn}
                onPress={async () => {
                  const restored = await restore();
                  Alert.alert(
                    restored ? '復元完了' : '復元結果',
                    restored ? '購入が復元されました' : '復元可能な購入がありません'
                  );
                }}
              >
                <Text style={styles.restoreText}>購入を復元</Text>
              </Pressable>
            )}
          </Pressable>
        </SlideIn>

        {/* プロフィール */}
        <SlideIn delay={200} direction="up">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>プロフィール</Text>

            {/* 年齢 */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>年齢</Text>
              <View style={styles.optionRow}>
                {AGE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.optionBtn, profile.ageCategory === opt.key && styles.optionBtnActive]}
                    onPress={() => handleAgeChange(opt.key)}
                  >
                    <Text style={[styles.optionText, profile.ageCategory === opt.key && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 経験 */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>走歴</Text>
              <View style={styles.optionRow}>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.optionBtn, styles.optionBtnFlex, profile.experience === opt.key && styles.optionBtnActive]}
                    onPress={() => handleExperienceChange(opt.key)}
                  >
                    <Text style={[styles.optionText, profile.experience === opt.key && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 自己ベスト（PB） */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>自己ベスト（PB）</Text>
              <View style={styles.pbGrid}>
                {PB_DISTANCES.map((dist) => {
                  const pbValue = profile.pbs[dist.key];
                  return (
                    <View key={dist.key} style={styles.pbGridItem}>
                      <Text style={styles.pbDistanceLabel}>{PB_COEFFICIENTS[dist.key].label}</Text>
                      <Pressable
                        style={styles.pbBtn}
                        onPress={() => setActivePickerDistance(dist.key)}
                      >
                        <Text style={[styles.pbValue, !pbValue && styles.pbPlaceholder]}>
                          {pbValue ? formatTime(pbValue) : '未設定'}
                        </Text>
                        {pbValue ? (
                          <Pressable
                            style={styles.pbClear}
                            onPress={() => handlePbClear(dist.key)}
                          >
                            <Ionicons name="close-circle" size={16} color={COLORS.text.muted} />
                          </Pressable>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              {estimatedEtp && !profile.current && (
                <Text style={styles.etpHint}>
                  推定ETP: {formatKmPace(estimatedEtp)} ({estimatedEtp}秒/400m)
                </Text>
              )}
              {/* スピード指標（800m + 1500m PBがある場合） */}
              {speedIndex && limiterFromPbs && (
                <View style={styles.speedIndexRow}>
                  <Ionicons name="analytics" size={14} color={COLORS.secondary} />
                  <Text style={styles.speedIndexText}>
                    スピード指標: {speedIndex.value.toFixed(2)} → {limiterFromPbs.reason}（自動設定）
                  </Text>
                </View>
              )}
            </View>

            {/* リミッター */}
            <View style={styles.fieldRow}>
              <View style={styles.limiterHeader}>
                <Text style={styles.fieldLabel}>リミッタータイプ</Text>
                {source === 'measured' && (
                  <View style={styles.measuredBadge}>
                    <Text style={styles.measuredText}>テスト判定</Text>
                  </View>
                )}
              </View>
              <View style={styles.limiterRow}>
                {LIMITER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.limiterBtn, limiter === opt.key && styles.limiterBtnActive]}
                    onPress={() => handleLimiterChange(opt.key)}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={limiter === opt.key ? COLORS.primary : COLORS.text.muted}
                    />
                    <Text style={[styles.limiterText, limiter === opt.key && styles.limiterTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </SlideIn>

        {/* 用語ヘルプ */}
        <SlideIn delay={300} direction="up">
          <View style={styles.card}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.text.muted} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>用語ヘルプ</Text>
            </View>
            {HELP_ITEMS.map((item, index) => {
              const isExpanded = expandedHelp === index;
              return (
                <Pressable
                  key={index}
                  style={[styles.helpItem, index < HELP_ITEMS.length - 1 && styles.helpItemBorder]}
                  onPress={() => setExpandedHelp(isExpanded ? null : index)}
                >
                  <View style={styles.helpTermRow}>
                    <Text style={styles.helpTerm}>{item.term}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.text.muted}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={styles.helpDesc}>{item.description}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </SlideIn>

        {/* データ管理 */}
        <SlideIn delay={400} direction="up">
          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.dangerTitle}>データ管理</Text>
              <Text style={styles.testCount}>テスト結果: {testResults?.length || 0}件</Text>
            </View>
            <Pressable style={styles.resetBtn} onPress={handleResetAll}>
              <Text style={styles.resetText}>全データ削除</Text>
            </Pressable>
          </View>
        </SlideIn>

        {/* 法的情報 */}
        <SlideIn delay={500} direction="up">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>法的情報</Text>
            <Pressable
              style={styles.legalItem}
              onPress={() => Linking.openURL('https://myajiri.github.io/midlab/privacy.html')}
            >
              <View style={styles.legalItemRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.text.muted} />
                <Text style={styles.legalItemText}>プライバシーポリシー</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.muted} />
            </Pressable>
            <Pressable
              style={styles.legalItem}
              onPress={() => Linking.openURL('https://myajiri.github.io/midlab/terms.html')}
            >
              <View style={styles.legalItemRow}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.text.muted} />
                <Text style={styles.legalItemText}>利用規約</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.muted} />
            </Pressable>
          </View>
        </SlideIn>

        {/* バージョン */}
        <SlideIn delay={600} direction="up">
          <View style={styles.version}>
            <Text style={styles.versionText}>MidLab v1.0.0</Text>
          </View>
        </SlideIn>
      </ScrollView>

      <TimePickerModal
        visible={activePickerDistance !== null}
        onClose={() => setActivePickerDistance(null)}
        onSelect={handlePbChange}
        value={activePickerDistance ? (profile.pbs[activePickerDistance] || undefined) : undefined}
        title={activePickerConfig?.title || 'ベストタイム'}
        minMinutes={activePickerConfig?.minMinutes || 1}
        maxMinutes={activePickerConfig?.maxMinutes || 30}
      />
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

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

  // タイトル
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },

  // カード
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
    marginBottom: 16,
  },

  // フィールド
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },

  // オプション選択
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionBtnFlex: {
    flex: 1,
    alignItems: 'center',
  },
  optionBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // PB入力
  pbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pbGridItem: {
    width: '48%' as any,
  },
  pbDistanceLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginBottom: 4,
    fontWeight: '500',
  },
  pbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
  },
  pbValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pbPlaceholder: {
    color: COLORS.text.muted,
    fontWeight: '400',
    fontSize: 13,
  },
  pbClear: {
    padding: 4,
  },
  etpHint: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 8,
  },
  speedIndexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  speedIndexText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },

  // リミッター
  limiterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  measuredBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  measuredText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '500',
  },
  limiterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  limiterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  limiterBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  limiterText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  limiterTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // サブスクリプション
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  restoreBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 12,
    color: COLORS.text.muted,
    textDecorationLine: 'underline',
  },

  // データ管理
  dangerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
  },
  testCount: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
  },
  resetText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },

  // 用語ヘルプ
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  helpItem: {
    paddingVertical: 12,
  },
  helpItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  helpTermRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpTerm: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 8,
  },
  helpDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginTop: 8,
  },

  // 法的情報
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  legalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalItemText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },

  // バージョン
  version: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
});
