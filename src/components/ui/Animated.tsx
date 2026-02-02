// ============================================
// アニメーションコンポーネント
// react-native-reanimatedを活用した滑らかなUI
// ============================================

import React, { useEffect } from 'react';
import { View, ViewStyle, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn as ReanimatedFadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  BounceIn,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

// ============================================
// FadeIn - フェードインアニメーション
// ============================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 400,
  style,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// SlideIn - スライドインアニメーション
// ============================================

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 400,
  distance = 30,
  style,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX =
      direction === 'left'
        ? interpolate(progress.value, [0, 1], [-distance, 0])
        : direction === 'right'
        ? interpolate(progress.value, [0, 1], [distance, 0])
        : 0;

    const translateY =
      direction === 'up'
        ? interpolate(progress.value, [0, 1], [distance, 0])
        : direction === 'down'
        ? interpolate(progress.value, [0, 1], [-distance, 0])
        : 0;

    return {
      opacity: progress.value,
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// ScaleIn - スケールインアニメーション
// ============================================

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  style?: ViewStyle;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = 300,
  initialScale = 0.8,
  style,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, { damping: 12 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [initialScale, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: progress.value,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// AnimatedPressable - アニメーション付きPressable
// ============================================

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  scaleOnPress?: number;
  disabled?: boolean;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  style,
  scaleOnPress = 0.96,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(scaleOnPress, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[animatedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ============================================
// AnimatedCard - アニメーション付きカード
// ============================================

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'highlight';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  onPress,
  style,
  variant = 'default',
}) => {
  const delay = index * 80;

  const variantStyles = {
    default: styles.cardDefault,
    elevated: styles.cardElevated,
    highlight: styles.cardHighlight,
  };

  const content = (
    <SlideIn delay={delay} direction="up" distance={20}>
      <View style={[styles.card, variantStyles[variant], style]}>
        {children}
      </View>
    </SlideIn>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress}>
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

// ============================================
// PulseView - パルスアニメーション
// ============================================

interface PulseViewProps {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  active = true,
  style,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );

      // 繰り返し
      const interval = setInterval(() => {
        scale.value = withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// SuccessCheckmark - 成功チェックマーク
// ============================================

interface SuccessCheckmarkProps {
  size?: number;
  color?: string;
  delay?: number;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  size = 64,
  color = '#22C55E',
  delay = 0,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-45);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    rotation.value = withDelay(delay, withSpring(0, { damping: 10 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: scale.value,
  }));

  return (
    <Animated.View style={[styles.checkmarkContainer, animatedStyle]}>
      <View
        style={[
          styles.checkmarkCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `${color}20`,
            borderColor: color,
          },
        ]}
      >
        <Ionicons name="checkmark" size={size * 0.5} color={color} />
      </View>
    </Animated.View>
  );
};

// ============================================
// CountUp - カウントアップアニメーション
// ============================================

interface CountUpProps {
  value: number;
  duration?: number;
  style?: any;
  suffix?: string;
  prefix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1000,
  style,
  suffix = '',
  prefix = '',
}) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration }, (finished) => {
      if (finished) {
        runOnJS(setDisplayValue)(value);
      }
    });

    // 中間値の更新
    const interval = setInterval(() => {
      setDisplayValue(Math.round(animatedValue.value));
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setDisplayValue(value);
    }, duration + 100);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <Text style={style}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
};

// ============================================
// StaggeredList - 段階的リスト表示
// ============================================

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 80,
  direction = 'up',
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <SlideIn
          key={index}
          delay={index * staggerDelay}
          direction={direction}
          duration={400}
        >
          {child}
        </SlideIn>
      ))}
    </>
  );
};

// ============================================
// 再エクスポート（Reanimated組み込みアニメーション）
// ============================================

export {
  ReanimatedFadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  BounceIn,
};

// ============================================
// スタイル
// ============================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardElevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHighlight: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
