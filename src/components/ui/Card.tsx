// ============================================
// Card Component
// ============================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { COLORS } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  onPress,
  variant = 'default',
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    style,
  ];

  const content = (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
};

// ============================================
// Collapsible Card Component
// ============================================

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  style?: ViewStyle;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  style,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <View style={[styles.card, style]}>
      <Pressable
        style={styles.collapsibleHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
      {expanded && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
};

// ============================================
// Status Card Component
// ============================================

interface StatusCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  unit,
  icon,
  color = COLORS.primary,
  style,
}) => {
  return (
    <View style={[styles.statusCard, style]}>
      {icon && <View style={styles.statusIcon}>{icon}</View>}
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={styles.statusValueRow}>
        <Text style={[styles.statusValue, { color }]}>{value}</Text>
        {unit && <Text style={styles.statusUnit}>{unit}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  collapsibleContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  statusIcon: {
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statusValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusUnit: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
});
