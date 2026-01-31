import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

// ルートレイアウト - アプリ全体のナビゲーション構造を定義
export default function RootLayout() {
    const initializeAuth = useAuthStore((state) => state.initialize);
    const initializeSubscription = useSubscriptionStore((state) => state.initialize);
    const isOnboardingComplete = useAppStore((state) => state.isOnboardingComplete);
    const user = useAuthStore((state) => state.user);
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();
    const segments = useSegments();

    // アプリ起動時に認証状態とサブスクリプションを初期化
    useEffect(() => {
        const init = async () => {
            await initializeAuth();
            // RevenueCat初期化（ユーザーIDがあれば紐付け）
            await initializeSubscription(user?.id);
            // Zustandの永続化が完了するまで少し待つ
            setTimeout(() => setIsReady(true), 100);
        };
        init();
    }, [initializeAuth, initializeSubscription, user?.id]);

    // オンボーディング状態に応じてリダイレクト
    useEffect(() => {
        if (!isReady) return;

        const inOnboarding = segments[0] === 'onboarding';

        if (!isOnboardingComplete && !inOnboarding) {
            // オンボーディング未完了かつオンボーディング画面にいない場合
            router.replace('/onboarding');
        } else if (isOnboardingComplete && inOnboarding) {
            // オンボーディング完了済みでオンボーディング画面にいる場合
            router.replace('/(tabs)');
        }
    }, [isReady, isOnboardingComplete, segments, router]);

    // ローディング中
    if (!isReady) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: '#0a0a0f',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
