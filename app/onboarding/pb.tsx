// ============================================
// オンボーディング: PB入力画面
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { estimateEtpFromMultiplePBs, formatKmPace } from '../../utils/calculations';

const PB_FIELDS = [
    { key: 'm800', label: '800m', placeholder: '例: 2:30' },
    { key: 'm1500', label: '1500m', placeholder: '例: 5:00' },
    { key: 'm3000', label: '3000m', placeholder: '例: 11:00' },
    { key: 'm5000', label: '5000m', placeholder: '例: 20:00' },
] as const;

export default function OnboardingPB() {
    const router = useRouter();
    const setProfile = useAppStore((state) => state.setProfile);
    const profile = useAppStore((state) => state.profile);

    const [pbs, setPbs] = useState<Record<string, string>>({});
    const [parsedPbs, setParsedPbs] = useState<Record<string, number>>({});

    const parseTime = (text: string): number | null => {
        const match = text.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return null;
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    };

    const handleTimeInput = (key: string, text: string) => {
        setPbs(prev => ({ ...prev, [key]: text }));
        const seconds = parseTime(text);
        if (seconds) {
            setParsedPbs(prev => ({ ...prev, [key]: seconds }));
        }
    };

    // 推定eTPを計算
    const estimatedEtp = estimateEtpFromMultiplePBs(parsedPbs as any);

    const handleNext = () => {
        setProfile({ pbs: parsedPbs as any });
        router.push('/onboarding/result');
    };

    const handleSkip = () => {
        router.push('/onboarding/result');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 戻る</Text>
                    </TouchableOpacity>
                    <Text style={styles.step}>2 / 3</Text>
                </View>

                <Text style={styles.title}>自己ベストを入力</Text>
                <Text style={styles.subtitle}>
                    入力するとeTPとトレーニングゾーンを推定できます（任意）
                </Text>

                {/* PB入力フィールド */}
                <View style={styles.pbList}>
                    {PB_FIELDS.map((field) => (
                        <View key={field.key} style={styles.pbField}>
                            <Text style={styles.pbLabel}>{field.label}</Text>
                            <TextInput
                                style={styles.pbInput}
                                placeholder={field.placeholder}
                                placeholderTextColor="#4b5563"
                                value={pbs[field.key] || ''}
                                onChangeText={(text) => handleTimeInput(field.key, text)}
                                keyboardType="numbers-and-punctuation"
                            />
                        </View>
                    ))}
                </View>

                {/* 推定結果プレビュー */}
                {estimatedEtp && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewLabel}>推定eTP</Text>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewValue}>{estimatedEtp}秒</Text>
                            <Text style={styles.previewPace}>{formatKmPace(estimatedEtp)}</Text>
                        </View>
                        <Text style={styles.previewNote}>
                            ※ RISEテストを実施するとより正確な値が得られます
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* ボタン */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>次へ</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>PBがわからない / あとで入力</Text>
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
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
    },
    step: {
        color: '#6b7280',
        fontSize: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 32,
    },
    pbList: {
        gap: 16,
    },
    pbField: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    pbLabel: {
        fontSize: 13,
        color: '#9ca3af',
        marginBottom: 8,
    },
    pbInput: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: '600',
    },
    previewCard: {
        marginTop: 32,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    previewLabel: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 12,
    },
    previewValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
    },
    previewPace: {
        fontSize: 16,
        color: '#9ca3af',
    },
    previewNote: {
        marginTop: 12,
        fontSize: 12,
        color: '#6b7280',
    },
    buttonContainer: {
        padding: 24,
        gap: 12,
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    nextButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    nextButtonText: {
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
