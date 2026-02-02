// ============================================
// アチーブメントUIコンポーネント
// バッジ表示、通知、一覧など
// ============================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import {
  useAchievementStore,
  ACHIEVEMENTS,
  useAchievementsByCategory,
} from '../../stores/useAchievementStore';
import { Achievement, AchievementCategory } from '../../types';
import { ScaleIn, FadeIn, PulseView, SuccessCheckmark } from './Animated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ============================================
// AchievementNotification - 達成通知ポップアップ
// ============================================

interface AchievementNotificationProps {
  onComplete?: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  const getNextNotification = useAchievementStore((state) => state.getNextPendingNotification);
  const markNotified = useAchievementStore((state) => state.markNotified);

  useEffect(() => {
    const achievement = getNextNotification();
    if (achievement) {
      setCurrentAchievement(achievement);
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (currentAchievement) {
      markNotified(currentAchievement.id);
    }
    setVisible(false);
    setCurrentAchievement(null);

    // 次の通知をチェック
    setTimeout(() => {
      const next = getNextNotification();
      if (next) {
        setCurrentAchievement(next);
        setVisible(true);
      } else {
        onComplete?.();
      }
    }, 300);
  };

  if (!visible || !currentAchievement) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.modalOverlay} onPress={handleDismiss}>
        <ScaleIn delay={100}>
          <View style={styles.notificationCard}>
            {/* 背景グラデーション */}
            <LinearGradient
              colors={[`${currentAchievement.color}30`, 'transparent']}
              style={styles.notificationGradient}
            />

            {/* 上部装飾 */}
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationLabel}>達成！</Text>
            </View>

            {/* アイコン */}
            <PulseView>
              <View
                style={[
                  styles.notificationIcon,
                  { backgroundColor: `${currentAchievement.color}20` },
                ]}
              >
                <Ionicons
                  name={currentAchievement.icon as any}
                  size={48}
                  color={currentAchievement.color}
                />
              </View>
            </PulseView>

            {/* タイトル */}
            <Text style={styles.notificationTitle}>{currentAchievement.title}</Text>
            <Text style={styles.notificationDesc}>{currentAchievement.description}</Text>

            {/* 閉じるボタン */}
            <Pressable style={styles.notificationButton} onPress={handleDismiss}>
              <Text style={styles.notificationButtonText}>すばらしい！</Text>
            </Pressable>
          </View>
        </ScaleIn>
      </Pressable>
    </Modal>
  );
};

// ============================================
// AchievementBadge - 単体バッジ表示
// ============================================

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  unlocked,
  size = 'medium',
  showLabel = true,
  onPress,
}) => {
  const sizeConfig = {
    small: { badge: 40, icon: 20, fontSize: 10 },
    medium: { badge: 56, icon: 28, fontSize: 11 },
    large: { badge: 72, icon: 36, fontSize: 13 },
  };

  const config = sizeConfig[size];

  const content = (
    <View style={styles.badgeContainer}>
      <View
        style={[
          styles.badge,
          {
            width: config.badge,
            height: config.badge,
            borderRadius: config.badge / 2,
            backgroundColor: unlocked ? `${achievement.color}20` : 'rgba(255, 255, 255, 0.05)',
            borderColor: unlocked ? achievement.color : 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <Ionicons
          name={achievement.icon as any}
          size={config.icon}
          color={unlocked ? achievement.color : COLORS.text.muted}
        />
        {!unlocked && (
          <View style={styles.badgeLock}>
            <Ionicons name="lock-closed" size={config.icon * 0.4} color={COLORS.text.muted} />
          </View>
        )}
      </View>
      {showLabel && (
        <Text
          style={[
            styles.badgeLabel,
            { fontSize: config.fontSize },
            !unlocked && styles.badgeLabelLocked,
          ]}
          numberOfLines={1}
        >
          {achievement.title}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
        {content}
      </Pressable>
    );
  }

  return content;
};

// ============================================
// AchievementList - カテゴリ別一覧
// ============================================

interface AchievementListProps {
  category: AchievementCategory;
  compact?: boolean;
}

export const AchievementList: React.FC<AchievementListProps> = ({
  category,
  compact = false,
}) => {
  const achievements = useAchievementsByCategory(category);

  if (compact) {
    return (
      <View style={styles.compactList}>
        {achievements.map((achievement, index) => (
          <FadeIn key={achievement.id} delay={index * 50}>
            <AchievementBadge
              achievement={achievement}
              unlocked={achievement.unlocked}
              size="small"
              showLabel={false}
            />
          </FadeIn>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {achievements.map((achievement, index) => (
        <FadeIn key={achievement.id} delay={index * 80}>
          <View style={styles.listItem}>
            <AchievementBadge
              achievement={achievement}
              unlocked={achievement.unlocked}
              size="medium"
              showLabel={false}
            />
            <View style={styles.listItemContent}>
              <Text
                style={[
                  styles.listItemTitle,
                  !achievement.unlocked && styles.listItemTitleLocked,
                ]}
              >
                {achievement.title}
              </Text>
              <Text style={styles.listItemDesc}>{achievement.description}</Text>
              {achievement.unlockedAt && (
                <Text style={styles.listItemDate}>
                  {new Date(achievement.unlockedAt).toLocaleDateString('ja-JP')}
                </Text>
              )}
            </View>
            {achievement.unlocked && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            )}
          </View>
        </FadeIn>
      ))}
    </View>
  );
};

// ============================================
// AchievementSummary - 達成状況サマリー
// ============================================

export const AchievementSummary: React.FC = () => {
  const unlockedAchievements = useAchievementStore((state) => state.unlockedAchievements);
  const total = ACHIEVEMENTS.length;
  const unlocked = unlockedAchievements.length;
  const progress = unlocked / total;

  return (
    <View style={styles.summary}>
      <View style={styles.summaryHeader}>
        <Ionicons name="trophy" size={20} color="#EAB308" />
        <Text style={styles.summaryTitle}>アチーブメント</Text>
        <Text style={styles.summaryCount}>
          {unlocked}/{total}
        </Text>
      </View>

      <View style={styles.summaryProgress}>
        <View style={styles.summaryProgressTrack}>
          <View
            style={[
              styles.summaryProgressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* 最近のアンロック */}
      <View style={styles.recentBadges}>
        {unlockedAchievements.slice(-3).reverse().map((unlock) => {
          const achievement = ACHIEVEMENTS.find((a) => a.id === unlock.achievementId);
          if (!achievement) return null;
          return (
            <View
              key={unlock.achievementId}
              style={[
                styles.recentBadge,
                { backgroundColor: `${achievement.color}20` },
              ]}
            >
              <Ionicons
                name={achievement.icon as any}
                size={16}
                color={achievement.color}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ============================================
// スタイル
// ============================================

const styles = StyleSheet.create({
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notificationCard: {
    width: width - 48,
    backgroundColor: COLORS.background.light,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  notificationGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  notificationHeader: {
    marginBottom: 24,
  },
  notificationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  notificationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationDesc: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  notificationButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Badge
  badgeContainer: {
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeLock: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.background.dark,
    borderRadius: 8,
    padding: 2,
  },
  badgeLabel: {
    color: COLORS.text.secondary,
    fontWeight: '500',
    maxWidth: 70,
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: COLORS.text.muted,
  },

  // List
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  listItemTitleLocked: {
    color: COLORS.text.muted,
  },
  listItemDesc: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  listItemDate: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  compactList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Summary
  summary: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  summaryProgress: {
    marginBottom: 12,
  },
  summaryProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: '#EAB308',
    borderRadius: 3,
  },
  recentBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  recentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
