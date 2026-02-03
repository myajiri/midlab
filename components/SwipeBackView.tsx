import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25%以上でスワイプ成功

interface SwipeBackViewProps {
    children: ReactNode;
    onSwipeBack: () => void;
    enabled?: boolean;
}

/**
 * スワイプバックジェスチャーを提供するラッパーコンポーネント
 * 画面全体から右スワイプで前画面に戻る
 */
export const SwipeBackView = ({ children, onSwipeBack, enabled = true }: SwipeBackViewProps) => {
    const translateX = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX(20) // 右方向20px以上で発火
        .failOffsetY([-20, 20]) // 垂直20px以上で失敗（スクロール優先）
        .onUpdate((event) => {
            // 右方向のみ追従
            if (event.translationX > 0) {
                translateX.value = event.translationX;
            }
        })
        .onEnd((event) => {
            const shouldGoBack =
                event.translationX > SWIPE_THRESHOLD ||
                (event.translationX > 50 && event.velocityX > 300);

            if (shouldGoBack) {
                // スワイプ成功 - 即座にコールバック
                translateX.value = 0;
                runOnJS(onSwipeBack)();
            } else {
                // 元に戻す
                translateX.value = withSpring(0, {
                    damping: 20,
                    stiffness: 200,
                    mass: 0.8,
                    velocity: event.velocityX,
                });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
