// ============================================
// EmptyState Component
// 空状態を視覚的に表現する共通コンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'card';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  iconColor = COLORS.text.muted,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';
  const isCard = variant === 'card';

  return (
    <View
      style={[
        styles.container,
        isCompact && styles.containerCompact,
        isCard && styles.containerCard,
        style,
      ]}
    >
      {/* アイコン背景 */}
      <View
        style={[
          styles.iconContainer,
          isCompact && styles.iconContainerCompact,
        ]}
      >
        <Ionicons
          name={icon}
          size={isCompact ? 32 : 48}
          color={iconColor}
        />
      </View>

      {/* テキスト */}
      <Text
        style={[
          styles.title,
          isCompact && styles.titleCompact,
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            styles.description,
            isCompact && styles.descriptionCompact,
          ]}
        >
          {description}
        </Text>
      )}

      {/* アクションボタン */}
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              size={isCompact ? 'small' : 'medium'}
              style={styles.actionButton}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              size={isCompact ? 'small' : 'medium'}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  containerCompact: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  containerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconContainerCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 15,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 240,
  },
  actions: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    minWidth: 160,
  },
});
