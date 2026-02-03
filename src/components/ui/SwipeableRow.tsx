// ============================================
// SwipeableRow Component
// スワイプで完了マークするUIコンポーネント
// ============================================

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const SWIPE_THRESHOLD = 80;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeComplete?: () => void;
  disabled?: boolean;
  completed?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onSwipeComplete,
  disabled = false,
  completed = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !completed,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 水平方向の動きが垂直方向より大きい場合のみ反応
        return (
          !disabled &&
          !completed &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // 右方向のスワイプのみ許可
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, SWIPE_THRESHOLD + 20));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // スワイプ完了 - 柔らかいスプリングでアクションを実行
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            velocity: gestureState.vx,
          }).start(() => {
            onSwipeComplete?.();
            // スプリングで自然に元に戻す
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 7,
            }).start();
          });
        } else {
          // 元に戻す - 柔らかいスプリング
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 7,
            velocity: gestureState.vx,
          }).start();
        }
      },
    })
  ).current;

  // 背景の不透明度
  const backgroundOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // アイコンのスケール
  const iconScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0.5, 0.8, 1],
    extrapolate: 'clamp',
  });

  if (completed || disabled) {
    return <View>{children}</View>;
  }

  return (
    <View style={styles.container}>
      {/* 背景（スワイプ時に表示） */}
      <Animated.View style={[styles.background, { opacity: backgroundOpacity }]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </Animated.View>
        <Text style={styles.backgroundText}>完了</Text>
      </Animated.View>

      {/* メインコンテンツ */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD + 20,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
    borderRadius: 8,
  },
  backgroundText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    backgroundColor: COLORS.background.dark,
  },
});
