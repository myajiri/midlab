// ============================================
// TimePickerModal Component
// タイム選択モーダル（分:秒形式）
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

  // 分の配列を生成
  const minutesData = Array.from(
    { length: maxMinutes - minMinutes + 1 },
    (_, i) => minMinutes + i
  );

  // 秒の配列を生成（0-59）
  const secondsData = Array.from({ length: 60 }, (_, i) => i);

  // モーダルが開いたときに値をリセットしてスクロール
  useEffect(() => {
    if (visible) {
      const mins = Math.floor((value || 0) / 60);
      const secs = (value || 0) % 60;
      const clampedMins = Math.max(minMinutes, Math.min(maxMinutes, mins || minMinutes));

      setSelectedMinutes(clampedMins);
      setSelectedSeconds(secs);

      // スクロール位置を設定
      setTimeout(() => {
        const minuteIndex = clampedMins - minMinutes;
        const secondIndex = secs;

        minutesListRef.current?.scrollToIndex({
          index: minuteIndex,
          animated: false,
          viewPosition: 0.5,
        });
        secondsListRef.current?.scrollToIndex({
          index: secondIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [visible, value, minMinutes, maxMinutes]);

  const handleMinutesMomentumEnd = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(minutesData.length - 1, index));
    setSelectedMinutes(minutesData[clampedIndex]);
  }, [minutesData]);

  const handleSecondsMomentumEnd = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(59, index));
    setSelectedSeconds(clampedIndex);
  }, []);

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onSelect(totalSeconds);
    onClose();
  };

  const formatTimeDisplay = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMinuteItem: ListRenderItem<number> = useCallback(({ item }) => {
    const isSelected = item === selectedMinutes;
    return (
      <Pressable
        style={styles.pickerItem}
        onPress={() => {
          setSelectedMinutes(item);
          const index = item - minMinutes;
          minutesListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }}
      >
        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
          {item}
        </Text>
      </Pressable>
    );
  }, [selectedMinutes, minMinutes]);

  const renderSecondItem: ListRenderItem<number> = useCallback(({ item }) => {
    const isSelected = item === selectedSeconds;
    return (
      <Pressable
        style={styles.pickerItem}
        onPress={() => {
          setSelectedSeconds(item);
          secondsListRef.current?.scrollToIndex({
            index: item,
            animated: true,
            viewPosition: 0.5,
          });
        }}
      >
        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
          {item.toString().padStart(2, '0')}
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
                  keyExtractor={(item) => `min-${item}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinutesMomentumEnd}
                  getItemLayout={getItemLayout}
                  ListHeaderComponent={ListHeader}
                  ListFooterComponent={ListFooter}
                  initialNumToRender={20}
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
                  keyExtractor={(item) => `sec-${item}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleSecondsMomentumEnd}
                  getItemLayout={getItemLayout}
                  ListHeaderComponent={ListHeader}
                  ListFooterComponent={ListFooter}
                  initialNumToRender={60}
                  windowSize={11}
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
