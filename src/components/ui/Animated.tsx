// ============================================
// アニメーションコンポーネント
// React Native標準Animated APIによる実装
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  ViewStyle,
  Pressable,
  StyleSheet,
  Text,
  Animated,
  Easing,
} from 'react-native';
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
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity }, style]}>
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
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX =
    direction === 'left'
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] })
      : direction === 'right'
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] })
      : 0;

  const translateY =
    direction === 'up'
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] })
      : direction === 'down'
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] })
      : 0;

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            { translateX: translateX as any },
            { translateY: translateY as any },
          ],
        },
        style,
      ]}
    >
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
  initialScale = 0.8,
  style,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      damping: 12,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [initialScale, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [{ scale }],
        },
        style,
      ]}
    >
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleOnPress,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
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
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        ])
      );
      animationRef.current.start();

      return () => {
        animationRef.current?.stop();
      };
    }
  }, [active]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
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
  const scale = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(-45)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 8,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(rotation, {
        toValue: 0,
        damping: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [-45, 0],
    outputRange: ['-45deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.checkmarkContainer,
        {
          transform: [{ scale }, { rotate }],
          opacity: scale,
        },
      ]}
    >
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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
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
