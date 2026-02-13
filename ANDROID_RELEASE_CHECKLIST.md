# Android リリース前チェックリスト

ストア提出前に確認すべき項目をまとめたチェックリスト。

---

## 1. Google Play Console 設定

- [ ] アプリの作成（Package Name: `com.midlab.app`）
- [ ] ストア掲載情報の入力
  - [ ] アプリ名: MidLab
  - [ ] 短い説明（`fastlane/metadata/android/ja-JP/short_description.txt`）
  - [ ] 詳細説明（`fastlane/metadata/android/ja-JP/full_description.txt`）
  - [ ] スクリーンショット（最低2枚、推奨 1080x1920px 以上）
  - [ ] フィーチャーグラフィック（1024x500px）
  - [ ] アプリアイコン（512x512px — Google Play Console 用）
- [ ] コンテンツレーティングの回答
- [ ] データセーフティの回答（`STORE_METADATA.md` 参照）
- [ ] 対象年齢の設定
- [ ] カテゴリ: ヘルスケア / フィットネス
- [ ] 連絡先メールアドレス: myajiri@gmail.com
- [ ] プライバシーポリシー URL: https://myajiri.github.io/midlab/privacy.html

## 2. Service Account

- [ ] Google Cloud Console でサービスアカウントを作成
- [ ] Google Play Console の API アクセスで招待・権限付与
- [ ] JSON キーを `./google-play-service-account.json` に保存
- [ ] `.gitignore` に含まれていることを確認 → ✅ 設定済み

## 3. 課金設定

- [ ] Google Play Console で定期購入を作成
  - [ ] `midlab_premium_monthly`（¥980/月）
  - [ ] `midlab_premium_yearly`（¥9,800/年）
  - [ ] 初回1ヶ月無料トライアル
- [ ] RevenueCat でプロジェクト作成
- [ ] RevenueCat に Google Play Service Account を登録
- [ ] RevenueCat でプロダクト紐付け（monthly / yearly）
- [ ] エンタイトルメント `MidLab Pro` を作成・紐付け
- [ ] EAS Secrets に Android API キーを登録
  ```bash
  eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_xxx"
  ```
- [ ] テスト用ライセンスアカウントを追加（Google Play Console > 設定 > ライセンステスト）

## 4. ビルド

- [ ] テスト用 APK ビルド
  ```bash
  eas build --profile testing --platform android
  ```
- [ ] テスターへ配布・動作確認
- [ ] 本番 AAB ビルド
  ```bash
  eas build --platform android --profile production
  ```

## 5. テスト項目

### 基本機能
- [ ] オンボーディングフロー（プロフィール入力 → PB入力 → ETP算出）
- [ ] ホーム画面の表示
- [ ] ETP テストの実行・記録
- [ ] トレーニングプラン生成
- [ ] ワークアウト記録
- [ ] 設定画面の全項目

### サブスクリプション（preview/production ビルド）
- [ ] アップグレード画面の表示
- [ ] プラン選択（月額/年額）
- [ ] 購入フローの完了
- [ ] 購入後の Premium 機能アンロック
- [ ] 購入復元
- [ ] 解約リンクが Google Play 設定に遷移すること
- [ ] 自動更新に関する説明表示

### Android 固有
- [ ] ハードウェアバックボタンの動作（アップグレード画面）
- [ ] 各種画面サイズでのレイアウト確認
- [ ] ダークテーマ表示
- [ ] オフライン状態での動作
- [ ] アプリのアダプティブアイコン表示

### E2E テスト（Maestro）
```bash
# Expo Go 用
maestro test .maestro/full_flow_test.yaml

# Android 本番ビルド用
maestro test .maestro/android_full_flow_test.yaml
maestro test .maestro/android_subscription_test.yaml
```

## 6. 提出

- [ ] 内部テストトラックに提出
  ```bash
  eas submit --platform android --profile production
  ```
- [ ] 内部テストで最終確認
- [ ] クローズドテストに昇格
- [ ] オープンテストに昇格（任意）
- [ ] 製品版に公開

---

## 重要な注意点

- **初回提出は `track: "internal"` + `releaseStatus: "draft"`** で下書きとしてアップロードされる
- Google Play のレビューは通常 **1〜7日** 程度
- テスト用ライセンスアカウントでの課金テストは実際の請求が発生しない
- `versionCode`（現在: 1）はアップデートごとにインクリメントが必要
