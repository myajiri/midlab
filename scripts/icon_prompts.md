# MidLab アイコン生成プロンプト

## 共通デザインブリーフ

- **アプリ名:** MidLab（ミドラボ）
- **用途:** 中距離走（800m〜5000m）専用トレーニング管理アプリ
- **カラー:** エメラルドグリーン (#2d9f2d) 基調、ダーク背景 (#0a0a0f)
- **モチーフ:** 陸上トラックのオーバル（横向き楕円） + 上昇カーブのグラフライン（ラボ＝分析のメタファー）
- **スタイル:** 2026年フラットデザイン、ミニマル、全年齢に親しまれるクリーンなデザイン

---

## 1. アプリアイコン（icon.png）

**サイズ:** 1024 x 1024 px / 正方形 / 角丸なし / 透過なし / アルファチャンネルなし

```
App icon for a running training app called "MidLab". Dark background (#0a0a0f). A horizontal athletic track oval in emerald green (#2d9f2d) as the main motif, centered. Inside the track oval, a rising performance graph line with small data point dots, curving upward from bottom-left to top-right, ending with an upward arrow — representing athletic improvement and data analysis. The graph line is in a lighter green with a subtle glow. A bold white "M" lettermark in the upper-left area of the icon. Flat design, minimal, sporty, modern 2026 aesthetic. No text other than "M". Clean geometric shapes, no gradients except subtle depth. Suitable for all ages. No people or characters.
```

---

## 2. Android 適応型アイコン前景（adaptive-icon.png）

**サイズ:** 1024 x 1024 px / 透過背景（PNG with alpha） / 重要な要素は中央66%以内

```
Foreground layer for an Android adaptive icon. Transparent background. A horizontal athletic track oval in emerald green (#2d9f2d), centered in the middle 66% of the canvas (safe zone for adaptive icon cropping). Inside the oval, a rising graph line with small dots, curving upward from lower-left to upper-right, ending with an upward arrow tip in white. The graph represents performance improvement. Flat, minimal, sporty design. Clean geometric shapes. No background color — only the track oval and graph elements on a fully transparent canvas.
```

---

## 3. スプラッシュスクリーン（splash-icon.png）

**サイズ:** 1024 x 1024 px 以上 / 透過背景 / アプリ起動時に #0a0a0f 背景の上に表示

```
Splash screen logo for a running app called "MidLab". Transparent background. Centered composition. A horizontal athletic track oval in emerald green (#2d9f2d) with a rising graph line inside — the graph has data point dots and curves upward, ending with a white upward arrow. Below the track oval, the text "MidLab" in clean white sans-serif font, modern and sporty. Flat design, minimal, 2026 aesthetic. The entire design should be centered and work well on a very dark (#0a0a0f) background. No decorative elements — clean and confident.
```

---

## 4. ファビコン（favicon.png）

**サイズ:** 48 x 48 px / 極小サイズで認識できるシンプルさ

```
Tiny 48x48 pixel favicon for a running app. Dark background (#0a0a0f). A simplified emerald green (#2d9f2d) oval shape with a small upward-trending line inside. Extremely minimal and recognizable at very small sizes. Flat design, no detail, just essential shapes.
```

---

## 生成時の注意事項

- iOS アイコン（icon.png）は **角丸を付けない**（iOS が自動で角丸を適用するため）
- adaptive-icon.png は **背景を透明** にすること（`app.config.js` で `backgroundColor: "#0a0a0f"` を指定済み）
- splash-icon.png も **背景を透明** にすること
- 生成後、各画像を `/home/user/midlab/assets/images/` に配置して差し替え
