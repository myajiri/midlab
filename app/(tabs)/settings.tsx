// ============================================
// Settings Screen - 設定画面
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
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
  useTrainingZones,
} from '../../src/stores/useAppStore';
import { formatTime, formatKmPace, parseTime, estimateEtpFromPb } from '../../src/utils';
import {
  COLORS,
  AGE_CATEGORY_CONFIG,
  EXPERIENCE_CONFIG,
  PB_COEFFICIENTS,
  ZONE_COEFFICIENTS_V3,
  LIMITER_ICONS,
  RACE_COEFFICIENTS,
} from '../../src/constants';
import { AgeCategory, Experience, LimiterType, ZoneName } from '../../src/types';
import { useRouter } from 'expo-router';
import { useIsPremium, useSubscriptionStore } from '../../store/useSubscriptionStore';
import { PremiumBadge } from '../../components/PremiumGate';

// ============================================
// 定数
// ============================================

const PB_FIELDS = [
  { key: 'm800', label: '800m', placeholder: '2:05' },
  { key: 'm1500', label: '1500m', placeholder: '4:15' },
  { key: 'm3000', label: '3000m', placeholder: '9:00' },
  { key: 'm5000', label: '5000m', placeholder: '16:00' },
];

const LIMITER_OPTIONS = [
  { value: 'cardio' as LimiterType, icon: '🫁', label: '心肺', desc: '息が先に上がる' },
  { value: 'balanced' as LimiterType, icon: '⚖️', label: 'バランス', desc: '両方同時' },
  { value: 'muscular' as LimiterType, icon: '🦵', label: '筋持久力', desc: '脚が先に疲れる' },
];

// ============================================
// メインコンポーネント
// ============================================

export default function SettingsScreen() {
  const router = useRouter();
  const isPremium = useIsPremium();
  const { restore } = useSubscriptionStore();

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
  const zones = useTrainingZones();

  // 編集モード状態
  const [editingProfile, setEditingProfile] = useState(false);

  // 一時編集用の状態
  const [tempDisplayName, setTempDisplayName] = useState(profile.displayName || '');
  const [tempAgeCategory, setTempAgeCategory] = useState<AgeCategory>(profile.ageCategory);
  const [tempGender, setTempGender] = useState(profile.gender);
  const [tempExperience, setTempExperience] = useState<Experience>(profile.experience);
  const [tempLimiter, setTempLimiter] = useState<LimiterType>(
    profile.current?.limiterType || profile.estimated?.limiterType || limiter
  );
  const [pbInputs, setPbInputs] = useState<Record<string, string>>(() => {
    const inputs: Record<string, string> = {};
    PB_FIELDS.forEach(({ key }) => {
      const value = profile.pbs[key as keyof typeof profile.pbs];
      inputs[key] = value ? formatTime(value) : '';
    });
    return inputs;
  });

  // 1500m PBからのリアルタイムeTP推定
  const estimatedEtpFrom1500 = useMemo(() => {
    const pb1500Input = pbInputs.m1500;
    if (!pb1500Input) return null;
    const pb1500Seconds = parseTime(pb1500Input);
    if (!pb1500Seconds) return null;
    return estimateEtpFromPb(pb1500Seconds, 1500);
  }, [pbInputs.m1500]);

  // 編集開始
  const handleStartEdit = useCallback(() => {
    setTempDisplayName(profile.displayName || '');
    setTempAgeCategory(profile.ageCategory);
    setTempGender(profile.gender);
    setTempExperience(profile.experience);
    setTempLimiter(profile.current?.limiterType || profile.estimated?.limiterType || limiter);
    const inputs: Record<string, string> = {};
    PB_FIELDS.forEach(({ key }) => {
      const value = profile.pbs[key as keyof typeof profile.pbs];
      inputs[key] = value ? formatTime(value) : '';
    });
    setPbInputs(inputs);
    setEditingProfile(true);
  }, [profile, limiter]);

  // 保存処理
  const handleSaveProfile = useCallback(() => {
    // 属性の更新
    updateAttributes({
      displayName: tempDisplayName.trim() || undefined,
      ageCategory: tempAgeCategory,
      gender: tempGender,
      experience: tempExperience,
    });

    // PBの更新
    const pbs: Record<string, number> = {};
    PB_FIELDS.forEach(({ key }) => {
      const value = pbInputs[key];
      if (value) {
        const seconds = parseTime(value);
        if (seconds) {
          pbs[key] = seconds;
        }
      }
    });
    updatePBs(pbs);

    // リミッタータイプの更新
    if (profile.current) {
      setCurrent(profile.current.etp, tempLimiter);
    } else if (estimatedEtpFrom1500) {
      setEstimated(estimatedEtpFrom1500, tempLimiter);
    }

    setEditingProfile(false);
    Alert.alert('保存完了', 'プロフィールを更新しました');
  }, [
    tempDisplayName,
    tempAgeCategory,
    tempGender,
    tempExperience,
    tempLimiter,
    pbInputs,
    profile.current,
    estimatedEtpFrom1500,
    updateAttributes,
    updatePBs,
    setCurrent,
    setEstimated,
  ]);

  // リセット処理
  const handleResetAll = useCallback(() => {
    Alert.alert(
      'すべてのデータをリセット',
      'プロフィール、テスト結果、計画、ログがすべて削除されます。この操作は取り消せません。',
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
            Alert.alert('完了', 'すべてのデータをリセットしました');
          },
        },
      ]
    );
  }, [resetProfile, clearResults, clearPlan, clearLogs, setOnboardingComplete]);

  // 入力値の検証エラー表示
  const getInputError = (key: string, value: string) => {
    if (!value) return null;
    const parsed = parseTime(value);
    if (parsed === null) return '「分:秒」形式で入力';
    return null;
  };

  // PB入力にエラーがあるかチェック
  const hasPbValidationError = useMemo(() => {
    return PB_FIELDS.some(({ key }) => {
      const value = pbInputs[key];
      if (!value) return false;
      return parseTime(value) === null;
    });
  }, [pbInputs]);

  const limiterConfig = LIMITER_ICONS[limiter];

  // ============================================
  // 表示モード
  // ============================================
  if (!editingProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>設定</Text>
          </View>

          {/* プロフィールセクション */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>プロファイル</Text>
              <Pressable style={styles.editButton} onPress={handleStartEdit}>
                <Text style={styles.editButtonText}>編集</Text>
              </Pressable>
            </View>

            {/* ニックネーム表示 */}
            {profile.displayName && (
              <View style={styles.displayNameRow}>
                <Text style={styles.displayNameLabel}>ニックネーム</Text>
                <Text style={styles.displayNameValue}>{profile.displayName}</Text>
              </View>
            )}

            <View style={styles.profileGrid}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>年齢</Text>
                <Text style={styles.profileValue}>
                  {AGE_CATEGORY_CONFIG[profile.ageCategory]?.label || '-'}
                </Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>性別</Text>
                <Text style={styles.profileValue}>
                  {profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : 'その他'}
                </Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>経験</Text>
                <Text style={styles.profileValue}>
                  {EXPERIENCE_CONFIG[profile.experience]?.label || '-'}
                </Text>
              </View>
            </View>

            {/* PB表示 */}
            <View style={styles.pbSection}>
              <Text style={styles.subsectionTitle}>自己ベスト</Text>
              <View style={styles.pbGrid}>
                {PB_FIELDS.map(({ key, label }) => {
                  const value = profile.pbs[key as keyof typeof profile.pbs];
                  return (
                    <View key={key} style={styles.pbItem}>
                      <Text style={styles.pbLabel}>{label}</Text>
                      <Text style={styles.pbValue}>{value ? formatTime(value) : '-'}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* リミッタータイプ */}
            <View style={styles.limiterSection}>
              <Text style={styles.subsectionTitle}>リミッタータイプ</Text>
              <View style={styles.limiterDisplay}>
                <Text style={styles.limiterIcon}>
                  {LIMITER_OPTIONS.find((l) => l.value === limiter)?.icon || '⚖️'}
                </Text>
                <Text style={styles.limiterLabel}>
                  {LIMITER_OPTIONS.find((l) => l.value === limiter)?.label || 'バランス'}
                </Text>
                {source === 'measured' && (
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedText}>テスト判定</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

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
                    <Text style={styles.zoneName}>{ZONE_COEFFICIENTS_V3[zone].label}</Text>
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
            <View style={styles.predictionsGrid}>
              {Object.entries(RACE_COEFFICIENTS).map(([distance, coef]) => {
                // 予測タイム = eTP × ペース係数 × 距離（400mラップ数）
                const predictedTime = Math.round(etp * coef.coefficient * coef.laps);
                return (
                  <View key={distance} style={styles.predictionItem}>
                    <Text style={styles.predictionDistance}>{coef.label}</Text>
                    <Text style={styles.predictionTime}>{formatTime(predictedTime)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* サブスクリプション管理 */}
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.sectionTitle}>サブスクリプション</Text>
              {isPremium && <PremiumBadge />}
            </View>
            {isPremium ? (
              <View style={styles.subscriptionContent}>
                <Text style={styles.subscriptionStatus}>👑 プレミアム会員</Text>
                <Text style={styles.subscriptionDesc}>すべてのプレミアム機能をご利用いただけます</Text>
                <Pressable
                  style={styles.subscriptionButton}
                  onPress={() => router.push('/upgrade')}
                >
                  <Text style={styles.subscriptionButtonText}>サブスクリプションを管理</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.subscriptionContent}>
                <Text style={styles.subscriptionStatus}>無料プラン</Text>
                <Text style={styles.subscriptionDesc}>
                  プレミアムにアップグレードして、詳細な計画機能や分析機能を利用しましょう
                </Text>
                <Pressable
                  style={[styles.subscriptionButton, styles.subscriptionButtonPrimary]}
                  onPress={() => router.push('/upgrade')}
                >
                  <Text style={[styles.subscriptionButtonText, styles.subscriptionButtonTextPrimary]}>
                    プレミアムにアップグレード
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.restorePurchaseButton}
                  onPress={async () => {
                    const restored = await restore();
                    if (restored) {
                      Alert.alert('復元完了', '購入が復元されました');
                    } else {
                      Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
                    }
                  }}
                >
                  <Text style={styles.restorePurchaseText}>購入を復元</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* データ管理 */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>データ管理</Text>
            <Text style={styles.testCount}>テスト結果: {testResults?.length || 0}件</Text>
            <View style={styles.resetSection}>
              <Text style={styles.dangerText}>
                すべてのデータを削除します。この操作は取り消せません。
              </Text>
              <Pressable style={styles.resetButton} onPress={handleResetAll}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.resetButtonText}>全データ削除</Text>
              </Pressable>
            </View>
          </View>

          {/* バージョン情報 */}
          <View style={styles.version}>
            <Text style={styles.versionText}>MidLab v1.0.0</Text>
            <Text style={styles.versionText}>Powered by ランプテスト Protocol</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================
  // 編集モード
  // ============================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <View style={styles.editHeader}>
          <Pressable style={styles.backButton} onPress={() => setEditingProfile(false)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </Pressable>
          <Text style={styles.editTitle}>プロファイル編集</Text>
          <Pressable
            style={[styles.saveButton, hasPbValidationError && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={hasPbValidationError}
          >
            <Text style={[styles.saveButtonText, hasPbValidationError && styles.saveButtonTextDisabled]}>
              保存
            </Text>
          </Pressable>
        </View>

        {/* ニックネーム */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>ニックネーム</Text>
          <TextInput
            style={styles.displayNameInput}
            value={tempDisplayName}
            onChangeText={setTempDisplayName}
            placeholder="例: たろう"
            placeholderTextColor={COLORS.text.muted}
            maxLength={20}
          />
        </View>

        {/* 年齢カテゴリ */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>年齢カテゴリ</Text>
          <View style={styles.optionGrid}>
            {(Object.entries(AGE_CATEGORY_CONFIG) as [AgeCategory, typeof AGE_CATEGORY_CONFIG.senior][]).map(
              ([key, config]) => (
                <Pressable
                  key={key}
                  style={[
                    styles.optionButton,
                    tempAgeCategory === key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setTempAgeCategory(key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempAgeCategory === key && styles.optionTextSelected,
                    ]}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </View>

        {/* 性別 */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>性別</Text>
          <View style={styles.optionRow}>
            {[
              { key: 'male', label: '男性' },
              { key: 'female', label: '女性' },
              { key: 'other', label: 'その他' },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                style={[
                  styles.optionButton,
                  styles.optionButtonFlex,
                  tempGender === key && styles.optionButtonSelected,
                ]}
                onPress={() => setTempGender(key as typeof tempGender)}
              >
                <Text
                  style={[
                    styles.optionText,
                    tempGender === key && styles.optionTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 競技歴 */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>競技歴</Text>
          <View style={styles.optionRow}>
            {(Object.entries(EXPERIENCE_CONFIG) as [Experience, typeof EXPERIENCE_CONFIG.beginner][]).map(
              ([key, config]) => (
                <Pressable
                  key={key}
                  style={[
                    styles.optionButton,
                    styles.optionButtonFlex,
                    tempExperience === key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setTempExperience(key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempExperience === key && styles.optionTextSelected,
                    ]}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </View>

        {/* PB入力 */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>自己ベスト（PB）</Text>
          {PB_FIELDS.map(({ key, label, placeholder }) => {
            const error = getInputError(key, pbInputs[key]);
            return (
              <View key={key} style={styles.pbInputRow}>
                <Text style={styles.pbInputLabel}>{label}</Text>
                <View style={styles.pbInputWrapper}>
                  <TextInput
                    style={[styles.pbInput, error && styles.pbInputError]}
                    value={pbInputs[key]}
                    onChangeText={(text) => setPbInputs((prev) => ({ ...prev, [key]: text }))}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="numbers-and-punctuation"
                  />
                  {error && <Text style={styles.errorText}>{error}</Text>}
                  {key === 'm1500' && pbInputs.m1500 && !error && estimatedEtpFrom1500 && (
                    <Text style={styles.estimatedEtp}>
                      → 推定eTP: {formatKmPace(estimatedEtpFrom1500)} ({estimatedEtpFrom1500}秒/400m)
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* リミッタータイプ選択 */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>リミッタータイプ</Text>
          <Text style={styles.limiterHint}>
            息が先に上がる → 心肺 / 脚が先に疲れる → 筋持久力
          </Text>
          <View style={styles.limiterGrid}>
            {LIMITER_OPTIONS.map(({ value, icon, label, desc }) => (
              <Pressable
                key={value}
                style={[
                  styles.limiterButton,
                  tempLimiter === value && styles.limiterButtonSelected,
                ]}
                onPress={() => setTempLimiter(value)}
              >
                <Text style={styles.limiterButtonIcon}>{icon}</Text>
                <Text
                  style={[
                    styles.limiterButtonLabel,
                    tempLimiter === value && styles.limiterButtonLabelSelected,
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.limiterButtonDesc}>{desc}</Text>
              </Pressable>
            ))}
          </View>
          {testResults && testResults.length > 0 && (
            <Text style={styles.limiterNote}>
              ※ テスト結果がある場合、ここでの変更は推定値としてのみ使用されます
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

const { width } = Dimensions.get('window');

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

  // 表示モード ヘッダー
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // 編集モード ヘッダー
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },

  // カード
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
  },
  subsectionTitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButtonText: {
    color: COLORS.text.primary,
    fontSize: 13,
  },

  // プロフィール表示
  displayNameRow: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  displayNameLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  displayNameValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  profileGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  profileItem: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  // PB表示
  pbSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  pbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pbItem: {
    width: (width - 64) / 3 - 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  pbLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  pbValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  // リミッター表示
  limiterSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  limiterDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limiterIcon: {
    fontSize: 24,
  },
  limiterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  confirmedText: {
    fontSize: 11,
    color: '#22C55E',
  },

  // ゾーン表示
  etpBadge: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 12,
  },
  zonesTable: {
    gap: 4,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
  zonePace400: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  zonePaceKm: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // レース予測
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  predictionItem: {
    width: (width - 64) / 2 - 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  predictionDistance: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  predictionTime: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // データ管理
  dangerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  testCount: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  resetSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },

  // バージョン
  version: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 2,
  },

  // ============================================
  // 編集モード スタイル
  // ============================================

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 12,
  },
  displayNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },

  // オプション選択（年齢カテゴリ、性別、競技歴）
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionButtonFlex: {
    flex: 1,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  optionText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // PB入力
  pbInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pbInputLabel: {
    width: 60,
    fontSize: 14,
    color: COLORS.text.secondary,
    paddingTop: 12,
  },
  pbInputWrapper: {
    flex: 1,
  },
  pbInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  pbInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  estimatedEtp: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },

  // リミッター選択
  limiterHint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  limiterGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  limiterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  limiterButtonSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  limiterButtonIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  limiterButtonLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  limiterButtonLabelSelected: {
    color: COLORS.primary,
  },
  limiterButtonDesc: {
    fontSize: 10,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  limiterNote: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 12,
    fontStyle: 'italic',
  },

  // ============================================
  // サブスクリプション管理
  // ============================================
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionContent: {
    gap: 8,
  },
  subscriptionStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  subscriptionDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  subscriptionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  subscriptionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  subscriptionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  subscriptionButtonTextPrimary: {
    color: '#fff',
  },
  restorePurchaseButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  restorePurchaseText: {
    fontSize: 13,
    color: COLORS.text.muted,
    textDecorationLine: 'underline',
  },
});
