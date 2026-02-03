import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
    interpolate,
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
 * 画面全体から右スワイプで前画面に戻る（スライドアウトアニメーション付き）
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
                // スワイプ成功 - 画面外へスライドアウトしてから遷移
                const velocity = Math.max(event.velocityX, 500);
                // 速度からdurationを計算（残りの距離 / 速度）
                const remaining = SCREEN_WIDTH - event.translationX;
                const duration = Math.min(Math.max(remaining / velocity * 1000, 120), 300);

                translateX.value = withTiming(SCREEN_WIDTH, {
                    duration,
                    easing: Easing.out(Easing.cubic),
                }, (finished) => {
                    if (finished) {
                        runOnJS(onSwipeBack)();
                    }
                });
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

    // メインビューのスタイル（右にスライド + わずかに縮小）
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scale: interpolate(translateX.value, [0, SCREEN_WIDTH], [1, 0.92]) },
        ],
        borderRadius: interpolate(translateX.value, [0, 100], [0, 12]),
        overflow: 'hidden' as const,
    }));

    // 背景の暗幕（スワイプ中に背景が暗くなる）
    const overlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, SCREEN_WIDTH], [0, 0.4]),
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.container}>
                {/* 背景の暗幕 */}
                <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
                {/* メインコンテンツ */}
                <Animated.View style={[styles.content, animatedStyle]}>
                    {children}
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
    },
});
