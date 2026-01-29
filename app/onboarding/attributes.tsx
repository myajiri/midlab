// ============================================
// オンボーディング: 属性入力画面
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';

const AGE_CATEGORIES = [
    { key: 'junior', label: '中学生', desc: '12-15歳' },
    { key: 'youth', label: '高校生・大学生', desc: '16-22歳' },
    { key: 'senior', label: '一般', desc: '23-39歳' },
    { key: 'master', label: 'マスターズ', desc: '40歳以上' },
] as const;

const EXPERIENCE_LEVELS = [
    { key: 'beginner', label: '初心者', desc: '走歴1年未満' },
    { key: 'intermediate', label: '中級者', desc: '走歴1-3年' },
    { key: 'advanced', label: '上級者', desc: '走歴3年以上' },
    { key: 'elite', label: 'エリート', desc: '競技経験あり' },
] as const;

export default function OnboardingAttributes() {
    const router = useRouter();
    const setProfile = useAppStore((state) => state.setProfile);
    const profile = useAppStore((state) => state.profile);

    const [ageCategory, setAgeCategory] = useState<typeof AGE_CATEGORIES[number]['key']>(profile.ageCategory);
    const [experience, setExperience] = useState<typeof EXPERIENCE_LEVELS[number]['key']>(profile.experience);

    const handleNext = () => {
        setProfile({ ageCategory, experience });
        router.push('/onboarding/pb');
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
                    <Text style={styles.step}>1 / 3</Text>
                </View>

                <Text style={styles.title}>あなたについて教えてください</Text>
                <Text style={styles.subtitle}>より正確な推定のために使用します</Text>

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
                        <Text style={styles.nextButtonText}>次へ</Text>
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
});
