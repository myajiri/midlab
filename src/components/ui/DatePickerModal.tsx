// ============================================
// DatePickerModal Component
// 日付選択モーダル
// ============================================

import React, { useState, useMemo } from 'react';
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

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  value,
  minDate,
  maxDate,
  title = '日付を選択',
}) => {
  const [displayMonth, setDisplayMonth] = useState(() => {
    const initial = value || new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  // カレンダー日付を生成
  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 月曜始まりに変換（0=日曜 → 月曜=0, 日曜=6）
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: Array<{ date: Date | null; isCurrentMonth: boolean; isSelected: boolean; isDisabled: boolean }> = [];

    // 前月の日付
    const prevMonth = new Date(year, month, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: true,
      });
    }

    // 今月の日付
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isSelected = value ?
        date.getFullYear() === value.getFullYear() &&
        date.getMonth() === value.getMonth() &&
        date.getDate() === value.getDate() : false;

      let isDisabled = false;
      if (minDate) {
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        if (date < min) isDisabled = true;
      }
      if (maxDate) {
        const max = new Date(maxDate);
        max.setHours(23, 59, 59, 999);
        if (date > max) isDisabled = true;
      }

      days.push({
        date,
        isCurrentMonth: true,
        isSelected,
        isDisabled,
      });
    }

    // 来月の日付（6行分になるように埋める）
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: true,
      });
    }

    return days;
  }, [displayMonth, value, minDate, maxDate]);

  const handlePrevMonth = () => {
    setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    onSelect(date);
    onClose();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

          {/* 月ナビゲーション */}
          <View style={styles.monthNav}>
            <Pressable style={styles.navButton} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text.primary} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {displayMonth.getFullYear()}年 {MONTHS[displayMonth.getMonth()]}
            </Text>
            <Pressable style={styles.navButton} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.text.primary} />
            </Pressable>
          </View>

          {/* 曜日ヘッダー */}
          <View style={styles.weekHeader}>
            {WEEKDAYS.map((day, i) => (
              <Text key={i} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, i) => {
              const isToday = day.date &&
                day.date.getTime() === today.getTime();

              return (
                <Pressable
                  key={i}
                  style={[
                    styles.dayCell,
                    day.isSelected && styles.dayCellSelected,
                    isToday && !day.isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => day.date && !day.isDisabled && handleSelectDate(day.date)}
                  disabled={day.isDisabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.dayTextMuted,
                      day.isDisabled && styles.dayTextDisabled,
                      day.isSelected && styles.dayTextSelected,
                      isToday && !day.isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day.date?.getDate() || ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 今日ボタン */}
          <Pressable
            style={styles.todayButton}
            onPress={() => {
              const newToday = new Date();
              setDisplayMonth(new Date(newToday.getFullYear(), newToday.getMonth(), 1));
            }}
          >
            <Text style={styles.todayButtonText}>今日に移動</Text>
          </Pressable>
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
    maxWidth: 360,
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
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text.muted,
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  dayTextMuted: {
    color: COLORS.text.muted,
  },
  dayTextDisabled: {
    opacity: 0.3,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  todayButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  todayButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },
});
