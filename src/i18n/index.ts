// ============================================
// i18n初期化
// ============================================

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ja from './locales/ja';
import en from './locales/en';

export const LANGUAGE_KEY = 'midlab-language';
export type AppLanguage = 'ja' | 'en' | 'system';

// サポート言語
const SUPPORTED_LANGUAGES = ['ja', 'en'];

// デバイス言語を取得
export const getDeviceLanguage = (): string => {
  const locale = getLocales()[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.includes(locale) ? locale : 'en';
};

// 保存済み言語設定を取得
const getStoredLanguage = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LANGUAGE_KEY);
};

// 言語を変更して保存
export const changeLanguage = async (lang: AppLanguage): Promise<void> => {
  if (lang === 'system') {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
    i18next.changeLanguage(getDeviceLanguage());
  } else {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    i18next.changeLanguage(lang);
  }
};

// 現在の言語設定を取得（'system' かどうか判定）
export const getCurrentLanguageSetting = async (): Promise<AppLanguage> => {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!stored) return 'system';
  return stored as AppLanguage;
};

i18next.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// 保存済み言語があれば上書き
getStoredLanguage().then((lang) => {
  if (lang && SUPPORTED_LANGUAGES.includes(lang)) {
    i18next.changeLanguage(lang);
  }
});

export default i18next;
