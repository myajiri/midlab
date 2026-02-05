// ============================================
// オンボーディング: メイン画面（簡素化版）
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore, useSettingsStore } from '../../src/stores/useAppStore';
import { formatTime, formatKmPace } from '../../src/utils';
import { AgeCategory, Experience, PBs } from '../../src/types';
import { TimePickerModal, ProgressBar } from '../../src/components/ui';
import { FadeIn, SlideIn } from '../../src/components/ui/Animated';
import { COLORS } from '../../src/constants';

// 年齢カテゴリ（7分割：年齢に応じた回復サイクル・ETP補正に使用）
const AGE_CATEGORIES: { key: AgeCategory; label: string; icon: string }[] = [
  { key: 'junior_high', label: '中学生', icon: 'school' },
  { key: 'high_school', label: '高校生', icon: 'school' },
  { key: 'collegiate', label: '大学生', icon: 'library' },
  { key: 'senior', label: '一般', icon: 'person' },
  { key: 'masters_40', label: '40代', icon: 'star' },
  { key: 'masters_50', label: '50代', icon: 'star' },
  { key: 'masters_60', label: '60歳〜', icon: 'star' },
];

// 簡略化した経験レベル
const EXPERIENCE_LEVELS: { key: Experience; label: string; desc: string }[] = [
  { key: 'beginner', label: '初心者', desc: '1年未満' },
  { key: 'intermediate', label: '中級者', desc: '1-3年' },
  { key: 'advanced', label: '上級者', desc: '3年以上' },
];

// ETP推定（1500m PBから）
const estimateEtpFrom1500 = (pb1500: number): number => {
  return Math.round(pb1500 / 3.30);
};

export default function OnboardingMain() {
  const router = useRouter();
  const updateAttributes = useProfileStore((state) => state.updateAttributes);
  const updatePBs = useProfileStore((state) => state.updatePBs);
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);
  const profile = useProfileStore((state) => state.profile);

  const [step, setStep] = useState<'welcome' | 'setup'>('welcome');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>(profile.ageCategory || 'senior');
  const [experience, setExperience] = useState<Experience>(profile.experience || 'intermediate');
  const [pb1500, setPb1500] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 推定eTP
  const estimatedEtp = pb1500 ? estimateEtpFrom1500(pb1500) : null;

  const handleStart = () => {
    setStep('setup');
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  const handleComplete = () => {
    // 属性を保存
    updateAttributes({ ageCategory, experience });

    // PBがあれば保存
    if (pb1500) {
      updatePBs({ m1500: pb1500 } as PBs);
    }

    // 結果画面へ
    router.push('/onboarding/result');
  };

  // ============================================
  // ウェルカム画面
  // ============================================
  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContent}>
          <FadeIn>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="flash" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>MidLab</Text>
              <Text style={styles.tagline}>中距離ランナーのための{'\n'}トレーニングアプリ</Text>
            </View>
          </FadeIn>

          <SlideIn delay={200} direction="up">
            <View style={styles.features}>
              {[
                { icon: 'analytics', color: '#3B82F6', title: 'ETPテスト', desc: '持久力タイプを科学的に判定' },
                { icon: 'speedometer', color: '#22C55E', title: 'ゾーン計算', desc: '最適なペースを自動算出' },
                { icon: 'fitness', color: '#8B5CF6', title: 'パーソナライズ', desc: 'あなた専用のトレーニング' },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                    <Ionicons name={f.icon as any} size={20} color={f.color} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </SlideIn>
        </View>

        <SlideIn delay={400} direction="up">
          <View style={styles.buttonArea}>
            <Pressable style={styles.primaryButton} onPress={handleStart}>
              <Text style={styles.primaryButtonText}>はじめる</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleSkip}>
              <Text style={styles.secondaryButtonText}>スキップ</Text>
            </Pressable>
          </View>
        </SlideIn>
      </SafeAreaView>
    );
  }

  // ============================================
  // セットアップ画面
  // ============================================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar progress={0.5} height={4} color={COLORS.primary} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <FadeIn>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => setStep('welcome')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
          </View>

          <Text style={styles.title}>かんたん設定</Text>
          <Text style={styles.subtitle}>2つの質問に答えるだけ</Text>
        </FadeIn>

        {/* 年齢カテゴリ */}
        <SlideIn delay={100} direction="up">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>年齢</Text>
            <View style={styles.ageGrid}>
              {AGE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.ageOption, ageCategory === cat.key && styles.ageOptionActive]}
                  onPress={() => setAgeCategory(cat.key)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={ageCategory === cat.key ? COLORS.primary : COLORS.text.muted}
                  />
                  <Text style={[styles.ageLabel, ageCategory === cat.key && styles.ageLabelActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SlideIn>

        {/* 経験レベル */}
        <SlideIn delay={200} direction="up">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>走歴</Text>
            <View style={styles.expGrid}>
              {EXPERIENCE_LEVELS.map((exp) => (
                <Pressable
                  key={exp.key}
                  style={[styles.expOption, experience === exp.key && styles.expOptionActive]}
                  onPress={() => setExperience(exp.key)}
                >
                  <Text style={[styles.expLabel, experience === exp.key && styles.expLabelActive]}>
                    {exp.label}
                  </Text>
                  <Text style={styles.expDesc}>{exp.desc}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SlideIn>

        {/* 1500m PB（オプション） */}
        <SlideIn delay={300} direction="up">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>1500m PB（任意）</Text>
            <Pressable style={styles.pbInput} onPress={() => setShowTimePicker(true)}>
              {pb1500 ? (
                <View style={styles.pbValueRow}>
                  <Text style={styles.pbValue}>{formatTime(pb1500)}</Text>
                  <Pressable onPress={() => setPb1500(null)}>
                    <Ionicons name="close-circle" size={20} color={COLORS.text.muted} />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.pbPlaceholder}>タップして入力（スキップ可）</Text>
              )}
            </Pressable>

            {estimatedEtp && (
              <View style={styles.etpPreview}>
                <Ionicons name="flash" size={14} color={COLORS.primary} />
                <Text style={styles.etpPreviewText}>
                  推定ETP: {formatKmPace(estimatedEtp)} ({estimatedEtp}秒/400m)
                </Text>
              </View>
            )}
          </View>
        </SlideIn>
      </ScrollView>

      <SlideIn delay={400} direction="up">
        <View style={styles.buttonArea}>
          <Pressable style={styles.primaryButton} onPress={handleComplete}>
            <Text style={styles.primaryButtonText}>完了</Text>
          </Pressable>
        </View>
      </SlideIn>

      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={(seconds) => setPb1500(seconds)}
        value={pb1500 || undefined}
        title="1500mのベストタイム"
        minMinutes={3}
        maxMinutes={10}
      />
    </SafeAreaView>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // ヘッダー
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // タイトル
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 32,
  },

  // ウェルカム
  welcomeContent: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // フィーチャー
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // セクション
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 12,
  },

  // 年齢グリッド
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  ageOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  ageLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  ageLabelActive: {
    color: COLORS.primary,
  },

  // 経験グリッド
  expGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  expOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  expOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  expLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  expLabelActive: {
    color: COLORS.primary,
  },
  expDesc: {
    fontSize: 11,
    color: COLORS.text.muted,
  },

  // PB入力
  pbInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pbValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pbValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pbPlaceholder: {
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  etpPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  etpPreviewText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // ボタン
  buttonArea: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
});
