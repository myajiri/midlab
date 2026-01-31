// ============================================
// Zone2Peak デザイントークン
// 全コンポーネントで統一されたデザイン定義
// ============================================

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// カラーパレット
// ============================================

export const COLORS = {
    // 背景
    background: {
        primary: '#0a0a0f',
        elevated: '#12121a',
        card: 'rgba(255, 255, 255, 0.04)',
        cardHover: 'rgba(255, 255, 255, 0.08)',
        cardHighlight: 'rgba(255, 255, 255, 0.12)',
    },

    // テキスト
    text: {
        primary: '#ffffff',
        secondary: '#9ca3af',
        tertiary: '#6b7280',
        muted: '#4b5563',
    },

    // アクセント
    accent: {
        primary: '#6366F1',      // Indigo - メインアクション
        secondary: '#8B5CF6',    // Violet - セカンダリ
        success: '#22C55E',      // Green - 成功
        warning: '#F59E0B',      // Amber - 警告
        error: '#EF4444',        // Red - エラー
        info: '#3B82F6',         // Blue - 情報
    },

    // グラデーション
    gradient: {
        primary: ['#6366F1', '#8B5CF6'],
        secondary: ['#3B82F6', '#6366F1'],
        success: ['#22C55E', '#10B981'],
        warning: ['#F59E0B', '#F97316'],
    },

    // リミッター別テーマ
    limiter: {
        cardio: {
            primary: '#3B82F6',
            light: 'rgba(59, 130, 246, 0.15)',
            border: 'rgba(59, 130, 246, 0.3)',
        },
        muscular: {
            primary: '#EF4444',
            light: 'rgba(239, 68, 68, 0.15)',
            border: 'rgba(239, 68, 68, 0.3)',
        },
        balanced: {
            primary: '#22C55E',
            light: 'rgba(34, 197, 94, 0.15)',
            border: 'rgba(34, 197, 94, 0.3)',
        },
    },

    // ゾーン別カラー
    zone: {
        jog: '#9CA3AF',
        easy: '#3B82F6',
        marathon: '#22C55E',
        threshold: '#EAB308',
        interval: '#F97316',
        rep: '#EF4444',
    },

    // ボーダー
    border: {
        subtle: 'rgba(255, 255, 255, 0.08)',
        medium: 'rgba(255, 255, 255, 0.12)',
        strong: 'rgba(255, 255, 255, 0.20)',
    },
};

// ============================================
// スペーシング
// ============================================

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// ============================================
// ボーダーラジウス
// ============================================

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

// ============================================
// タイポグラフィ
// ============================================

export const TYPOGRAPHY = {
    // 見出し
    h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
    h2: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },

    // 数値表示
    display: { fontSize: 48, fontWeight: '800' as const },
    stat: { fontSize: 28, fontWeight: '700' as const },
    statSmall: { fontSize: 20, fontWeight: '600' as const },

    // 本文
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },

    // ラベル
    label: { fontSize: 13, fontWeight: '500' as const },
    labelSmall: { fontSize: 11, fontWeight: '500' as const },

    // キャプション
    caption: { fontSize: 12, fontWeight: '400' as const },
    captionSmall: { fontSize: 10, fontWeight: '400' as const },
};

// ============================================
// シャドウ（iOS用）
// ============================================

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    }),
};

// ============================================
// 共通スタイル
// ============================================

export const COMMON_STYLES = {
    // カード
    card: {
        backgroundColor: COLORS.background.card,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border.subtle,
    },

    // セクションタイトル
    sectionTitle: {
        ...TYPOGRAPHY.label,
        color: COLORS.text.secondary,
        marginBottom: SPACING.md,
    },

    // ボタン（プライマリ）
    buttonPrimary: {
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.lg,
        alignItems: 'center' as const,
    },

    // 画面コンテナ
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },

    // スクロールビュー
    scrollView: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
    },
};

// ============================================
// 画面サイズ定義
// ============================================

export const SCREEN = {
    width: SCREEN_WIDTH,
    isSmall: SCREEN_WIDTH < 375,
    padding: SPACING.xl,
};
