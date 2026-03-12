// テスト用i18n初期化（planGeneratorがi18next.t()を使用するため必要）
import i18next from 'i18next';
import ja from '../i18n/locales/ja';
import en from '../i18n/locales/en';

if (!i18next.isInitialized) {
  i18next.init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: 'ja',
    fallbackLng: 'ja',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}
