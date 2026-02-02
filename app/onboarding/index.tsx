// ============================================
// オンボーディング: ウェルカム画面
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/stores/useAppStore';
import { ProgressBar } from '../../src/components/ui';

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
            {/* 進捗表示 */}
            <View style={styles.progressContainer}>
                <ProgressBar progress={0} height={4} color="#3B82F6" />
            </View>

            <View style={styles.content}>
                {/* ロゴ・アイコン */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoIconWrapper}>
                        <Text style={styles.logo}>⚡</Text>
                    </View>
                    <Text style={styles.appName}>MidLab</Text>
                    <Text style={styles.tagline}>中距離ランナーのための{'\n'}トレーニングアプリ</Text>
                </View>

                {/* 機能説明 */}
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="analytics-outline" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>ランプテスト</Text>
                            <Text style={styles.featureDesc}>あなたの持久力タイプを科学的に判定</Text>
                        </View>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIconContainer, styles.featureIconGreen]}>
                            <Ionicons name="speedometer-outline" size={24} color="#22C55E" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>トレーニングゾーン</Text>
                            <Text style={styles.featureDesc}>6ゾーンで最適なペースを自動計算</Text>
                        </View>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIconContainer, styles.featureIconPurple]}>
                            <Ionicons name="fitness-outline" size={24} color="#8B5CF6" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>パーソナライズ</Text>
                            <Text style={styles.featureDesc}>あなたの弱点に合わせたトレーニング</Text>
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
    progressContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logo: {
        fontSize: 48,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 2,
        marginBottom: 12,
    },
    tagline: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    features: {
        gap: 14,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    featureIconGreen: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    featureIconPurple: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    buttons: {
        padding: 28,
        gap: 12,
    },
    startButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    startButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 17,
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
