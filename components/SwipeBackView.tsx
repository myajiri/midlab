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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2; // 20%以上でスワイプ成功
const EDGE_WIDTH = 50; // 左端50pxからのスワイプを検出

interface SwipeBackViewProps {
    children: ReactNode;
    onSwipeBack: () => void;
    enabled?: boolean;
}

/**
 * スワイプバックジェスチャーを提供するラッパーコンポーネント
 * Reanimated GestureでUIスレッド実行（60fps保証）
 */
export const SwipeBackView = ({ children, onSwipeBack, enabled = true }: SwipeBackViewProps) => {
    const translateX = useSharedValue(0);
    const isEdgeSwipe = useSharedValue(false);

    const panGesture = Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([10, SCREEN_WIDTH]) // 右方向10px以上で発火
        .failOffsetY([-15, 15]) // 垂直15px以上で失敗（スクロール優先）
        .onBegin((event) => {
            // 左端からの開始かを判定
            isEdgeSwipe.value = event.absoluteX < EDGE_WIDTH;
        })
        .onUpdate((event) => {
            // 左端スワイプのみ、1:1で追従
            if (isEdgeSwipe.value && event.translationX > 0) {
                translateX.value = event.translationX;
            }
        })
        .onEnd((event) => {
            if (!isEdgeSwipe.value) {
                return;
            }

            if (event.translationX > SWIPE_THRESHOLD && event.velocityX > 200) {
                // スワイプ成功 - スプリングで画面外へ
                translateX.value = withSpring(SCREEN_WIDTH, {
                    velocity: event.velocityX,
                    damping: 20,
                    stiffness: 100,
                }, (finished) => {
                    if (finished) {
                        runOnJS(onSwipeBack)();
                        translateX.value = 0;
                    }
                });
            } else {
                // 元に戻す - 柔らかいスプリング
                translateX.value = withSpring(0, {
                    damping: 20,
                    stiffness: 200,
                    mass: 0.8,
                    velocity: event.velocityX,
                });
            }

            isEdgeSwipe.value = false;
        })
        .onFinalize(() => {
            // キャンセル時も柔らかく戻す
            if (translateX.value !== 0) {
                translateX.value = withSpring(0, {
                    damping: 20,
                    stiffness: 200,
                    mass: 0.8,
                });
            }
            isEdgeSwipe.value = false;
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
