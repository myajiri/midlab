// ============================================
// ETP推移グラフコンポーネント（コンパクト版）
// ステータスカード内に埋め込むための軽量チャート
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../../constants';
import { LimiterType, TestResult } from '../../types';

// リミッタータイプ別の色
const LIMITER_COLORS: Record<LimiterType, string> = {
  cardio: '#EF4444',
  muscular: '#F97316',
  balanced: '#22C55E',
};

const LIMITER_LABELS: Record<LimiterType, string> = {
  cardio: '心肺',
  muscular: '筋持久力',
  balanced: 'バランス',
};

interface EtpTrendChartProps {
  results: TestResult[];
}

export const EtpTrendChart: React.FC<EtpTrendChartProps> = ({ results }) => {
  // 2件未満は推移が見えないので非表示
  if (results.length < 2) return null;

  // 時系列順（古い→新しい）に並べ替え
  const sorted = [...results].reverse();

  // コンパクトなグラフ描画パラメータ
  const CHART_WIDTH = 280;
  const CHART_HEIGHT = 80;
  const PADDING_LEFT = 32;
  const PADDING_RIGHT = 12;
  const PADDING_TOP = 8;
  const PADDING_BOTTOM = 20;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // ETP値の範囲（余白付き）
  const etpValues = sorted.map((r) => r.eTP);
  const minEtp = Math.min(...etpValues);
  const maxEtp = Math.max(...etpValues);
  const range = maxEtp - minEtp;
  const effectiveRange = Math.max(range, 3);
  const yMin = minEtp - effectiveRange * 0.15;
  const yMax = maxEtp + effectiveRange * 0.15;

  // 座標変換
  const toX = (index: number) => {
    return PADDING_LEFT + (index / (sorted.length - 1)) * plotWidth;
  };
  const toY = (etp: number) => {
    return PADDING_TOP + ((etp - yMin) / (yMax - yMin)) * plotHeight;
  };

  // 折れ線パスを生成
  const points = sorted.map((r, i) => ({ x: toX(i), y: toY(r.eTP) }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // グラデーション塗りつぶしパス
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${PADDING_TOP + plotHeight}` +
    ` L ${points[0].x} ${PADDING_TOP + plotHeight} Z`;

  // Y軸目盛り（上下2つのみ）
  const yTicks = [maxEtp, minEtp].map((v) => Math.round(v));

  // 変化量の計算
  const firstEtp = sorted[0].eTP;
  const lastEtp = sorted[sorted.length - 1].eTP;
  const change = lastEtp - firstEtp;

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー行 */}
      <View style={styles.header}>
        <Text style={styles.title}>推移</Text>
        <View style={[styles.changeBadge, change < 0 ? styles.changePositive : change > 0 ? styles.changeNegative : styles.changeNeutral]}>
          <Text style={[styles.changeText, change < 0 ? styles.changeTextPositive : change > 0 ? styles.changeTextNegative : styles.changeTextNeutral]}>
            {change < 0 ? '▲' : change > 0 ? '▼' : '→'} {Math.abs(change).toFixed(1)}秒
          </Text>
        </View>
      </View>

      {/* チャート */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Y軸目盛り線 */}
          {yTicks.map((tick, i) => {
            const y = toY(tick);
            return (
              <React.Fragment key={`tick-${i}`}>
                <Line x1={PADDING_LEFT} y1={y} x2={CHART_WIDTH - PADDING_RIGHT} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                <SvgText x={PADDING_LEFT - 4} y={y + 3} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.35)">
                  {tick}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* X軸日付（先頭と末尾のみ） */}
          <SvgText x={toX(0)} y={CHART_HEIGHT - 4} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)">
            {formatDate(sorted[0].date)}
          </SvgText>
          <SvgText x={toX(sorted.length - 1)} y={CHART_HEIGHT - 4} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)">
            {formatDate(sorted[sorted.length - 1].date)}
          </SvgText>

          {/* グラデーション塗りつぶし */}
          <Path d={areaPath} fill="url(#areaGradient)" />

          {/* 折れ線 */}
          <Path d={linePath} fill="none" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* データポイント */}
          {sorted.map((r, i) => (
            <React.Fragment key={`point-${i}`}>
              <Circle cx={toX(i)} cy={toY(r.eTP)} r={3.5} fill={COLORS.background.dark} />
              <Circle cx={toX(i)} cy={toY(r.eTP)} r={3} fill={LIMITER_COLORS[r.limiterType]} />
            </React.Fragment>
          ))}
        </Svg>
      </View>

      {/* 凡例（出現タイプのみ、コンパクト） */}
      <View style={styles.legend}>
        {(['cardio', 'muscular', 'balanced'] as LimiterType[]).map((type) => {
          if (!sorted.some((r) => r.limiterType === type)) return null;
          return (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LIMITER_COLORS[type] }]} />
              <Text style={styles.legendText}>{LIMITER_LABELS[type]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  changePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  changeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  changeNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  changeTextPositive: {
    color: '#22C55E',
  },
  changeTextNegative: {
    color: '#EF4444',
  },
  changeTextNeutral: {
    color: COLORS.text.secondary,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
});
