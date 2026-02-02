// ============================================
// ProgressSteps Component
// ステップ形式のプログレス表示
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface Step {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  variant?: 'default' | 'compact' | 'numbered';
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';
  const isNumbered = variant === 'numbered';

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            {/* ステップアイテム */}
            <View style={styles.stepItem}>
              {/* ドット/アイコン */}
              <View
                style={[
                  styles.stepDot,
                  isCompact && styles.stepDotCompact,
                  isCompleted && styles.stepDotCompleted,
                  isActive && styles.stepDotActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons
                    name="checkmark"
                    size={isCompact ? 10 : 12}
                    color="#fff"
                  />
                ) : isNumbered ? (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                ) : step.icon && isActive ? (
                  <Ionicons
                    name={step.icon}
                    size={isCompact ? 10 : 12}
                    color="#fff"
                  />
                ) : null}
              </View>

              {/* ラベル */}
              <Text
                style={[
                  styles.stepLabel,
                  isCompact && styles.stepLabelCompact,
                  isCompleted && styles.stepLabelCompleted,
                  isActive && styles.stepLabelActive,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>

            {/* 接続線 */}
            {!isLast && (
              <View
                style={[
                  styles.stepLine,
                  isCompact && styles.stepLineCompact,
                  isCompleted && styles.stepLineCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// シンプルなプログレスバー
interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = COLORS.primary,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  showPercentage = false,
  animated = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBarTrack,
          { height, backgroundColor, borderRadius: height / 2 },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${clampedProgress * 100}%`,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.progressPercentage}>
          {Math.round(clampedProgress * 100)}%
        </Text>
      )}
    </View>
  );
};

// 週間プログレス表示（7日分のドット）
interface WeekProgressProps {
  completed: boolean[];
  activeDay?: number; // 0-6 (今日のハイライト)
  size?: 'small' | 'medium' | 'large';
}

export const WeekProgress: React.FC<WeekProgressProps> = ({
  completed,
  activeDay,
  size = 'medium',
}) => {
  const sizeMap = {
    small: { dot: 6, gap: 3 },
    medium: { dot: 10, gap: 4 },
    large: { dot: 14, gap: 6 },
  };
  const { dot: dotSize, gap } = sizeMap[size];

  const days = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <View style={[styles.weekProgressContainer, { gap }]}>
      {days.map((day, index) => {
        const isCompleted = completed[index];
        const isActive = index === activeDay;

        return (
          <View key={index} style={styles.weekDayItem}>
            <View
              style={[
                styles.weekDot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                },
                isCompleted && styles.weekDotCompleted,
                isActive && styles.weekDotActive,
                isActive && !isCompleted && styles.weekDotActiveIncomplete,
              ]}
            >
              {isCompleted && size !== 'small' && (
                <Ionicons
                  name="checkmark"
                  size={dotSize - 4}
                  color="#fff"
                />
              )}
            </View>
            {size !== 'small' && (
              <Text
                style={[
                  styles.weekDayLabel,
                  isCompleted && styles.weekDayLabelCompleted,
                  isActive && styles.weekDayLabelActive,
                ]}
              >
                {day}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // ProgressSteps
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  containerCompact: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.success,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  stepLabelCompact: {
    fontSize: 10,
  },
  stepLabelCompleted: {
    color: COLORS.text.secondary,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 11,
    marginHorizontal: 4,
  },
  stepLineCompact: {
    width: 20,
    marginTop: 9,
    marginHorizontal: 2,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.success,
  },

  // ProgressBar
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    flex: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    // スタイルは動的に設定
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 36,
    textAlign: 'right',
  },

  // WeekProgress
  weekProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayItem: {
    alignItems: 'center',
    flex: 1,
  },
  weekDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotCompleted: {
    backgroundColor: COLORS.success,
  },
  weekDotActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  weekDotActiveIncomplete: {
    backgroundColor: 'transparent',
  },
  weekDayLabel: {
    fontSize: 10,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  weekDayLabelCompleted: {
    color: COLORS.success,
  },
  weekDayLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
