// ============================================
// Test Screen - Single MeasureTab (rise-test style)
// ============================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useProfileStore,
  useTestResultsStore,
} from '../../src/stores/useAppStore';
import {
  formatTime,
  formatKmPace,
  calculateEtpFromTest,
  calculateZonesV3,
  calculateRacePredictions,
  determineLimiterType,
  generateLapSchedule,
  getLevelFromEtp,
  recommendTestLevel,
} from '../../src/utils';
import { Button } from '../../src/components/ui';
import {
  COLORS,
  LEVELS,
  PACE_INCREMENT,
} from '../../src/constants';
import {
  LevelName,
  TerminationReason,
  RecoveryTime,
  TestResult,
} from '../../src/types';

// レベル調整（初回テスト用）
const adjustLevel = (level: LevelName, isFirstTest: boolean): LevelName => {
  if (!isFirstTest) return level;
  const levels: LevelName[] = ['SS', 'S', 'A', 'B', 'C'];
  const idx = levels.indexOf(level);
  return idx < levels.length - 1 ? levels[idx + 1] : level;
};

export default function TestScreen() {
  const profile = useProfileStore((state) => state.profile);
  const results = useTestResultsStore((state) => state.results);
  const addResult = useTestResultsStore((state) => state.addResult);
  const setCurrent = useProfileStore((state) => state.setCurrent);

  // 推奨レベルを計算（PB/eTPから自動算定）
  const getRecommendedLevel = (): LevelName => {
    // 1. 過去のテスト結果から
    const latestResult = results?.[0];
    if (latestResult?.eTP) {
      const level = getLevelFromEtp(latestResult.eTP);
      if (level) return level;
    }
    // 2. プロファイルのcurrent eTPから
    if (profile?.current?.etp) {
      const level = getLevelFromEtp(profile.current.etp);
      if (level) return level;
    }
    // 3. プロファイルのestimated eTPから
    if (profile?.estimated?.etp) {
      const level = getLevelFromEtp(profile.estimated.etp);
      if (level) return level;
    }
    // 4. 1500m PBからeTPを推定してレベルを算定
    if (profile?.pbs?.m1500) {
      // 1500m PBからeTPを推定（PB / 3.30）
      const estimatedEtp = Math.round(profile.pbs.m1500 / 3.30);
      const rec = recommendTestLevel(
        estimatedEtp,
        profile?.ageCategory || 'senior',
        profile?.experience || 'intermediate'
      );
      if (rec?.recommended) return rec.recommended;
    }
    return 'A';
  };

  const [showInput, setShowInput] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
  const [level, setLevel] = useState<LevelName>(() => getRecommendedLevel());
  const [isFirstTest, setIsFirstTest] = useState(false);
  const [completedLaps, setCompletedLaps] = useState(5);
  const [terminationReason, setTerminationReason] = useState<TerminationReason>('both');
  const [q1, setQ1] = useState(false); // もう1周できそうだった？
  const [q2, setQ2] = useState(false); // 5秒遅ければ続けられた？
  const [q3, setQ3] = useState<RecoveryTime>('30-60'); // 息が落ち着くまで

  const effectiveLevel = adjustLevel(level, isFirstTest);
  const config = LEVELS[effectiveLevel];
  const schedule = useMemo(() => generateLapSchedule(effectiveLevel), [effectiveLevel]);
  const maxLaps = LEVELS[level].maxLaps;

  // LCP計算（Last Completed Pace）
  const calculateLCP = (lvl: LevelName, laps: number): number => {
    const cfg = LEVELS[lvl];
    return cfg.startPace - (laps - 1) * PACE_INCREMENT;
  };
  const lcp = calculateLCP(level, completedLaps);

  const handleSubmit = () => {
    const etp = calculateEtpFromTest(lcp);
    const limiterResult = determineLimiterType(
      terminationReason,
      q1,
      q2,
      q3
    );
    const zones = calculateZonesV3(etp, limiterResult.type);
    const predictions = calculateRacePredictions(etp, limiterResult.type);

    const testResult: TestResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      level,
      completedLaps,
      lastCompletedPace: lcp,
      terminationReason,
      couldDoOneMore: q1,
      couldContinueSlower: q2,
      breathRecoveryTime: q3,
      eTP: etp,
      limiterType: limiterResult.type,
      limiterConfidence: limiterResult.confidence,
      zones,
      predictions,
    };

    addResult(testResult);
    setCurrent(etp, limiterResult.type);
    setLastTestResult(testResult);
    setShowInput(false);
    setShowResult(true);
  };

  // リミッター表示用
  const LIMITER_DISPLAY: Record<string, { icon: string; name: string; color: string }> = {
    cardio: { icon: 'heart', name: '心肺リミッター型', color: '#EF4444' },
    muscular: { icon: 'fitness', name: '筋持久力リミッター型', color: '#F97316' },
    balanced: { icon: 'git-compare', name: 'バランス型', color: '#22C55E' },
  };

  // 結果表示画面
  if (showResult && lastTestResult) {
    const limiterInfo = LIMITER_DISPLAY[lastTestResult.limiterType];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* ヘッダー */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultHeaderTitle}>テスト結果</Text>
            <Text style={styles.resultHeaderDate}>
              {new Date(lastTestResult.date).toLocaleDateString('ja-JP')}
            </Text>
          </View>

          {/* eTPカード */}
          <View style={styles.etpResultCard}>
            <Text style={styles.etpResultLabel}>あなたのeTP</Text>
            <Text style={styles.etpResultValue}>{lastTestResult.eTP}秒</Text>
            <Text style={styles.etpResultPace}>{formatKmPace(lastTestResult.eTP)}</Text>
          </View>

          {/* リミッタータイプ */}
          <View style={[styles.limiterResultCard, { borderColor: limiterInfo.color }]}>
            <Ionicons name={limiterInfo.icon as any} size={28} color={limiterInfo.color} />
            <View style={styles.limiterResultInfo}>
              <Text style={[styles.limiterResultName, { color: limiterInfo.color }]}>
                {limiterInfo.name}
              </Text>
              <Text style={styles.limiterResultConfidence}>
                確信度: {lastTestResult.limiterConfidence === 'confirmed' ? '高' : '中'}
              </Text>
            </View>
          </View>

          {/* テスト詳細 */}
          <View style={styles.testDetailCard}>
            <Text style={styles.testDetailTitle}>テスト詳細</Text>
            <View style={styles.testDetailRow}>
              <Text style={styles.testDetailLabel}>レベル</Text>
              <Text style={styles.testDetailValue}>{lastTestResult.level}</Text>
            </View>
            <View style={styles.testDetailRow}>
              <Text style={styles.testDetailLabel}>完走周回数</Text>
              <Text style={styles.testDetailValue}>{lastTestResult.completedLaps}周</Text>
            </View>
            <View style={styles.testDetailRow}>
              <Text style={styles.testDetailLabel}>最終ペース</Text>
              <Text style={styles.testDetailValue}>{lastTestResult.lastCompletedPace}秒/400m</Text>
            </View>
          </View>

          {/* ボタン */}
          <Button
            title="完了"
            onPress={() => setShowResult(false)}
            fullWidth
            style={styles.completeBtn}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 結果入力フォーム
  if (showInput) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* ヘッダー */}
          <View style={styles.inputHeader}>
            <Pressable style={styles.backButton} onPress={() => setShowInput(false)}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.inputHeaderTitle}>結果入力</Text>
          </View>

          {/* 実施レベル */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>実施レベル</Text>
            <View style={styles.levelTabs}>
              {(Object.keys(LEVELS) as LevelName[]).map((key) => (
                <Pressable
                  key={key}
                  style={[styles.levelTabBtn, level === key && styles.levelTabBtnActive]}
                  onPress={() => {
                    setLevel(key);
                    setCompletedLaps(Math.min(completedLaps, LEVELS[key].maxLaps));
                  }}
                >
                  <Text style={[styles.levelTabText, level === key && styles.levelTabTextActive]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 完遂周回数 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>完遂周回数</Text>
            <View style={styles.lapsInput}>
              <Pressable
                style={styles.lapsBtn}
                onPress={() => setCompletedLaps(Math.max(1, completedLaps - 1))}
              >
                <Text style={styles.lapsBtnText}>−</Text>
              </Pressable>
              <Text style={styles.lapsValue}>{completedLaps}</Text>
              <Pressable
                style={styles.lapsBtn}
                onPress={() => setCompletedLaps(Math.min(maxLaps, completedLaps + 1))}
              >
                <Text style={styles.lapsBtnText}>+</Text>
              </Pressable>
              <Text style={styles.lapsUnit}>周 / {maxLaps}周</Text>
            </View>
            <View style={styles.lcpDisplay}>
              <Text style={styles.lcpText}>
                → LCP: <Text style={styles.lcpValue}>{lcp}秒</Text> ({formatKmPace(lcp)})
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 終了理由 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>なぜ止まりましたか？</Text>
            {[
              { value: 'breath' as TerminationReason, label: '息が苦しい' },
              { value: 'legs' as TerminationReason, label: '脚が重い' },
              { value: 'both' as TerminationReason, label: '両方' },
              { value: 'other' as TerminationReason, label: 'その他' },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.radioOption, terminationReason === opt.value && styles.radioOptionSelected]}
                onPress={() => setTerminationReason(opt.value)}
              >
                <View style={[styles.radioCircle, terminationReason === opt.value && styles.radioCircleSelected]} />
                <Text style={[styles.radioText, terminationReason === opt.value && styles.radioTextSelected]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          {/* 補助質問 */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>補助質問</Text>

            {/* Q1 */}
            <View style={styles.subQuestion}>
              <Text style={styles.subQuestionText}>Q1. もう1周できそうだった？</Text>
              <View style={styles.boolOptions}>
                <Pressable
                  style={[styles.boolBtn, q1 && styles.boolBtnSelected]}
                  onPress={() => setQ1(true)}
                >
                  <Text style={[styles.boolBtnText, q1 && styles.boolBtnTextSelected]}>はい</Text>
                </Pressable>
                <Pressable
                  style={[styles.boolBtn, !q1 && styles.boolBtnSelected]}
                  onPress={() => setQ1(false)}
                >
                  <Text style={[styles.boolBtnText, !q1 && styles.boolBtnTextSelected]}>いいえ</Text>
                </Pressable>
              </View>
            </View>

            {/* Q2 */}
            <View style={styles.subQuestion}>
              <Text style={styles.subQuestionText}>Q2. 5秒遅ければ続けられた？</Text>
              <View style={styles.boolOptions}>
                <Pressable
                  style={[styles.boolBtn, q2 && styles.boolBtnSelected]}
                  onPress={() => setQ2(true)}
                >
                  <Text style={[styles.boolBtnText, q2 && styles.boolBtnTextSelected]}>はい</Text>
                </Pressable>
                <Pressable
                  style={[styles.boolBtn, !q2 && styles.boolBtnSelected]}
                  onPress={() => setQ2(false)}
                >
                  <Text style={[styles.boolBtnText, !q2 && styles.boolBtnTextSelected]}>いいえ</Text>
                </Pressable>
              </View>
            </View>

            {/* Q3 */}
            <View style={styles.subQuestion}>
              <Text style={styles.subQuestionText}>Q3. 息が落ち着くまで？</Text>
              <View style={styles.tripleOptions}>
                {(['<30', '30-60', '>60'] as RecoveryTime[]).map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.tripleBtn, q3 === v && styles.tripleBtnSelected]}
                    onPress={() => setQ3(v)}
                  >
                    <Text style={[styles.tripleBtnText, q3 === v && styles.tripleBtnTextSelected]}>
                      {v === '<30' ? '30秒未満' : v === '30-60' ? '30-60秒' : '60秒以上'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Button title="結果を算出" onPress={handleSubmit} fullWidth style={styles.submitBtn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // メイン画面（スケジュール表示）
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <Text style={styles.sectionTitle}>テスト測定</Text>

        {/* レベルタブ */}
        <View style={styles.levelTabs}>
          {(Object.keys(LEVELS) as LevelName[]).map((key) => (
            <Pressable
              key={key}
              style={[styles.levelTabBtn, level === key && styles.levelTabBtnActive]}
              onPress={() => setLevel(key)}
            >
              <Text style={[styles.levelTabText, level === key && styles.levelTabTextActive]}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* レベル説明 */}
        <Text style={styles.levelDescription}>{LEVELS[level].description}</Text>

        {/* 初回テストチェックボックス */}
        <Pressable
          style={styles.firstTestOption}
          onPress={() => setIsFirstTest(!isFirstTest)}
        >
          <View style={[styles.checkbox, isFirstTest && styles.checkboxChecked]}>
            {isFirstTest && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.firstTestText}>初回テスト（1段階遅いレベルで開始）</Text>
        </Pressable>

        {/* 調整後レベル表示 */}
        {isFirstTest && level !== effectiveLevel && (
          <View style={styles.adjustedNotice}>
            <Text style={styles.adjustedText}>→ 調整後: レベル {effectiveLevel}</Text>
          </View>
        )}

        {/* スケジュールヘッダー */}
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>レベル{effectiveLevel} 進行表</Text>
          <Text style={styles.scheduleInfo}>
            開始: {config.startPace}秒 ({formatKmPace(config.startPace)}) / 最大: {config.maxLaps}周
          </Text>
        </View>

        {/* スケジュールテーブル */}
        <View style={styles.scheduleTable}>
          {/* ヘッダー行 */}
          <View style={styles.scheduleRow}>
            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.colLap]}>周</Text>
            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.col400m]}>400m</Text>
            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.col100m]}>100m</Text>
            <Text style={[styles.scheduleCell, styles.scheduleCellHeader, styles.colKm]}>キロ換算</Text>
          </View>
          {/* データ行 */}
          {schedule.map((lap) => (
            <View key={lap.lap} style={styles.scheduleRow}>
              <Text style={[styles.scheduleCell, styles.colLap]}>{lap.lap}</Text>
              <Text style={[styles.scheduleCell, styles.col400m]}>{lap.pace}秒</Text>
              <Text style={[styles.scheduleCell, styles.col100m]}>{(lap.pace / 4).toFixed(1)}秒</Text>
              <Text style={[styles.scheduleCell, styles.colKm]}>{formatKmPace(lap.pace)}</Text>
            </View>
          ))}
        </View>

        {/* 終了条件 */}
        <Text style={styles.terminationNote}>終了条件: 設定タイムより2秒以上遅延</Text>

        {/* 結果入力ボタン */}
        <Button
          title="✏️ 結果を入力する"
          onPress={() => setShowInput(true)}
          fullWidth
          style={styles.inputButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    paddingBottom: 32,
  },

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 20,
  },

  // Level Tabs
  levelTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  levelTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  levelTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  levelTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  levelTabTextActive: {
    color: '#fff',
  },

  // Level Description
  levelDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },

  // First Test Option
  firstTestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.text.secondary,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  firstTestText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // Adjusted Notice
  adjustedNotice: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  adjustedText: {
    fontSize: 14,
    color: '#EAB308',
  },

  // Schedule Header
  scheduleHeader: {
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  scheduleInfo: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // Schedule Table
  scheduleTable: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  scheduleCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  scheduleCellHeader: {
    color: COLORS.text.secondary,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  colLap: {
    width: 40,
    textAlign: 'center',
  },
  col400m: {
    flex: 1,
    textAlign: 'center',
  },
  col100m: {
    flex: 1,
    textAlign: 'center',
  },
  colKm: {
    flex: 1.2,
    textAlign: 'center',
  },

  // Termination Note
  terminationNote: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginBottom: 20,
  },

  // Input Button
  inputButton: {
    marginTop: 8,
  },

  // Input Form
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  inputHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },

  // Laps Input
  lapsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lapsBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapsBtnText: {
    fontSize: 24,
    color: COLORS.text.primary,
    fontWeight: '300',
  },
  lapsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 50,
    textAlign: 'center',
  },
  lapsUnit: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  lcpDisplay: {
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  lcpText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  lcpValue: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },

  // Radio Options
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.text.secondary,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  radioTextSelected: {
    color: COLORS.text.primary,
  },

  // Sub Questions
  subQuestion: {
    marginBottom: 16,
  },
  subQuestionText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  boolOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  boolBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  boolBtnSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
  },
  boolBtnText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  boolBtnTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  tripleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  tripleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tripleBtnSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
  },
  tripleBtnText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  tripleBtnTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Submit Button
  submitBtn: {
    marginTop: 12,
  },

  // Result Screen
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  resultHeaderDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  etpResultCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  etpResultLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  etpResultValue: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  etpResultPace: {
    fontSize: 18,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  limiterResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    gap: 12,
  },
  limiterResultInfo: {
    flex: 1,
  },
  limiterResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  limiterResultConfidence: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  testDetailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  testDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  testDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  testDetailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  testDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  completeBtn: {
    marginTop: 8,
  },
});
