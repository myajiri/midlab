// ============================================
// オンボーディング: ウェルカム画面
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/useAppStore';

const { width } = Dimensions.get('window');

export default function OnboardingWelcome() {
    const router = useRouter();
    const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

    const handleStart = () => {
        router.push('/onboarding/attributes');
    };

    const handleSkip = () => {
        setOnboardingComplete(true);
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* ロゴ・アイコン */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>⚡</Text>
                    <Text style={styles.appName}>Zone2Peak</Text>
                    <Text style={styles.tagline}>RISEテストで最適なトレーニングを</Text>
                </View>

                {/* 説明 */}
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🏃</Text>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>RISEテスト</Text>
                            <Text style={styles.featureDesc}>あなたの持久力タイプを判定</Text>
                        </View>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📊</Text>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>トレーニングゾーン</Text>
                            <Text style={styles.featureDesc}>最適なペースを自動計算</Text>
                        </View>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🎯</Text>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>パーソナルメニュー</Text>
                            <Text style={styles.featureDesc}>リミッター別のアドバイス</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ボタン */}
            <View style={styles.buttons}>
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.startButtonGradient}
                    >
                        <Text style={styles.startButtonText}>はじめる</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>スキップ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logo: {
        fontSize: 72,
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#6b7280',
    },
    features: {
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
    },
    featureIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#6b7280',
    },
    buttons: {
        padding: 32,
        gap: 12,
    },
    startButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    startButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    skipButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6b7280',
        fontSize: 14,
    },
});
