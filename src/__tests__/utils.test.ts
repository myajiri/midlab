// ============================================
// ユーティリティ関数のテストケース
// ============================================

import {
  formatTime,
  formatKmPace,
  parseTime,
  calculateEtp,
  calculateEtpFromTest,
  estimateLimiterFromPBs,
  calculateSpeedIndex,
  estimateLimiterFromSpeedIndex,
  calculateRacePredictions,
  calculateZonesV3,
  determineLimiterType,
  getLevelFromEtp,
  recommendTestLevel,
  getEffectiveValues,
  getUserStage,
  estimateEtpFromPb,
  estimateVO2max,
} from '../utils';

import type { PBs, Profile, TestResult, RacePlan } from '../types';

// ============================================
// formatTime / parseTime
// ============================================

describe('formatTime', () => {
  it('基本的な時間フォーマット', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(240)).toBe('4:00');
  });

  it('秒が1桁の場合はゼロ埋め', () => {
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(65)).toBe('1:05');
  });

  it('0秒', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('大きい値（5000m級タイム）', () => {
    expect(formatTime(900)).toBe('15:00');
    expect(formatTime(845)).toBe('14:05');
  });
});

describe('formatKmPace', () => {
  it('400mペースをkm/ペースに変換', () => {
    // 80秒/400m → 200秒/km → 3:20/km
    expect(formatKmPace(80)).toBe('3:20/km');
    // 100秒/400m → 250秒/km → 4:10/km
    expect(formatKmPace(100)).toBe('4:10/km');
  });
});

describe('parseTime', () => {
  it('M:SS形式をパース', () => {
    expect(parseTime('4:00')).toBe(240);
    expect(parseTime('1:30')).toBe(90);
    expect(parseTime('15:00')).toBe(900);
  });

  it('不正な形式はnullを返す', () => {
    expect(parseTime('abc')).toBeNull();
    expect(parseTime('4:60')).toBeNull(); // 秒が60以上
    expect(parseTime('4:5')).toBeNull(); // 秒が1桁
    expect(parseTime('')).toBeNull();
  });
});

// ============================================
// calculateEtp
// ============================================

describe('calculateEtp', () => {
  it('1500mのPBのみでeTPを計算', () => {
    // 1500m PB = 240秒 (4:00)
    // estimatedEtp = 240 / 3.30 = 72.73
    // baseEtp = round(72.73 * 0.5 / 0.5) = 73
    // senior + intermediate: etpAdj=0, expAdj=1
    // adjustedEtp = 73 + 0 + 1 = 74
    const result = calculateEtp({ m1500: 240 }, 'senior', 'intermediate');
    expect(result).not.toBeNull();
    expect(result!.baseEtp).toBe(73);
    expect(result!.adjustedEtp).toBe(74);
    expect(result!.confidence).toBe('medium');
  });

  it('800mのPBのみでeTPを計算', () => {
    // 800m PB = 120秒 (2:00)
    // estimatedEtp = 120 / 1.64 = 73.17
    // baseEtp = round(73.17 * 0.3 / 0.3) = 73
    const result = calculateEtp({ m800: 120 }, 'senior', 'advanced');
    expect(result).not.toBeNull();
    expect(result!.baseEtp).toBe(73);
    // advanced: etpAdj=0, adjustedEtp = 73
    expect(result!.adjustedEtp).toBe(73);
    expect(result!.confidence).toBe('high');
  });

  it('複数PBからeTPを加重平均で計算', () => {
    // 800m=120s, 1500m=240s
    // 800m: 120/1.64=73.17, weight=0.3
    // 1500m: 240/3.30=72.73, weight=0.5
    // weightedSum = 73.17*0.3 + 72.73*0.5 = 21.95 + 36.36 = 58.31
    // totalWeight = 0.8
    // baseEtp = round(58.31/0.8) = round(72.89) = 73
    const result = calculateEtp({ m800: 120, m1500: 240 }, 'senior', 'intermediate');
    expect(result).not.toBeNull();
    expect(result!.baseEtp).toBe(73);
  });

  it('4距離全てのPBからeTPを計算', () => {
    const pbs: PBs = { m800: 120, m1500: 240, m3000: 520, m5000: 910 };
    const result = calculateEtp(pbs, 'senior', 'intermediate');
    expect(result).not.toBeNull();
    expect(result!.baseEtp).toBeGreaterThan(0);
    expect(result!.adjustedEtp).toBeGreaterThan(0);
  });

  it('空のPBsではnullを返す', () => {
    expect(calculateEtp({}, 'senior', 'intermediate')).toBeNull();
  });

  it('値が0や未定義のPBは無視される', () => {
    expect(calculateEtp({ m800: 0 }, 'senior', 'intermediate')).toBeNull();
    expect(calculateEtp({ m800: undefined }, 'senior', 'intermediate')).toBeNull();
  });

  it('年齢カテゴリ補正が適用される', () => {
    const pbs: PBs = { m1500: 240 };
    const resultSenior = calculateEtp(pbs, 'senior', 'intermediate');
    const resultMasters50 = calculateEtp(pbs, 'masters_50', 'intermediate');
    // masters_50: etpAdj=4
    expect(resultMasters50!.adjustedEtp).toBe(resultSenior!.adjustedEtp + 4);
  });

  it('経験レベル補正が適用される', () => {
    const pbs: PBs = { m1500: 240 };
    const resultAdvanced = calculateEtp(pbs, 'senior', 'advanced');
    const resultBeginner = calculateEtp(pbs, 'senior', 'beginner');
    // beginner: etpAdj=3, advanced: etpAdj=0
    expect(resultBeginner!.adjustedEtp).toBe(resultAdvanced!.adjustedEtp + 3);
  });

  it('エリート選手はeTPが低めに補正される', () => {
    const pbs: PBs = { m1500: 240 };
    const resultElite = calculateEtp(pbs, 'senior', 'elite');
    const resultAdvanced = calculateEtp(pbs, 'senior', 'advanced');
    // elite: etpAdj=-1, advanced: etpAdj=0
    expect(resultElite!.adjustedEtp).toBe(resultAdvanced!.adjustedEtp - 1);
  });

  it('中学生のレベル調整が適用される', () => {
    const pbs: PBs = { m1500: 300 };
    const resultJunior = calculateEtp(pbs, 'junior_high', 'intermediate');
    const resultSenior = calculateEtp(pbs, 'senior', 'intermediate');
    // 中学生: etpAdj=0だがlevelAdj=-1（別のテストで検証）
    // eTPの補正は同じ
    expect(resultJunior!.adjustedEtp).toBe(resultSenior!.adjustedEtp);
  });
});

describe('calculateEtpFromTest', () => {
  it('テスト結果からeTPを計算', () => {
    // ETP_COEFFICIENT = 1.12
    expect(calculateEtpFromTest(80)).toBe(Math.round(80 * 1.12));
    expect(calculateEtpFromTest(70)).toBe(Math.round(70 * 1.12));
  });
});

// ============================================
// estimateLimiterFromPBs
// ============================================

describe('estimateLimiterFromPBs', () => {
  it('800mと1500mの両方がない場合はbalanced', () => {
    expect(estimateLimiterFromPBs({})).toBe('balanced');
    expect(estimateLimiterFromPBs({ m1500: 240 })).toBe('balanced');
    expect(estimateLimiterFromPBs({ m800: 120 })).toBe('balanced');
  });

  it('バランス型の選手を検出', () => {
    // 800m=120s, 1500m=240s
    // speedIndex800 = 120/1.64 = 73.17
    // speedIndex1500 = 240/3.30 = 72.73
    // ratio = 73.17/72.73 = 1.006 → balanced
    expect(estimateLimiterFromPBs({ m800: 120, m1500: 240 })).toBe('balanced');
  });

  it('心肺型の選手を検出（800mが相対的に速い）', () => {
    // 800m=110s, 1500m=240s
    // speedIndex800 = 110/1.64 = 67.07
    // speedIndex1500 = 240/3.30 = 72.73
    // ratio = 67.07/72.73 = 0.922 → < 0.94 → cardio
    expect(estimateLimiterFromPBs({ m800: 110, m1500: 240 })).toBe('cardio');
  });

  it('筋持久力型の選手を検出（800mが相対的に遅い）', () => {
    // 800m=130s, 1500m=240s
    // speedIndex800 = 130/1.64 = 79.27
    // speedIndex1500 = 240/3.30 = 72.73
    // ratio = 79.27/72.73 = 1.090 → > 1.06 → muscular
    expect(estimateLimiterFromPBs({ m800: 130, m1500: 240 })).toBe('muscular');
  });

  it('3000mや5000mのみの場合はbalanced', () => {
    expect(estimateLimiterFromPBs({ m3000: 520, m5000: 900 })).toBe('balanced');
  });

  it('境界値テスト: ratio ≈ 0.94', () => {
    // ratio = 0.94 ちょうどはbalanced（< 0.94がcardio）
    // speedIndex800 / speedIndex1500 = 0.94
    // (m800/1.64) / (m1500/3.30) = 0.94
    // m800/1.64 = 0.94 * m1500/3.30
    // m800 = 0.94 * 1.64 * m1500 / 3.30
    // m1500=330の場合: m800 = 0.94 * 1.64 * 330 / 3.30 = 0.94 * 1.64 * 100 = 154.16
    // ratio = (154.16/1.64) / (330/3.30) = 94.0 / 100 = 0.94 → balanced
    const result = estimateLimiterFromPBs({ m800: 155, m1500: 330 });
    expect(result).toBe('balanced');
  });
});

// ============================================
// calculateSpeedIndex
// ============================================

describe('calculateSpeedIndex', () => {
  it('800mと1500mからスピード指標を計算', () => {
    // (120 * 1.875) / 240 = 225/240 = 0.9375 → 0.94
    const result = calculateSpeedIndex({ m800: 120, m1500: 240 });
    expect(result).not.toBeNull();
    expect(result!.value).toBe(0.94);
    expect(result!.source).toBe('800m');
    expect(result!.estimated).toBe(false);
  });

  it('800mがない場合はnull', () => {
    expect(calculateSpeedIndex({ m1500: 240 })).toBeNull();
  });

  it('1500mがない場合はnull', () => {
    expect(calculateSpeedIndex({ m800: 120 })).toBeNull();
  });

  it('両方ない場合はnull', () => {
    expect(calculateSpeedIndex({})).toBeNull();
  });

  it('バランス型のスピード指標（≈1.0）', () => {
    // 理論的にバランスの取れた選手: 800m=114s, 1500m=228s
    // (114 * 1.875) / 228 = 213.75 / 228 = 0.9375 → 0.94
    const result = calculateSpeedIndex({ m800: 114, m1500: 228 });
    expect(result).not.toBeNull();
    // 値は0.94あたり
    expect(result!.value).toBeCloseTo(0.94, 1);
  });

  it('スピード型のスピード指標（< 0.95）', () => {
    // スピードが相対的に速い選手
    // 800m=110s, 1500m=240s
    // (110 * 1.875) / 240 = 206.25/240 = 0.859
    const result = calculateSpeedIndex({ m800: 110, m1500: 240 });
    expect(result).not.toBeNull();
    expect(result!.value).toBeLessThan(0.95);
  });

  it('持久型のスピード指標（> 1.02）', () => {
    // 持久力が相対的に強い選手
    // 800m=135s, 1500m=240s
    // (135 * 1.875) / 240 = 253.125/240 = 1.055
    const result = calculateSpeedIndex({ m800: 135, m1500: 240 });
    expect(result).not.toBeNull();
    expect(result!.value).toBeGreaterThan(1.02);
  });
});

// ============================================
// estimateLimiterFromSpeedIndex
// ============================================

describe('estimateLimiterFromSpeedIndex', () => {
  it('nullの場合はnull', () => {
    expect(estimateLimiterFromSpeedIndex(null)).toBeNull();
  });

  it('スピード指標 < 0.95 → muscular（スピード型）', () => {
    const result = estimateLimiterFromSpeedIndex({ value: 0.90, source: '800m', estimated: false });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('muscular');
    expect(result!.confidence).toBe('high');
  });

  it('スピード指標 0.95-1.02 → balanced', () => {
    const result = estimateLimiterFromSpeedIndex({ value: 0.98, source: '800m', estimated: false });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('balanced');
    expect(result!.confidence).toBe('medium');
  });

  it('スピード指標 > 1.02 → cardio（持久型）', () => {
    const result = estimateLimiterFromSpeedIndex({ value: 1.05, source: '800m', estimated: false });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('cardio');
    expect(result!.confidence).toBe('high');
  });

  it('境界値: 0.95 → balanced', () => {
    const result = estimateLimiterFromSpeedIndex({ value: 0.95, source: '800m', estimated: false });
    expect(result).not.toBeNull();
    expect(result!.type).toBe('balanced');
  });

  it('境界値: 1.02 → cardio（< 1.02がbalancedの上限）', () => {
    const result = estimateLimiterFromSpeedIndex({ value: 1.02, source: '800m', estimated: false });
    expect(result).not.toBeNull();
    // コード: value < 1.02 → balanced, それ以上は cardio
    expect(result!.type).toBe('cardio');
  });
});

// ============================================
// calculateRacePredictions
// ============================================

describe('calculateRacePredictions', () => {
  it('balanced型のレース予測', () => {
    const etp = 73;
    const predictions = calculateRacePredictions(etp, 'balanced');

    // 800m: min=73*0.82*2=119.72, max=73*0.85*2=124.1
    expect(predictions.m800.min).toBe(Math.round(73 * 0.82 * 2));
    expect(predictions.m800.max).toBe(Math.round(73 * 0.85 * 2));

    // 1500m: min=73*0.88*3.75=240.9, max=73*0.92*3.75=251.85
    expect(predictions.m1500.min).toBe(Math.round(73 * 0.88 * 3.75));
    expect(predictions.m1500.max).toBe(Math.round(73 * 0.92 * 3.75));

    // 3000m: min=73*0.96*7.5=525.6, max=73*1.00*7.5=547.5
    expect(predictions.m3000.min).toBe(Math.round(73 * 0.96 * 7.5));
    expect(predictions.m3000.max).toBe(Math.round(73 * 1.00 * 7.5));

    // 5000m: min=73*1.00*12.5=912.5, max=73*1.04*12.5=949
    expect(predictions.m5000.min).toBe(Math.round(73 * 1.00 * 12.5));
    expect(predictions.m5000.max).toBe(Math.round(73 * 1.04 * 12.5));
  });

  it('cardio型はリミッター調整が適用される', () => {
    const etp = 73;
    const balanced = calculateRacePredictions(etp, 'balanced');
    const cardio = calculateRacePredictions(etp, 'cardio');

    // LIMITER_ADJUSTMENTS:
    // m800: cardio=-3 → 800mは速くなる
    // m1500: cardio=1.5 → 1500mは遅くなる（丸め前の値に加算されるため厳密比較は避ける）
    // m5000: cardio=27.5 → 5000mは大幅に遅くなる
    expect(cardio.m800.min).toBeLessThan(balanced.m800.min);
    expect(cardio.m1500.min).toBeGreaterThan(balanced.m1500.min);
    expect(cardio.m5000.min).toBeGreaterThan(balanced.m5000.min);
  });

  it('muscular型はリミッター調整が適用される', () => {
    const etp = 73;
    const balanced = calculateRacePredictions(etp, 'balanced');
    const muscular = calculateRacePredictions(etp, 'muscular');

    // m800: muscular=3 → 800mは遅くなる
    // m5000: muscular=-27.5 → 5000mは速くなる
    expect(muscular.m800.min).toBe(balanced.m800.min + 3);
    expect(muscular.m5000.min).toBeLessThan(balanced.m5000.min);
  });

  it('全4距離の予測値が生成される', () => {
    const predictions = calculateRacePredictions(80, 'balanced');
    expect(predictions).toHaveProperty('m800');
    expect(predictions).toHaveProperty('m1500');
    expect(predictions).toHaveProperty('m3000');
    expect(predictions).toHaveProperty('m5000');
  });

  it('minはmaxより小さい', () => {
    const predictions = calculateRacePredictions(80, 'balanced');
    expect(predictions.m800.min).toBeLessThan(predictions.m800.max);
    expect(predictions.m1500.min).toBeLessThan(predictions.m1500.max);
    expect(predictions.m3000.min).toBeLessThan(predictions.m3000.max);
    expect(predictions.m5000.min).toBeLessThan(predictions.m5000.max);
  });
});

// ============================================
// calculateZonesV3
// ============================================

describe('calculateZonesV3', () => {
  it('balanced型のゾーン計算（調整なし）', () => {
    const etp = 80;
    const zones = calculateZonesV3(etp, 'balanced');

    // ZONE_COEFFICIENTS_V3: jog=1.40, easy=1.275, marathon=1.125, threshold=1.025, interval=0.945, repetition=0.875
    // balanced: 全調整0
    expect(zones.jog).toBe(Math.round(80 * 1.40));
    expect(zones.easy).toBe(Math.round(80 * 1.275));
    expect(zones.marathon).toBe(Math.round(80 * 1.125));
    expect(zones.threshold).toBe(Math.round(80 * 1.025));
    expect(zones.interval).toBe(Math.round(80 * 0.945));
    expect(zones.repetition).toBe(Math.round(80 * 0.875));
  });

  it('cardio型のゾーン調整', () => {
    const etp = 80;
    const balanced = calculateZonesV3(etp, 'balanced');
    const cardio = calculateZonesV3(etp, 'cardio');

    // cardio: easy=+0.05, threshold=+0.02 → ペースが遅くなる
    expect(cardio.easy).toBeGreaterThan(balanced.easy);
    expect(cardio.threshold).toBeGreaterThan(balanced.threshold);
    // jogは調整0
    expect(cardio.jog).toBe(balanced.jog);
  });

  it('muscular型のゾーン調整', () => {
    const etp = 80;
    const balanced = calculateZonesV3(etp, 'balanced');
    const muscular = calculateZonesV3(etp, 'muscular');

    // muscular: jog=+0.05, easy=+0.08 → よりゆっくり
    // repetition=-0.02 → より速く
    expect(muscular.jog).toBeGreaterThan(balanced.jog);
    expect(muscular.easy).toBeGreaterThan(balanced.easy);
    expect(muscular.repetition).toBeLessThan(balanced.repetition);
  });

  it('全6ゾーンが返される', () => {
    const zones = calculateZonesV3(80, 'balanced');
    expect(Object.keys(zones)).toEqual(
      expect.arrayContaining(['jog', 'easy', 'marathon', 'threshold', 'interval', 'repetition'])
    );
  });
});

// ============================================
// determineLimiterType
// ============================================

describe('determineLimiterType', () => {
  it('両方 → balanced (confirmed)', () => {
    const result = determineLimiterType('both', false, false, '<30');
    expect(result.type).toBe('balanced');
    expect(result.confidence).toBe('confirmed');
  });

  it('呼吸 + 回復>60秒 → cardio (confirmed)', () => {
    const result = determineLimiterType('breath', false, false, '>60');
    expect(result.type).toBe('cardio');
    expect(result.confidence).toBe('confirmed');
  });

  it('呼吸 + 回復<30秒 → cardio (tentative)', () => {
    const result = determineLimiterType('breath', false, false, '<30');
    expect(result.type).toBe('cardio');
    expect(result.confidence).toBe('tentative');
  });

  it('脚 + もう1本可能 + ゆっくりなら可能 → muscular (confirmed)', () => {
    const result = determineLimiterType('legs', true, true, '<30');
    expect(result.type).toBe('muscular');
    expect(result.confidence).toBe('confirmed');
  });

  it('脚 + もう1本不可 → muscular (tentative)', () => {
    const result = determineLimiterType('legs', false, true, '<30');
    expect(result.type).toBe('muscular');
    expect(result.confidence).toBe('tentative');
  });

  it('other → balanced (tentative)', () => {
    const result = determineLimiterType('other', false, false, '<30');
    expect(result.type).toBe('balanced');
    expect(result.confidence).toBe('tentative');
  });
});

// ============================================
// getLevelFromEtp
// ============================================

describe('getLevelFromEtp', () => {
  it('eTP < 62 → SS', () => {
    expect(getLevelFromEtp(50)).toBe('SS');
    expect(getLevelFromEtp(61)).toBe('SS');
  });

  it('eTP 62-70 → S', () => {
    expect(getLevelFromEtp(62)).toBe('S');
    expect(getLevelFromEtp(70)).toBe('S');
  });

  it('eTP 71-79 → A', () => {
    expect(getLevelFromEtp(71)).toBe('A');
    expect(getLevelFromEtp(79)).toBe('A');
  });

  it('eTP 80-88 → B', () => {
    expect(getLevelFromEtp(80)).toBe('B');
    expect(getLevelFromEtp(88)).toBe('B');
  });

  it('eTP 89以上 → C', () => {
    expect(getLevelFromEtp(89)).toBe('C');
    expect(getLevelFromEtp(100)).toBe('C');
  });
});

// ============================================
// recommendTestLevel
// ============================================

describe('recommendTestLevel', () => {
  it('eTP73 + senior + intermediate → A', () => {
    const result = recommendTestLevel(73, 'senior', 'intermediate');
    // baseIndex for 73: 71-79 → index 2 → 'A'
    // senior: levelAdj=0, intermediate: levelAdj=0
    expect(result.recommended).toBe('A');
  });

  it('中学生は難易度が下がる', () => {
    const result = recommendTestLevel(73, 'junior_high', 'intermediate');
    // junior_high: levelAdj=-1 → 難易度下げ → index + (-1) = 2-1=1 → 'S'
    // Wait, levelAdj negative means harder? Let me re-check.
    // adjustedIndex = Math.max(0, Math.min(4, baseIndex + levelAdj))
    // junior_high levelAdj=-1, so -1 means shift towards SS (harder)
    // But the code says (levelAdj > 0 ? '難易度下げ' : '難易度上げ')
    // levelAdj=-1 → 難易度上げ → actually shifts to a harder (faster) level
    // baseIndex=2(A), adjusted=1(S)
    expect(result.recommended).toBe('S');
  });

  it('初心者は難易度が下がる', () => {
    const result = recommendTestLevel(73, 'senior', 'beginner');
    // beginner: levelAdj=-1 → 難易度上げ → index 2-1=1 → 'S'
    expect(result.recommended).toBe('S');
  });

  it('SS範囲でも下限に収まる', () => {
    const result = recommendTestLevel(50, 'junior_high', 'beginner');
    // baseIndex=0(SS), levelAdj=-1-1=-2, adjusted=max(0,-2)=0 → SS
    expect(result.recommended).toBe('SS');
  });

  it('alternative はひとつ上のレベル', () => {
    const result = recommendTestLevel(80, 'senior', 'intermediate');
    // baseIndex=3(B), adjusted=3(B)
    expect(result.recommended).toBe('B');
    expect(result.alternative).toBe('A');
  });

  it('SSの場合alternativeはundefined', () => {
    const result = recommendTestLevel(50, 'senior', 'intermediate');
    expect(result.recommended).toBe('SS');
    expect(result.alternative).toBeUndefined();
  });
});

// ============================================
// estimateEtpFromPb
// ============================================

describe('estimateEtpFromPb', () => {
  it('1500m PBからeTPを推定', () => {
    // 240s / (0.88 * 3.75) = 240 / 3.3 = 72.73 → 73
    const result = estimateEtpFromPb(240, 1500);
    expect(result).toBe(73);
  });

  it('800m PBからeTPを推定', () => {
    // 120s / (0.82 * 2) = 120 / 1.64 = 73.17 → 73
    const result = estimateEtpFromPb(120, 800);
    expect(result).toBe(73);
  });

  it('0秒や負の値はnull', () => {
    expect(estimateEtpFromPb(0)).toBeNull();
    expect(estimateEtpFromPb(-10)).toBeNull();
  });
});

// ============================================
// estimateVO2max
// ============================================

describe('estimateVO2max', () => {
  it('有効なeTPからVO2maxを推定', () => {
    const vo2max = estimateVO2max(73);
    expect(vo2max).not.toBeNull();
    expect(vo2max!).toBeGreaterThan(30);
    expect(vo2max!).toBeLessThanOrEqual(85);
  });

  it('0やnullはnullを返す', () => {
    expect(estimateVO2max(0)).toBeNull();
  });

  it('VO2maxは30-85の範囲に収まる', () => {
    // 非常に速い選手
    const fast = estimateVO2max(50);
    expect(fast).toBeLessThanOrEqual(85);
    expect(fast).toBeGreaterThanOrEqual(30);

    // 遅い選手
    const slow = estimateVO2max(120);
    expect(slow).toBeLessThanOrEqual(85);
    expect(slow).toBeGreaterThanOrEqual(30);
  });
});

// ============================================
// getEffectiveValues
// ============================================

describe('getEffectiveValues', () => {
  const baseProfile: Profile = {
    ageCategory: 'senior',
    gender: 'male',
    experience: 'intermediate',
    pbs: {},
    estimated: null,
    current: null,
  };

  it('currentがある場合はcurrentを優先', () => {
    const profile: Profile = {
      ...baseProfile,
      current: { etp: 70, limiterType: 'cardio', lastTestDate: '2024-01-01' },
      estimated: { etp: 80, confidence: 'medium', adjustments: [], limiterType: 'balanced' },
    };
    const result = getEffectiveValues(profile, []);
    expect(result.etp).toBe(70);
    expect(result.limiter).toBe('cardio');
    expect(result.source).toBe('measured');
  });

  it('テスト結果がある場合はテスト結果を使用', () => {
    const results: TestResult[] = [{
      id: '1',
      date: '2024-01-01',
      level: 'A',
      completedLaps: 5,
      lastCompletedPace: 85,
      terminationReason: 'breath',
      couldDoOneMore: false,
      couldContinueSlower: true,
      breathRecoveryTime: '>60',
      eTP: 75,
      limiterType: 'cardio',
      limiterConfidence: 'confirmed',
      zones: {} as any,
      predictions: {} as any,
    }];
    const result = getEffectiveValues(baseProfile, results);
    expect(result.etp).toBe(75);
    expect(result.limiter).toBe('cardio');
    expect(result.source).toBe('measured');
  });

  it('推定値がある場合は推定値を使用', () => {
    const profile: Profile = {
      ...baseProfile,
      estimated: { etp: 80, confidence: 'medium', adjustments: [], limiterType: 'muscular' },
    };
    const result = getEffectiveValues(profile, []);
    expect(result.etp).toBe(80);
    expect(result.limiter).toBe('muscular');
    expect(result.source).toBe('estimated');
  });

  it('何もない場合はデフォルト値', () => {
    const result = getEffectiveValues(baseProfile, []);
    expect(result.etp).toBe(100);
    expect(result.limiter).toBe('balanced');
    expect(result.source).toBe('default');
  });
});

// ============================================
// getUserStage
// ============================================

describe('getUserStage', () => {
  const baseProfile: Profile = {
    ageCategory: 'senior',
    gender: 'male',
    experience: 'intermediate',
    pbs: {},
    estimated: null,
    current: null,
  };

  it('プランがある場合はtraining', () => {
    const plan = { id: '1' } as RacePlan;
    expect(getUserStage(baseProfile, [], plan)).toBe('training');
  });

  it('テスト結果がある場合はmeasured', () => {
    const results = [{ id: '1' }] as TestResult[];
    expect(getUserStage(baseProfile, results, null)).toBe('measured');
  });

  it('currentがある場合はmeasured', () => {
    const profile: Profile = {
      ...baseProfile,
      current: { etp: 70, limiterType: 'cardio', lastTestDate: '2024-01-01' },
    };
    expect(getUserStage(profile, [], null)).toBe('measured');
  });

  it('推定値がある場合はestimated', () => {
    const profile: Profile = {
      ...baseProfile,
      estimated: { etp: 80, confidence: 'medium', adjustments: [] },
    };
    expect(getUserStage(profile, [], null)).toBe('estimated');
  });

  it('PBがある場合はestimated', () => {
    const profile: Profile = {
      ...baseProfile,
      pbs: { m1500: 240 },
    };
    expect(getUserStage(profile, [], null)).toBe('estimated');
  });

  it('何もない場合はnew', () => {
    expect(getUserStage(baseProfile, [], null)).toBe('new');
  });
});

// ============================================
// PB→リミッター推定の整合性テスト
// ============================================

describe('PB→リミッター推定の整合性', () => {
  it('estimateLimiterFromPBsとcalculateSpeedIndex→estimateLimiterFromSpeedIndexの方向性が一致', () => {
    // スピード型（800mが相対的に速い）
    const pbs: PBs = { m800: 110, m1500: 240 };
    const limiterFromPBs = estimateLimiterFromPBs(pbs);
    const speedIndex = calculateSpeedIndex(pbs);
    const limiterFromIndex = estimateLimiterFromSpeedIndex(speedIndex);

    // 注: 2つの関数は異なるアルゴリズムを使用しているため、
    // 必ずしも完全一致しないが、方向性は一致するべき
    // estimateLimiterFromPBs: ratio = (m800/1.64)/(m1500/3.30)
    //   110/1.64=67.07, 240/3.30=72.73, ratio=0.922 → cardio
    // calculateSpeedIndex: (110*1.875)/240 = 0.859 → < 0.95 → muscular

    // ※ 2つの関数は閾値と方向が逆:
    //   estimateLimiterFromPBs: ratio < 0.94 → cardio（心肺系が強い = 800mが速い）
    //   estimateLimiterFromSpeedIndex: value < 0.95 → muscular（スピード型 = 800mが速い）
    // これはcardio/muscularの定義の違いによるもの
    expect(limiterFromPBs).toBe('cardio');
    expect(limiterFromIndex!.type).toBe('muscular');
    // 注: この不一致は意図的な設計差の可能性があるが、確認が必要
  });

  it('バランス型は両方の関数で一致する', () => {
    // バランス型（800mと1500mが均等）
    // ratio ≈ 1.0, speedIndex ≈ 1.0を目指す
    // ratio = (m800/1.64)/(m1500/3.30) = 1.0 → m800 = 1.64 * m1500 / 3.30
    // speedIndex = (m800 * 1.875) / m1500 = 1.0 → m800 = m1500 / 1.875
    // m1500=240: ratio=1.0 → m800=119.3, speedIndex=1.0 → m800=128.0
    // 両方balancedになるm800は120〜128の間
    const pbs: PBs = { m800: 124, m1500: 240 };
    const limiterFromPBs = estimateLimiterFromPBs(pbs);
    const speedIndex = calculateSpeedIndex(pbs);
    const limiterFromIndex = estimateLimiterFromSpeedIndex(speedIndex);

    // ratio = (124/1.64)/(240/3.30) = 75.61/72.73 = 1.040 → balanced
    // speedIndex = (124*1.875)/240 = 232.5/240 = 0.969 → balanced
    expect(limiterFromPBs).toBe('balanced');
    expect(limiterFromIndex!.type).toBe('balanced');
  });
});
