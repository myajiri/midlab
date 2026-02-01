// ============================================
// Onboarding Screen - rise-test忠実再現版
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useProfileStore,
  useSettingsStore,
} from '../src/stores/useAppStore';
import {
  parseTime,
  formatTime,
  formatKmPace,
  estimateEtpFromPb,
  calculateSpeedIndex,
  estimateLimiterFromSpeedIndex,
  calculateRacePredictions,
} from '../src/utils';
import { Button } from '../src/components/ui';
import {
  COLORS,
  AGE_CATEGORY_CONFIG,
  GENDER_CONFIG,
  EXPERIENCE_CONFIG,
} from '../src/constants';
import { AgeCategory, Experience, Gender, LimiterType, PBs } from '../src/types';

// ステップ順序: Welcome → PB → Attributes (rise-testと同じ)
type OnboardingStep = 'welcome' | 'pb' | 'attributes';

export default function OnboardingScreen() {
  const router = useRouter();
  const updateAttributes = useProfileStore((state) => state.updateAttributes);
  const updatePBs = useProfileStore((state) => state.updatePBs);
  const updateEstimated = useProfileStore((state) => state.updateEstimated);
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

  const [step, setStep] = useState<OnboardingStep>('welcome');

  // Attributes
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('senior');
  const [gender, setGender] = useState<Gender>('other');
  const [experience, setExperience] = useState<Experience>('intermediate');

  // PBs - 4距離対応
  const [pbInputs, setPbInputs] = useState<Record<string, string>>({
    m800: '',
    m1500: '',
    m3000: '',
    m5000: '',
  });

  // リミッタータイプ
  const [limiterType, setLimiterType] = useState<LimiterType>('balanced');
  const [prevLimiterType, setPrevLimiterType] = useState<LimiterType>('balanced');
  const [showDiff, setShowDiff] = useState(false);

  const handleSkip = useCallback(() => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  }, [setOnboardingComplete, router]);

  const handleComplete = useCallback(() => {
    // Save attributes
    updateAttributes({ ageCategory, gender, experience });

    // Save PBs
    const pbs: Partial<PBs> = {};
    Object.entries(pbInputs).forEach(([key, value]) => {
      if (value) {
        const seconds = parseTime(value);
        if (seconds) {
          pbs[key as keyof PBs] = seconds;
        }
      }
    });
    if (Object.keys(pbs).length > 0) {
      updatePBs(pbs as PBs);
    }

    // Save estimated eTP and limiter
    const etp = getEtpFromInputs();
    if (etp) {
      updateEstimated({
        etp,
        limiterType,
        confidence: 'low',
      });
    }

    setOnboardingComplete(true);
    router.replace('/(tabs)');
  }, [
    ageCategory,
    gender,
    experience,
    pbInputs,
    limiterType,
    updateAttributes,
    updatePBs,
    updateEstimated,
    setOnboardingComplete,
    router,
  ]);

  // PBからeTPを取得（優先順位: 1500m > 3000m > 5000m > 800m）
  const getEtpFromInputs = useCallback(() => {
    const pb1500 = parseTime(pbInputs.m1500);
    if (pb1500) return estimateEtpFromPb(pb1500, 1500);

    const pb3000 = parseTime(pbInputs.m3000);
    if (pb3000) return estimateEtpFromPb(pb3000, 3000);

    const pb5000 = parseTime(pbInputs.m5000);
    if (pb5000) return estimateEtpFromPb(pb5000, 5000);

    const pb800 = parseTime(pbInputs.m800);
    if (pb800) return estimateEtpFromPb(pb800, 800);

    return null;
  }, [pbInputs]);

  const handleLimiterChange = useCallback((newType: LimiterType) => {
    setPrevLimiterType(limiterType);
    setLimiterType(newType);
    setShowDiff(true);
    setTimeout(() => setShowDiff(false), 2000);
  }, [limiterType]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Skip Button */}
      <View style={styles.header}>
        <StepIndicator currentStep={step} />
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>スキップ</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.text.secondary} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'welcome' && (
          <WelcomeStep onNext={() => setStep('pb')} />
        )}
        {step === 'pb' && (
          <PBStep
            pbInputs={pbInputs}
            setPbInputs={setPbInputs}
            limiterType={limiterType}
            prevLimiterType={prevLimiterType}
            showDiff={showDiff}
            onLimiterChange={handleLimiterChange}
            getEtpFromInputs={getEtpFromInputs}
            onNext={() => setStep('attributes')}
            onBack={() => setStep('welcome')}
          />
        )}
        {step === 'attributes' && (
          <AttributesStep
            ageCategory={ageCategory}
            setAgeCategory={setAgeCategory}
            gender={gender}
            setGender={setGender}
            experience={experience}
            setExperience={setExperience}
            onComplete={handleComplete}
            onSkip={handleComplete}
            onBack={() => setStep('pb')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================
// Step Indicator (rise-test: App.jsx 1098-1130)
// ============================================

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps: OnboardingStep[] = ['welcome', 'pb', 'attributes'];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <View style={styles.stepIndicator}>
      {steps.map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === currentIndex && styles.stepDotCurrent,
            i < currentIndex && styles.stepDotCompleted,
          ]}
        />
      ))}
      <Text style={styles.stepCounter}>
        {currentIndex + 1} / {steps.length}
      </Text>
    </View>
  );
}

// ============================================
// Welcome Step (rise-test: App.jsx 1132-1163)
// ============================================

interface WelcomeStepProps {
  onNext: () => void;
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepScrollContent}>
      {/* RISE Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>RISE</Text>
        <Text style={styles.logoSubtitle}>Ramp to Individual Speed Exhaustion</Text>
      </View>

      {/* Main description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          1500mのPBを入力するだけで{'\n'}
          あなた専用の予測タイムを算出
        </Text>

        {/* Limiter info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>
            リミッター型に応じた予測
          </Text>
          <Text style={styles.infoBoxText}>
            心肺リミッター型・筋持久力リミッター型で予測タイムが変わる様子を体験できます
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="PBを入力する"
          onPress={onNext}
          fullWidth
          size="large"
        />
      </View>
    </ScrollView>
  );
}

// ============================================
// PB Step (rise-test: App.jsx 1254-1562)
// ============================================

interface PBStepProps {
  pbInputs: Record<string, string>;
  setPbInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  limiterType: LimiterType;
  prevLimiterType: LimiterType;
  showDiff: boolean;
  onLimiterChange: (type: LimiterType) => void;
  getEtpFromInputs: () => number | null;
  onNext: () => void;
  onBack: () => void;
}

const PB_DISTANCES = [
  { key: 'm800', label: '800m', placeholder: '2:15' },
  { key: 'm1500', label: '1500m', placeholder: '4:30' },
  { key: 'm3000', label: '3000m', placeholder: '9:30' },
  { key: 'm5000', label: '5000m', placeholder: '16:30' },
];

const LIMITER_OPTIONS = [
  { value: 'cardio' as LimiterType, label: '心肺リミッター型', icon: '🫁', desc: '息が先に上がるタイプ' },
  { value: 'balanced' as LimiterType, label: 'バランス', icon: '⚖️', desc: '両方同時に限界' },
  { value: 'muscular' as LimiterType, label: '筋持久力リミッター型', icon: '🦵', desc: '脚が先に疲れるタイプ' },
];

function PBStep({
  pbInputs,
  setPbInputs,
  limiterType,
  prevLimiterType,
  showDiff,
  onLimiterChange,
  getEtpFromInputs,
  onNext,
  onBack,
}: PBStepProps) {
  // Parse all PB inputs
  const parsedPBs = useMemo(() => {
    const pbs: Partial<PBs> = {};
    Object.entries(pbInputs).forEach(([key, value]) => {
      if (value) {
        const seconds = parseTime(value);
        if (seconds) {
          pbs[key as keyof PBs] = seconds;
        }
      }
    });
    return pbs;
  }, [pbInputs]);

  const etp = getEtpFromInputs();
  const hasAnyPb = Object.values(pbInputs).some(v => v.length > 0 && parseTime(v) !== null);

  // Speed index calculation
  const speedIndex = useMemo(() => calculateSpeedIndex(parsedPBs), [parsedPBs]);
  const suggestedLimiter = useMemo(() => estimateLimiterFromSpeedIndex(speedIndex), [speedIndex]);

  // Predictions
  const predictions = useMemo(() => etp ? calculateRacePredictions(etp, limiterType) : null, [etp, limiterType]);
  const prevPredictions = useMemo(() => etp ? calculateRacePredictions(etp, prevLimiterType) : null, [etp, prevLimiterType]);

  // Check for invalid input
  const hasInvalidInput = (value: string) => {
    if (!value) return false;
    return parseTime(value) === null;
  };

  // Get diff for animation
  const getDiff = (key: keyof typeof predictions) => {
    if (!predictions || !prevPredictions || !showDiff) return null;
    const diff = predictions[key].min - prevPredictions[key].min;
    return diff !== 0 ? diff : null;
  };

  return (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepScrollContent}>
      {/* Header with back button */}
      <View style={styles.pbHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </Pressable>
        <Text style={styles.pbTitle}>自己ベストを入力</Text>
      </View>

      <Text style={styles.pbSubtitle}>
        1つ以上の距離でPBを入力してください
      </Text>

      {/* PB Inputs */}
      <View style={styles.pbGrid}>
        {PB_DISTANCES.map(({ key, label, placeholder }) => {
          const value = pbInputs[key] || '';
          const seconds = parseTime(value);
          const isInvalid = hasInvalidInput(value);

          return (
            <View
              key={key}
              style={[
                styles.pbInputRow,
                isInvalid && styles.pbInputRowError,
              ]}
            >
              <Text style={[styles.pbLabel, seconds && styles.pbLabelActive]}>
                {label}
              </Text>
              <TextInput
                style={styles.pbInput}
                value={value}
                onChangeText={(text) =>
                  setPbInputs((prev) => ({ ...prev, [key]: text }))
                }
                placeholder={placeholder}
                placeholderTextColor={COLORS.text.muted}
                keyboardType="numbers-and-punctuation"
              />
              {seconds && (
                <Ionicons name="checkmark" size={18} color={COLORS.success} />
              )}
            </View>
          );
        })}
      </View>

      {/* Format error message */}
      {Object.values(pbInputs).some(v => v && parseTime(v) === null) && (
        <Text style={styles.errorText}>
          「分:秒」形式で入力してください（例: 4:30）
        </Text>
      )}

      {/* eTP Result */}
      {etp && (
        <>
          <View style={styles.etpResult}>
            <Text style={styles.etpLabel}>推定 eTP</Text>
            <Text style={styles.etpValue}>{etp}秒</Text>
            <Text style={styles.etpKmPace}>{formatKmPace(etp)}</Text>
          </View>

          {/* Speed Index */}
          {speedIndex && (
            <View style={styles.speedIndexBox}>
              <Text style={styles.speedIndexLabel}>
                スピード指標{' '}
                {speedIndex.estimated && (
                  <Text style={styles.speedIndexSource}>（{speedIndex.source}から推定）</Text>
                )}
              </Text>
              <View style={styles.speedIndexRow}>
                <Text style={styles.speedIndexValue}>{speedIndex.value}</Text>
                {suggestedLimiter && (
                  <View style={styles.speedIndexBadge}>
                    <Text style={styles.speedIndexBadgeText}>
                      → {suggestedLimiter.reason}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.speedIndexHint}>
                {'<'} 0.94: スピード型 | 0.94-1.06: バランス | {'>'} 1.06: 持久型
              </Text>
            </View>
          )}

          {/* Limiter Selector */}
          <View style={styles.limiterSection}>
            <Text style={styles.limiterLabel}>あなたはどのタイプ？</Text>
            <View style={styles.limiterSelector}>
              {LIMITER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.limiterOption,
                    limiterType === opt.value && styles.limiterOptionSelected,
                  ]}
                  onPress={() => onLimiterChange(opt.value)}
                >
                  <Text style={styles.limiterIcon}>{opt.icon}</Text>
                  <Text style={[
                    styles.limiterOptionLabel,
                    limiterType === opt.value && styles.limiterOptionLabelSelected,
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.limiterDesc}>
              {LIMITER_OPTIONS.find(o => o.value === limiterType)?.desc}
            </Text>
          </View>

          {/* Race Predictions */}
          <View style={styles.predictionsBox}>
            <Text style={styles.predictionsTitle}>予測レースタイム</Text>
            <View style={styles.predictionsGrid}>
              {[
                { key: 'm800' as const, label: '800m' },
                { key: 'm1500' as const, label: '1500m' },
                { key: 'm3000' as const, label: '3000m' },
                { key: 'm5000' as const, label: '5000m' },
              ].map(({ key, label }) => {
                const diff = getDiff(key);
                const hasDiff = diff !== null;

                return (
                  <View
                    key={key}
                    style={[
                      styles.predictionRow,
                      hasDiff && styles.predictionRowHighlight,
                    ]}
                  >
                    <Text style={styles.predictionLabel}>{label}</Text>
                    <View style={styles.predictionValueRow}>
                      <Text style={styles.predictionValue}>
                        {predictions && formatTime(predictions[key].min)}
                      </Text>
                      {hasDiff && (
                        <Text style={[
                          styles.predictionDiff,
                          diff > 0 ? styles.predictionDiffNegative : styles.predictionDiffPositive,
                        ]}>
                          {diff > 0 ? '+' : ''}{diff}秒
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={styles.predictionsHint}>
              リミッター型を切り替えて予測の変化を確認してみてください
            </Text>
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="この設定で始める"
          onPress={onNext}
          fullWidth
          size="large"
          disabled={!hasAnyPb}
        />
      </View>
    </ScrollView>
  );
}

// ============================================
// Attributes Step (rise-test: App.jsx 1166-1251)
// ============================================

interface AttributesStepProps {
  ageCategory: AgeCategory;
  setAgeCategory: (v: AgeCategory) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  experience: Experience;
  setExperience: (v: Experience) => void;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

function AttributesStep({
  ageCategory,
  setAgeCategory,
  gender,
  setGender,
  experience,
  setExperience,
  onComplete,
  onSkip,
  onBack,
}: AttributesStepProps) {
  return (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepScrollContent}>
      {/* Header with back button */}
      <View style={styles.pbHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </Pressable>
        <Text style={styles.pbTitle}>詳細設定（任意）</Text>
      </View>

      <Text style={styles.attrSubtitle}>
        より正確な推定のために入力できます。後で設定画面から変更も可能です。
      </Text>

      {/* Age Category */}
      <View style={styles.attrSection}>
        <Text style={styles.attrLabel}>年齢カテゴリ</Text>
        <View style={styles.selectContainer}>
          {(Object.entries(AGE_CATEGORY_CONFIG) as [AgeCategory, typeof AGE_CATEGORY_CONFIG.senior][]).map(
            ([key, config]) => (
              <Pressable
                key={key}
                style={[
                  styles.selectOption,
                  ageCategory === key && styles.selectOptionSelected,
                ]}
                onPress={() => setAgeCategory(key)}
              >
                <Text style={[
                  styles.selectOptionText,
                  ageCategory === key && styles.selectOptionTextSelected,
                ]}>
                  {config.label}
                </Text>
                <Text style={styles.selectOptionDesc}>
                  {config.desc}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {/* Gender */}
      <View style={styles.attrSection}>
        <Text style={styles.attrLabel}>性別</Text>
        <View style={styles.genderRow}>
          {(Object.entries(GENDER_CONFIG) as [Gender, typeof GENDER_CONFIG.male][]).map(
            ([key, config]) => (
              <Pressable
                key={key}
                style={[
                  styles.genderOption,
                  gender === key && styles.genderOptionSelected,
                ]}
                onPress={() => setGender(key)}
              >
                <Text style={[
                  styles.genderOptionText,
                  gender === key && styles.genderOptionTextSelected,
                ]}>
                  {config.label}
                </Text>
              </Pressable>
            )
          )}
        </View>
        {gender === 'female' && GENDER_CONFIG.female.note && (
          <Text style={styles.genderNote}>{GENDER_CONFIG.female.note}</Text>
        )}
      </View>

      {/* Experience */}
      <View style={styles.attrSection}>
        <Text style={styles.attrLabel}>競技歴</Text>
        <View style={styles.selectContainer}>
          {(Object.entries(EXPERIENCE_CONFIG) as [Experience, typeof EXPERIENCE_CONFIG.beginner][]).map(
            ([key, config]) => (
              <Pressable
                key={key}
                style={[
                  styles.selectOption,
                  experience === key && styles.selectOptionSelected,
                ]}
                onPress={() => setExperience(key)}
              >
                <Text style={[
                  styles.selectOptionText,
                  experience === key && styles.selectOptionTextSelected,
                ]}>
                  {config.label}
                </Text>
                <Text style={styles.selectOptionDesc}>
                  {config.desc}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="設定を保存して始める"
          onPress={onComplete}
          fullWidth
          size="large"
        />
        <Pressable style={styles.skipButtonBottom} onPress={onSkip}>
          <Text style={styles.skipButtonText}>スキップして始める</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepScrollContent: {
    paddingBottom: 32,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotCurrent: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepCounter: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.text.muted,
  },

  // Welcome Step
  logoContainer: {
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 4,
  },
  logoSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  descriptionText: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    width: '100%',
    marginBottom: 32,
  },
  infoBoxTitle: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: COLORS.text.muted,
    lineHeight: 18,
  },

  // PB Step
  pbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  pbTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pbSubtitle: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 16,
  },
  pbGrid: {
    gap: 12,
    marginBottom: 16,
  },
  pbInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pbInputRowError: {
    borderColor: COLORS.error,
  },
  pbLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  pbLabelActive: {
    color: COLORS.primary,
  },
  pbInput: {
    flex: 1,
    fontSize: 18,
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    color: COLORS.text.primary,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },

  // eTP Result
  etpResult: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  etpLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  etpValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  etpKmPace: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },

  // Speed Index
  speedIndexBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 20,
  },
  speedIndexLabel: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 8,
  },
  speedIndexSource: {
    color: COLORS.text.muted,
    fontWeight: '400',
  },
  speedIndexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedIndexValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  speedIndexBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  speedIndexBadgeText: {
    fontSize: 12,
    color: COLORS.text.primary,
  },
  speedIndexHint: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 8,
    display: 'none', // スピード指標のヒントは現在使用しない（800mと1500mベースに変更）
  },

  // Limiter Selector
  limiterSection: {
    marginBottom: 20,
  },
  limiterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  limiterSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  limiterOption: {
    flex: 1,
    padding: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  limiterOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: COLORS.primary,
  },
  limiterIcon: {
    fontSize: 24,
  },
  limiterOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  limiterOptionLabelSelected: {
    color: COLORS.primary,
  },
  limiterDesc: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Predictions
  predictionsBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  predictionsTitle: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  predictionsGrid: {
    gap: 12,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  predictionRowHighlight: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  predictionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: COLORS.text.primary,
  },
  predictionDiff: {
    fontSize: 12,
    fontWeight: '600',
  },
  predictionDiffPositive: {
    color: COLORS.success,
  },
  predictionDiffNegative: {
    color: COLORS.error,
  },
  predictionsHint: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },

  // Attributes Step
  attrSubtitle: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 20,
    lineHeight: 20,
  },
  attrSection: {
    marginBottom: 24,
  },
  attrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
  },
  selectOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  selectOptionTextSelected: {
    color: COLORS.primary,
  },
  selectOptionDesc: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
  },
  genderOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  genderOptionTextSelected: {
    color: COLORS.primary,
  },
  genderNote: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 8,
  },

  // Buttons
  buttonContainer: {
    marginTop: 24,
    paddingTop: 16,
  },
  skipButtonBottom: {
    marginTop: 12,
    padding: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
});
