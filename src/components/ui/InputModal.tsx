// ============================================
// InputModal Component
// 汎用テキスト入力モーダル
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  value?: string;
  title?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'numbers-and-punctuation';
  maxLength?: number;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  validator?: (value: string) => { valid: boolean; error?: string };
}

export const InputModal: React.FC<InputModalProps> = ({
  visible,
  onClose,
  onConfirm,
  value = '',
  title = '入力',
  placeholder,
  keyboardType = 'default',
  maxLength,
  multiline = false,
  autoCapitalize = 'none',
  validator,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setInputValue(value);
      setError(null);
      // フォーカスを当てる
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible, value]);

  const handleChangeText = (text: string) => {
    setInputValue(text);
    if (validator) {
      const result = validator(text);
      setError(result.error || null);
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (validator) {
      const result = validator(inputValue);
      if (!result.valid) {
        setError(result.error || '入力が無効です');
        return;
      }
    }
    onConfirm(inputValue);
    onClose();
  };

  const isValid = !validator || validator(inputValue).valid;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.overlayPress} onPress={onClose}>
          <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </Pressable>
            </View>

            {/* 入力フィールド */}
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                multiline && styles.inputMultiline,
                error && styles.inputError,
              ]}
              value={inputValue}
              onChangeText={handleChangeText}
              placeholder={placeholder}
              placeholderTextColor={COLORS.text.muted}
              keyboardType={keyboardType}
              maxLength={maxLength}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
            />

            {/* エラー表示 */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* ボタン */}
            <View style={styles.buttons}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, !isValid && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={!isValid}
              >
                <Text style={[
                  styles.confirmButtonText,
                  !isValid && styles.confirmButtonTextDisabled
                ]}>
                  確定
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayPress: {
    flex: 1,
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButtonTextDisabled: {
    opacity: 0.7,
  },
});
