import React, { useRef, ReactNode } from 'react';
import {
    Animated,
    PanResponder,
    Dimensions,
    StyleSheet,
    View,
    GestureResponderEvent,
    PanResponderGestureState,
} from 'react-native';

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
 * 左端から右スワイプで前画面に戻る動作を実現
 */
export const SwipeBackView = ({ children, onSwipeBack, enabled = true }: SwipeBackViewProps) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const isSwipeActive = useRef(false);
    const startX = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (
                event: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => {
                // 左端からの右スワイプのみを検出
                const shouldCapture =
                    enabled &&
                    gestureState.dx > 15 && // 15px以上の右移動
                    event.nativeEvent.pageX < EDGE_WIDTH && // 左端から開始
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.5); // 水平方向が優勢

                if (shouldCapture) {
                    isSwipeActive.current = true;
                    startX.current = event.nativeEvent.pageX;
                }
                return shouldCapture;
            },
            onMoveShouldSetPanResponderCapture: (
                event: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => {
                // より積極的にキャプチャ
                return (
                    enabled &&
                    gestureState.dx > 15 &&
                    event.nativeEvent.pageX < EDGE_WIDTH &&
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.5)
                );
            },
            onPanResponderGrant: () => {
                translateX.setValue(0);
                isSwipeActive.current = true;
            },
            onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
                if (isSwipeActive.current && gestureState.dx > 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
                if (!isSwipeActive.current) {
                    return;
                }

                if (gestureState.dx > SWIPE_THRESHOLD && gestureState.vx > 0.2) {
                    // スワイプ成功 - 画面右へスライド
                    Animated.timing(translateX, {
                        toValue: SCREEN_WIDTH,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onSwipeBack();
                        translateX.setValue(0);
                    });
                } else {
                    // 元に戻す
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 10,
                    }).start();
                }
                isSwipeActive.current = false;
            },
            onPanResponderTerminate: () => {
                // キャンセルされた場合は元に戻す
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
                isSwipeActive.current = false;
            },
        })
    ).current;

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                {children}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});
