import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore, useUser, useIsAuthenticated } from '../../store/useAuthStore';
import { useAppStore, useProfile, useTestResults, useIsOnboardingComplete } from '../../store/useAppStore';
import { signInWithEmail, signUpWithEmail } from '../../services/auth';

// ============================================
// メインコンポーネント
// ============================================

export default function SettingsScreen() {
    const router = useRouter();
    const user = useUser();
    const isAuthenticated = useIsAuthenticated();
    const signOut = useAuthStore((state) => state.signOut);
    const profile = useProfile();
    const testResults = useTestResults();
    const setProfile = useAppStore((state) => state.setProfile);
    const clearTestResults = useAppStore((state) => state.clearTestResults);
    const isOnboardingComplete = useIsOnboardingComplete();
    const resetOnboarding = useAppStore((state) => state.resetOnboarding);

    // ログインフォーム状態
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 認証処理
    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
                Alert.alert('確認メール送信', '確認メールを送信しました。メールを確認してアカウントを有効化してください。');
            } else {
                await signInWithEmail(email, password);
            }
            setShowAuthForm(false);
            setEmail('');
            setPassword('');
        } catch (error: any) {
            Alert.alert('エラー', error.message || '認証に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // サインアウト処理
    const handleSignOut = async () => {
        Alert.alert(
            'ログアウト',
            'ログアウトしますか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'ログアウト',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error: any) {
                            Alert.alert('エラー', error.message);
                        }
                    },
                },
            ]
        );
    };

    // データ削除
    const handleClearData = () => {
        Alert.alert(
            'データ削除',
            'すべてのテスト結果を削除しますか？この操作は取り消せません。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除',
                    style: 'destructive',
                    onPress: () => {
                        clearTestResults();
                        Alert.alert('完了', 'データを削除しました');
                    },
                },
            ]
        );
    };

    // ============================================
    // 認証フォーム
    // ============================================
    if (showAuthForm) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.authHeader}>
                            <TouchableOpacity onPress={() => setShowAuthForm(false)} style={styles.backButton}>
                                <Text style={styles.backButtonText}>← 戻る</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.authContent}>
                            <Text style={styles.authTitle}>{isSignUp ? 'アカウント作成' : 'ログイン'}</Text>
                            <Text style={styles.authSubtitle}>
                                {isSignUp ? '新しいアカウントを作成します' : 'メールアドレスでログイン'}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>メールアドレス</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="email@example.com"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>パスワード</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="6文字以上"
                                    placeholderTextColor="#6b7280"
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.authButton, loading && styles.authButtonDisabled]}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#3B82F6', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.authButtonGradient}
                                >
                                    <Text style={styles.authButtonText}>
                                        {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.switchAuthMode}
                                onPress={() => setIsSignUp(!isSignUp)}
                            >
                                <Text style={styles.switchAuthModeText}>
                                    {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでないですか？'}
                                    <Text style={styles.switchAuthModeLink}>
                                        {isSignUp ? ' ログイン' : ' 新規登録'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // ============================================
    // 設定画面メイン
    // ============================================
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.title}>設定</Text>
                </View>

                {/* アカウントセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>アカウント</Text>

                    {isAuthenticated ? (
                        <View style={styles.accountCard}>
                            <View style={styles.accountInfo}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || '?'}</Text>
                                </View>
                                <View style={styles.accountDetails}>
                                    <Text style={styles.accountEmail}>{user?.email}</Text>
                                    <Text style={styles.accountStatus}>✅ ログイン中</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                                <Text style={styles.logoutButtonText}>ログアウト</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.loginCard} onPress={() => setShowAuthForm(true)}>
                            <View style={styles.loginCardContent}>
                                <Text style={styles.loginIcon}>🔐</Text>
                                <View style={styles.loginInfo}>
                                    <Text style={styles.loginTitle}>ログイン / 新規登録</Text>
                                    <Text style={styles.loginSubtitle}>データをクラウドに保存</Text>
                                </View>
                            </View>
                            <Text style={styles.loginArrow}>→</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* プロフィールセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>プロフィール</Text>
                    <View style={styles.settingsList}>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>表示名</Text>
                            <Text style={styles.settingValue}>{profile.displayName}</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>テスト回数</Text>
                            <Text style={styles.settingValue}>{testResults.length}回</Text>
                        </View>
                    </View>
                </View>

                {/* PBセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>自己ベスト (PB)</Text>
                    <Text style={styles.sectionDesc}>
                        PBを入力すると、eTPとトレーニングゾーンを推定できます
                    </Text>
                    <View style={styles.pbGrid}>
                        {[
                            { key: 'm800', label: '800m' },
                            { key: 'm1500', label: '1500m' },
                            { key: 'm3000', label: '3000m' },
                            { key: 'm5000', label: '5000m' },
                        ].map(({ key, label }) => {
                            const value = profile.pbs[key as keyof typeof profile.pbs];
                            const displayValue = value
                                ? `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`
                                : '--:--';
                            return (
                                <View key={key} style={styles.pbItem}>
                                    <Text style={styles.pbLabel}>{label}</Text>
                                    <TextInput
                                        style={styles.pbInput}
                                        placeholder="M:SS"
                                        placeholderTextColor="#4b5563"
                                        keyboardType="numbers-and-punctuation"
                                        defaultValue={value ? displayValue : ''}
                                        onEndEditing={(e) => {
                                            const text = e.nativeEvent.text;
                                            const match = text.match(/^(\d{1,2}):(\d{2})$/);
                                            if (match) {
                                                const seconds = parseInt(match[1]) * 60 + parseInt(match[2]);
                                                setProfile({
                                                    pbs: {
                                                        ...profile.pbs,
                                                        [key]: seconds,
                                                    },
                                                });
                                            }
                                        }}
                                    />
                                </View>
                            );
                        })}
                    </View>

                    {/* eTP推定プレビューと更新ボタン */}
                    {(() => {
                        const { estimateEtpFromMultiplePBs, formatKmPace, calculateSpeedIndex, estimateLimiterFromSpeedIndex } = require('../../utils/calculations');
                        const estimatedEtp = estimateEtpFromMultiplePBs(profile.pbs);
                        const speedIndex = calculateSpeedIndex(profile.pbs);
                        const limiterEstimate = estimateLimiterFromSpeedIndex(speedIndex);
                        const currentEtp = useAppStore.getState().currentEtp;
                        const setEstimatedEtp = useAppStore.getState().setEstimatedEtp;

                        if (!estimatedEtp) return null;

                        return (
                            <View style={styles.etpPreview}>
                                <View style={styles.etpPreviewHeader}>
                                    <Text style={styles.etpPreviewLabel}>PBからの推定eTP</Text>
                                    <Text style={styles.etpPreviewValue}>
                                        {estimatedEtp}秒 ({formatKmPace(estimatedEtp)})
                                    </Text>
                                </View>
                                {currentEtp && currentEtp !== estimatedEtp && (
                                    <Text style={styles.etpPreviewCurrent}>
                                        現在のeTP: {currentEtp}秒
                                    </Text>
                                )}
                                <TouchableOpacity
                                    style={styles.updateEtpButton}
                                    onPress={() => {
                                        Alert.alert(
                                            'eTPを更新',
                                            `PBから推定したeTP (${estimatedEtp}秒) で更新しますか？\n\n※ RISEテストの結果がある場合は、テスト結果の方が正確です。`,
                                            [
                                                { text: 'キャンセル', style: 'cancel' },
                                                {
                                                    text: '更新',
                                                    onPress: () => {
                                                        setEstimatedEtp(estimatedEtp, limiterEstimate.type);
                                                        Alert.alert('完了', 'eTPを更新しました');
                                                    },
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.updateEtpButtonText}>📊 このeTPで更新</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })()}
                </View>

                {/* データセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>データ</Text>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
                        <Text style={styles.dangerButtonText}>🗑️ テスト結果をすべて削除</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dangerButton, styles.resetButton]}
                        onPress={() => {
                            Alert.alert(
                                'オンボーディングをリセット',
                                '次回アプリ起動時にオンボーディング画面が表示されます。よろしいですか？',
                                [
                                    { text: 'キャンセル', style: 'cancel' },
                                    {
                                        text: 'リセット',
                                        style: 'destructive',
                                        onPress: () => {
                                            resetOnboarding();
                                            Alert.alert('完了', 'オンボーディングをリセットしました。アプリを再起動してください。');
                                        },
                                    },
                                ]
                            );
                        }}
                    >
                        <Text style={styles.resetButtonText}>🔄 オンボーディングをリセット</Text>
                    </TouchableOpacity>
                </View>

                {/* アプリ情報 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>アプリ情報</Text>
                    <View style={styles.settingsList}>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>バージョン</Text>
                            <Text style={styles.settingValue}>1.0.0</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================================
// スタイル定義
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },

    // セクション
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // アカウントカード（ログイン済み）
    accountCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    accountDetails: {
        flex: 1,
    },
    accountEmail: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    accountStatus: {
        color: '#22C55E',
        fontSize: 13,
        marginTop: 2,
    },
    logoutButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },

    // ログインカード（未ログイン）
    loginCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    loginCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    loginInfo: {
        flex: 1,
    },
    loginTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginSubtitle: {
        color: '#6b7280',
        fontSize: 13,
        marginTop: 2,
    },
    loginArrow: {
        color: '#3B82F6',
        fontSize: 20,
        fontWeight: '600',
    },

    // 設定リスト
    settingsList: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    settingLabel: {
        color: '#ffffff',
        fontSize: 15,
    },
    settingValue: {
        color: '#6b7280',
        fontSize: 15,
    },

    // 危険なボタン
    dangerButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    dangerButtonText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '500',
    },

    // 認証フォーム
    authHeader: {
        marginTop: 20,
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
    },
    authContent: {
        paddingTop: 20,
    },
    authTitle: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    authSubtitle: {
        color: '#6b7280',
        fontSize: 16,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#9ca3af',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    authButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 12,
    },
    authButtonDisabled: {
        opacity: 0.6,
    },
    authButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    authButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    switchAuthMode: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchAuthModeText: {
        color: '#6b7280',
        fontSize: 14,
    },
    switchAuthModeLink: {
        color: '#3B82F6',
        fontWeight: '500',
    },

    // PBセクション
    sectionDesc: {
        color: '#6b7280',
        fontSize: 13,
        marginBottom: 12,
    },
    pbGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    pbItem: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
    },
    pbLabel: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 6,
    },
    pbInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '600',
    },

    // リセットボタン
    resetButton: {
        marginTop: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    resetButtonText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '500',
    },

    // eTP更新プレビュー
    etpPreview: {
        marginTop: 16,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    etpPreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    etpPreviewLabel: {
        color: '#9ca3af',
        fontSize: 13,
    },
    etpPreviewValue: {
        color: '#22c55e',
        fontSize: 16,
        fontWeight: '600',
    },
    etpPreviewCurrent: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 12,
    },
    updateEtpButton: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    updateEtpButtonText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
    },

    bottomSpacer: {
        height: 40,
    },
});
