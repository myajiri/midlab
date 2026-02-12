# MidLab - App Store / Play Store リリース作業計画

## 概要

MidLab（中距離走専用トレーニング管理アプリ）を App Store および Google Play Store にリリースするための作業計画。

### 初期リリース方針
- **アカウント機能: 無効**（Supabase 認証は未使用。ログイン/サインアップ UI なし）
- **課金機能: 有効**（RevenueCat によるサブスクリプション ¥980/月・¥9,800/年・初回1週間無料）
- **データ保存: ローカルのみ**（Zustand + AsyncStorage）
- アカウント機能は将来のアップデートで導入予定

---

## 現状の整理

### 完了済み ✅
- Expo + React Native によるアプリ本体の実装
- Expo Router によるナビゲーション構成
- Zustand + AsyncStorage によるローカル状態管理
- RevenueCat によるサブスクリプション基盤（¥980/月・¥9,800/年・初回1週間無料）
- EAS Build プロファイル（development / preview / production）
- アプリアイコン・スプラッシュ画面のアセット（AI生成、分割・透過処理済み）
- Maestro による E2E テスト
- アカウント機能のコード実装（将来のアップデート用、現在は未使用）
- プライバシーポリシー・利用規約の作成（日本語+英語、GitHub Pages 用 HTML）
- アプリ内設定画面に法的情報リンク追加済み
- アップグレード画面に月額/年額プラン選択UI追加済み
- サブスクリプション自動更新・解約方法の表示（Apple審査要件対応済み）
- `eas.json` にストア提出用テンプレート追加済み（値は要設定）
- iOS `buildNumber` / Android `versionCode` 設定済み
- 法的文書の連絡先メールアドレスを `myajiri@gmail.com` に統一済み

### 未完了 ❌
- App Store Connect のアカウント・アプリ登録
- ~~Google Play Console のアカウント登録~~ → ✅ 完了
- Google Play Console でのアプリ作成・Service Account 設定
- ストア提出用クレデンシャルの実値設定（`eas.json` の `submit` セクション）
- RevenueCat アカウント作成・API キーの本番設定（EAS Secrets）
- アプリアイコンの改善（nanobanana で再生成）
- ストアメタデータ（~~説明文~~ → ✅ Fastlane 形式で作成済み・スクリーンショット等）の準備
- 本番環境テスト

---

## フェーズ 1: アカウント・コンソール準備

### 1-1. Apple Developer Program
- [x] Apple Developer Program に登録（年額 ¥12,980）
- [ ] App Store Connect でアプリを作成
  - Bundle ID: `com.midlab.app`
  - アプリ名: MidLab
- [ ] Apple Team ID を取得し `eas.json` に設定
- [ ] App Store Connect App ID を取得し `eas.json` に設定
- [ ] Apple ID（メールアドレス）を `eas.json` に設定

### 1-2. Google Play Console
- [x] Google Play Developer アカウントを作成（$25 一回払い）
- [ ] Google Play Console でアプリを作成
  - Package Name: `com.midlab.app`
- [ ] Google Play Service Account を作成
- [ ] Service Account JSON キーを取得し `./google-play-service-account.json` として保存
  - `eas.json` の `submit.production.android` に設定済み（track: internal, releaseStatus: draft）

---

## フェーズ 2: RevenueCat・課金設定

### 2-1. App Store Connect 課金設定
- [ ] App Store Connect で App 内課金を作成
  - 種類: 自動更新サブスクリプション
  - Product ID: `midlab_premium_monthly`
  - 価格: ¥980/月・¥9,800/年・初回1週間無料
- [ ] サブスクリプショングループの作成
- [ ] ローカライズ情報の入力（表示名・説明文）

### 2-2. Google Play Console 課金設定
- [ ] Google Play Console で定期購入を作成
  - Product ID（月額）: `midlab_premium_monthly`（¥980/月）
  - Product ID（年額）: `midlab_premium_yearly`（¥9,800/年）
  - 初回1週間無料トライアルを設定
- [ ] 基本プランと特典の設定
- [ ] テスト用ライセンスアカウントの追加（Google Play Console > 設定 > ライセンステスト）

### 2-3. RevenueCat 設定
- [ ] RevenueCat アカウントを作成（https://www.revenuecat.com/ で登録）
- [ ] RevenueCat でプロジェクトを作成
- [ ] App Store Connect API キーを RevenueCat に登録
- [ ] Google Play Service Account を RevenueCat に登録
- [ ] プロダクト `midlab_premium_monthly` を紐付け
- [ ] エンタイトルメント `premium` を作成・プロダクトに紐付け
- [ ] iOS / Android 用 API キーを EAS Secrets に登録
  ```bash
  eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_xxx"
  eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_xxx"
  ```

### 2-4. EAS プロジェクト設定
- [ ] `eas secret:create` で EAS_PROJECT_ID を登録
- [ ] EAS の owner 設定を確認（現在: `myajiri`）

> **注意:** Supabase の設定は初期リリースでは不要。環境変数は空のままで問題なし（`lib/supabase.ts` は空文字列を安全に処理する）。

---

## フェーズ 3: 法務・コンプライアンス

### 3-1. プライバシーポリシー
- [x] プライバシーポリシーを作成（日本語 + 英語）
  - 収集データ: サブスクリプション情報（RevenueCat 経由）
  - **端末内のみに保存されるデータ**: トレーニングデータ、ETP テスト結果、プロフィール情報
  - 第三者提供: RevenueCat（課金管理）
  - ※ アカウント機能なしのため、メールアドレス等の個人情報はサーバーに送信されない
- [x] プライバシーポリシーを Web 上に公開（GitHub Pages: `docs/privacy.html`, `docs/privacy-en.html`）
- [x] アプリ内設定画面にリンクを追加

### 3-2. 利用規約
- [x] 利用規約を作成（日本語 + 英語）
  - サブスクリプションの自動更新・解約方法の明記（Apple 審査で必須）
- [x] Web 上に公開（GitHub Pages: `docs/terms.html`, `docs/terms-en.html`）
- [x] アプリ内設定画面にリンクを追加

### 3-2.1. 法的文書のメールアドレス更新
- [x] プライバシーポリシー・利用規約の連絡先メールアドレスを更新
  - `midlab.app@gmail.com` → `myajiri@gmail.com`
  - 対象ファイル: `docs/privacy.html`, `docs/privacy-en.html`, `docs/terms.html`, `docs/terms-en.html`

### 3-3. Apple 固有の要件
- [x] App Tracking Transparency (ATT) 対応の確認
  - トラッキングを行っていないため不要
- [ ] App Privacy Details（App Store Connect のプライバシー質問）への回答準備
  - 「Data Not Collected」に該当する項目が多い（ローカル保存のみ）
  - 購入履歴のみ RevenueCat 経由で収集
- [x] サブスクリプション関連の表示要件
  - 価格・更新頻度・解約方法をアプリ内に明記（`upgrade.tsx` に実装済み）
- [ ] EULA（必要に応じてカスタム利用規約を設定）

> **注意:** アカウント機能がないため以下は **不要**:
> - Apple ログイン（Sign in with Apple）の実装義務なし（サードパーティログインを提供しないため）
> - アカウント削除機能の実装義務なし（アカウントが存在しないため）

### 3-4. Google 固有の要件
- [ ] データセーフティセクションの回答
  - 回答ガイドは `STORE_METADATA.md` の「Google Play データセーフティ回答ガイド」を参照
  - データ収集: 購入履歴のみ（RevenueCat 経由）
  - 個人情報: 収集しない（アカウント登録なし）
  - 位置情報: 収集しない
  - データ暗号化: HTTPS
  - 削除リクエスト: アプリのアンインストールでローカルデータ全削除
- [ ] コンテンツレーティング質問への回答
  - IARC レーティング質問票に回答（暴力・性的コンテンツなし → 全年齢対象見込み）
- [ ] ターゲットユーザー層と対象年齢の設定
  - 対象年齢: 全年齢（ただし13歳未満は対象外を推奨 → COPPA 対応不要）

---

## フェーズ 4: ストアメタデータ準備

### 4-1. 共通メタデータ
- [x] アプリ説明文（短い説明 + 詳細説明）を作成
  - `STORE_METADATA.md` に日英で作成済み
  - Fastlane 形式メタデータを `fastlane/metadata/android/` に配置済み
    - `ja-JP/`: title, short_description, full_description, changelogs
    - `en-US/`: title, short_description, full_description, changelogs
- [x] キーワード選定（800m, 1500m, 中距離, トレーニング, ランニング 等）
- [x] カテゴリ選定: Health & Fitness
- [x] サポート URL の準備（https://myajiri.github.io/midlab/）

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
- [x] iOS アイコン: 1024 x 1024 px（角丸なし、透過なし）― `icon.png` 設定済み
- [x] Android アイコン: 1024 x 1024 px（適応型アイコン）― `adaptive-icon.png` 透過背景で設定済み
- [x] スプラッシュスクリーン: `splash-icon.png` 設定済み
- [x] Favicon: `favicon.png` 48x48 設定済み

### 4-4. アプリアイコンの改善
- [ ] nanobanana を使用してよりクリーンなアイコンを生成（手動ステップ）
  - プロンプトは `scripts/icon_prompts.md` を参照
  - 2x2 グリッド形式で出力される
- [ ] 生成された画像を `scripts/source_icon.png` として保存
- [ ] `python3 scripts/process_icons.py scripts/source_icon.png` を実行してアイコンを分割・処理
- [ ] 生成されたアイコンの品質を目視確認

> **注意:** 現在のアイコンは `scripts/generate_icons.py` でプロシージャル生成されたものだが、仕上がりが粗い。nanobanana で生成し直すことでよりクリーンな仕上がりを目指す。`scripts/process_icons.py` は nanobanana の 2x2 グリッド出力に対応済み。

---

## フェーズ 5: ビルド・テスト

### 5-0. 外部テスター向けビルド（課金スキップ）
- [x] `eas.json` に `testing` プロファイルを追加済み
  - `EXPO_PUBLIC_ENABLE_PURCHASES=false`（課金UI非表示）
  - `EXPO_PUBLIC_FORCE_PREMIUM=true`（全プレミアム機能アンロック）
  - `distribution: "internal"`（外部テスターに配布可能）
- [ ] テスト用ビルドの作成
  ```bash
  eas build --profile testing --platform ios
  eas build --profile testing --platform android
  ```
- [ ] テスターへの配布・フィードバック収集

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
  - ダークモード表示の確認
  - 各画面の表示崩れチェック
- [ ] Android: Google Play 内部テストトラック
  - 上記と同様の項目をテスト
  - 各種画面サイズでのレイアウト確認

### 5-3. サブスクリプションテスト（重要）
- [ ] iOS Sandbox 環境でのテスト
  - 購入フローの完了確認
  - 購入後に Premium 機能がアンロックされるか確認
  - 復元ボタンの動作確認
  - サブスクリプション解約フローの確認
- [ ] Android テスト環境でのテスト
  - 同上の項目を確認

### 5-4. パフォーマンス・品質チェック
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
    - サブスクリプションの価格・更新頻度・解約方法が明記されていない
    - プライバシーポリシーの不備
    - スクリーンショットの不整合
    - メタデータの不備

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

### 7-2. 次期アップデート計画
- [ ] ユーザーフィードバックの収集・分析
- [ ] バージョン管理ルールの策定
  - バージョン番号: Semantic Versioning（MAJOR.MINOR.PATCH）
  - `buildNumber`（iOS）/ `versionCode`（Android）のインクリメント管理
- [ ] アカウント機能の導入（Supabase 認証、クラウド同期）

---

## 設定リファレンス

### `eas.json` に設定が必要な項目

**Android（設定済み）:**
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```
> `track: "internal"` で内部テストトラックに公開。準備完了後に `"production"` に変更。
> `releaseStatus: "draft"` で下書き状態でアップロード。

**iOS（未設定 — Apple Developer 登録後に追加）:**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

### EAS Secrets に登録が必要な環境変数

| 変数名 | 用途 | 初期リリースで必要 |
|--------|------|:------------------:|
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat iOS API キー | ✅ |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | RevenueCat Android API キー | ✅ |
| `EAS_PROJECT_ID` | EAS プロジェクト ID | ✅ |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | ❌ 不要 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | ❌ 不要 |

### 本番ビルドの環境変数（`eas.json` の `production.env`）

```json
{
  "EXPO_PUBLIC_ENABLE_PURCHASES": "true"
}
```

> `EXPO_PUBLIC_ENABLE_PURCHASES` は既に production プロファイルで `true` に設定済み。

---

## 推奨作業順序

```
フェーズ 1（アカウント・コンソール準備）
    ↓
フェーズ 2（RevenueCat 課金設定）＋ フェーズ 3（法務）← 並行作業可能
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
- サブスクリプションの Sandbox テストは必ず実施すること
- iPad 対応（`supportsTablet: true`）のため、iPad のスクリーンショットとレイアウト確認が必要
- アカウント機能がないため、Supabase 関連の設定は初期リリースでは一切不要

---

## Android リリース クイックリファレンス

Google Play アカウント登録済みの状態から、Android 版リリースまでの手順をまとめたクイックリファレンス。

### ステップ 1: Google Play Console でアプリ作成
1. Google Play Console にログイン
2. 「アプリを作成」→ アプリ名: `MidLab`、デフォルト言語: 日本語、アプリ/ゲーム: アプリ、無料/有料: 無料
3. ストアの掲載情報を入力（`fastlane/metadata/android/` に準備済み）
4. コンテンツレーティングの質問票に回答
5. データセーフティセクションに回答（`STORE_METADATA.md` の回答ガイドを参照）

### ステップ 2: Service Account 設定
1. Google Cloud Console でサービスアカウントを作成
2. Google Play Console > 設定 > API アクセス でサービスアカウントを招待
3. 権限: 「リリース管理」を付与
4. JSON キーをダウンロードし `./google-play-service-account.json` として保存
5. `.gitignore` に `google-play-service-account.json` が含まれていることを確認

### ステップ 3: RevenueCat 設定（Android）
1. RevenueCat でプロジェクト作成
2. Google Play Service Account を RevenueCat に登録
3. プロダクト `midlab_premium_monthly` / `midlab_premium_yearly` を紐付け
4. エンタイトルメント `MidLab Pro` を作成・紐付け
5. Android API キーを EAS Secrets に登録:
   ```bash
   eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_xxx"
   ```

### ステップ 4: ビルド・テスト・提出
```bash
# 1. テスト用ビルド（プレミアム機能アンロック済み）
eas build --profile testing --platform android

# 2. 本番ビルド（AAB 形式）
eas build --platform android --profile production

# 3. 内部テストトラックに提出
eas submit --platform android --profile production
```

### ステップ 5: Google Play Console で公開
1. 内部テストトラックで動作確認
2. サブスクリプション購入テスト（ライセンステストアカウント使用）
3. クローズドテスト → オープンテスト → 製品版の順に段階公開
