// ============================================
// Tab Layout（スワイプ対応版）
// ============================================

import { useRef, useCallback } from 'react';
import { PanResponder, StyleSheet, Animated } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// タブの順序
const TAB_ORDER = ['index', 'test', 'plan', 'workout', 'settings'];
const SWIPE_THRESHOLD = 80;

interface TabIconProps {
  focused: boolean;
  outlineName: IoniconsName;
  filledName: IoniconsName;
}

const TabIcon = ({ focused, outlineName, filledName }: TabIconProps) => (
  <Ionicons
    name={focused ? filledName : outlineName}
    size={24}
    color={focused ? COLORS.primary : COLORS.text.secondary}
  />
);

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useRef(new Animated.Value(0)).current;

  // 現在のタブインデックス
  const getCurrentIndex = useCallback(() => {
    const currentTab = pathname.replace('/', '') || 'index';
    return TAB_ORDER.indexOf(currentTab);
  }, [pathname]);

  // タブ遷移
  const navigateToTab = useCallback(
    (direction: 'left' | 'right') => {
      const currentIndex = getCurrentIndex();
      const newIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;

      if (newIndex >= 0 && newIndex < TAB_ORDER.length) {
        const targetTab = TAB_ORDER[newIndex];
        router.push(`/(tabs)/${targetTab === 'index' ? '' : targetTab}`);
      }
    },
    [getCurrentIndex, router]
  );

  // PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // 画面端での横スワイプのみ検出
        return Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 15;
      },
      onPanResponderGrant: () => {
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // 軽いフィードバック
        translateX.setValue(gestureState.dx * 0.15);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;

        if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
          navigateToTab('left');
        } else if (dx > SWIPE_THRESHOLD || vx > 0.5) {
          navigateToTab('right');
        }

        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.background.dark,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            borderTopWidth: 1,
            height: 85,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.text.secondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          animation: 'shift',
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="home-outline"
              filledName="home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: 'テスト',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="speedometer-outline"
              filledName="speedometer"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: '計画',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="calendar-outline"
              filledName="calendar"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'トレーニング',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="walk-outline"
              filledName="walk"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="settings-outline"
              filledName="settings"
            />
          ),
        }}
      />
      </Tabs>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
