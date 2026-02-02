// ============================================
// ガイド付きジャーニーコンポーネント
// ユーザーを次のステップへ導くUI
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants';
import {
  useAchievementStore,
  useCurrentJourneyStep,
  useJourneyProgress,
  JOURNEY_STEPS,
  JourneyStepInfo,
} from '../../stores/useAchievementStore';
import { JourneyStep } from '../../types';
import { ProgressBar } from './ProgressSteps';
import { SlideIn, AnimatedPressable, PulseView } from './Animated';

// ============================================
// JourneyCard - 現在のステップを表示するカード
// ============================================

interface JourneyCardProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({
  onDismiss,
  compact = false,
}) => {
  const router = useRouter();
  const currentStep = useCurrentJourneyStep();
  const progress = useJourneyProgress();
  const completeStep = useAchievementStore((state) => state.completeJourneyStep);
  const skipStep = useAchievementStore((state) => state.skipJourneyStep);

  if (!currentStep || currentStep.id === 'completed') {
    return null;
  }

  const handleAction = () => {
    if (currentStep.route) {
      router.push(currentStep.route as any);
    }
  };

  const handleSkip = () => {
    skipStep(currentStep.id);
    onDismiss?.();
  };

  if (compact) {
    return (
      <SlideIn direction="down" delay={200}>
        <Pressable style={styles.compactCard} onPress={handleAction}>
          <View style={[styles.compactIcon, { backgroundColor: `${currentStep.color}20` }]}>
            <Ionicons
              name={currentStep.icon as any}
              size={20}
              color={currentStep.color}
            />
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle}>{currentStep.title}</Text>
            <Text style={styles.compactDesc} numberOfLines={1}>
              {currentStep.description}
            </Text>
          </View>
          {currentStep.action && (
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
          )}
        </Pressable>
      </SlideIn>
    );
  }

  return (
    <SlideIn direction="up" delay={100}>
      <View style={styles.card}>
        {/* 進捗バー */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>ジャーニー進捗</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarWrapper}>
              <ProgressBar progress={progress} height={6} color={COLORS.primary} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        {/* ステップ内容 */}
        <View style={styles.stepSection}>
          <PulseView active>
            <View style={[styles.stepIcon, { backgroundColor: `${currentStep.color}20` }]}>
              <Ionicons
                name={currentStep.icon as any}
                size={32}
                color={currentStep.color}
              />
            </View>
          </PulseView>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepDesc}>{currentStep.description}</Text>
          </View>
        </View>

        {/* アクションボタン */}
        <View style={styles.actions}>
          {currentStep.action && (
            <AnimatedPressable onPress={handleAction}>
              <View style={[styles.actionButton, { backgroundColor: currentStep.color }]}>
                <Text style={styles.actionButtonText}>{currentStep.action}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </AnimatedPressable>
          )}

          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>スキップ</Text>
          </Pressable>
        </View>
      </View>
    </SlideIn>
  );
};

// ============================================
// JourneyTimeline - ジャーニーのタイムライン表示
// ============================================

interface JourneyTimelineProps {
  showAll?: boolean;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  showAll = false,
}) => {
  const journey = useAchievementStore((state) => state.journey);

  if (!journey) return null;

  const currentIndex = JOURNEY_STEPS.findIndex((s) => s.id === journey.currentStep);
  const stepsToShow = showAll
    ? JOURNEY_STEPS
    : JOURNEY_STEPS.slice(0, Math.min(currentIndex + 2, JOURNEY_STEPS.length));

  return (
    <View style={styles.timeline}>
      {stepsToShow.map((step, index) => {
        const isCompleted = journey.completedSteps.includes(step.id);
        const isSkipped = journey.skippedSteps.includes(step.id);
        const isCurrent = step.id === journey.currentStep;
        const isLast = index === stepsToShow.length - 1;

        return (
          <SlideIn key={step.id} delay={index * 100} direction="left">
            <View style={styles.timelineItem}>
              {/* ドット */}
              <View style={styles.timelineDotContainer}>
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isSkipped && styles.timelineDotSkipped,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : isSkipped ? (
                    <Ionicons name="remove" size={12} color="#fff" />
                  ) : isCurrent ? (
                    <Ionicons name={step.icon as any} size={12} color="#fff" />
                  ) : null}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      (isCompleted || isSkipped) && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>

              {/* コンテンツ */}
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    isCurrent && styles.timelineTitleCurrent,
                    (isCompleted || isSkipped) && styles.timelineTitleDone,
                  ]}
                >
                  {step.title}
                </Text>
                {isCurrent && (
                  <Text style={styles.timelineDesc}>{step.description}</Text>
                )}
              </View>
            </View>
          </SlideIn>
        );
      })}
    </View>
  );
};

// ============================================
// JourneyCompleteBanner - 完了バナー
// ============================================

export const JourneyCompleteBanner: React.FC = () => {
  const journey = useAchievementStore((state) => state.journey);

  if (!journey || journey.currentStep !== 'completed') {
    return null;
  }

  return (
    <SlideIn direction="up" delay={0}>
      <View style={styles.completeBanner}>
        <View style={styles.completeIcon}>
          <Ionicons name="trophy" size={32} color="#EAB308" />
        </View>
        <View style={styles.completeContent}>
          <Text style={styles.completeTitle}>セットアップ完了！</Text>
          <Text style={styles.completeDesc}>
            おめでとうございます！MidLabの基本セットアップが完了しました。
          </Text>
        </View>
      </View>
    </SlideIn>
  );
};

// ============================================
// スタイル
// ============================================

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarWrapper: {
    flex: 1,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  compactDesc: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },

  // Timeline
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDotContainer: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineDotSkipped: {
    backgroundColor: COLORS.text.muted,
  },
  timelineDotCurrent: {
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  timelineTitleCurrent: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  timelineTitleDone: {
    color: COLORS.text.secondary,
  },
  timelineDesc: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },

  // Complete Banner
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  completeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeContent: {
    flex: 1,
  },
  completeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EAB308',
    marginBottom: 4,
  },
  completeDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});
