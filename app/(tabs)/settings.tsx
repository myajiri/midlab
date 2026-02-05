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
import { formatTime, formatKmPace, parseTime, estimateEtpFromPb } from '../../src/utils';
import { TimePickerModal } from '../../src/components/ui';
import { FadeIn, SlideIn } from '../../src/components/ui/Animated';
import { COLORS } from '../../src/constants';
import { AgeCategory, Experience, LimiterType } from '../../src/types';
import { useRouter } from 'expo-router';
import { useIsPremium, useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { useIsFocused } from '@react-navigation/native';

// ============================================
// 定数（簡素化）
// ============================================

const AGE_OPTIONS: { key: AgeCategory; label: string }[] = [
  { key: 'junior_high', label: '中高生' },
  { key: 'collegiate', label: '大学生' },
  { key: 'senior', label: '一般' },
  { key: 'masters_40', label: 'マスターズ' },
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<number | null>(null);
  const pb1500 = profile.pbs.m1500 || null;

  // 推定eTP
  const estimatedEtp = useMemo(() => {
    if (!pb1500) return null;
    return estimateEtpFromPb(pb1500, 1500);
  }, [pb1500]);

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

  // PB変更
  const handlePbChange = useCallback((seconds: number) => {
    updatePBs({ m1500: seconds });
    const newEtp = estimateEtpFromPb(seconds, 1500);
    if (newEtp && !profile.current) {
      setEstimated(newEtp, limiter);
    }
  }, [updatePBs, profile.current, limiter, setEstimated]);

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

            {/* 1500m PB */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>1500m PB</Text>
              <Pressable style={styles.pbBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.pbValue, !pb1500 && styles.pbPlaceholder]}>
                  {pb1500 ? formatTime(pb1500) : '未設定'}
                </Text>
                {pb1500 && (
                  <Pressable
                    style={styles.pbClear}
                    onPress={() => updatePBs({ m1500: undefined as any })}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.text.muted} />
                  </Pressable>
                )}
              </Pressable>
              {estimatedEtp && !profile.current && (
                <Text style={styles.etpHint}>
                  推定ETP: {formatKmPace(estimatedEtp)}
                </Text>
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
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={handlePbChange}
        value={pb1500 || undefined}
        title="1500mベストタイム"
        minMinutes={3}
        maxMinutes={8}
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
  pbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  pbValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pbPlaceholder: {
    color: COLORS.text.muted,
    fontWeight: '400',
  },
  pbClear: {
    padding: 4,
  },
  etpHint: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 6,
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
