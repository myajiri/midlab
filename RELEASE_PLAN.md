# MidLab - App Store / Play Store リリース作業計画

## 概要

MidLab（中距離走専用トレーニング管理アプリ）を App Store および Google Play Store にリリースするための作業計画。

---

## 現状の整理

### 完了済み ✅
- Expo + React Native によるアプリ本体の実装
- Expo Router によるナビゲーション構成
- Zustand + AsyncStorage によるローカル状態管理
- Supabase による認証基盤（Email / Apple / Google）
- RevenueCat によるサブスクリプション基盤（¥780/月）
- EAS Build プロファイル（development / preview / production）
- アプリアイコン・スプラッシュ画面のアセット
- Maestro による E2E テスト
- アカウント削除機能（Supabase Edge Function）

### 未完了 ❌
- App Store Connect / Google Play Console のアカウント・アプリ登録
- ストア提出用クレデンシャルの設定（`eas.json` の `submit` セクション）
- 環境変数（Supabase / RevenueCat API キー）の本番設定
- プライバシーポリシー・利用規約の作成
- ストアメタデータ（説明文・スクリーンショット等）の準備
- 本番環境テスト

---

## フェーズ 1: アカウント・コンソール準備

### 1-1. Apple Developer Program
- [ ] Apple Developer Program に登録（年額 ¥12,980）
- [ ] App Store Connect でアプリを作成
  - Bundle ID: `com.midlab.app`
  - アプリ名: MidLab
- [ ] Apple Team ID を取得し `eas.json` に設定
- [ ] App Store Connect App ID を取得し `eas.json` に設定
- [ ] Apple ID（メールアドレス）を `eas.json` に設定

### 1-2. Google Play Console
- [ ] Google Play Developer アカウントを作成（$25 一回払い）
- [ ] Google Play Console でアプリを作成
  - Package Name: `com.midlab.app`
- [ ] Google Play Service Account を作成
- [ ] Service Account JSON キーを取得し `eas.json` の `serviceAccountKeyPath` に設定

---

## フェーズ 2: バックエンド・サービス本番設定

### 2-1. Supabase 本番環境
- [ ] 本番用 Supabase プロジェクトを作成（または既存プロジェクトの確認）
- [ ] 本番 URL と Anon Key を EAS Secrets に登録
  ```bash
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "xxx"
  ```
- [ ] Row Level Security (RLS) ポリシーの確認・強化
- [ ] Edge Function（delete-user）の本番デプロイ
- [ ] OAuth リダイレクト URL の本番設定（`midlab://auth/callback`）

### 2-2. RevenueCat 設定
- [ ] RevenueCat でプロジェクトを作成
- [ ] App Store Connect API キーを RevenueCat に登録
- [ ] Google Play Service Account を RevenueCat に登録
- [ ] プロダクト `midlab_premium_monthly` を作成
  - iOS: App Store Connect で App 内課金（自動更新サブスクリプション）を設定
  - Android: Google Play Console で定期購入を設定
- [ ] エンタイトルメント `premium` を作成・プロダクトに紐付け
- [ ] iOS / Android 用 API キーを EAS Secrets に登録
  ```bash
  eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_xxx"
  eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_xxx"
  ```

### 2-3. EAS プロジェクト設定
- [ ] `eas secret:create` で EAS_PROJECT_ID を登録
- [ ] EAS の owner 設定を確認（現在: `myajiri`）

---

## フェーズ 3: 法務・コンプライアンス

### 3-1. プライバシーポリシー
- [ ] プライバシーポリシーを作成（日本語 + 英語）
  - 収集データ: メールアドレス、トレーニングデータ、ETP テスト結果
  - 利用目的: アカウント管理、トレーニングデータの保存と表示
  - 第三者提供: Supabase（データベース）、RevenueCat（課金管理）
  - データ削除: アプリ内アカウント削除機能
- [ ] プライバシーポリシーを Web 上に公開（Supabase Hosting / GitHub Pages 等）
- [ ] アプリ内設定画面にリンクを追加

### 3-2. 利用規約
- [ ] 利用規約を作成（日本語 + 英語）
- [ ] Web 上に公開
- [ ] アプリ内設定画面にリンクを追加

### 3-3. Apple 固有の要件
- [ ] App Tracking Transparency (ATT) 対応の確認
  - 現状トラッキングを行っていない場合は不要
- [ ] Apple ログイン実装済み ✅（`expo-apple-authentication`）
- [ ] App Privacy Details（App Store Connect のプライバシー質問）への回答準備
- [ ] EULA（必要に応じてカスタム利用規約を設定）

### 3-4. Google 固有の要件
- [ ] データセーフティセクションの回答準備
- [ ] コンテンツレーティング質問への回答
- [ ] ターゲットユーザー層と対象年齢の設定

---

## フェーズ 4: ストアメタデータ準備

### 4-1. 共通メタデータ
- [ ] アプリ説明文（短い説明 + 詳細説明）を作成
  - 短い説明（80文字以内）: 「ETPテストで最適な中距離トレーニングプランを自動生成」等
  - 詳細説明: 主要機能・特徴・ターゲットユーザーの説明
- [ ] キーワード選定（800m, 1500m, 中距離, トレーニング, ランニング 等）
- [ ] カテゴリ選定: Health & Fitness
- [ ] サポート URL の準備

### 4-2. スクリーンショット
- [ ] iOS スクリーンショット作成
  - 6.7インチ（iPhone 15 Pro Max）: 必須
  - 6.5インチ（iPhone 11 Pro Max）: 推奨
  - 5.5インチ（iPhone 8 Plus）: 推奨
  - iPad（12.9インチ）: `supportsTablet: true` のため必要
  - 各サイズ最低 2枚、最大 10枚
- [ ] Android スクリーンショット作成
  - スマートフォン: 最低 2枚、最大 8枚
  - 推奨サイズ: 1080 x 1920 px 以上
- [ ] フィーチャーグラフィック（Android）: 1024 x 500 px

### 4-3. アプリアイコンの確認
- [ ] iOS アイコン: 1024 x 1024 px（角丸なし、透過なし）
  - 現在の `icon.png` がストア要件を満たすか確認
- [ ] Android アイコン: 512 x 512 px
  - 現在の `adaptive-icon.png` が要件を満たすか確認
- [ ] アイコンの高解像度版が必要な場合は再作成

---

## フェーズ 5: ビルド・テスト

### 5-1. 本番ビルドの作成
- [ ] iOS Production ビルド
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] Android Production ビルド（AAB）
  ```bash
  eas build --platform android --profile production
  ```

### 5-2. 内部テスト
- [ ] iOS: TestFlight で内部テスト
  - オンボーディングフローの動作確認
  - ETP テストの実行・記録
  - トレーニングプラン生成（Premium 機能）
  - ワークアウト記録
  - サブスクリプション購入・復元（Sandbox 環境）
  - Apple ログインの動作確認
  - アカウント削除の動作確認
  - ダークモード表示の確認
- [ ] Android: Google Play 内部テストトラック
  - 上記と同様の項目をテスト
  - Google OAuth ログインの動作確認
  - 各種画面サイズでのレイアウト確認

### 5-3. パフォーマンス・品質チェック
- [ ] 起動時間の確認（3秒以内が目安）
- [ ] メモリ使用量の確認
- [ ] オフライン状態での動作確認（ローカルデータ操作）
- [ ] クラッシュ監視ツールの導入検討（Sentry 等）

---

## フェーズ 6: ストア提出

### 6-1. iOS App Store 提出
- [ ] EAS Submit で App Store に提出
  ```bash
  eas submit --platform ios --profile production
  ```
- [ ] App Store Connect でメタデータを入力
  - アプリ説明・スクリーンショット・キーワード
  - プライバシーポリシー URL
  - サポート URL
  - App Privacy Details の回答
  - 価格: 無料（App 内課金あり）
- [ ] App Review に提出
- [ ] レビュー対応（リジェクト時の修正）
  - よくあるリジェクト理由:
    - サブスクリプション利用規約の不備
    - アカウント削除フローの不備 → 実装済み ✅
    - プライバシーポリシーの不備
    - スクリーンショットの不整合

### 6-2. Google Play Store 提出
- [ ] EAS Submit で Play Store に提出
  ```bash
  eas submit --platform android --profile production
  ```
- [ ] Google Play Console でストア掲載情報を入力
  - アプリ説明・スクリーンショット・フィーチャーグラフィック
  - プライバシーポリシー URL
  - コンテンツレーティングの回答
  - データセーフティの回答
  - 広告の有無: なし
  - 価格: 無料（アプリ内購入あり）
- [ ] 内部テスト → クローズドテスト → オープンテスト → 製品版へ段階的に公開
- [ ] レビュー対応

---

## フェーズ 7: リリース後

### 7-1. モニタリング
- [ ] クラッシュレポートの監視
- [ ] ストアレビューの確認・返信
- [ ] サブスクリプション売上の確認（RevenueCat Dashboard）
- [ ] Supabase のデータベース使用量の監視

### 7-2. 次期アップデート準備
- [ ] ユーザーフィードバックの収集・分析
- [ ] バージョン管理ルールの策定
  - バージョン番号: Semantic Versioning（MAJOR.MINOR.PATCH）
  - `buildNumber`（iOS）/ `versionCode`（Android）のインクリメント管理

---

## `eas.json` に設定が必要な項目一覧

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## EAS Secrets に登録が必要な環境変数

| 変数名 | 用途 |
|--------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat iOS API キー |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | RevenueCat Android API キー |
| `EAS_PROJECT_ID` | EAS プロジェクト ID |

---

## 推奨作業順序

```
フェーズ 1（アカウント準備）
    ↓
フェーズ 2（バックエンド設定）＋ フェーズ 3（法務）← 並行作業可能
    ↓
フェーズ 4（メタデータ準備）
    ↓
フェーズ 5（ビルド・テスト）
    ↓
フェーズ 6（ストア提出）
    ↓
フェーズ 7（リリース後運用）
```

**注意事項:**
- Apple のレビューは通常 1〜3 日程度かかる（初回はさらに長くなる場合あり）
- Google Play のレビューは通常 1〜7 日程度
- サブスクリプションのサンドボックステストは必ず実施すること
- iPad 対応（`supportsTablet: true`）のため、iPad のスクリーンショットとレイアウト確認が必要
