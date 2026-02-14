import React, { ReactNode, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet } from 'react-native';

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
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            // 右方向20px以上で発火、垂直20px以内
            onMoveShouldSetPanResponder: (_, gestureState) => {
                if (!enabled) return false;
                return gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                if (!enabled) return false;
                return gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
            },
            onPanResponderMove: (_, gestureState) => {
                // 右方向のみ追従
                if (gestureState.dx > 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const shouldGoBack =
                    gestureState.dx > SWIPE_THRESHOLD ||
                    (gestureState.dx > 50 && gestureState.vx > 0.3);

                if (shouldGoBack) {
                    // スワイプ成功 - 画面外へスライドアウトしてから遷移
                    const velocity = Math.max(gestureState.vx, 0.5);
                    const remaining = SCREEN_WIDTH - gestureState.dx;
                    const duration = Math.min(Math.max(remaining / velocity, 120), 300);

                    Animated.timing(translateX, {
                        toValue: SCREEN_WIDTH,
                        duration,
                        useNativeDriver: true,
                    }).start((result) => {
                        if (result.finished) {
                            onSwipeBack();
                        }
                    });
                } else {
                    // 元に戻す
                    Animated.spring(translateX, {
                        toValue: 0,
                        damping: 20,
                        stiffness: 200,
                        mass: 0.8,
                        velocity: gestureState.vx,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                // ジェスチャーが中断された場合は元に戻す
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    // メインビューのスタイル（右にスライド + わずかに縮小）
    const scale = translateX.interpolate({
        inputRange: [0, SCREEN_WIDTH],
        outputRange: [1, 0.92],
        extrapolate: 'clamp',
    });

    // 背景の暗幕（スワイプ中に背景が暗くなる）
    const overlayOpacity = translateX.interpolate({
        inputRange: [0, SCREEN_WIDTH],
        outputRange: [0, 0.4],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View style={styles.container} {...panResponder.panHandlers}>
            {/* 背景の暗幕 */}
            <Animated.View
                style={[styles.overlay, { opacity: overlayOpacity }]}
                pointerEvents="none"
            />
            {/* メインコンテンツ */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [{ translateX }, { scale }],
                    },
                ]}
            >
                {children}
            </Animated.View>
        </Animated.View>
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
