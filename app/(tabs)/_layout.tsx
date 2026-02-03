// ============================================
// Tab Layout（スワイプ対応版）
// ============================================

import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../../src/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// タブの順序
const TAB_ORDER = ['index', 'test', 'plan', 'workout', 'settings'];
const SWIPE_THRESHOLD = 50;

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
  const translateX = useSharedValue(0);

  const getCurrentIndex = () => {
    const currentTab = pathname.replace('/', '') || 'index';
    return TAB_ORDER.indexOf(currentTab);
  };

  const navigateToTab = (index: number) => {
    const tab = TAB_ORDER[index];
    router.push(`/(tabs)/${tab === 'index' ? '' : tab}`);
  };

  // スワイプ終了時の処理（JSスレッドで実行）
  const handleSwipeEnd = (translationX: number) => {
    const currentIndex = getCurrentIndex();

    if (translationX < -SWIPE_THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
      // 左スワイプ - 次のタブへ
      navigateToTab(currentIndex + 1);
    } else if (translationX > SWIPE_THRESHOLD && currentIndex > 0) {
      // 右スワイプ - 前のタブへ
      navigateToTab(currentIndex - 1);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // 水平20px以上で発火
    .failOffsetY([-10, 10]) // 垂直10px以上で失敗（スクロール優先）
    .onUpdate((event) => {
      // 係数を0.8に増加（指に追従する動きが大きくなる）
      translateX.value = event.translationX * 0.8;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const shouldNavigate =
        Math.abs(event.translationX) > SWIPE_THRESHOLD ||
        Math.abs(velocity) > 500;

      if (shouldNavigate) {
        runOnJS(handleSwipeEnd)(event.translationX);
      }

      // バウンスなしで滑らかに戻す
      translateX.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
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
    </GestureDetector>
  );
}
