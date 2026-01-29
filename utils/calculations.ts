// ============================================
// Zone2Peak 計算ロジック
// rise-test/src/App.jsx から移植
// ============================================

import {
    ZONE_COEFFICIENTS,
    LIMITER_ZONE_ADJUSTMENTS,
    RACE_COEFFICIENTS,
    LIMITER_RACE_ADJUSTMENTS,
    ETP_COEFFICIENT,
    LEVELS,
    PACE_INCREMENT,
    type LimiterType,
    type ZoneKey,
    type LevelKey,
} from '../constants';

// ============================================
// フォーマット関数
// ============================================

/**
 * 秒を MM:SS 形式に変換
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 400mペースからキロペースに変換
 */
export const formatKmPace = (pace400m: number): string => {
    const kmSeconds = pace400m * 2.5;
    return formatTime(kmSeconds) + '/km';
};

/**
 * MM:SS形式の文字列を秒に変換
 */
export const parseTimeInput = (str: string): number | null => {
    if (!str) return null;
    const match = str.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
};

// ============================================
// eTP計算
// ============================================

/**
 * LCPからeTPを計算
 * eTP = LCP × 1.12
 */
export const calculateETP = (lcp: number): number => {
    return Math.round(lcp * ETP_COEFFICIENT);
};

/**
 * 距離（m）と時間（分）からeTPを計算
 */
export const calculateEtpFromRun = (distanceMeters: number, timeMinutes: number): number => {
    const totalSeconds = timeMinutes * 60;
    const pace400m = (totalSeconds / distanceMeters) * 400;
    return Math.round(pace400m);
};

/**
 * 1500m自己ベストからeTPを推定
 * eTP = 1500m_time / 3.375
 */
export const estimateEtpFromPb = (pbSeconds: number, distance: number = 1500): number | null => {
    if (!pbSeconds) return null;

    const coefficients: Record<number, number> = {
        200: 0.76,
        400: 0.78,
        800: 0.82,
        1500: 0.88,
        3000: 0.96,
        5000: 1.00,
    };

    const coef = coefficients[distance] || 0.90;
    const distanceRatio = distance / 400;
    const divisor = coef * distanceRatio;

    return Math.round(pbSeconds / divisor);
};

/**
 * eTPからVO2maxを推定（Jack Daniels式）
 */
export const estimateVO2max = (etp: number): number | null => {
    if (!etp) return null;
    const predicted1500Sec = etp * 3.375;
    const timeMin = predicted1500Sec / 60;
    const velocity = 1500 / timeMin; // m/min

    const vo2 = 0.182258 * velocity + 0.000104 * Math.pow(velocity, 2) - 4.6;
    const vo2max = vo2 / 0.98;

    return Math.round(vo2max * 10) / 10;
};

// ============================================
// 複数PBからのeTP推定（v3.0）
// ============================================

interface PBs {
    m200?: number;
    m400?: number;
    m800?: number;
    m1500?: number;
    m3000?: number;
    m5000?: number;
}

/**
 * スピード指標を計算
 * 400mと1500mのタイム比率から、スプリンター寄りかどうかを判定
 * 結果: < 1.0 = スプリンター寄り（中距離型）、> 1.0 = 持久力型
 */
export const calculateSpeedIndex = (pbs: PBs): number | null => {
    // 400mと1500mが両方必要
    if (!pbs.m400 || !pbs.m1500) return null;

    // 理論上、1500m = 400m × 4.2程度が標準
    const standardRatio = 4.2;
    const actualRatio = pbs.m1500 / pbs.m400;

    // 標準比率との比較（1.0が標準、<1.0でスプリンター寄り）
    return Math.round((actualRatio / standardRatio) * 100) / 100;
};

/**
 * スピード指標からリミッター型を推定
 */
export const estimateLimiterFromSpeedIndex = (
    speedIndex: number | null
): { type: LimiterType; confidence: 'high' | 'medium' | 'low' } => {
    if (speedIndex === null) {
        return { type: 'balanced', confidence: 'low' };
    }

    if (speedIndex < 0.92) {
        return { type: 'muscular', confidence: speedIndex < 0.88 ? 'high' : 'medium' };
    } else if (speedIndex > 1.08) {
        return { type: 'cardio', confidence: speedIndex > 1.12 ? 'high' : 'medium' };
    } else {
        return { type: 'balanced', confidence: 'medium' };
    }
};

/**
 * 複数PBからeTPを推定
 * 優先順位: 1500m > 3000m > 5000m > 800m > 400m > 200m
 */
export const estimateEtpFromMultiplePBs = (pbs: PBs): number | null => {
    // 優先順位順にチェック
    const priorities: { key: keyof PBs; distance: number }[] = [
        { key: 'm1500', distance: 1500 },
        { key: 'm3000', distance: 3000 },
        { key: 'm5000', distance: 5000 },
        { key: 'm800', distance: 800 },
        { key: 'm400', distance: 400 },
        { key: 'm200', distance: 200 },
    ];

    for (const { key, distance } of priorities) {
        if (pbs[key]) {
            return estimateEtpFromPb(pbs[key]!, distance);
        }
    }

    return null;
};

/**
 * 複数PBから加重平均eTPを計算（より精度の高い推定）
 */
export const calculateWeightedEtp = (pbs: PBs): number | null => {
    const weights: Record<string, number> = {
        m200: 0.5,
        m400: 0.7,
        m800: 0.85,
        m1500: 1.0,  // 最も信頼性が高い
        m3000: 0.95,
        m5000: 0.9,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(pbs).forEach(([key, value]) => {
        if (value && weights[key]) {
            const distance = parseInt(key.replace('m', ''));
            const etp = estimateEtpFromPb(value, distance);
            if (etp) {
                weightedSum += etp * weights[key];
                totalWeight += weights[key];
            }
        }
    });

    if (totalWeight === 0) return null;
    return Math.round(weightedSum / totalWeight);
};

// ============================================
// リミッター判定
// ============================================

/**
 * 5分間走と30分間走からリミッタータイプを判定
 */
export const determineLimiterFromRuns = (
    dist5min: number,
    dist30min: number
): { type: LimiterType; confidence: 'high' | 'medium' | 'low' } => {
    const pace5min = (5 * 60 / dist5min) * 400;
    const pace30min = (30 * 60 / dist30min) * 400;
    const enduranceRatio = pace5min / pace30min;

    if (enduranceRatio < 0.82) {
        return { type: 'cardio', confidence: 'high' };
    } else if (enduranceRatio < 0.88) {
        return { type: 'cardio', confidence: 'medium' };
    } else if (enduranceRatio > 0.98) {
        return { type: 'muscular', confidence: 'high' };
    } else if (enduranceRatio > 0.93) {
        return { type: 'muscular', confidence: 'medium' };
    } else {
        return { type: 'balanced', confidence: 'medium' };
    }
};

/**
 * RISEテストの終了理由からリミッタータイプを判定
 */
export const determineLimiterFromTest = (
    reason: 'breath' | 'legs' | 'both' | 'other',
    couldDoOneMore: boolean,
    couldContinueSlower: boolean,
    breathRecoveryTime: '<30' | '30-60' | '>60'
): { type: LimiterType; confidence: 'confirmed' | 'tentative' } => {
    if (reason === 'breath') {
        if (breathRecoveryTime === '>60') {
            return { type: 'cardio', confidence: 'confirmed' };
        }
        return { type: 'cardio', confidence: 'tentative' };
    }

    if (reason === 'legs') {
        if (couldDoOneMore && couldContinueSlower) {
            return { type: 'muscular', confidence: 'confirmed' };
        }
        return { type: 'muscular', confidence: 'tentative' };
    }

    if (reason === 'both') {
        return { type: 'balanced', confidence: 'confirmed' };
    }

    return { type: 'balanced', confidence: 'tentative' };
};

// ============================================
// ゾーン計算
// ============================================

/**
 * eTPとリミッタータイプからトレーニングゾーンを計算
 */
export const calculateZones = (
    etp: number,
    limiterType: LimiterType = 'balanced'
): Record<ZoneKey, number> => {
    const adj = LIMITER_ZONE_ADJUSTMENTS[limiterType];
    const zones = {} as Record<ZoneKey, number>;

    (Object.entries(ZONE_COEFFICIENTS) as [ZoneKey, { coef: number }][]).forEach(([key, config]) => {
        const adjustment = adj[key] || 0;
        zones[key] = Math.round(etp * (config.coef + adjustment));
    });

    return zones;
};

/**
 * ゾーン情報を配列形式で取得
 */
export const getZonesList = (etp: number, limiterType: LimiterType = 'balanced') => {
    const zones = calculateZones(etp, limiterType);

    return (Object.entries(ZONE_COEFFICIENTS) as [ZoneKey, { name: string; color: string }][]).map(
        ([key, config]) => ({
            key,
            name: config.name,
            color: config.color,
            pace400m: zones[key],
            paceKm: formatKmPace(zones[key]),
        })
    );
};

// ============================================
// レース予測
// ============================================

/**
 * eTPからレース予測タイムを計算
 */
export const calculatePredictions = (
    etp: number,
    limiterType: LimiterType = 'balanced'
): Record<string, { min: number; max: number }> => {
    const predictions: Record<string, { min: number; max: number }> = {};

    (Object.entries(RACE_COEFFICIENTS) as [string, { min: number; max: number; laps: number }][]).forEach(
        ([key, config]) => {
            const limiterAdj = LIMITER_RACE_ADJUSTMENTS[key as keyof typeof LIMITER_RACE_ADJUSTMENTS]?.[limiterType] || 0;
            const basePaceMin = etp * config.min;
            const basePaceMax = etp * config.max;

            predictions[key] = {
                min: Math.round(basePaceMin * config.laps + limiterAdj),
                max: Math.round(basePaceMax * config.laps + limiterAdj),
            };
        }
    );

    return predictions;
};

/**
 * eTPから5km予測タイムを計算
 */
export const predict5kTime = (etp: number, limiterType: LimiterType): number => {
    const baseCoef = 1.00;
    const limiterAdj = LIMITER_RACE_ADJUSTMENTS.m5000[limiterType];
    const pace400m = etp * baseCoef;
    const baseTime = pace400m * 12.5;
    return Math.round(baseTime + limiterAdj);
};

// ============================================
// RISEテスト関連
// ============================================

/**
 * レベルと完遂周回数からLCPを計算
 */
export const calculateLCP = (level: LevelKey, completedLaps: number): number => {
    const config = LEVELS[level];
    return config.startPace - (completedLaps - 1) * PACE_INCREMENT;
};

/**
 * レベルのラップスケジュールを生成
 */
export const generateLapSchedule = (level: LevelKey) => {
    const config = LEVELS[level];
    const schedule = [];

    for (let lap = 1; lap <= config.maxLaps; lap++) {
        const pace400m = config.startPace - (lap - 1) * PACE_INCREMENT;
        schedule.push({
            lap,
            pace400m,
            pace100m: (pace400m / 4).toFixed(1),
            kmPace: formatKmPace(pace400m),
        });
    }

    return schedule;
};

/**
 * eTPからレベルを推定
 */
export const getLevelFromEtp = (etp: number): LevelKey | null => {
    if (!etp) return null;
    if (etp < 62) return 'SS';
    if (etp < 71) return 'S';
    if (etp < 80) return 'A';
    if (etp < 89) return 'B';
    return 'C';
};

/**
 * 1500m PBからレベルを推奨
 */
export const recommendLevel = (pbSeconds: number): LevelKey | null => {
    if (pbSeconds === null) return null;
    if (pbSeconds < 210) return 'SS';
    if (pbSeconds < 240) return 'S';
    if (pbSeconds < 270) return 'A';
    if (pbSeconds < 300) return 'B';
    return 'C';
};

// ============================================
// 計画生成ロジック（rise-test互換）
// ============================================

import {
    PHASE_CONFIG,
    PHASE_DISTRIBUTION,
    DISTRIBUTION_BY_LIMITER,
    KEY_WORKOUTS_BY_PHASE,
    WEEKLY_DISTANCE_BY_EVENT,
    TAPER_CONFIG,
    type PhaseType,
} from '../constants';
import type { TrainingPlan, WeeklyPlan, PlanPhase, DaySchedule } from '../store/useAppStore';

interface GeneratePlanParams {
    race: {
        name: string;
        date: string;
        distance: number;
        targetTime: number;
    };
    baseline: {
        etp: number;
        limiterType: LimiterType;
    };
    weeksUntilRace: number;
}

/**
 * 週間スケジュールを生成
 */
const generateWeeklySchedule = (
    phaseType: PhaseType,
    focusKeys: readonly string[],
    isRecoveryWeek: boolean,
    isRiseTestWeek: boolean,
): DaySchedule[] => {
    const getFocusLabel = (key: string): string => {
        const labels: Record<string, string> = {
            aerobic: '有酸素ベース',
            threshold: '乳酸閾値',
            vo2max: 'VO2max',
            speed: '神経筋系',
        };
        return labels[key] || '有酸素ベース';
    };

    if (isRecoveryWeek) {
        return [
            { dayOfWeek: 0, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
            { dayOfWeek: 1, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
            { dayOfWeek: 2, type: 'rest', label: '休養', isKey: false, completed: false },
            { dayOfWeek: 3, type: 'workout', label: getFocusLabel(focusKeys[0]), isKey: true, completed: false, focusKey: focusKeys[0], focusCategory: getFocusLabel(focusKeys[0]) },
            { dayOfWeek: 4, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
            { dayOfWeek: 5, type: 'long', label: 'Long Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
            { dayOfWeek: 6, type: 'rest', label: '休養', isKey: false, completed: false },
        ];
    }

    if (isRiseTestWeek) {
        return [
            { dayOfWeek: 0, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
            { dayOfWeek: 1, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
            { dayOfWeek: 2, type: 'rest', label: '休養', isKey: false, completed: false },
            { dayOfWeek: 3, type: 'test', label: 'RISE Test', isKey: true, completed: false, focusKey: 'test' },
            { dayOfWeek: 4, type: 'rest', label: '休養', isKey: false, completed: false },
            { dayOfWeek: 5, type: 'workout', label: getFocusLabel(focusKeys[0]), isKey: true, completed: false, focusKey: focusKeys[0], focusCategory: getFocusLabel(focusKeys[0]) },
            { dayOfWeek: 6, type: 'rest', label: '休養', isKey: false, completed: false },
        ];
    }

    // 通常週
    return [
        { dayOfWeek: 0, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
        { dayOfWeek: 1, type: 'workout', label: getFocusLabel(focusKeys[0]), isKey: true, completed: false, focusKey: focusKeys[0], focusCategory: getFocusLabel(focusKeys[0]) },
        { dayOfWeek: 2, type: 'rest', label: '休養', isKey: false, completed: false },
        { dayOfWeek: 3, type: 'easy', label: 'Easy Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
        { dayOfWeek: 4, type: 'workout', label: focusKeys[1] ? getFocusLabel(focusKeys[1]) : getFocusLabel(focusKeys[0]), isKey: true, completed: false, focusKey: focusKeys[1] || focusKeys[0], focusCategory: focusKeys[1] ? getFocusLabel(focusKeys[1]) : getFocusLabel(focusKeys[0]) },
        { dayOfWeek: 5, type: 'long', label: 'Long Run', isKey: false, completed: false, focusKey: 'aerobic', focusCategory: '有酸素ベース' },
        { dayOfWeek: 6, type: 'rest', label: '休養', isKey: false, completed: false },
    ];
};

/**
 * トレーニング計画を生成
 */
export const generatePlan = ({ race, baseline, weeksUntilRace }: GeneratePlanParams): TrainingPlan => {
    // 期間に応じた配分を決定
    const distribution = weeksUntilRace >= 16 ? 'long'
        : weeksUntilRace >= 10 ? 'medium'
            : weeksUntilRace >= 6 ? 'short'
                : 'minimal';

    const phaseConfig = PHASE_DISTRIBUTION[distribution];
    const phases: PlanPhase[] = [];
    let currentWeek = 1;

    // フェーズ配分
    (['base', 'build', 'peak', 'taper'] as const).forEach((type) => {
        const [min, max] = phaseConfig[type].weeks;
        const weeks = Math.min(max, Math.max(min, Math.floor(weeksUntilRace * (max / 16))));
        if (weeks > 0) {
            phases.push({
                type,
                startWeek: currentWeek,
                endWeek: currentWeek + weeks - 1,
                weeks,
                focus: PHASE_CONFIG[type].name,
            });
            currentWeek += weeks;
        }
    });

    // RISE Test推奨週（4週間ごと）
    const riseTestDates: number[] = [];
    const testInterval = 4;
    for (let w = testInterval; w <= weeksUntilRace && w < 20; w += testInterval) {
        const weekPhase = phases.find((p) => w >= p.startWeek && w <= p.endWeek);
        if (weekPhase && weekPhase.type !== 'taper') {
            riseTestDates.push(w);
        }
    }
    // 基礎期の終わりにもテストを推奨
    const basePhase = phases.find((p) => p.type === 'base');
    if (basePhase && !riseTestDates.includes(basePhase.endWeek)) {
        riseTestDates.push(basePhase.endWeek);
        riseTestDates.sort((a, b) => a - b);
    }

    // 週間プラン生成
    const weeklyPlans: WeeklyPlan[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // 次の月曜日

    const eventDistance = WEEKLY_DISTANCE_BY_EVENT[race.distance as keyof typeof WEEKLY_DISTANCE_BY_EVENT]
        || WEEKLY_DISTANCE_BY_EVENT[1500];

    for (let w = 0; w < weeksUntilRace && w < 20; w++) {
        const weekNumber = w + 1;
        const phase = phases.find((p) => weekNumber >= p.startWeek && weekNumber <= p.endWeek);
        const phaseType = phase?.type || 'base';
        const dist = DISTRIBUTION_BY_LIMITER[phaseType]?.[baseline.limiterType]
            || DISTRIBUTION_BY_LIMITER.base.balanced;

        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // フェーズ内での週の位置
        const weeksIntoPhase = weekNumber - (phase?.startWeek || 1);
        const phaseLength = phase?.weeks || 1;
        const phaseProgress = weeksIntoPhase / phaseLength;

        // 3週ごとに回復週
        const isRecoveryWeek = weeksIntoPhase > 0 && weeksIntoPhase % 3 === 0;

        // 基準距離を計算
        let baseDistance: number = eventDistance[phaseType] || 50000;

        if (phaseType === 'taper') {
            const taperConf = TAPER_CONFIG[baseline.limiterType] || TAPER_CONFIG.balanced;
            const volumeMultiplier = 1 - (taperConf.volumeReduction * phaseProgress);
            baseDistance = Math.round(eventDistance.peak * volumeMultiplier);
        } else if (isRecoveryWeek) {
            baseDistance = Math.round(baseDistance * 0.7);
        } else {
            const progressionMultiplier = 1 + (phaseProgress * 0.1);
            baseDistance = Math.round(baseDistance * progressionMultiplier);
        }

        // 負荷率計算
        const loadPercent = isRecoveryWeek ? 70
            : phaseType === 'taper' ? Math.round(100 - (phaseProgress * 50))
                : Math.round(PHASE_CONFIG[phaseType].loadRange[0] + (phaseProgress * 10));

        const phaseFocusKeys = KEY_WORKOUTS_BY_PHASE[phaseType]?.focusKeys || ['aerobic'];
        const isRiseTestWeek = riseTestDates.includes(weekNumber);

        const days = generateWeeklySchedule(phaseType, phaseFocusKeys, isRecoveryWeek, isRiseTestWeek);

        weeklyPlans.push({
            weekNumber,
            phaseType,
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            targetDistance: baseDistance,
            loadPercent,
            days,
            keyWorkouts: days.filter((d) => d.isKey).map((d) => d.focusKey || d.label),
            isRecoveryWeek,
            isRiseTestWeek,
        });
    }

    return {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        race,
        baseline,
        phases,
        weeklyPlans,
        riseTestDates,
    };
};

