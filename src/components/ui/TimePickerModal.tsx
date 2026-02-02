// ============================================
// TimePickerModal Component
// タイム選択モーダル（分:秒形式）
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
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

const ITEM_HEIGHT = 48;
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
  const initialMinutes = Math.floor((value || 0) / 60);
  const initialSeconds = (value || 0) % 60;

  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [selectedSeconds, setSelectedSeconds] = useState(initialSeconds);

  const minutesScrollRef = useRef<ScrollView>(null);
  const secondsScrollRef = useRef<ScrollView>(null);

  // 値が変更されたときにスクロール位置を更新
  useEffect(() => {
    if (visible) {
      const mins = Math.floor((value || 0) / 60);
      const secs = (value || 0) % 60;
      setSelectedMinutes(mins);
      setSelectedSeconds(secs);

      setTimeout(() => {
        minutesScrollRef.current?.scrollTo({
          y: (mins - minMinutes) * ITEM_HEIGHT,
          animated: false,
        });
        secondsScrollRef.current?.scrollTo({
          y: secs * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible, value, minMinutes]);

  // 分の配列を生成
  const minutesArray = Array.from(
    { length: maxMinutes - minMinutes + 1 },
    (_, i) => minMinutes + i
  );

  // 秒の配列を生成（0-59）
  const secondsArray = Array.from({ length: 60 }, (_, i) => i);

  const handleMinutesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const newMinutes = Math.min(Math.max(0, index), minutesArray.length - 1);
    setSelectedMinutes(minutesArray[newMinutes] || minMinutes);
  };

  const handleSecondsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const newSeconds = Math.min(Math.max(0, index), 59);
    setSelectedSeconds(newSeconds);
  };

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onSelect(totalSeconds);
    onClose();
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
              {formatTime(selectedMinutes, selectedSeconds)}
            </Text>
          </View>

          {/* ピッカー */}
          <View style={styles.pickerContainer}>
            {/* 分ピッカー */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>分</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerHighlight} />
                <ScrollView
                  ref={minutesScrollRef}
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinutesScroll}
                  contentContainerStyle={styles.pickerContent}
                >
                  {/* パディング用の空要素 */}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                  {minutesArray.map((min) => (
                    <View key={min} style={styles.pickerItem}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMinutes === min && styles.pickerItemTextSelected,
                        ]}
                      >
                        {min}
                      </Text>
                    </View>
                  ))}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                </ScrollView>
              </View>
            </View>

            {/* コロン */}
            <Text style={styles.colon}>:</Text>

            {/* 秒ピッカー */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>秒</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerHighlight} />
                <ScrollView
                  ref={secondsScrollRef}
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleSecondsScroll}
                  contentContainerStyle={styles.pickerContent}
                >
                  {/* パディング用の空要素 */}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                  {secondsArray.map((sec) => (
                    <View key={sec} style={styles.pickerItem}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedSeconds === sec && styles.pickerItemTextSelected,
                        ]}
                      >
                        {sec.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                  <View style={{ height: ITEM_HEIGHT * 2 }} />
                </ScrollView>
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
    width: '85%',
    maxWidth: 320,
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
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  selectedValue: {
    fontSize: 32,
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
  },
  pickerHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
  },
  picker: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  pickerContent: {
    alignItems: 'center',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  pickerItemText: {
    fontSize: 20,
    color: COLORS.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  pickerItemTextSelected: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  colon: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginHorizontal: 8,
    marginTop: 20,
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
