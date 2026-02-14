// ============================================
// Root Layout - MidLab
// ============================================

import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/components/ui';
import { useSettingsStore } from '../src/stores/useAppStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { COLORS } from '../src/constants';
import { migrateStorageKeys } from '../src/utils';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);

  // ナビゲーションの準備状態を確認
  const navigationState = useRootNavigationState();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isMigrationComplete, setIsMigrationComplete] = useState(false);
  const hasRedirected = useRef(false);

  // 起動時にストレージキーの移行を実行
  useEffect(() => {
    const runMigration = async () => {
      await migrateStorageKeys();
      setIsMigrationComplete(true);
    };
    runMigration();
  }, []);

  // サブスクリプション（RevenueCat）の初期化
  // ストアのアクション関数は安定した参照なので、getState()経由で直接呼び出す
  useEffect(() => {
    if (!isMigrationComplete) return;
    useSubscriptionStore.getState().initialize();
  }, [isMigrationComplete]);

  useEffect(() => {
    if (navigationState?.key) {
      setIsNavigationReady(true);
    }
  }, [navigationState?.key]);

  useEffect(() => {
    // ナビゲーションと移行が準備できるまで待機
    if (!isNavigationReady || !isMigrationComplete) return;

    // オンボーディング未完了の場合、オンボーディング画面へ遷移
    // ただし、既にオンボーディング画面にいる場合は遷移しない
    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      // 重複遷移を防止
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace('/onboarding');
    } else {
      hasRedirected.current = false;
    }
  }, [onboardingComplete, segments, isNavigationReady, isMigrationComplete]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ToastProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background.dark },
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="upgrade"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  presentation: 'card',
                }}
              />
            </Stack>
          </View>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
});
