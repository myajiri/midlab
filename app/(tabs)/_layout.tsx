// ============================================
// Tab Layout
// ============================================

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

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
          title: 'ワークアウト',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="barbell-outline"
              filledName="barbell"
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
  );
}
