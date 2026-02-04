// ============================================
// Expo App Configuration
// 環境変数対応版
// ============================================

export default {
  expo: {
    name: "MidLab",
    slug: "midlab",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "midlab",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0f"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.midlab.app",
      buildNumber: "1"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0a0a0f"
      },
      package: "com.midlab.app",
      versionCode: 1
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
      // EAS設定
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "",
      },
    },
    owner: process.env.EXPO_OWNER || "myajiri",
  },
};
