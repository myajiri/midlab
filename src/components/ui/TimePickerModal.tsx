// ============================================
// TimePickerModal Component
// タイム選択モーダル（分:秒形式）
// 循環型ピッカー（0↔59でループ）
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (totalSeconds: number) => void;
  value?: number; // 秒単位
  title?: string;
  minMinutes?: number;
  maxMinutes?: number;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const REPEAT_COUNT = 3; // 循環用に3回繰り返す

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  value = 0,
  title = 'タイムを選択',
  minMinutes = 0,
  maxMinutes = 60,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(Math.floor((value || 0) / 60));
  const [selectedSeconds, setSelectedSeconds] = useState((value || 0) % 60);

  const minutesListRef = useRef<FlatList>(null);
  const secondsListRef = useRef<FlatList>(null);

  // 分の基本配列を生成
  const minutesBase = Array.from(
    { length: maxMinutes - minMinutes + 1 },
    (_, i) => minMinutes + i
  );

  // 秒の基本配列を生成（0-59）
  const secondsBase = Array.from({ length: 60 }, (_, i) => i);

  // 循環用に配列を繰り返す
  const minutesData = minutesBase.length > 1
    ? [...minutesBase, ...minutesBase, ...minutesBase]
    : minutesBase;
  const secondsData = [...secondsBase, ...secondsBase, ...secondsBase];

  // 中央のセットの開始インデックス
  const minutesCenterOffset = minutesBase.length;
  const secondsCenterOffset = 60; // secondsBase.length

  // モーダルが開いたときに値をリセットしてスクロール
  useEffect(() => {
    if (visible) {
      const mins = Math.floor((value || 0) / 60);
      const secs = (value || 0) % 60;
      const clampedMins = Math.max(minMinutes, Math.min(maxMinutes, mins || minMinutes));

      setSelectedMinutes(clampedMins);
      setSelectedSeconds(secs);

      // 中央のセットにスクロール
      setTimeout(() => {
        const minuteIndex = minutesCenterOffset + (clampedMins - minMinutes);
        const secondIndex = secondsCenterOffset + secs;

        minutesListRef.current?.scrollToOffset({
          offset: minuteIndex * ITEM_HEIGHT,
          animated: false,
        });
        secondsListRef.current?.scrollToOffset({
          offset: secondIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible, value, minMinutes, maxMinutes]);

  // 分のスクロール終了時
  const handleMinutesMomentumEnd = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    if (minutesBase.length <= 1) {
      setSelectedMinutes(minutesBase[0]);
      return;
    }

    // 実際の値を計算
    const actualIndex = index % minutesBase.length;
    const actualValue = minutesBase[actualIndex];
    setSelectedMinutes(actualValue);

    // 端に近い場合は中央にジャンプ
    if (index < minutesBase.length || index >= minutesBase.length * 2) {
      const centerIndex = minutesCenterOffset + actualIndex;
      setTimeout(() => {
        minutesListRef.current?.scrollToOffset({
          offset: centerIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [minutesBase, minutesCenterOffset]);

  // 秒のスクロール終了時
  const handleSecondsMomentumEnd = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    // 実際の値を計算（0-59にマップ）
    const actualIndex = ((index % 60) + 60) % 60;
    setSelectedSeconds(actualIndex);

    // 端に近い場合は中央にジャンプ
    if (index < 60 || index >= 120) {
      const centerIndex = secondsCenterOffset + actualIndex;
      setTimeout(() => {
        secondsListRef.current?.scrollToOffset({
          offset: centerIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [secondsCenterOffset]);

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onSelect(totalSeconds);
    onClose();
  };

  const formatTimeDisplay = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMinuteItem: ListRenderItem<number> = useCallback(({ item, index }) => {
    const actualValue = minutesBase.length > 1
      ? minutesBase[index % minutesBase.length]
      : item;
    const isSelected = actualValue === selectedMinutes;
    return (
      <Pressable
        style={styles.pickerItem}
        onPress={() => {
          setSelectedMinutes(actualValue);
          minutesListRef.current?.scrollToOffset({
            offset: index * ITEM_HEIGHT,
            animated: true,
          });
        }}
      >
        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
          {actualValue}
        </Text>
      </Pressable>
    );
  }, [selectedMinutes, minutesBase]);

  const renderSecondItem: ListRenderItem<number> = useCallback(({ item, index }) => {
    const actualValue = index % 60;
    const isSelected = actualValue === selectedSeconds;
    return (
      <Pressable
        style={styles.pickerItem}
        onPress={() => {
          setSelectedSeconds(actualValue);
          secondsListRef.current?.scrollToOffset({
            offset: index * ITEM_HEIGHT,
            animated: true,
          });
        }}
      >
        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
          {actualValue.toString().padStart(2, '0')}
        </Text>
      </Pressable>
    );
  }, [selectedSeconds]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const ListHeader = () => <View style={{ height: ITEM_HEIGHT * 2 }} />;
  const ListFooter = () => <View style={{ height: ITEM_HEIGHT * 2 }} />;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text.secondary} />
            </Pressable>
          </View>

          {/* 選択中の値表示 */}
          <View style={styles.selectedDisplay}>
            <Text style={styles.selectedValue}>
              {formatTimeDisplay(selectedMinutes, selectedSeconds)}
            </Text>
          </View>

          {/* ピッカー */}
          <View style={styles.pickerContainer}>
            {/* 分ピッカー */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>分</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerHighlight} />
                <FlatList
                  ref={minutesListRef}
                  data={minutesData}
                  renderItem={renderMinuteItem}
                  keyExtractor={(_, index) => `min-${index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinutesMomentumEnd}
                  getItemLayout={getItemLayout}
                  ListHeaderComponent={ListHeader}
                  ListFooterComponent={ListFooter}
                  initialNumToRender={30}
                  windowSize={11}
                />
              </View>
            </View>

            {/* コロン */}
            <Text style={styles.colon}>:</Text>

            {/* 秒ピッカー */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>秒</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerHighlight} />
                <FlatList
                  ref={secondsListRef}
                  data={secondsData}
                  renderItem={renderSecondItem}
                  keyExtractor={(_, index) => `sec-${index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleSecondsMomentumEnd}
                  getItemLayout={getItemLayout}
                  ListHeaderComponent={ListHeader}
                  ListFooterComponent={ListFooter}
                  initialNumToRender={90}
                  windowSize={15}
                />
              </View>
            </View>
          </View>

          {/* ボタン */}
          <View style={styles.buttons}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>選択</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.background.dark,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  selectedDisplay: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  selectedValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  pickerWrapper: {
    position: 'relative',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 80,
    overflow: 'hidden',
  },
  pickerHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  pickerItemText: {
    fontSize: 22,
    color: COLORS.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  pickerItemTextSelected: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 24,
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginHorizontal: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
