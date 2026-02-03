// ============================================
// ActionCard Component
// アクションを促すカードコンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
  title: string;
  description?: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'highlight' | 'subtle' | 'bordered';
  badge?: string;
  disabled?: boolean;
  showArrow?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  iconColor = COLORS.primary,
  iconBackgroundColor,
  title,
  description,
  onPress,
  style,
  variant = 'default',
  badge,
  disabled = false,
  showArrow = true,
}) => {
  // バリアント別のスタイル
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlight':
        return {
          container: styles.containerHighlight,
          iconBg: iconBackgroundColor || `${iconColor}20`,
        };
      case 'subtle':
        return {
          container: styles.containerSubtle,
          iconBg: iconBackgroundColor || 'rgba(255, 255, 255, 0.05)',
        };
      case 'bordered':
        return {
          container: [styles.containerBordered, { borderColor: `${iconColor}40` }],
          iconBg: iconBackgroundColor || `${iconColor}15`,
        };
      default:
        return {
          container: styles.containerDefault,
          iconBg: iconBackgroundColor || `${iconColor}15`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        variantStyles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {/* アイコン */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: variantStyles.iconBg },
        ]}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>

      {/* コンテンツ */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      {/* 矢印 */}
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.text.muted}
          style={styles.arrow}
        />
      )}
    </Pressable>
  );
};

// シンプルなリストアイテム形式
interface ActionListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export const ActionListItem: React.FC<ActionListItemProps> = ({
  icon,
  iconColor = COLORS.text.secondary,
  label,
  value,
  onPress,
  disabled = false,
  danger = false,
}) => {
  const effectiveIconColor = danger ? COLORS.danger : iconColor;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.listItem,
        pressed && !disabled && styles.listItemPressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={20}
        color={effectiveIconColor}
        style={styles.listItemIcon}
      />
      <Text
        style={[
          styles.listItemLabel,
          danger && styles.listItemLabelDanger,
        ]}
      >
        {label}
      </Text>
      {value && (
        <Text style={styles.listItemValue}>{value}</Text>
      )}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={COLORS.text.muted}
      />
    </Pressable>
  );
};

// スタットカード（数値表示用）
interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  iconColor = COLORS.primary,
  trend,
  trendValue,
  onPress,
  style,
}) => {
  const content = (
    <View style={[styles.statCard, style]}>
      {/* ヘッダー */}
      <View style={styles.statHeader}>
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={iconColor}
            style={styles.statIcon}
          />
        )}
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      {/* 値 */}
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>

      {/* トレンド */}
      {trend && trendValue && (
        <View style={styles.statTrend}>
          <Ionicons
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
            size={14}
            color={trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.danger : COLORS.text.muted}
          />
          <Text
            style={[
              styles.statTrendText,
              trend === 'up' && styles.statTrendUp,
              trend === 'down' && styles.statTrendDown,
            ]}
          >
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  // ActionCard
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  containerDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  containerHighlight: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  containerSubtle: {
    backgroundColor: 'transparent',
  },
  containerBordered: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  arrow: {
    marginLeft: 4,
  },

  // ActionListItem
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  listItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  listItemLabelDanger: {
    color: COLORS.danger,
  },
  listItemValue: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginRight: 8,
  },

  // StatCard
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    marginRight: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontWeight: '500',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  statUnit: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statTrendText: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  statTrendUp: {
    color: COLORS.success,
  },
  statTrendDown: {
    color: COLORS.danger,
  },
});
