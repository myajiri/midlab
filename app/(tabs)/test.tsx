// ============================================
// Test Screen - ETPテスト画面（簡素化版）
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
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
} from '../../src/utils';
import {
  Button,
  SuccessCheckmark,
  SlideIn,
  FadeIn,
  CountUp,
  ScaleIn,
} from '../../src/components/ui';
import {
  COLORS,
  LEVELS,
  PACE_INCREMENT,
  ZONE_COEFFICIENTS_V3,
  RACE_COEFFICIENTS,
} from '../../src/constants';
import {
  LevelName,
  TerminationReason,
  RecoveryTime,
  TestResult,
  ZoneName,
} from '../../src/types';
import { useSetSubScreenOpen } from '../../store/useUIStore';
import { SwipeBackView } from '../../components/SwipeBackView';

export default function TestScreen() {
  const profile = useProfileStore((state) => state.profile);
  const results = useTestResultsStore((state) => state.results);
  const addResult = useTestResultsStore((state) => state.addResult);
  const setCurrent = useProfileStore((state) => state.setCurrent);

  // 推奨レベルを計算
  const getRecommendedLevel = (): LevelName => {
    const latestResult = results?.[0];
    if (latestResult?.eTP) {
      const level = getLevelFromEtp(latestResult.eTP);
      if (level) return level;
    }
    if (profile?.current?.etp) {
      const level = getLevelFromEtp(profile.current.etp);
      if (level) return level;
    }
    if (profile?.estimated?.etp) {
      const level = getLevelFromEtp(profile.estimated.etp);
      if (level) return level;
    }
    return 'A';
  };

  // 状態管理
  const [view, setView] = useState<'main' | 'input' | 'result'>('main');
  const setSubScreenOpen = useSetSubScreenOpen();

  // サブビュー表示中はタブスワイプを無効化
  useEffect(() => {
    const isSubView = view !== 'main';
    setSubScreenOpen(isSubView);
    return () => setSubScreenOpen(false);
  }, [view, setSubScreenOpen]);

  const [level, setLevel] = useState<LevelName>(() => getRecommendedLevel());
  const [completedLaps, setCompletedLaps] = useState(5);
  const [terminationReason, setTerminationReason] = useState<TerminationReason>('both');
  const [breathRecovery, setBreathRecovery] = useState<RecoveryTime>('30-60');
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const config = LEVELS[level];
  const schedule = useMemo(() => generateLapSchedule(level), [level]);
  const maxLaps = config.maxLaps;

  // LCP計算
  const lcp = config.startPace - (completedLaps - 1) * PACE_INCREMENT;

  const handleSubmit = () => {
    const etp = calculateEtpFromTest(lcp);
    const limiterResult = determineLimiterType(
      terminationReason,
      false, // q1は簡略化
      false, // q2は簡略化
      breathRecovery
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
      couldDoOneMore: false,
      couldContinueSlower: false,
      breathRecoveryTime: breathRecovery,
      eTP: etp,
      limiterType: limiterResult.type,
      limiterConfidence: limiterResult.confidence,
      zones,
      predictions,
    };

    addResult(testResult);
    setCurrent(etp, limiterResult.type);
    setLastTestResult(testResult);
    setView('result');
  };

  // リミッター表示用
  const LIMITER_DISPLAY: Record<string, { icon: string; name: string; color: string }> = {
    cardio: { icon: 'heart', name: '心肺リミッター型', color: '#EF4444' },
    muscular: { icon: 'fitness', name: '筋持久力リミッター型', color: '#F97316' },
    balanced: { icon: 'git-compare', name: 'バランス型', color: '#22C55E' },
  };

  // ============================================
  // 結果画面
  // ============================================
  if (view === 'result' && lastTestResult) {
    const limiterInfo = LIMITER_DISPLAY[lastTestResult.limiterType];
    return (
      <SwipeBackView onSwipeBack={() => setView('main')}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          <SuccessCheckmark size={80} color={COLORS.success} />

          <SlideIn direction="up" delay={300}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>テスト完了</Text>
              <Text style={styles.resultDate}>
                {new Date(lastTestResult.date).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          </SlideIn>

          <ScaleIn delay={500}>
            <View style={styles.etpCard}>
              <Text style={styles.etpLabel}>あなたのETP</Text>
              <CountUp value={lastTestResult.eTP} duration={1500} style={styles.etpValue} suffix="秒" />
              <Text style={styles.etpPace}>{formatKmPace(lastTestResult.eTP)}</Text>
            </View>
          </ScaleIn>

          <SlideIn direction="left" delay={700}>
            <View style={[styles.limiterCard, { borderColor: limiterInfo.color }]}>
              <Ionicons name={limiterInfo.icon as any} size={24} color={limiterInfo.color} />
              <Text style={[styles.limiterName, { color: limiterInfo.color }]}>{limiterInfo.name}</Text>
            </View>
          </SlideIn>

          <FadeIn delay={900}>
            <View style={styles.zonesCard}>
              <Text style={styles.cardTitle}>トレーニングゾーン</Text>
              {(['jog', 'easy', 'marathon', 'threshold', 'interval', 'repetition'] as ZoneName[]).map((zone) => {
                const pace = lastTestResult.zones[zone];
                const zoneConfig = ZONE_COEFFICIENTS_V3[zone];
                return (
                  <View key={zone} style={styles.zoneRow}>
                    <View style={styles.zoneInfo}>
                      <View style={[styles.zoneDot, { backgroundColor: zoneConfig.color }]} />
                      <Text style={styles.zoneName}>{zoneConfig.label}</Text>
                    </View>
                    <Text style={styles.zonePace}>{formatKmPace(pace)}</Text>
                  </View>
                );
              })}
            </View>
          </FadeIn>

          <FadeIn delay={1100}>
            <View style={styles.predictionsCard}>
              <Text style={styles.cardTitle}>レース予測</Text>
              <View style={styles.predictionsGrid}>
                {Object.entries(lastTestResult.predictions).map(([key, prediction]) => (
                  <View key={key} style={styles.predictionItem}>
                    <Text style={styles.predictionDistance}>
                      {RACE_COEFFICIENTS[key as keyof typeof RACE_COEFFICIENTS].label}
                    </Text>
                    <Text style={styles.predictionTime}>
                      {formatTime(prediction.min)}-{formatTime(prediction.max)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={1300}>
            <Pressable style={styles.primaryButton} onPress={() => setView('main')}>
              <Text style={styles.primaryButtonText}>完了</Text>
            </Pressable>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
      </SwipeBackView>
    );
  }

  // ============================================
  // 入力画面
  // ============================================
  if (view === 'input') {
    return (
      <SwipeBackView onSwipeBack={() => setView('main')}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => setView('main')}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>結果入力</Text>
            <View style={{ width: 40 }} />
          </View>

          <FadeIn>
            <View style={styles.inputCard}>
              {/* レベル選択 */}
              <Text style={styles.inputLabel}>実施レベル</Text>
              <View style={styles.levelSelector}>
                {(Object.keys(LEVELS) as LevelName[]).map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.levelOption, level === key && styles.levelOptionActive]}
                    onPress={() => {
                      setLevel(key);
                      setCompletedLaps(Math.min(completedLaps, LEVELS[key].maxLaps));
                    }}
                  >
                    <Text style={[styles.levelOptionText, level === key && styles.levelOptionTextActive]}>
                      {key}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </FadeIn>

          <SlideIn delay={100} direction="up">
            <View style={styles.inputCard}>
              {/* 周回数 */}
              <Text style={styles.inputLabel}>完走した周回数</Text>
              <View style={styles.lapsSelector}>
                <Pressable
                  style={styles.lapsButton}
                  onPress={() => setCompletedLaps(Math.max(1, completedLaps - 1))}
                >
                  <Ionicons name="remove" size={24} color={COLORS.text.primary} />
                </Pressable>
                <View style={styles.lapsDisplay}>
                  <Text style={styles.lapsValue}>{completedLaps}</Text>
                  <Text style={styles.lapsMax}>/ {maxLaps}</Text>
                </View>
                <Pressable
                  style={styles.lapsButton}
                  onPress={() => setCompletedLaps(Math.min(maxLaps, completedLaps + 1))}
                >
                  <Ionicons name="add" size={24} color={COLORS.text.primary} />
                </Pressable>
              </View>
              <View style={styles.lcpBadge}>
                <Ionicons name="speedometer" size={14} color={COLORS.primary} />
                <Text style={styles.lcpText}>最終ペース: {formatKmPace(lcp)} ({lcp}秒/400m)</Text>
              </View>
            </View>
          </SlideIn>

          <SlideIn delay={200} direction="up">
            <View style={styles.inputCard}>
              {/* 終了理由 */}
              <Text style={styles.inputLabel}>なぜ止まりましたか？</Text>
              <View style={styles.reasonGrid}>
                {[
                  { value: 'breath' as TerminationReason, label: '息が苦しい', icon: 'fitness' },
                  { value: 'legs' as TerminationReason, label: '脚が重い', icon: 'footsteps' },
                  { value: 'both' as TerminationReason, label: '両方', icon: 'body' },
                ].map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.reasonOption, terminationReason === opt.value && styles.reasonOptionActive]}
                    onPress={() => setTerminationReason(opt.value)}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={20}
                      color={terminationReason === opt.value ? COLORS.primary : COLORS.text.muted}
                    />
                    <Text style={[styles.reasonText, terminationReason === opt.value && styles.reasonTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </SlideIn>

          <SlideIn delay={300} direction="up">
            <View style={styles.inputCard}>
              {/* 回復時間 */}
              <Text style={styles.inputLabel}>息が落ち着くまでの時間</Text>
              <View style={styles.recoveryOptions}>
                {(['<30', '30-60', '>60'] as RecoveryTime[]).map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.recoveryOption, breathRecovery === v && styles.recoveryOptionActive]}
                    onPress={() => setBreathRecovery(v)}
                  >
                    <Text style={[styles.recoveryText, breathRecovery === v && styles.recoveryTextActive]}>
                      {v === '<30' ? '30秒未満' : v === '30-60' ? '30-60秒' : '60秒以上'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </SlideIn>

          <SlideIn delay={400} direction="up">
            <Pressable style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryButtonText}>結果を算出</Text>
            </Pressable>
          </SlideIn>
        </ScrollView>
      </SafeAreaView>
      </SwipeBackView>
    );
  }

  // ============================================
  // メイン画面
  // ============================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <FadeIn>
          <Text style={styles.pageTitle}>ETPテスト</Text>
          <Text style={styles.pageSubtitle}>ETPを測定してトレーニングゾーンを算出</Text>
        </FadeIn>

        {/* クイックスタートカード */}
        <SlideIn delay={100} direction="up">
          <View style={styles.startCard}>
            <View style={styles.startCardHeader}>
              <Ionicons name="timer" size={28} color={COLORS.primary} />
              <View style={styles.startCardTitleRow}>
                <Text style={styles.startCardTitle}>テストを実施</Text>
                <Text style={styles.startCardHint}>400mトラックで実施</Text>
              </View>
            </View>

            {/* レベル選択 */}
            <Text style={styles.levelLabel}>レベル選択</Text>
            <View style={styles.levelTabs}>
              {(Object.keys(LEVELS) as LevelName[]).map((key) => (
                <Pressable
                  key={key}
                  style={[styles.levelTab, level === key && styles.levelTabActive]}
                  onPress={() => setLevel(key)}
                >
                  <Text style={[styles.levelTabText, level === key && styles.levelTabTextActive]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.levelDesc}>{config.description}</Text>

            {/* 簡易スケジュール */}
            <View style={styles.schedulePreview}>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>開始ペース</Text>
                <Text style={styles.scheduleValue}>{formatKmPace(config.startPace)} ({config.startPace}秒)</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>最大周回</Text>
                <Text style={styles.scheduleValue}>{config.maxLaps}周</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>加速</Text>
                <Text style={styles.scheduleValue}>毎周 -4秒</Text>
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={() => setView('input')}>
              <Text style={styles.primaryButtonText}>テスト結果を入力</Text>
            </Pressable>
          </View>
        </SlideIn>

        {/* 進行表（コンパクト） */}
        <SlideIn delay={200} direction="up">
          <Pressable style={styles.scheduleCard}>
            <Text style={styles.cardTitle}>レベル{level} 進行表</Text>
            <View style={styles.scheduleTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableHeaderCell, { width: 40 }]}>周</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>ペース/km</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>400m</Text>
              </View>
              {schedule.map((lap) => (
                <View key={lap.lap} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: 40 }]}>{lap.lap}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{formatKmPace(lap.pace)}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{lap.pace}秒</Text>
                </View>
              ))}
            </View>
          </Pressable>
        </SlideIn>

        {/* テスト履歴 */}
        {results && results.length > 0 && (
          <SlideIn delay={300} direction="up">
            <Pressable style={styles.historyCard} onPress={() => setShowHistory(!showHistory)}>
              <View style={styles.historyHeader}>
                <Text style={styles.cardTitle}>過去の結果</Text>
                <Ionicons
                  name={showHistory ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.text.muted}
                />
              </View>

              {/* 最新結果のみ常に表示 */}
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>
                    {new Date(results[0].date).toLocaleDateString('ja-JP')}
                  </Text>
                  <Text style={styles.historyLevel}>Lv.{results[0].level}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyEtp}>{formatKmPace(results[0].eTP)}</Text>
                  <Text style={styles.historyEtpSec}>{results[0].eTP}秒/400m</Text>
                </View>
              </View>

              {/* 展開時に追加表示 */}
              {showHistory && results.slice(1, 5).map((result) => (
                <View key={result.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>
                      {new Date(result.date).toLocaleDateString('ja-JP')}
                    </Text>
                    <Text style={styles.historyLevel}>Lv.{result.level}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyEtp}>{formatKmPace(result.eTP)}</Text>
                    <Text style={styles.historyEtpSec}>{result.eTP}秒/400m</Text>
                  </View>
                </View>
              ))}
            </Pressable>
          </SlideIn>
        )}

        {/* 簡易ガイド */}
        <SlideIn delay={400} direction="up">
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>テストの流れ</Text>
            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>1</Text></View>
                <Text style={styles.guideStepText}>レベルを選択して開始ペースを確認</Text>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>2</Text></View>
                <Text style={styles.guideStepText}>400mトラックで各周のペースを守る</Text>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>3</Text></View>
                <Text style={styles.guideStepText}>2秒以上遅れたら終了→結果を入力</Text>
              </View>
            </View>
          </View>
        </SlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// スタイル
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
    padding: 20,
    paddingBottom: 40,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  // ページタイトル
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 24,
  },

  // スタートカード
  startCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  startCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  startCardTitleRow: {
    flex: 1,
  },
  startCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  startCardHint: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
  },

  // レベル選択
  levelLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  levelTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  levelTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  levelTabActive: {
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
  levelDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 16,
    lineHeight: 18,
  },

  // スケジュールプレビュー
  schedulePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleLabel: {
    fontSize: 13,
    color: COLORS.text.muted,
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
  },

  // プライマリボタン
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // 進行表カード
  scheduleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 12,
  },
  scheduleTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  tableHeaderCell: {
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  tableMore: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // 履歴カード
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyDate: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  historyLevel: {
    fontSize: 12,
    color: COLORS.text.muted,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyEtp: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  historyEtpSec: {
    fontSize: 11,
    color: COLORS.text.muted,
  },

  // ガイドカード
  guideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
    marginBottom: 12,
  },
  guideSteps: {
    gap: 10,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guideStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideStepNumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  guideStepText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // 入力フォーム
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  levelSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 4,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  levelOptionActive: {
    backgroundColor: COLORS.primary,
  },
  levelOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  levelOptionTextActive: {
    color: '#fff',
  },

  // 周回数セレクター
  lapsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  lapsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  lapsValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lapsMax: {
    fontSize: 18,
    color: COLORS.text.muted,
    marginLeft: 4,
  },
  lcpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
  },
  lcpText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // 終了理由
  reasonGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  reasonOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  reasonOptionActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  reasonTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // 回復時間
  recoveryOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  recoveryOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  recoveryOptionActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
  },
  recoveryText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  recoveryTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // 結果画面
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  etpCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  etpLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  etpValue: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  etpPace: {
    fontSize: 18,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  limiterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  limiterName: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ゾーンカード
  zonesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneName: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  zonePace: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  // 予測カード
  predictionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  predictionItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  predictionDistance: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  predictionTime: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});
