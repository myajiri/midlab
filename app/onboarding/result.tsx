// ============================================
// オンボーディング: 完了画面（簡素化版）
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore, useSettingsStore } from '../../src/stores/useAppStore';
import { formatKmPace } from '../../src/utils';
import { ProgressBar, SuccessCheckmark } from '../../src/components/ui';
import { FadeIn, SlideIn, ScaleIn } from '../../src/components/ui/Animated';
import { COLORS } from '../../src/constants';

export default function OnboardingResult() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

  const estimatedEtp = profile.estimated?.etp || null;

  const handleComplete = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar progress={1} height={4} color={COLORS.success} />
      </View>

      <View style={styles.content}>
        {/* 成功アニメーション */}
        <SuccessCheckmark size={80} color={COLORS.success} />

        <SlideIn direction="up" delay={300}>
          <Text style={styles.title}>準備完了！</Text>
          <Text style={styles.subtitle}>
            {estimatedEtp
              ? 'PBからETPを推定しました'
              : 'ETPテストでETPを測定しましょう'}
          </Text>
        </SlideIn>

        {/* eTPカード（ある場合） */}
        {estimatedEtp && (
          <ScaleIn delay={500}>
            <View style={styles.etpCard}>
              <Text style={styles.etpLabel}>推定ETP</Text>
              <Text style={styles.etpPace}>{formatKmPace(estimatedEtp)}</Text>
              <Text style={styles.etpSec}>{estimatedEtp}秒/400m</Text>
            </View>
          </ScaleIn>
        )}

        {/* 次のステップ */}
        <SlideIn delay={700} direction="up">
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>次のステップ</Text>
            {[
              { icon: 'analytics', text: 'テストタブでETPテストを実施' },
              { icon: 'home', text: 'ホームでゾーンを確認' },
              { icon: 'fitness', text: 'トレーニングを開始' },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon as any} size={18} color={COLORS.text.muted} />
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </SlideIn>
      </View>

      <SlideIn delay={900} direction="up">
        <View style={styles.buttonArea}>
          <Pressable style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>アプリを始める</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>戻る</Text>
          </Pressable>
        </View>
      </SlideIn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },

  // eTPカード
  etpCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  etpLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  etpPace: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  etpSec: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },

  // 次のステップ
  nextSteps: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // ボタン
  buttonArea: {
    padding: 24,
    gap: 12,
  },
  completeButton: {
    backgroundColor: COLORS.success,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
});
