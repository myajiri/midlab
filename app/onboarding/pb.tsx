// ============================================
// オンボーディング: PB入力画面
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../src/stores/useAppStore';
import { formatTime, formatKmPace } from '../../src/utils';
import { PBs } from '../../src/types';
import { ProgressBar, TimePickerModal } from '../../src/components/ui';

const PB_FIELDS = [
    { key: 'm800', label: '800m', minMinutes: 1, maxMinutes: 5, distance: 800 },
    { key: 'm1500', label: '1500m', minMinutes: 3, maxMinutes: 10, distance: 1500 },
    { key: 'm3000', label: '3000m', minMinutes: 7, maxMinutes: 20, distance: 3000 },
    { key: 'm5000', label: '5000m', minMinutes: 12, maxMinutes: 35, distance: 5000 },
] as const;

// PBsオブジェクトからeTPを推定（複数PBから最も信頼性の高いものを使用）
const estimateEtpFromPbs = (pbs: Record<string, number>): number | null => {
    const coefficients: Record<string, { coef: number; distance: number }> = {
        m800: { coef: 0.82, distance: 800 },
        m1500: { coef: 0.88, distance: 1500 },
        m3000: { coef: 0.96, distance: 3000 },
        m5000: { coef: 1.00, distance: 5000 },
    };

    // 優先順位: 5000m > 3000m > 1500m > 800m
    const priority = ['m5000', 'm3000', 'm1500', 'm800'];

    for (const key of priority) {
        if (pbs[key] && pbs[key] > 0) {
            const { coef, distance } = coefficients[key];
            const distanceRatio = distance / 400;
            return Math.round(pbs[key] / (coef * distanceRatio));
        }
    }
    return null;
};

export default function OnboardingPB() {
    const router = useRouter();
    const updatePBs = useProfileStore((state) => state.updatePBs);
    const profile = useProfileStore((state) => state.profile);

    const [pbs, setPbs] = useState<Record<string, number>>({});
    const [activeField, setActiveField] = useState<string | null>(null);

    // 現在編集中のフィールド情報を取得
    const activeFieldInfo = PB_FIELDS.find(f => f.key === activeField);

    const handleTimeSelect = (key: string, seconds: number) => {
        setPbs(prev => ({ ...prev, [key]: seconds }));
        setActiveField(null);
    };

    // 推定eTPを計算
    const estimatedEtp = Object.keys(pbs).length > 0 ? estimateEtpFromPbs(pbs) : null;

    const handleNext = () => {
        updatePBs(pbs as PBs);
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
            {/* プログレスバー */}
            <View style={styles.progressContainer}>
                <ProgressBar progress={0.66} height={4} color="#3B82F6" />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#3B82F6" />
                    </Pressable>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>ステップ 2/3</Text>
                    </View>
                </View>

                <Text style={styles.title}>自己ベストを入力</Text>
                <Text style={styles.subtitle}>
                    入力するとeTPとトレーニングゾーンを推定できます（任意）
                </Text>

                {/* PB入力フィールド */}
                <View style={styles.pbList}>
                    {PB_FIELDS.map((field) => (
                        <Pressable
                            key={field.key}
                            style={styles.pbField}
                            onPress={() => setActiveField(field.key)}
                        >
                            <Text style={styles.pbLabel}>{field.label}</Text>
                            <View style={styles.pbValueRow}>
                                {pbs[field.key] ? (
                                    <Text style={styles.pbValue}>{formatTime(pbs[field.key])}</Text>
                                ) : (
                                    <Text style={styles.pbPlaceholder}>タップして入力</Text>
                                )}
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </View>
                        </Pressable>
                    ))}
                </View>

                {/* 推定結果プレビュー */}
                {estimatedEtp && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewLabel}>推定eTP</Text>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewPace}>{formatKmPace(estimatedEtp)}</Text>
                            <Text style={styles.previewValue}>({estimatedEtp}秒/400m)</Text>
                        </View>
                        <Text style={styles.previewNote}>
                            ※ ランプテストを実施するとより正確な値が得られます
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

            {/* タイムピッカーモーダル */}
            {activeFieldInfo && (
                <TimePickerModal
                    visible={!!activeField}
                    onClose={() => setActiveField(null)}
                    onSelect={(seconds) => handleTimeSelect(activeField!, seconds)}
                    value={pbs[activeField!] || 0}
                    title={`${activeFieldInfo.label}のベストタイム`}
                    minMinutes={activeFieldInfo.minMinutes}
                    maxMinutes={activeFieldInfo.maxMinutes}
                />
            )}
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
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 28,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stepText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '500',
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
        gap: 12,
    },
    pbField: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pbLabel: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    pbValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pbValue: {
        fontSize: 18,
        color: '#3B82F6',
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    pbPlaceholder: {
        fontSize: 14,
        color: '#6b7280',
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
