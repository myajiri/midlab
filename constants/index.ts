// ============================================
// Zone2Peak 定数定義
// rise-test/src/App.jsx から移植
// ============================================

// テストレベル設定
export const LEVELS = {
    SS: { name: 'SS', description: '1500m 3:30以内', startPace: 76, maxLaps: 6 },
    S: { name: 'S', description: '1500m 3:30-4:00', startPace: 88, maxLaps: 8 },
    A: { name: 'A', description: '1500m 4:00-4:30', startPace: 96, maxLaps: 10 },
    B: { name: 'B', description: '1500m 4:30-5:00', startPace: 108, maxLaps: 10 },
    C: { name: 'C', description: '1500m 5:00-5:30', startPace: 120, maxLaps: 10 },
} as const;

export type LevelKey = keyof typeof LEVELS;

// ペース増分（毎周回4秒ずつ速くなる）
export const PACE_INCREMENT = 4;

// eTP係数（LCP × 1.12）
export const ETP_COEFFICIENT = 1.12;

// 6ゾーン定義（v3.0）
export const ZONE_COEFFICIENTS = {
    jog: { coef: 1.40, name: 'Recovery', color: '#9CA3AF' },
    easy: { coef: 1.275, name: 'Easy', color: '#3B82F6' },
    marathon: { coef: 1.125, name: 'Marathon', color: '#22C55E' },
    threshold: { coef: 1.025, name: 'Threshold', color: '#EAB308' },
    interval: { coef: 0.945, name: 'Interval', color: '#F97316' },
    repetition: { coef: 0.875, name: 'Rep', color: '#EF4444' },
} as const;

export type ZoneKey = keyof typeof ZONE_COEFFICIENTS;

// リミッター別ゾーン調整
export const LIMITER_ZONE_ADJUSTMENTS = {
    cardio: { jog: 0, easy: +0.05, marathon: +0.03, threshold: +0.02, interval: +0.03, repetition: +0.03 },
    muscular: { jog: +0.05, easy: +0.08, marathon: +0.06, threshold: +0.04, interval: +0.03, repetition: -0.02 },
    balanced: { jog: 0, easy: 0, marathon: 0, threshold: 0, interval: 0, repetition: 0 },
} as const;

// リミッタータイプ設定
export const LIMITER_CONFIG = {
    cardio: { icon: '🫁', name: '心肺リミッター型', color: '#3B82F6', description: '有酸素能力が高く、スピードが課題' },
    muscular: { icon: '🦵', name: '筋持久力リミッター型', color: '#F97316', description: 'スピードがあり、有酸素能力が課題' },
    balanced: { icon: '⚖️', name: 'バランス型', color: '#8B5CF6', description: '両方のシステムが均等に発達' },
} as const;

export type LimiterType = keyof typeof LIMITER_CONFIG;

// レース予測係数
export const RACE_COEFFICIENTS = {
    m800: { min: 0.82, max: 0.85, laps: 2 },
    m1500: { min: 0.88, max: 0.92, laps: 3.75 },
    m3000: { min: 0.96, max: 1.00, laps: 7.5 },
    m5000: { min: 1.00, max: 1.04, laps: 12.5 },
} as const;

// リミッター別レース予測調整（秒）
export const LIMITER_RACE_ADJUSTMENTS = {
    m800: { cardio: -3, muscular: 3, balanced: 0 },
    m1500: { cardio: 1.5, muscular: -1.5, balanced: 0 },
    m3000: { cardio: 11.5, muscular: -11.5, balanced: 0 },
    m5000: { cardio: 27.5, muscular: -27.5, balanced: 0 },
} as const;

// 年齢カテゴリ設定
export const AGE_CATEGORY_CONFIG = {
    junior_high: { label: '中学生', etpAdj: 0, levelAdj: -1 },
    high_school: { label: '高校生', etpAdj: 0, levelAdj: 0 },
    collegiate: { label: '大学生', etpAdj: 0, levelAdj: 0 },
    senior: { label: '一般', etpAdj: 0, levelAdj: 0 },
    masters_40: { label: 'マスターズ40代', etpAdj: 2, levelAdj: 0 },
    masters_50: { label: 'マスターズ50代', etpAdj: 4, levelAdj: -1 },
    masters_60: { label: 'マスターズ60歳以上', etpAdj: 6, levelAdj: -1 },
} as const;

// 経験レベル設定
export const EXPERIENCE_CONFIG = {
    beginner: { label: '初心者', etpAdj: 3, levelAdj: -1 },
    intermediate: { label: '中級者', etpAdj: 1, levelAdj: 0 },
    advanced: { label: '上級者', etpAdj: 0, levelAdj: 0 },
    elite: { label: 'エリート', etpAdj: -1, levelAdj: 0 },
} as const;

// ストレージキー
export const STORAGE_KEYS = {
    profile: 'zone2peak_profile',
    testResults: 'zone2peak_results',
    settings: 'zone2peak_settings',
} as const;

// ============================================
// 計画関連定数（rise-test互換）
// ============================================

// 生理学的焦点カテゴリ（アイコン付き）
export const PHYSIOLOGICAL_FOCUS_CATEGORIES = {
    aerobic: {
        name: '有酸素ベース',
        menuCategory: '有酸素ベース',
        icon: '🫀',
        color: '#3B82F6',
        description: '毛細血管発達・ミトコンドリア増加',
    },
    threshold: {
        name: '乳酸閾値',
        menuCategory: '乳酸閾値',
        icon: '💪',
        color: '#EAB308',
        description: '乳酸処理能力の向上',
    },
    vo2max: {
        name: 'VO2max',
        menuCategory: 'VO2max',
        icon: '🔥',
        color: '#F97316',
        description: '最大酸素摂取量の向上',
    },
    speed: {
        name: '神経筋系',
        menuCategory: '神経筋系',
        icon: '⚡',
        color: '#EF4444',
        description: '神経筋協調性・ランニングエコノミー',
    },
} as const;

export type FocusKey = keyof typeof PHYSIOLOGICAL_FOCUS_CATEGORIES;

// フェーズ設定
export const PHASE_CONFIG = {
    base: { name: '基礎期', color: '#3B82F6', loadRange: [100, 100] },
    build: { name: '強化期', color: '#F97316', loadRange: [110, 120] },
    peak: { name: '試合期', color: '#EF4444', loadRange: [90, 100] },
    taper: { name: 'テーパー', color: '#A855F7', loadRange: [50, 70] },
} as const;

export type PhaseType = keyof typeof PHASE_CONFIG;

// 準備期間別の期分け配分
export const PHASE_DISTRIBUTION = {
    long: {     // 16週以上
        base: { weeks: [4, 6] },
        build: { weeks: [6, 8] },
        peak: { weeks: [3, 4] },
        taper: { weeks: [2, 3] },
    },
    medium: {   // 10-15週
        base: { weeks: [3, 4] },
        build: { weeks: [4, 6] },
        peak: { weeks: [2, 3] },
        taper: { weeks: [1, 2] },
    },
    short: {    // 6-9週
        base: { weeks: [2, 2] },
        build: { weeks: [3, 4] },
        peak: { weeks: [1, 2] },
        taper: { weeks: [1, 1] },
    },
    minimal: {  // 5週以下
        base: { weeks: [1, 1] },
        build: { weeks: [2, 2] },
        peak: { weeks: [1, 1] },
        taper: { weeks: [1, 1] },
    },
} as const;

// フェーズ × リミッター別の負荷配分（%）
export const DISTRIBUTION_BY_LIMITER = {
    base: {
        cardio: { easy: 60, threshold: 25, vo2max: 10, speed: 5 },
        muscular: { easy: 55, threshold: 25, vo2max: 10, speed: 10 },
        balanced: { easy: 58, threshold: 25, vo2max: 10, speed: 7 },
    },
    build: {
        cardio: { easy: 40, threshold: 20, vo2max: 30, speed: 10 },
        muscular: { easy: 40, threshold: 20, vo2max: 15, speed: 25 },
        balanced: { easy: 40, threshold: 22, vo2max: 23, speed: 15 },
    },
    peak: {
        cardio: { easy: 45, threshold: 20, vo2max: 25, speed: 10 },
        muscular: { easy: 45, threshold: 15, vo2max: 15, speed: 25 },
        balanced: { easy: 45, threshold: 18, vo2max: 20, speed: 17 },
    },
    taper: {
        cardio: { easy: 60, threshold: 15, vo2max: 15, speed: 10 },
        muscular: { easy: 55, threshold: 15, vo2max: 10, speed: 20 },
        balanced: { easy: 58, threshold: 15, vo2max: 12, speed: 15 },
    },
} as const;

// キーワークアウト（フェーズ別）
export const KEY_WORKOUTS_BY_PHASE = {
    base: {
        categories: ['有酸素ベース', '乳酸閾値'] as const,
        focusKeys: ['aerobic', 'threshold'] as const,
        description: '有酸素能力の土台を構築',
    },
    build: {
        categories: ['VO2max', '乳酸閾値', '神経筋系'] as const,
        focusKeys: ['vo2max', 'threshold', 'speed'] as const,
        description: 'VO2max・乳酸閾値の向上',
    },
    peak: {
        categories: ['VO2max', '乳酸閾値'] as const,
        focusKeys: ['vo2max', 'threshold'] as const,
        description: 'レースペースへの最終調整',
    },
    taper: {
        categories: ['有酸素ベース', '神経筋系'] as const,
        focusKeys: ['aerobic', 'speed'] as const,
        description: '疲労回復と神経筋系維持',
    },
} as const;

// 週間距離目安（種目別、メートル）
export const WEEKLY_DISTANCE_BY_EVENT = {
    800: { base: 35000, build: 40000, peak: 35000, taper: 20000 },
    1500: { base: 40000, build: 50000, peak: 45000, taper: 25000 },
    3000: { base: 50000, build: 60000, peak: 55000, taper: 30000 },
    5000: { base: 55000, build: 70000, peak: 60000, taper: 35000 },
} as const;

// テーパー戦略
export const TAPER_CONFIG = {
    cardio: {
        durationMultiplier: 1.2,
        volumeReduction: 0.50,
        intensityKeep: true,
        lastIntenseWorkout: 10,
    },
    muscular: {
        durationMultiplier: 0.8,
        volumeReduction: 0.60,
        intensityKeep: true,
        lastIntenseWorkout: 5,
    },
    balanced: {
        durationMultiplier: 1.0,
        volumeReduction: 0.55,
        intensityKeep: true,
        lastIntenseWorkout: 7,
    },
} as const;

