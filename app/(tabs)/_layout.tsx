// ============================================
// Tab Layout（ネイティブページャーによるぬるぬるスワイプ）
// ============================================

import { withLayoutContext } from 'expo-router';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
  type MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import {
  type ParamListBase,
  type TabNavigationState,
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const { Navigator } = createMaterialTopTabNavigator();

// expo-routerとMaterialTopTabsを統合（ネイティブPagerViewベース）
const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

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
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.background.dark,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 0,
          textTransform: 'none',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarShowIcon: true,
        tabBarIndicatorStyle: { height: 0 },
        // ネイティブページャーのスワイプ設定
        swipeEnabled: true,
        lazy: true,
        lazyPreloadDistance: 1, // 隣接タブを事前読み込み
      }}
    >
      <MaterialTopTabs.Screen
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
      <MaterialTopTabs.Screen
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
      <MaterialTopTabs.Screen
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
      <MaterialTopTabs.Screen
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
      <MaterialTopTabs.Screen
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
    </MaterialTopTabs>
  );
}
