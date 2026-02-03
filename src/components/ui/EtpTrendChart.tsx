// ============================================
// ETP推移グラフコンポーネント
// react-native-svg ベースの折れ線グラフ
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../../constants';
import { LimiterType, TestResult } from '../../types';
import { formatKmPace } from '../../utils';

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
  if (results.length === 0) return null;

  // 時系列順（古い→新しい）に並べ替え
  const sorted = [...results].reverse();

  // グラフ描画パラメータ
  const CHART_WIDTH = 320;
  const CHART_HEIGHT = 140;
  const PADDING_LEFT = 44;
  const PADDING_RIGHT = 16;
  const PADDING_TOP = 16;
  const PADDING_BOTTOM = 28;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // ETP値の範囲（余白付き）
  const etpValues = sorted.map((r) => r.eTP);
  const minEtp = Math.min(...etpValues);
  const maxEtp = Math.max(...etpValues);
  const range = maxEtp - minEtp;
  // 最低5秒の範囲を確保（1件や差が小さい場合）
  const effectiveRange = Math.max(range, 5);
  const yMin = minEtp - effectiveRange * 0.2;
  const yMax = maxEtp + effectiveRange * 0.2;

  // 座標変換（ETPは低いほど速い → Y軸上方向を低い値に）
  const toX = (index: number) => {
    if (sorted.length === 1) return PADDING_LEFT + plotWidth / 2;
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

  // Y軸目盛り（3段階）
  const yTicks = [yMax, (yMin + yMax) / 2, yMin].map((v) => Math.round(v));

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
      <View style={styles.header}>
        <Text style={styles.title}>ETP推移</Text>
        {sorted.length >= 2 && (
          <View style={[styles.changeBadge, change < 0 ? styles.changePositive : change > 0 ? styles.changeNegative : styles.changeNeutral]}>
            <Text style={[styles.changeText, change < 0 ? styles.changeTextPositive : change > 0 ? styles.changeTextNegative : styles.changeTextNeutral]}>
              {change < 0 ? '▲' : change > 0 ? '▼' : '→'} {Math.abs(change).toFixed(1)}秒
            </Text>
          </View>
        )}
      </View>

      {/* 1件のみの場合はポイント表示 */}
      {sorted.length === 1 ? (
        <View style={styles.singleResult}>
          <Text style={styles.singleEtp}>{sorted[0].eTP}秒</Text>
          <Text style={styles.singlePace}>{formatKmPace(sorted[0].eTP)}</Text>
          <View style={[styles.limiterDot, { backgroundColor: LIMITER_COLORS[sorted[0].limiterType] }]} />
          <Text style={styles.singleDate}>{formatDate(sorted[0].date)}</Text>
        </View>
      ) : (
        <>
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
              <Defs>
                <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
                </LinearGradient>
              </Defs>

              {/* Y軸グリッド線 */}
              {yTicks.map((tick, i) => {
                const y = toY(tick);
                return (
                  <React.Fragment key={`tick-${i}`}>
                    <Line x1={PADDING_LEFT} y1={y} x2={CHART_WIDTH - PADDING_RIGHT} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                    <SvgText x={PADDING_LEFT - 6} y={y + 4} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.4)">
                      {tick}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* X軸日付ラベル */}
              {sorted.map((r, i) => {
                // 多すぎる場合は先頭・末尾・中間のみ表示
                const showLabel = sorted.length <= 5 || i === 0 || i === sorted.length - 1 || i === Math.floor(sorted.length / 2);
                if (!showLabel) return null;
                return (
                  <SvgText key={`date-${i}`} x={toX(i)} y={CHART_HEIGHT - 4} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">
                    {formatDate(r.date)}
                  </SvgText>
                );
              })}

              {/* グラデーション塗りつぶし */}
              <Path d={areaPath} fill="url(#areaGradient)" />

              {/* 折れ線 */}
              <Path d={linePath} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

              {/* データポイント */}
              {sorted.map((r, i) => (
                <React.Fragment key={`point-${i}`}>
                  {/* 外枠 */}
                  <Circle cx={toX(i)} cy={toY(r.eTP)} r={5} fill={COLORS.background.dark} />
                  {/* リミッタータイプ別の色付きドット */}
                  <Circle cx={toX(i)} cy={toY(r.eTP)} r={4} fill={LIMITER_COLORS[r.limiterType]} />
                </React.Fragment>
              ))}
            </Svg>
          </View>

          {/* 凡例 */}
          <View style={styles.legend}>
            {(['cardio', 'muscular', 'balanced'] as LimiterType[]).map((type) => {
              const hasType = sorted.some((r) => r.limiterType === type);
              if (!hasType) return null;
              return (
                <View key={type} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: LIMITER_COLORS[type] }]} />
                  <Text style={styles.legendText}>{LIMITER_LABELS[type]}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
    fontSize: 12,
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
  // 1件のみの場合の表示
  singleResult: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  singleEtp: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  singlePace: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  limiterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  singleDate: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  // 凡例
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
});
