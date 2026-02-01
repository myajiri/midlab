// ============================================
// Button Component
// ============================================

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : COLORS.primary}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

// ============================================
// Icon Button Component
// ============================================

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'medium',
  variant = 'default',
  disabled = false,
  style,
}) => {
  const sizeMap = {
    small: 32,
    medium: 44,
    large: 56,
  };

  const buttonSize = sizeMap[size];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        variant === 'primary' && styles.iconButtonPrimary,
        variant === 'danger' && styles.iconButtonDanger,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
    </Pressable>
  );
};

// ============================================
// Chip Button Component
// ============================================

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Base button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Variant styles
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary,
  },
  button_danger: {
    backgroundColor: COLORS.danger,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  // Size styles
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },

  // Text styles
  text: {
    fontWeight: '600',
  },
  textDisabled: {
    opacity: 0.7,
  },
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: '#ffffff',
  },
  text_danger: {
    color: '#ffffff',
  },
  text_ghost: {
    color: COLORS.primary,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_small: {
    fontSize: 13,
  },
  text_medium: {
    fontSize: 15,
  },
  text_large: {
    fontSize: 17,
  },

  // Icon button styles
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  iconButtonDanger: {
    backgroundColor: COLORS.danger,
  },

  // Chip styles
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
