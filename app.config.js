// ============================================
// Expo App Configuration
// 環境変数対応版
// ============================================

export default {
  expo: {
    name: "ミドラボ",
    slug: "midlab",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "midlab",
    userInterfaceStyle: "dark",
    newArchEnabled: false,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0f"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.midlab.app",
      buildNumber: "23"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0a0a0f"
      },
      package: "com.midlab.app",
      versionCode: 22
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // Supabase設定
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      // RevenueCat設定
      revenueCatApiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || "",
      revenueCatApiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || "",
      // 課金機能有効化フラグ
      enablePurchases: process.env.EXPO_PUBLIC_ENABLE_PURCHASES === "true",
      // テスト用: プレミアム強制フラグ（外部テスター向け）
      forcePremium: process.env.EXPO_PUBLIC_FORCE_PREMIUM === "true",
      // EAS設定
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "c5b71a66-9e44-41a0-a528-6844faff2f36",
      },
    },
    owner: process.env.EXPO_OWNER || "myajiri",
  },
};
