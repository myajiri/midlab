// ============================================
// プレミアム機能ゲートコンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsPremium } from '../store/useSubscriptionStore';

interface PremiumGateProps {
    featureName: string;
    children: React.ReactNode;
}

/**
 * プレミアム機能へのアクセスをゲートするコンポーネント
 * プレミアムユーザーはchildrenを表示、そうでなければアップグレード誘導
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({ featureName, children }) => {
    const router = useRouter();
    const isPremium = useIsPremium();

    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>👑</Text>
                <Text style={styles.title}>プレミアム機能</Text>
                <Text style={styles.description}>
                    「{featureName}」はプレミアム会員限定です
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/upgrade')}
                >
                    <LinearGradient
                        colors={['#F59E0B', '#EAB308']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>プレミアムにアップグレード</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
            <Text style={styles.badgeText}>👑 Premium</Text>
        </View>
    );
};

/**
 * プレミアム限定ラベル
 */
export const PremiumLabel: React.FC = () => (
    <View style={styles.label}>
        <Text style={styles.labelText}>👑 PRO</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '600',
    },
    badge: {
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
