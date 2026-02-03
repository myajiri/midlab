// ============================================
// プレミアム機能ゲートコンポーネント
// ============================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
 * プレミアムユーザーはchildrenを表示、そうでなければアップグレード画面へリダイレクト
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({ featureName, children }) => {
    const router = useRouter();
    const isPremium = useIsPremium();

    useEffect(() => {
        if (!isPremium) {
            // アップグレード画面へ遷移（機能名をパラメータとして渡す）
            router.push({
                pathname: '/upgrade',
                params: { feature: featureName },
            });
        }
    }, [isPremium, router, featureName]);

    if (isPremium) {
        return <>{children}</>;
    }

    // リダイレクト中は空のビューを表示
    return <View style={styles.container} />;
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
