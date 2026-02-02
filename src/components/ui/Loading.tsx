// ============================================
// Loading Component
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  DimensionValue,
} from 'react-native';
import { COLORS } from '../../constants';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

// フルスクリーンローディングオーバーレイ
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = '読み込み中...',
}) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

// インラインローディングスピナー
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color = COLORS.primary,
  message,
}) => {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.spinnerMessage}>{message}</Text>}
    </View>
  );
};

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

// スケルトンローディング
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  message: {
    color: COLORS.text.primary,
    fontSize: 14,
  },

  // Spinner
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinnerMessage: {
    color: COLORS.text.secondary,
    fontSize: 13,
  },

  // Skeleton
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
