// ============================================
// Root Layout - MidLab
// ============================================

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/components/ui';
import { useSettingsStore } from '../src/stores/useAppStore';
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

  // 起動時にストレージキーの移行を実行
  useEffect(() => {
    const runMigration = async () => {
      await migrateStorageKeys();
      setIsMigrationComplete(true);
    };
    runMigration();
  }, []);

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
      router.replace('/onboarding');
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
