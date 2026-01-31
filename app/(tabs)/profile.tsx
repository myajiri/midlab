// ============================================
// Zone2Peak マイページ
// 設定 + 履歴 + ゾーン/予測 を統合
// ============================================

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore, useUser, useIsAuthenticated } from '../../store/useAuthStore';
import { useAppStore, useProfile, useTestResults, useCurrentEtp, useCurrentLimiter } from '../../store/useAppStore';
import { useIsPremium } from '../../store/useSubscriptionStore';
import { signInWithEmail, signUpWithEmail } from '../../services/auth';
import { formatKmPace, estimateVO2max, calculateZones, getLevelFromEtp } from '../../utils/calculations';
import { ZONE_COEFFICIENTS, LIMITER_CONFIG, RACE_COEFFICIENTS, LIMITER_RACE_ADJUSTMENTS, type ZoneKey, type LimiterType } from '../../constants';
import { formatTime } from '../../utils/calculations';
import { PremiumBadge } from '../../components/PremiumGate';

// ============================================
// eTP推移グラフコンポーネント
// ============================================

interface EtpChartProps {
    results: { date: string; etp: number }[];
}

const EtpChart = ({ results }: EtpChartProps) => {
    if (results.length === 0) return null;

    const data = results.slice(0, 10).reverse();
    const etpValues = data.map((r) => r.etp);
    const maxEtp = Math.max(...etpValues);
    const minEtp = Math.min(...etpValues);
    const range = maxEtp - minEtp || 10;

    const getHeight = (etp: number) => {
        return 20 + ((maxEtp - etp) / range) * 60;
    };

    return (
        <View style={chartStyles.container}>
            <Text style={chartStyles.title}>📈 eTP推移</Text>
            <View style={chartStyles.chartArea}>
                <View style={chartStyles.yAxis}>
                    <Text style={chartStyles.yLabel}>{formatKmPace(minEtp)}</Text>
                    <Text style={chartStyles.yLabelCenter}>速い</Text>
                    <Text style={chartStyles.yLabel}>{formatKmPace(maxEtp)}</Text>
                </View>
                <View style={chartStyles.chart}>
                    {data.map((item) => {
                        const height = getHeight(item.etp);
                        const date = new Date(item.date);
                        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                        return (
                            <View key={item.date} style={chartStyles.barContainer}>
                                <View style={chartStyles.barWrapper}>
                                    <LinearGradient
                                        colors={['#3B82F6', '#8B5CF6']}
                                        style={[chartStyles.bar, { height: `${100 - height}%` }]}
                                    />
                                </View>
                                <Text style={chartStyles.barLabel}>{dateStr}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const chartStyles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    chartArea: {
        flexDirection: 'row',
        height: 120,
    },
    yAxis: {
        width: 45,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 8,
        paddingBottom: 20,
    },
    yLabel: {
        color: '#6b7280',
        fontSize: 9,
    },
    yLabelCenter: {
        color: '#9ca3af',
        fontSize: 10,
    },
    chart: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        paddingBottom: 20,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        width: '100%',
        height: 80,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        color: '#6b7280',
        fontSize: 8,
        marginTop: 4,
    },
});

// ============================================
// メインコンポーネント
// ============================================

export default function ProfileScreen() {
    const router = useRouter();
    const user = useUser();
    const isAuthenticated = useIsAuthenticated();
    const signOut = useAuthStore((state) => state.signOut);
    const profile = useProfile();
    const testResults = useTestResults();
    const currentEtp = useCurrentEtp();
    const currentLimiter = useCurrentLimiter();
    const clearTestResults = useAppStore((state) => state.clearTestResults);
    const deleteTestResult = useAppStore((state) => state.deleteTestResult);
    const resetOnboarding = useAppStore((state) => state.resetOnboarding);
    const isPremium = useIsPremium();
    const setProfile = useAppStore((state) => state.setProfile);
    const workoutLogs = useAppStore((state) => state.workoutLogs);

    // 認証フォーム状態
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // プロフィール編集
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(profile?.displayName || '');
    const [showProfileEditModal, setShowProfileEditModal] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState(profile.displayName || '');
    const [editAgeCategory, setEditAgeCategory] = useState<'junior' | 'youth' | 'senior' | 'master'>(profile.ageCategory);
    const [editExperience, setEditExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>(profile.experience);
    const [editLimiterType, setEditLimiterType] = useState<LimiterType>(profile.selfReportedLimiter ?? 'balanced');
    const [editRestDays, setEditRestDays] = useState<number[]>(profile.restDays || [0, 4]);

    // 画像選択
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfile({ ...profile, avatarUri: result.assets[0].uri });
        }
    };

    const saveName = () => {
        if (tempName.trim()) {
            setProfile({ ...profile, displayName: tempName.trim() });
        }
        setEditingName(false);
    };

    // 展開セクション
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // デフォルト値
    const etp = currentEtp ?? 95;
    const limiterType: LimiterType = currentLimiter ?? 'balanced';
    const limiter = LIMITER_CONFIG[limiterType];
    const hasTestResult = currentEtp !== null;

    // 計算
    const vo2max = estimateVO2max(etp);
    const level = getLevelFromEtp(etp);
    const zonesData = calculateZones(etp, limiterType);
    const zones = (Object.entries(ZONE_COEFFICIENTS) as [ZoneKey, { name: string; color: string }][]).map(
        ([key, config]) => ({
            key,
            name: config.name,
            color: config.color,
            pace400m: zonesData[key],
        })
    );

    // レース予測
    const racePredictions = [
        { distance: 800, label: '800m', laps: 2, coef: 0.835 },
        { distance: 1500, label: '1500m', laps: 3.75, coef: 0.90 },
        { distance: 3000, label: '3000m', laps: 7.5, coef: 0.98 },
        { distance: 5000, label: '5000m', laps: 12.5, coef: 1.02 },
    ].map(race => {
        const limiterAdj = LIMITER_RACE_ADJUSTMENTS[`m${race.distance}` as keyof typeof LIMITER_RACE_ADJUSTMENTS]?.[limiterType] || 0;
        const predictedTime = Math.round(etp * race.coef * race.laps + limiterAdj);
        return {
            ...race,
            time: predictedTime,
            formatted: formatTime(predictedTime),
        };
    });

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
                Alert.alert('確認メール送信', '確認メールを送信しました。');
            } else {
                await signInWithEmail(email, password);
            }
            setShowAuthForm(false);
            setEmail(''); setPassword('');
        } catch (error: any) {
            Alert.alert('エラー', error.message || '認証に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert('ログアウト', 'ログアウトしますか？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: 'ログアウト',
                style: 'destructive',
                onPress: async () => { try { await signOut(); } catch (e: any) { Alert.alert('エラー', e.message); } },
            },
        ]);
    };

    const handleClearData = () => {
        Alert.alert('データ削除', 'すべてのテスト結果を削除しますか？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: '削除',
                style: 'destructive',
                onPress: () => { clearTestResults(); Alert.alert('完了', 'データを削除しました'); },
            },
        ]);
    };

    // ============================================
    // 認証フォーム
    // ============================================
    if (showAuthForm) {
        const handleAppleSignIn = async () => {
            setLoading(true);
            try {
                const { signInWithApple } = await import('../../services/auth');
                await signInWithApple();
                setShowAuthForm(false);
            } catch (error: any) {
                if (error.code !== 'ERR_REQUEST_CANCELED') {
                    Alert.alert('エラー', error.message || 'Appleサインインに失敗しました');
                }
            } finally {
                setLoading(false);
            }
        };

        const handleGoogleSignIn = async () => {
            setLoading(true);
            try {
                const { signInWithGoogle } = await import('../../services/auth');
                await signInWithGoogle();
                // OAuth redirect will handle the rest
            } catch (error: any) {
                Alert.alert('エラー', error.message || 'Googleサインインに失敗しました');
            } finally {
                setLoading(false);
            }
        };

        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <TouchableOpacity onPress={() => setShowAuthForm(false)} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← 戻る</Text>
                        </TouchableOpacity>
                        <View style={styles.authContent}>
                            <Text style={styles.authTitle}>{isSignUp ? 'アカウント作成' : 'ログイン'}</Text>

                            {/* ソーシャルログイン */}
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={handleAppleSignIn}
                                    disabled={loading}
                                >
                                    <Text style={styles.socialButtonIcon}></Text>
                                    <Text style={styles.socialButtonText}>Appleでサインイン</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.socialButton, { backgroundColor: '#fff' }]}
                                onPress={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <Text style={styles.socialButtonIcon}>G</Text>
                                <Text style={[styles.socialButtonText, { color: '#333' }]}>Googleでサインイン</Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>または</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* メール認証 */}
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
                            <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
                                <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.authButtonGradient}>
                                    <Text style={styles.authButtonText}>{loading ? '処理中...' : isSignUp ? '登録' : 'ログイン'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchAuth}>
                                <Text style={styles.switchAuthText}>
                                    {isSignUp ? 'アカウントをお持ちの方' : '新規登録はこちら'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // ============================================
    // メイン画面
    // ============================================
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* プロフィールヘッダー */}
                <View style={styles.profileHeader}>
                    {/* アバター */}
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {profile?.avatarUri ? (
                            <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: `${limiter.color}30`, borderColor: limiter.color }]}>
                                <Text style={styles.avatarPlaceholderText}>📷</Text>
                            </View>
                        )}
                        <View style={styles.avatarEditBadge}>
                            <Text style={styles.avatarEditIcon}>✏️</Text>
                        </View>
                    </TouchableOpacity>
                    {/* 名前 */}
                    <View style={styles.profileInfo}>
                        {editingName ? (
                            <View style={styles.nameEditRow}>
                                <TextInput
                                    style={styles.nameInput}
                                    value={tempName}
                                    onChangeText={setTempName}
                                    placeholder="名前を入力"
                                    placeholderTextColor="#6b7280"
                                    autoFocus
                                    onBlur={saveName}
                                    onSubmitEditing={saveName}
                                />
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => { setTempName(profile?.displayName || ''); setEditingName(true); }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.profileName}>{profile?.displayName || 'ランナー'}</Text>
                                    <Text style={styles.editIcon}>✏️</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <Text style={styles.profileBadge}>{limiter.icon} {limiter.name}</Text>
                            <PremiumBadge />
                        </View>
                    </View>
                </View>

                {/* eTPステータス（コンパクト横並び） */}
                <View style={[styles.etpCompactContainer, { borderColor: `${limiter.color}30` }]}>
                    {/* 左: メインeTP */}
                    <View style={styles.etpCompactMain}>
                        <View style={[
                            styles.etpCompactCircle,
                            { borderColor: limiter.color, backgroundColor: `${limiter.color}20`, shadowColor: limiter.color }
                        ]}>
                            <Text style={styles.etpCompactValue}>{etp}</Text>
                        </View>
                        <View style={styles.etpCompactInfo}>
                            <Text style={styles.etpCompactLabel}>{hasTestResult ? 'eTP' : '推定eTP'}</Text>
                            <Text style={styles.etpCompactPace}>{formatKmPace(etp)}</Text>
                        </View>
                    </View>
                    {/* 右: サブ指標 */}
                    <View style={styles.etpCompactSubs}>
                        <View style={styles.etpCompactSubItem}>
                            <Text style={styles.etpCompactSubValue}>{level ?? '-'}</Text>
                            <Text style={styles.etpCompactSubLabel}>Lv</Text>
                        </View>
                        <View style={styles.etpCompactSubItem}>
                            <Text style={styles.etpCompactSubValue}>{vo2max ?? '-'}</Text>
                            <Text style={styles.etpCompactSubLabel}>VO2</Text>
                        </View>
                        <View style={styles.etpCompactSubItem}>
                            <Text style={[styles.etpCompactSubValue, { color: limiter.color }]}>{limiter.icon}</Text>
                            <Text style={styles.etpCompactSubLabel}>タイプ</Text>
                        </View>
                    </View>
                </View>

                {/* RISEテストCTA */}
                <TouchableOpacity style={styles.testCta} onPress={() => router.push('/test')}>
                    <Text style={styles.testCtaIcon}>🏃</Text>
                    <View style={styles.testCtaText}>
                        <Text style={styles.testCtaTitle}>テストを実施</Text>
                        <Text style={styles.testCtaDesc}>eTPとリミッターを測定</Text>
                    </View>
                    <Text style={styles.testCtaArrow}>→</Text>
                </TouchableOpacity>

                {/* eTP推移グラフ */}
                {testResults.length >= 2 && (
                    <EtpChart results={testResults.map((r) => ({ date: r.date, etp: r.etp }))} />
                )}

                {/* プレミアムアップグレードCTA */}
                {!isPremium && (
                    <TouchableOpacity
                        style={[styles.testCta, { borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
                        onPress={() => router.push('/upgrade')}
                    >
                        <Text style={styles.testCtaIcon}>👑</Text>
                        <View style={styles.testCtaText}>
                            <Text style={styles.testCtaTitle}>プレミアムにアップグレード</Text>
                            <Text style={styles.testCtaDesc}>すべての機能をアンロック</Text>
                        </View>
                        <Text style={[styles.testCtaArrow, { color: '#F59E0B' }]}>→</Text>
                    </TouchableOpacity>
                )}

                {/* ワークアウト履歴（折りたたみ） */}
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setExpandedSection(expandedSection === 'workouts' ? null : 'workouts')}
                >
                    <Text style={styles.sectionTitle}>🏃 ワークアウト履歴</Text>
                    <Text style={styles.expandIcon}>{expandedSection === 'workouts' ? '−' : '+'}</Text>
                </TouchableOpacity>
                {expandedSection === 'workouts' && (
                    <View style={styles.workoutHistoryContainer}>
                        {workoutLogs.length === 0 ? (
                            <Text style={styles.emptyText}>まだワークアウトの記録がありません</Text>
                        ) : (
                            [...workoutLogs]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 10)
                                .map((log) => (
                                    <View key={log.id} style={styles.workoutHistoryItem}>
                                        <View style={styles.workoutHistoryHeader}>
                                            <Text style={styles.workoutHistoryName}>{log.workoutName}</Text>
                                            <Text style={styles.workoutHistoryDate}>
                                                {new Date(log.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                            </Text>
                                        </View>
                                        <View style={styles.workoutHistoryStats}>
                                            {log.actualDistance && (
                                                <Text style={styles.workoutHistoryStat}>📏 {log.actualDistance}km</Text>
                                            )}
                                            {log.actualDuration && (
                                                <Text style={styles.workoutHistoryStat}>⏱️ {log.actualDuration}分</Text>
                                            )}
                                            {log.completed && (
                                                <Text style={[styles.workoutHistoryStat, { color: '#22c55e' }]}>✅</Text>
                                            )}
                                        </View>
                                        {log.notes && (
                                            <Text style={styles.workoutHistoryNotes}>{log.notes}</Text>
                                        )}
                                    </View>
                                ))
                        )}
                    </View>
                )}

                {/* プロフィール編集（折りたたみ） */}
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
                >
                    <Text style={styles.sectionTitle}>👤 プロフィール設定</Text>
                    <Text style={styles.expandIcon}>{expandedSection === 'profile' ? '−' : '+'}</Text>
                </TouchableOpacity>
                {expandedSection === 'profile' && (
                    <View style={styles.profileEditContainer}>
                        <View style={styles.profileRow}>
                            <Text style={styles.profileLabel}>年齢カテゴリ</Text>
                            <Text style={styles.profileValue}>
                                {profile.ageCategory === 'junior' ? '中学生' :
                                    profile.ageCategory === 'youth' ? '高校生・大学生' :
                                        profile.ageCategory === 'senior' ? '一般' : 'マスターズ'}
                            </Text>
                        </View>
                        <View style={styles.profileRow}>
                            <Text style={styles.profileLabel}>走歴・経験</Text>
                            <Text style={styles.profileValue}>
                                {profile.experience === 'beginner' ? '初心者' :
                                    profile.experience === 'intermediate' ? '中級者' :
                                        profile.experience === 'advanced' ? '上級者' : 'エリート'}
                            </Text>
                        </View>
                        <View style={styles.profileRow}>
                            <Text style={styles.profileLabel}>自己申告タイプ</Text>
                            <Text style={[styles.profileValue, { color: LIMITER_CONFIG[profile.selfReportedLimiter ?? 'balanced'].color }]}>
                                {LIMITER_CONFIG[profile.selfReportedLimiter ?? 'balanced'].icon}{' '}
                                {LIMITER_CONFIG[profile.selfReportedLimiter ?? 'balanced'].name}
                            </Text>
                        </View>
                        {profile.pbs?.m1500 && (
                            <View style={styles.profileRow}>
                                <Text style={styles.profileLabel}>1500m PB</Text>
                                <Text style={styles.profileValue}>{formatTime(profile.pbs.m1500)}</Text>
                            </View>
                        )}
                        {/* 休養日表示 */}
                        <View style={styles.profileRow}>
                            <Text style={styles.profileLabel}>休養日</Text>
                            <Text style={styles.profileValue}>
                                {(profile.restDays || []).map(d => ['月', '火', '水', '木', '金', '土', '日'][d]).join('・') || '未設定'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editProfileButton}
                            onPress={() => {
                                setEditDisplayName(profile.displayName || '');
                                setEditAgeCategory(profile.ageCategory);
                                setEditExperience(profile.experience);
                                setEditLimiterType(profile.selfReportedLimiter ?? 'balanced');
                                setEditRestDays(profile.restDays || [0, 4]);
                                setShowProfileEditModal(true);
                            }}
                        >
                            <Text style={styles.editProfileButtonText}>編集する</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* テスト履歴（折りたたみ） */}
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setExpandedSection(expandedSection === 'history' ? null : 'history')}
                >
                    <Text style={styles.sectionTitle}>📋 テスト履歴 ({testResults.length}件)</Text>
                    <Text style={styles.expandIcon}>{expandedSection === 'history' ? '−' : '+'}</Text>
                </TouchableOpacity>
                {expandedSection === 'history' && (
                    <View style={styles.historyContainer}>
                        {testResults.length === 0 ? (
                            <Text style={styles.emptyText}>まだテスト結果がありません</Text>
                        ) : (
                            testResults.slice(0, 5).map((result) => {
                                const date = new Date(result.date);
                                const lim = LIMITER_CONFIG[result.limiterType as keyof typeof LIMITER_CONFIG];
                                return (
                                    <View key={result.id} style={styles.historyItem}>
                                        <Text style={styles.historyDate}>{date.getMonth() + 1}/{date.getDate()}</Text>
                                        <Text style={styles.historyEtp}>{result.etp}秒</Text>
                                        <Text style={styles.historyLimiter}>{lim?.icon}</Text>
                                        <TouchableOpacity onPress={() => deleteTestResult(result.id)}>
                                            <Text style={styles.deleteBtn}>削除</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {/* アカウント */}
                <View style={styles.accountSection}>
                    <Text style={styles.accountTitle}>アカウント</Text>
                    {isAuthenticated ? (
                        <>
                            <Text style={styles.accountEmail}>{user?.email}</Text>
                            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                                <Text style={styles.signOutText}>ログアウト</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.signOutButton, { marginTop: 10, backgroundColor: 'rgba(239,68,68,0.2)' }]}
                                onPress={() => {
                                    Alert.alert(
                                        'アカウント削除',
                                        'アカウントを削除すると、すべてのデータが失われます。この操作は取り消せません。',
                                        [
                                            { text: 'キャンセル', style: 'cancel' },
                                            {
                                                text: '削除する',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        const { deleteAccount } = await import('../../services/auth');
                                                        // ローカルデータも削除
                                                        clearTestResults();
                                                        resetOnboarding();
                                                        const result = await deleteAccount();
                                                        if (result.complete) {
                                                            Alert.alert('完了', 'アカウントを完全に削除しました。同じメールで再登録できます。');
                                                        } else {
                                                            Alert.alert('完了', 'ローカルデータを削除しログアウトしました。\n\n完全削除にはEdge Functionのデプロイが必要です。');
                                                        }
                                                    } catch (error: any) {
                                                        Alert.alert('エラー', error.message || '削除に失敗しました');
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                }}
                            >
                                <Text style={[styles.signOutText, { color: '#ef4444' }]}>アカウントを削除</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.loginButton} onPress={() => setShowAuthForm(true)}>
                            <Text style={styles.loginButtonText}>ログイン / 新規登録</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* データ管理 */}
                <View style={styles.dangerSection}>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
                        <Text style={styles.dangerButtonText}>🗑️ テストデータを削除</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dangerButton} onPress={() => {
                        Alert.alert('オンボーディング', 'オンボーディングをやり直しますか？', [
                            { text: 'キャンセル', style: 'cancel' },
                            { text: 'やり直す', onPress: () => { resetOnboarding(); router.replace('/onboarding'); } },
                        ]);
                    }}>
                        <Text style={styles.dangerButtonText}>🔄 初期設定をやり直す</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* プロフィール編集モーダル */}
            <Modal
                visible={showProfileEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowProfileEditModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#0a0a0f', padding: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <TouchableOpacity onPress={() => setShowProfileEditModal(false)}>
                            <Text style={{ color: '#6b7280', fontSize: 16 }}>キャンセル</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>プロフィール編集</Text>
                        <TouchableOpacity onPress={() => {
                            setProfile({ displayName: editDisplayName.trim() || 'ゲスト', ageCategory: editAgeCategory, experience: editExperience, selfReportedLimiter: editLimiterType, restDays: editRestDays });
                            setShowProfileEditModal(false);
                        }}>
                            <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '600' }}>保存</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        {/* ニックネーム */}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>ニックネーム</Text>
                        <TextInput
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                color: '#ffffff',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                marginBottom: 24,
                            }}
                            value={editDisplayName}
                            onChangeText={setEditDisplayName}
                            placeholder="ニックネームを入力"
                            placeholderTextColor="#6b7280"
                        />

                        {/* 年齢カテゴリ */}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>年齢カテゴリ</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {[
                                { key: 'junior' as const, label: '中学生' },
                                { key: 'youth' as const, label: '高校生・大学生' },
                                { key: 'senior' as const, label: '一般' },
                                { key: 'master' as const, label: 'マスターズ' },
                            ].map((cat) => (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={{
                                        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
                                        backgroundColor: editAgeCategory === cat.key ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        borderWidth: 1, borderColor: editAgeCategory === cat.key ? '#3B82F6' : 'transparent',
                                    }}
                                    onPress={() => setEditAgeCategory(cat.key)}
                                >
                                    <Text style={{ color: editAgeCategory === cat.key ? '#3B82F6' : '#9ca3af' }}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 経験レベル */}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>走歴・経験</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {[
                                { key: 'beginner' as const, label: '初心者' },
                                { key: 'intermediate' as const, label: '中級者' },
                                { key: 'advanced' as const, label: '上級者' },
                                { key: 'elite' as const, label: 'エリート' },
                            ].map((exp) => (
                                <TouchableOpacity
                                    key={exp.key}
                                    style={{
                                        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
                                        backgroundColor: editExperience === exp.key ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        borderWidth: 1, borderColor: editExperience === exp.key ? '#3B82F6' : 'transparent',
                                    }}
                                    onPress={() => setEditExperience(exp.key)}
                                >
                                    <Text style={{ color: editExperience === exp.key ? '#3B82F6' : '#9ca3af' }}>{exp.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* タイプ */}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>自分のタイプ</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {[
                                { key: 'cardio' as const, label: '心肺型' },
                                { key: 'muscular' as const, label: '筋持久力型' },
                                { key: 'balanced' as const, label: 'バランス型' },
                            ].map((type) => {
                                const config = LIMITER_CONFIG[type.key];
                                return (
                                    <TouchableOpacity
                                        key={type.key}
                                        style={{
                                            paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
                                            backgroundColor: editLimiterType === type.key ? config.color + '20' : 'rgba(255,255,255,0.05)',
                                            borderWidth: 1, borderColor: editLimiterType === type.key ? config.color : 'transparent',
                                        }}
                                        onPress={() => setEditLimiterType(type.key)}
                                    >
                                        <Text style={{ color: editLimiterType === type.key ? config.color : '#9ca3af' }}>
                                            {config.icon} {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* 休養日 */}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>休養日</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {['月', '火', '水', '木', '金', '土', '日'].map((dayName, idx) => {
                                const isRestDay = editRestDays.includes(idx);
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={{
                                            paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
                                            backgroundColor: isRestDay ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                            borderWidth: 1, borderColor: isRestDay ? '#EF4444' : 'transparent',
                                        }}
                                        onPress={() => {
                                            if (isRestDay) {
                                                setEditRestDays(editRestDays.filter(d => d !== idx));
                                            } else {
                                                setEditRestDays([...editRestDays, idx]);
                                            }
                                        }}
                                    >
                                        <Text style={{ color: isRestDay ? '#EF4444' : '#9ca3af', fontWeight: '600' }}>
                                            {dayName}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ============================================
// スタイル
// ============================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0f' },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    header: { marginTop: 20, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },

    // プロフィールヘッダー
    profileHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 72, height: 72, borderRadius: 36 },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    avatarPlaceholderText: { fontSize: 28 },
    avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3B82F6' },
    avatarEditIcon: { fontSize: 12 },
    profileInfo: { marginLeft: 16, flex: 1 },
    profileName: { fontSize: 22, fontWeight: '700', color: '#fff' },
    editIcon: { fontSize: 14, opacity: 0.5 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center' },
    nameInput: { fontSize: 20, fontWeight: '600', color: '#fff', borderBottomWidth: 1, borderBottomColor: '#3B82F6', paddingVertical: 4, minWidth: 150 },
    profileBadge: { color: '#9ca3af', fontSize: 13 },

    // eTPコンパクト横並びレイアウト
    etpCompactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    etpCompactMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    etpCompactCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    etpCompactValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
    etpCompactInfo: { marginLeft: 12 },
    etpCompactLabel: { color: '#9ca3af', fontSize: 12 },
    etpCompactPace: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
    etpCompactSubs: {
        flexDirection: 'row',
        gap: 16,
    },
    etpCompactSubItem: { alignItems: 'center' },
    etpCompactSubValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
    etpCompactSubLabel: { color: '#6b7280', fontSize: 10, marginTop: 2 },

    // テストCTA
    testCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
    testCtaIcon: { fontSize: 28, marginRight: 12 },
    testCtaText: { flex: 1 },
    testCtaTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
    testCtaDesc: { color: '#6b7280', fontSize: 12, marginTop: 2 },
    testCtaArrow: { color: '#3B82F6', fontSize: 20 },

    // セクション
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
    expandIcon: { color: '#6b7280', fontSize: 18 },

    // ゾーン
    zonesContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 12 },
    zoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    zoneIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    zoneName: { flex: 1, color: '#fff', fontSize: 13 },
    zonePace: { color: '#9ca3af', fontSize: 12 },

    // レース予測
    predictionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    predictionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, width: '48%', alignItems: 'center' },
    predictionDistance: { color: '#9ca3af', fontSize: 12 },
    predictionTime: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4 },

    // 履歴
    historyContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 12 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    historyDate: { color: '#6b7280', fontSize: 12, width: 50 },
    historyEtp: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
    historyLimiter: { fontSize: 16, marginRight: 12 },
    deleteBtn: { color: '#ef4444', fontSize: 12 },
    emptyText: { color: '#6b7280', fontSize: 13, textAlign: 'center', paddingVertical: 16 },

    // アカウント
    accountSection: { marginTop: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 },
    accountTitle: { color: '#9ca3af', fontSize: 12, marginBottom: 8 },
    accountEmail: { color: '#fff', fontSize: 14, marginBottom: 12 },
    signOutButton: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    signOutText: { color: '#ef4444', fontSize: 14 },
    loginButton: { backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    loginButtonText: { color: '#3B82F6', fontSize: 14, fontWeight: '500' },

    // プロフィール編集
    profileEditContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 12 },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    profileLabel: { color: '#6b7280', fontSize: 13 },
    profileValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
    editProfileButton: { marginTop: 12, backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    editProfileButtonText: { color: '#3B82F6', fontSize: 14, fontWeight: '500' },

    // データ管理
    dangerSection: { marginTop: 20, gap: 10 },
    dangerButton: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    dangerButtonText: { color: '#9ca3af', fontSize: 13 },

    // ワークアウト履歴
    workoutHistoryContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 12 },
    workoutHistoryItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    workoutHistoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    workoutHistoryName: { color: '#fff', fontSize: 15, fontWeight: '600' },
    workoutHistoryDate: { color: '#6b7280', fontSize: 12 },
    workoutHistoryStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
    workoutHistoryStat: { color: '#9ca3af', fontSize: 13 },
    workoutHistoryNotes: { color: '#6b7280', fontSize: 12, marginTop: 6, fontStyle: 'italic' },

    bottomSpacer: { height: 40 },

    // 認証フォーム
    backButton: { marginTop: 20, marginBottom: 20 },
    backButtonText: { color: '#3B82F6', fontSize: 16 },
    authContent: { paddingVertical: 20 },
    authTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15 },
    authButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
    authButtonGradient: { paddingVertical: 14, alignItems: 'center' },
    authButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchAuth: { marginTop: 20, alignItems: 'center' },
    switchAuthText: { color: '#3B82F6', fontSize: 14 },

    // ソーシャルログイン
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 12, paddingVertical: 14, marginBottom: 12 },
    socialButtonIcon: { fontSize: 18, marginRight: 8, color: '#fff' },
    socialButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { color: '#6b7280', fontSize: 13, marginHorizontal: 12 },
});
