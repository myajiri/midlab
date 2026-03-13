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
  InteractionManager,
  TextInput,
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
import Constants from 'expo-constants';
import { useIsPremium, useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18next, { changeLanguage, getCurrentLanguageSetting, type AppLanguage } from '../../src/i18n';

// ============================================
// 定数（簡素化）
// ============================================

const getAgeOptions = (): { key: AgeCategory; label: string }[] => [
  { key: 'junior_high', label: i18next.t('settings.ageJuniorHigh') },
  { key: 'high_school', label: i18next.t('settings.ageHighSchool') },
  { key: 'collegiate', label: i18next.t('settings.ageCollegiate') },
  { key: 'senior', label: i18next.t('settings.ageSenior') },
  { key: 'masters_40', label: i18next.t('settings.ageMasters40') },
  { key: 'masters_50', label: i18next.t('settings.ageMasters50') },
  { key: 'masters_60', label: i18next.t('settings.ageMasters60') },
];

const getExperienceOptions = (): { key: Experience; label: string }[] => [
  { key: 'beginner', label: i18next.t('settings.expBeginner') },
  { key: 'intermediate', label: i18next.t('settings.expIntermediate') },
  { key: 'advanced', label: i18next.t('settings.expAdvanced') },
];

const getLimiterOptions = (): { key: LimiterType; icon: string; label: string }[] => [
  { key: 'cardio', icon: 'fitness', label: i18next.t('settings.limiterCardio') },
  { key: 'balanced', icon: 'scale', label: i18next.t('settings.limiterBalanced') },
  { key: 'muscular', icon: 'barbell', label: i18next.t('settings.limiterMuscular') },
];

// PB距離設定（200m〜5000m：初回プロファイリングでリミッター分類に使用）
const getPbDistances = (): { key: keyof PBs; label: string; minMinutes: number; maxMinutes: number; title: string }[] => [
  { key: 'm200', label: '200m PB', minMinutes: 0, maxMinutes: 1, title: i18next.t('settings.pbTitle200m') },
  { key: 'm400', label: '400m PB', minMinutes: 0, maxMinutes: 2, title: i18next.t('settings.pbTitle400m') },
  { key: 'm800', label: '800m PB', minMinutes: 1, maxMinutes: 5, title: i18next.t('settings.pbTitle800m') },
  { key: 'm1500', label: '1500m PB', minMinutes: 3, maxMinutes: 8, title: i18next.t('settings.pbTitle1500m') },
  { key: 'm3000', label: '3000m PB', minMinutes: 7, maxMinutes: 18, title: i18next.t('settings.pbTitle3000m') },
  { key: 'm5000', label: '5000m PB', minMinutes: 12, maxMinutes: 30, title: i18next.t('settings.pbTitle5000m') },
];

// 用語ヘルプ定義（i18n対応）
const getHelpItems = (): { term: string; description: string }[] => [
  {
    term: i18next.t('settings.helpEtpTerm'),
    description: i18next.t('settings.helpEtpDesc'),
  },
  {
    term: i18next.t('settings.helpLimiterTerm'),
    description: i18next.t('settings.helpLimiterDesc'),
  },
  {
    term: i18next.t('settings.helpZoneTerm'),
    description: i18next.t('settings.helpZoneDesc'),
  },
  {
    term: i18next.t('settings.helpVO2maxTerm'),
    description: i18next.t('settings.helpVO2maxDesc'),
  },
  {
    term: i18next.t('settings.helpTestTerm'),
    description: i18next.t('settings.helpTestDesc'),
  },
  {
    term: i18next.t('settings.helpPhaseTerm'),
    description: i18next.t('settings.helpPhaseDesc'),
  },
];

// ============================================
// メインコンポーネント
// ============================================

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isPremium = useIsPremium();
  const [currentLang, setCurrentLang] = useState<AppLanguage>('system');

  useEffect(() => {
    getCurrentLanguageSetting().then(setCurrentLang);
  }, []);
  const { restore, applyPremiumStatus } = useSubscriptionStore();
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
  const [expandedPhilosophy, setExpandedPhilosophy] = useState<number | null>(null);

  // アクティブなピッカーの設定を取得
  const activePickerConfig = useMemo(() => {
    if (!activePickerDistance) return null;
    return getPbDistances().find(d => d.key === activePickerDistance) || null;
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
      t('settings.resetDataTitle'),
      t('settings.resetDataMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
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
          <Text style={styles.title}>{t('settings.title')}</Text>
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
                  {isPremium ? t('settings.premiumMember') : t('settings.freePlan')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
            </View>
            {!isPremium && (
              <Pressable
                style={styles.restoreBtn}
                onPress={async () => {
                  const restored = await restore();
                  if (restored) {
                    InteractionManager.runAfterInteractions(() => {
                      applyPremiumStatus();
                    });
                  }
                  Alert.alert(
                    restored ? t('settings.restoreSuccess') : t('settings.restoreResult'),
                    restored ? t('settings.restoreSuccessMsg') : t('settings.restoreFailMsg')
                  );
                }}
              >
                <Text style={styles.restoreText}>{t('settings.restorePurchase')}</Text>
              </Pressable>
            )}
          </Pressable>
        </SlideIn>

        {/* プロフィール */}
        <SlideIn delay={200} direction="up">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>

            {/* 年齢 */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('settings.age')}</Text>
              <View style={styles.optionRow}>
                {getAgeOptions().map((opt) => (
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
              <Text style={styles.fieldLabel}>{t('settings.experience')}</Text>
              <View style={styles.optionRow}>
                {getExperienceOptions().map((opt) => (
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
              <Text style={styles.fieldLabel}>{t('settings.personalBests')}</Text>
              <View style={styles.pbGrid}>
                {getPbDistances().map((dist) => {
                  const pbValue = profile.pbs[dist.key];
                  return (
                    <View key={dist.key} style={styles.pbGridItem}>
                      <Text style={styles.pbDistanceLabel}>{PB_COEFFICIENTS[dist.key].label}</Text>
                      <Pressable
                        style={styles.pbBtn}
                        onPress={() => setActivePickerDistance(dist.key)}
                      >
                        <Text style={[styles.pbValue, !pbValue && styles.pbPlaceholder]}>
                          {pbValue ? formatTime(pbValue) : t('common.notSet')}
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
                  {t('settings.estimatedEtp', { kmPace: formatKmPace(estimatedEtp), etp: estimatedEtp })}
                </Text>
              )}
              {/* スピード指標（800m + 1500m PBがある場合） */}
              {speedIndex && limiterFromPbs && (
                <View style={styles.speedIndexRow}>
                  <Ionicons name="analytics" size={14} color={COLORS.secondary} />
                  <Text style={styles.speedIndexText}>
                    {t('settings.speedIndex', { value: speedIndex.value.toFixed(2), reason: limiterFromPbs.reason })}
                  </Text>
                </View>
              )}
            </View>

            {/* リミッター */}
            <View style={styles.fieldRow}>
              <View style={styles.limiterHeader}>
                <Text style={styles.fieldLabel}>{t('settings.limiterType')}</Text>
                {source === 'measured' && (
                  <View style={styles.measuredBadge}>
                    <Text style={styles.measuredText}>{t('settings.testDetermined')}</Text>
                  </View>
                )}
              </View>
              <View style={styles.limiterRow}>
                {getLimiterOptions().map((opt) => (
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

            {/* 月間上限走行距離 */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('settings.monthlyMileage')}</Text>
              <TextInput
                style={styles.mileageInput}
                value={profile.monthlyMileage ? String(profile.monthlyMileage) : ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num > 0) {
                    updateAttributes({ monthlyMileage: num });
                  } else if (text === '') {
                    updateAttributes({ monthlyMileage: undefined });
                  }
                }}
                placeholder={t('settings.monthlyMileagePlaceholder')}
                placeholderTextColor={COLORS.text.muted}
                keyboardType="numeric"
              />
              <Text style={styles.mileageHint}>
                {t('settings.monthlyMileageHint')}
              </Text>
            </View>
          </View>
        </SlideIn>

        {/* 言語設定 */}
        <SlideIn delay={250} direction="up">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.optionRow}>
              {([
                { key: 'system', label: t('settings.languageSystem') },
                { key: 'ja', label: '日本語' },
                { key: 'en', label: 'English' },
              ] as { key: AppLanguage; label: string }[]).map((option) => (
                <Pressable
                  key={option.key}
                  style={[styles.optionBtn, styles.optionBtnFlex, currentLang === option.key && styles.optionBtnActive]}
                  onPress={async () => {
                    setCurrentLang(option.key);
                    await changeLanguage(option.key);
                  }}
                >
                  <Text style={[styles.optionText, currentLang === option.key && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SlideIn>

        {/* 用語ヘルプ */}
        <SlideIn delay={300} direction="up">
          <View style={styles.card}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.text.muted} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('settings.glossary')}</Text>
            </View>
            {getHelpItems().map((item, index) => {
              const isExpanded = expandedHelp === index;
              return (
                <Pressable
                  key={index}
                  style={[styles.helpItem, index < getHelpItems().length - 1 && styles.helpItemBorder]}
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

        {/* トレーニング哲学 */}
        <SlideIn delay={350} direction="up">
          <View style={styles.card}>
            <View style={styles.philosophyHeader}>
              <Ionicons name="school-outline" size={18} color="#EAB308" />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('settings.philosophy')}</Text>
            </View>
            <Text style={styles.philosophyIntro}>{t('settings.philosophyIntro')}</Text>
            {(i18next.t('philosophy', { returnObjects: true }) as Array<{ title: string; content: string; icon: string }>).map((item, index, arr) => {
              const isExpanded = expandedPhilosophy === index;
              return (
                <Pressable
                  key={index}
                  style={[styles.philosophyItem, index < arr.length - 1 && styles.helpItemBorder]}
                  onPress={() => setExpandedPhilosophy(isExpanded ? null : index)}
                >
                  <View style={styles.philosophyTermRow}>
                    <Ionicons name={item.icon as any} size={16} color={COLORS.primary} />
                    <Text style={styles.philosophyTerm}>{item.title}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.text.muted}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={styles.philosophyDesc}>{item.content}</Text>
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
              <Text style={styles.dangerTitle}>{t('settings.dataManagement')}</Text>
              <Text style={styles.testCount}>{t('settings.testResultCount', { count: testResults?.length || 0 })}</Text>
            </View>
            <Pressable style={styles.resetBtn} onPress={handleResetAll}>
              <Text style={styles.resetText}>{t('settings.deleteAllData')}</Text>
            </Pressable>
          </View>
        </SlideIn>

        {/* 法的情報 */}
        <SlideIn delay={500} direction="up">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
            <Pressable
              style={styles.legalItem}
              onPress={() => Linking.openURL('https://myajiri.github.io/midlab/privacy.html')}
            >
              <View style={styles.legalItemRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.text.muted} />
                <Text style={styles.legalItemText}>{t('settings.privacyPolicy')}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.muted} />
            </Pressable>
            <Pressable
              style={styles.legalItem}
              onPress={() => Linking.openURL('https://myajiri.github.io/midlab/terms.html')}
            >
              <View style={styles.legalItemRow}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.text.muted} />
                <Text style={styles.legalItemText}>{t('settings.termsOfService')}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.muted} />
            </Pressable>
          </View>
        </SlideIn>

        {/* バージョン */}
        <SlideIn delay={600} direction="up">
          <View style={styles.version}>
            <Text style={styles.versionText}>MidLab v{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
        </SlideIn>
      </ScrollView>

      <TimePickerModal
        visible={activePickerDistance !== null}
        onClose={() => setActivePickerDistance(null)}
        onSelect={handlePbChange}
        value={activePickerDistance ? (profile.pbs[activePickerDistance] || undefined) : undefined}
        title={activePickerConfig?.title || t('settings.bestTime')}
        minMinutes={activePickerConfig?.minMinutes ?? 1}
        maxMinutes={activePickerConfig?.maxMinutes ?? 30}
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

  // 月間走行距離入力
  mileageInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  mileageHint: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 6,
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

  // トレーニング哲学
  philosophyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  philosophyIntro: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 12,
  },
  philosophyItem: {
    paddingVertical: 12,
  },
  philosophyTermRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  philosophyTerm: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
  },
  philosophyDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginTop: 8,
    paddingLeft: 24,
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
