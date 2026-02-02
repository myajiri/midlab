// ============================================
// TimePickerModal Component
// タイム選択モーダル（分:秒形式）
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
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

  // モーダルが開いたときに値をリセット
  useEffect(() => {
    if (visible) {
      const mins = Math.floor((value || 0) / 60);
      const secs = (value || 0) % 60;
      // minMinutesの範囲内に収める
      setSelectedMinutes(Math.max(minMinutes, Math.min(maxMinutes, mins || minMinutes)));
      setSelectedSeconds(secs);
    }
  }, [visible, value, minMinutes, maxMinutes]);

  // 分の配列を生成
  const minutesArray = Array.from(
    { length: maxMinutes - minMinutes + 1 },
    (_, i) => minMinutes + i
  );

  // 秒の配列を生成（0-59、5秒刻み）
  const secondsArray = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onSelect(totalSeconds);
    onClose();
  };

  const formatTimeDisplay = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 分を増減
  const incrementMinutes = () => {
    setSelectedMinutes(prev => Math.min(maxMinutes, prev + 1));
  };

  const decrementMinutes = () => {
    setSelectedMinutes(prev => Math.max(minMinutes, prev - 1));
  };

  // 秒を増減（5秒刻み）
  const incrementSeconds = () => {
    setSelectedSeconds(prev => {
      const next = prev + 5;
      if (next >= 60) {
        if (selectedMinutes < maxMinutes) {
          setSelectedMinutes(selectedMinutes + 1);
          return 0;
        }
        return 55;
      }
      return next;
    });
  };

  const decrementSeconds = () => {
    setSelectedSeconds(prev => {
      const next = prev - 5;
      if (next < 0) {
        if (selectedMinutes > minMinutes) {
          setSelectedMinutes(selectedMinutes - 1);
          return 55;
        }
        return 0;
      }
      return next;
    });
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
              {formatTimeDisplay(selectedMinutes, selectedSeconds)}
            </Text>
          </View>

          {/* ピッカー */}
          <View style={styles.pickerContainer}>
            {/* 分ピッカー */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>分</Text>
              <View style={styles.spinnerControl}>
                <Pressable
                  style={styles.spinnerButton}
                  onPress={incrementMinutes}
                  disabled={selectedMinutes >= maxMinutes}
                >
                  <Ionicons
                    name="chevron-up"
                    size={28}
                    color={selectedMinutes >= maxMinutes ? COLORS.text.muted : COLORS.text.primary}
                  />
                </Pressable>
                <View style={styles.spinnerValue}>
                  <Text style={styles.spinnerValueText}>{selectedMinutes}</Text>
                </View>
                <Pressable
                  style={styles.spinnerButton}
                  onPress={decrementMinutes}
                  disabled={selectedMinutes <= minMinutes}
                >
                  <Ionicons
                    name="chevron-down"
                    size={28}
                    color={selectedMinutes <= minMinutes ? COLORS.text.muted : COLORS.text.primary}
                  />
                </Pressable>
              </View>
            </View>

            {/* コロン */}
            <Text style={styles.colon}>:</Text>

            {/* 秒ピッカー */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>秒</Text>
              <View style={styles.spinnerControl}>
                <Pressable
                  style={styles.spinnerButton}
                  onPress={incrementSeconds}
                >
                  <Ionicons name="chevron-up" size={28} color={COLORS.text.primary} />
                </Pressable>
                <View style={styles.spinnerValue}>
                  <Text style={styles.spinnerValueText}>
                    {selectedSeconds.toString().padStart(2, '0')}
                  </Text>
                </View>
                <Pressable
                  style={styles.spinnerButton}
                  onPress={decrementSeconds}
                >
                  <Ionicons name="chevron-down" size={28} color={COLORS.text.primary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* クイック選択（秒） */}
          <View style={styles.quickSelect}>
            <Text style={styles.quickSelectLabel}>秒をタップで選択</Text>
            <View style={styles.quickSelectGrid}>
              {secondsArray.map((sec) => (
                <Pressable
                  key={sec}
                  style={[
                    styles.quickSelectItem,
                    selectedSeconds === sec && styles.quickSelectItemSelected,
                  ]}
                  onPress={() => setSelectedSeconds(sec)}
                >
                  <Text
                    style={[
                      styles.quickSelectText,
                      selectedSeconds === sec && styles.quickSelectTextSelected,
                    ]}
                  >
                    {sec.toString().padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
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
    marginBottom: 16,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  spinnerControl: {
    alignItems: 'center',
  },
  spinnerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  spinnerValue: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
    marginVertical: 8,
  },
  spinnerValueText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginHorizontal: 12,
  },
  quickSelect: {
    marginBottom: 20,
  },
  quickSelectLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 8,
    textAlign: 'center',
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickSelectItem: {
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickSelectItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: COLORS.primary,
  },
  quickSelectText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  quickSelectTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
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
