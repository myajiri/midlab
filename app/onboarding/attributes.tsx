// ============================================
// オンボーディング: 属性入力画面
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../src/stores/useAppStore';
import { LIMITER_CONFIG } from '../../constants';
import { LimiterType, AgeCategory, Experience } from '../../src/types';
import { ProgressBar } from '../../src/components/ui';

const AGE_CATEGORIES: { key: AgeCategory; label: string; desc: string }[] = [
    { key: 'junior_high', label: '中学生', desc: '12-15歳' },
    { key: 'high_school', label: '高校生', desc: '15-18歳' },
    { key: 'collegiate', label: '大学生', desc: '18-22歳' },
    { key: 'senior', label: '一般', desc: '22-39歳' },
    { key: 'masters_40', label: 'マスターズ40代', desc: '40-49歳' },
    { key: 'masters_50', label: 'マスターズ50代', desc: '50-59歳' },
    { key: 'masters_60', label: 'マスターズ60歳以上', desc: '60歳以上' },
];

const EXPERIENCE_LEVELS: { key: Experience; label: string; desc: string }[] = [
    { key: 'beginner', label: '初心者', desc: '走歴1年未満' },
    { key: 'intermediate', label: '中級者', desc: '走歴1-3年' },
    { key: 'advanced', label: '上級者', desc: '走歴3年以上' },
    { key: 'elite', label: 'エリート', desc: '競技経験あり' },
];

const LIMITER_TYPES: { key: LimiterType; label: string; desc: string }[] = [
    { key: 'cardio', label: '心肺型', desc: '心肺機能が制限要因' },
    { key: 'muscular', label: '筋持久力型', desc: '筋持久力が制限要因' },
    { key: 'balanced', label: 'バランス型', desc: '両方バランスが取れている' },
];

export default function OnboardingAttributes() {
    const router = useRouter();
    const { edit } = useLocalSearchParams<{ edit?: string }>();
    const isEditMode = edit === 'true';

    const updateAttributes = useProfileStore((state) => state.updateAttributes);
    const setLimiterTypeStore = useProfileStore((state) => state.setLimiterType);
    const profile = useProfileStore((state) => state.profile);

    const [displayName, setDisplayName] = useState('');
    const [ageCategory, setAgeCategory] = useState<AgeCategory>(profile.ageCategory);
    const [experience, setExperience] = useState<Experience>(profile.experience);
    const [limiterType, setLimiterType] = useState<LimiterType>(profile.estimated?.limiterType ?? 'balanced');

    const handleNext = () => {
        updateAttributes({ ageCategory, experience });
        // リミッタータイプのみを保存（eTPはPB入力後に計算される）
        setLimiterTypeStore(limiterType);
        if (isEditMode) {
            router.back();
        } else {
            router.push('/onboarding/pb');
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* プログレスバー */}
            <View style={styles.progressContainer}>
                <ProgressBar progress={0.33} height={4} color="#3B82F6" />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#3B82F6" />
                    </Pressable>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>ステップ 1/3</Text>
                    </View>
                </View>

                <Text style={styles.title}>あなたについて教えてください</Text>
                <Text style={styles.subtitle}>より正確な推定のために使用します</Text>

                {/* ニックネーム */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ニックネーム</Text>
                    <TextInput
                        style={styles.nameInput}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="ニックネームを入力"
                        placeholderTextColor="#6b7280"
                    />
                </View>

                {/* 年齢カテゴリ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>年齢カテゴリ</Text>
                    <View style={styles.optionGrid}>
                        {AGE_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.key}
                                style={[
                                    styles.optionCard,
                                    ageCategory === cat.key && styles.optionCardActive,
                                ]}
                                onPress={() => setAgeCategory(cat.key)}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    ageCategory === cat.key && styles.optionLabelActive,
                                ]}>
                                    {cat.label}
                                </Text>
                                <Text style={styles.optionDesc}>{cat.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 経験レベル */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>走歴・経験</Text>
                    <View style={styles.optionGrid}>
                        {EXPERIENCE_LEVELS.map((exp) => (
                            <TouchableOpacity
                                key={exp.key}
                                style={[
                                    styles.optionCard,
                                    experience === exp.key && styles.optionCardActive,
                                ]}
                                onPress={() => setExperience(exp.key)}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    experience === exp.key && styles.optionLabelActive,
                                ]}>
                                    {exp.label}
                                </Text>
                                <Text style={styles.optionDesc}>{exp.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* タイプ（リミッター） */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>自分のタイプ（わからなければバランス型）</Text>
                    <View style={styles.optionGrid}>
                        {LIMITER_TYPES.map((type) => {
                            const config = LIMITER_CONFIG[type.key];
                            return (
                                <TouchableOpacity
                                    key={type.key}
                                    style={[
                                        styles.optionCard,
                                        limiterType === type.key && { borderColor: config.color, backgroundColor: config.color + '20' },
                                    ]}
                                    onPress={() => setLimiterType(type.key)}
                                >
                                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{config.icon}</Text>
                                    <Text style={[
                                        styles.optionLabel,
                                        limiterType === type.key && { color: config.color },
                                    ]}>
                                        {type.label}
                                    </Text>
                                    <Text style={styles.optionDesc}>{type.desc}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* 次へボタン */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>{isEditMode ? '保存' : '次へ'}</Text>
                    </LinearGradient>
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionCard: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardActive: {
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    optionLabelActive: {
        color: '#3B82F6',
    },
    optionDesc: {
        fontSize: 12,
        color: '#6b7280',
    },
    buttonContainer: {
        padding: 24,
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
    nameInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
});
