import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useIsSubScreenOpen } from '../../store/useUIStore';

// Material Top Tab Navigatorを使用してスワイプを有効化
const { Navigator } = createMaterialTopTabNavigator();

// Expo Routerとの連携
export const MaterialTopTabs = withLayoutContext<
    MaterialTopTabNavigationOptions,
    typeof Navigator,
    TabNavigationState<ParamListBase>,
    {}
>(Navigator);

// タブナビゲーションのレイアウト（スワイプ対応）
export default function TabLayout() {
    // サブ画面が開いているときはスワイプを無効化
    const isSubScreenOpen = useIsSubScreenOpen();

    return (
        <MaterialTopTabs
            initialRouteName="index"
            tabBarPosition="bottom"
            screenOptions={{
                // サブ画面が開いているときはスワイプ無効
                swipeEnabled: !isSubScreenOpen,
                // タブバーのスタイル
                tabBarStyle: {
                    backgroundColor: '#0a0a0f',
                    borderTopColor: '#1a1a2e',
                    borderTopWidth: 1,
                    height: 88,
                    paddingBottom: 30,
                    paddingTop: 8,
                },
                // インジケーターのスタイル
                tabBarIndicatorStyle: {
                    backgroundColor: '#3b82f6',
                    height: 3,
                    top: 0,
                },
                // アクティブなタブの色
                tabBarActiveTintColor: '#3b82f6',
                // 非アクティブなタブの色
                tabBarInactiveTintColor: '#6b7280',
                // ラベルのスタイル
                tabBarLabelStyle: {
                    fontSize: 9,
                    fontWeight: '600',
                    textTransform: 'none',
                    marginTop: 2,
                },
                // アイコンを表示
                tabBarShowIcon: true,
                // レイジーローディングを有効化
                lazy: true,
            }}
        >
            {/* ホームタブ */}
            <MaterialTopTabs.Screen
                name="index"
                options={{
                    title: 'ホーム',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="home" size={20} color={color} />
                    ),
                }}
            />
            {/* テストタブ */}
            <MaterialTopTabs.Screen
                name="test"
                options={{
                    title: 'テスト',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="fitness" size={20} color={color} />
                    ),
                }}
            />
            {/* 計画タブ */}
            <MaterialTopTabs.Screen
                name="plan"
                options={{
                    title: '計画',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="calendar" size={20} color={color} />
                    ),
                }}
            />
            {/* ワークアウトタブ */}
            <MaterialTopTabs.Screen
                name="workout"
                options={{
                    title: 'メニュー',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="barbell" size={20} color={color} />
                    ),
                }}
            />
            {/* 履歴タブ */}
            <MaterialTopTabs.Screen
                name="history"
                options={{
                    title: '履歴',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="time" size={20} color={color} />
                    ),
                }}
            />
            {/* 設定タブ */}
            <MaterialTopTabs.Screen
                name="settings"
                options={{
                    title: '設定',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="settings" size={22} color={color} />
                    ),
                }}
            />
        </MaterialTopTabs>
    );
}
