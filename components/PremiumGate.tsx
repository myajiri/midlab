// ============================================
// プレミアム機能ゲートコンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsPremium } from '../store/useSubscriptionStore';
import { COLORS } from '../src/constants';

interface PremiumGateProps {
    featureName: string;
    children: React.ReactNode;
}

/**
 * プレミアム機能へのアクセスをゲートするコンポーネント
 * プレミアムユーザーはchildrenを表示、そうでなければインラインでアップグレード案内を表示
 * ※ router.pushによるリダイレクトは廃止（隣接タブのプリロードで誤発火するため）
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({ featureName, children }) => {
    const router = useRouter();
    const isPremium = useIsPremium();

    if (isPremium) {
        return <>{children}</>;
    }

    // インラインでアップグレード案内を表示
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>プレミアム機能</Text>
                <Text style={styles.description}>
                    「{featureName}」はプレミアムプランで{'\n'}ご利用いただけます
                </Text>
                <Pressable
                    style={styles.upgradeButton}
                    onPress={() => router.push({
                        pathname: '/upgrade',
                        params: { feature: featureName },
                    })}
                >
                    <Ionicons name="diamond" size={18} color="#fff" />
                    <Text style={styles.upgradeButtonText}>プランを見る</Text>
                </Pressable>
            </View>
        </View>
    );
};

/**
 * プレミアムバッジコンポーネント
 */
export const PremiumBadge: React.FC = () => {
    const isPremium = useIsPremium();

    if (!isPremium) return null;

    return (
        <View style={styles.badge}>
            <Ionicons name="trophy" size={12} color="#F59E0B" />
            <Text style={styles.badgeText}>Premium</Text>
        </View>
    );
};

/**
 * プレミアム限定ラベル
 */
export const PremiumLabel: React.FC = () => (
    <View style={styles.label}>
        <Ionicons name="trophy" size={10} color="#F59E0B" />
        <Text style={styles.labelText}>PRO</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    upgradeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: '600',
    },
    label: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    labelText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
    },
});

export default PremiumGate;
