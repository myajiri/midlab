// ============================================
// SectionHeader Component
// セクション見出しの統一コンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
  badge?: string;
  badgeColor?: string;
  style?: ViewStyle;
  variant?: 'default' | 'large' | 'small';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconColor = COLORS.text.secondary,
  actionLabel,
  onAction,
  count,
  badge,
  badgeColor = COLORS.primary,
  style,
  variant = 'default',
}) => {
  const isLarge = variant === 'large';
  const isSmall = variant === 'small';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {/* アイコン */}
        {icon && (
          <Ionicons
            name={icon}
            size={isLarge ? 20 : isSmall ? 14 : 16}
            color={iconColor}
            style={styles.icon}
          />
        )}

        {/* タイトル */}
        <View>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                isLarge && styles.titleLarge,
                isSmall && styles.titleSmall,
              ]}
            >
              {title}
            </Text>

            {/* カウント */}
            {typeof count === 'number' && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}

            {/* バッジ */}
            {badge && (
              <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>
                  {badge}
                </Text>
              </View>
            )}
          </View>

          {/* サブタイトル */}
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>

      {/* アクションボタン */}
      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [
            styles.action,
            pressed && styles.actionPressed,
          ]}
          onPress={onAction}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={COLORS.primary}
          />
        </Pressable>
      )}
    </View>
  );
};

// Divider（区切り線）
interface DividerProps {
  label?: string;
  style?: ViewStyle;
  variant?: 'default' | 'subtle' | 'bold';
}

export const Divider: React.FC<DividerProps> = ({
  label,
  style,
  variant = 'default',
}) => {
  const lineColor =
    variant === 'subtle'
      ? 'rgba(255, 255, 255, 0.05)'
      : variant === 'bold'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.08)';

  if (label) {
    return (
      <View style={[styles.dividerWithLabel, style]}>
        <View style={[styles.dividerLine, { backgroundColor: lineColor }]} />
        <Text style={styles.dividerLabel}>{label}</Text>
        <View style={[styles.dividerLine, { backgroundColor: lineColor }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: lineColor },
        style,
      ]}
    />
  );
};

// PageHeader（ページヘッダー）
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backButton = false,
  onBack,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.pageHeader, style]}>
      {/* 戻るボタン */}
      {backButton && onBack && (
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </Pressable>
      )}

      {/* タイトル部分 */}
      <View style={styles.pageHeaderCenter}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.pageSubtitle}>{subtitle}</Text>
        )}
      </View>

      {/* 右側アクション */}
      {rightAction && (
        <View style={styles.pageHeaderRight}>
          {rightAction}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // SectionHeader
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  titleLarge: {
    fontSize: 18,
  },
  titleSmall: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionPressed: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  actionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: 16,
  },
  dividerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // PageHeader
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    borderRadius: 22,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageHeaderCenter: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  pageHeaderRight: {
    marginLeft: 12,
  },
});
