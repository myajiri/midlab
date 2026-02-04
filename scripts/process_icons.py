"""
nanobanana proで生成された2x2グリッド画像を
4つの個別アイコンファイルに分割・処理するスクリプト

使い方:
  python3 scripts/process_icons.py scripts/source_icon.png
"""

import sys
import shutil
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def is_checker_pixel(r, g, b):
    """チェッカー柄のピクセルかどうか判定（灰色〜白のグレースケール）"""
    return (abs(int(r) - int(g)) < 15 and
            abs(int(g) - int(b)) < 15 and
            abs(int(r) - int(b)) < 15 and
            (int(r) + int(g) + int(b)) / 3 > 170)


def remove_all_checker(img):
    """
    チェッカー柄ピクセルを全て透過にする。
    adaptive-icon用：ロゴの緑色以外を全て透過に。
    """
    rgba = img.convert("RGBA")
    data = np.array(rgba)
    h, w = data.shape[:2]

    r = data[:,:,0].astype(int)
    g = data[:,:,1].astype(int)
    b = data[:,:,2].astype(int)
    brightness = (r + g + b) / 3

    # ロゴの主要色（緑系）を特定して保護
    is_green = (g > r + 15) & (g > b + 15) & (g > 50)

    # 中間的な緑（アンチエイリアス境界）も保護
    # 緑成分が最も高く、ある程度の彩度がある
    green_dominant = (g > r) & (g > b) & ((g - np.minimum(r, b)) > 10)

    # 保護するピクセル = 明確に緑系のもの
    keep_mask = is_green | green_dominant

    # 上部140px（ラベルテキスト領域）は無条件で透過
    unconditional_clear = np.zeros((h, w), dtype=bool)
    unconditional_clear[:140, :] = True

    # 右端・下端40px（ガイド破線）は無条件で透過
    unconditional_clear[:, -40:] = True
    unconditional_clear[-40:, :] = True

    # 左端の薄い線も除去
    unconditional_clear[:, :5] = True

    # 無条件エリアではkeepも無効
    keep_mask = keep_mask & ~unconditional_clear

    # 透過マスク = 保護対象以外の全ピクセル
    bg_mask = ~keep_mask

    data[bg_mask, 3] = 0

    return Image.fromarray(data)


def remove_bg_edge_flood(img):
    """エッジからのflood-fillで背景チェッカーを透過（favicon用）"""
    rgba = img.convert("RGBA")
    data = np.array(rgba)
    h, w = data.shape[:2]

    r = data[:,:,0].astype(int)
    g = data[:,:,1].astype(int)
    b = data[:,:,2].astype(int)

    is_gray = (np.abs(r - g) < 15) & (np.abs(g - b) < 15)
    brightness = (r + g + b) / 3
    checker_candidate = is_gray & (brightness > 170)

    # ラベルテキストエリア（上部100px）も候補に含める
    label_area = np.zeros((h, w), dtype=bool)
    label_area[:100, :] = True
    checker_candidate = checker_candidate | label_area

    # エッジからの連結成分
    edge_mask = np.zeros((h, w), dtype=bool)
    edge_mask[0, :] = True
    edge_mask[-1, :] = True
    edge_mask[:, 0] = True
    edge_mask[:, -1] = True

    labeled, _ = ndimage.label(checker_candidate)
    edge_labels = set(labeled[edge_mask].flatten()) - {0}
    bg_mask = np.isin(labeled, list(edge_labels))

    data[bg_mask, 3] = 0
    return Image.fromarray(data)


def process_source_image(source_path):
    """ソース画像を4分割して個別アイコンとして保存"""
    print(f"ソース画像を読み込み中: {source_path}")
    source = Image.open(source_path)
    sw, sh = source.size
    print(f"  サイズ: {sw}x{sh}, モード: {source.mode}")

    mid_x = sw // 2
    mid_y = sh // 2

    # 4分割
    top_left = source.crop((0, 0, mid_x, mid_y))        # App Icon
    top_right = source.crop((mid_x, 0, sw, mid_y))       # Adaptive Icon
    bottom_left = source.crop((0, mid_y, mid_x, sh))     # Splash Icon
    bottom_right = source.crop((mid_x, mid_y, sw, sh))   # Favicon

    output_dir = "assets/images"

    # --- 1. App Icon (icon.png) ---
    # iOS用: 1024x1024, 透過なし, 黒背景
    print("\n[1/4] App Icon (icon.png)")
    icon = top_left.convert("RGB")
    # ラベルテキストを黒で塗りつぶし（上部100px）
    draw = ImageDraw.Draw(icon)
    draw.rectangle([0, 0, icon.width, 100], fill=(0, 0, 0))
    icon.save(f"{output_dir}/icon.png", "PNG")
    print(f"  保存: {output_dir}/icon.png ({icon.size[0]}x{icon.size[1]}, RGB)")

    # --- 2. Adaptive Icon (adaptive-icon.png) ---
    # Android用: 1024x1024, 透過あり
    # 全チェッカー柄＋ラベル＋ガイド線を除去
    print("\n[2/4] Adaptive Icon (adaptive-icon.png)")
    adaptive = remove_all_checker(top_right)
    adaptive.save(f"{output_dir}/adaptive-icon.png", "PNG")
    print(f"  保存: {output_dir}/adaptive-icon.png ({adaptive.size[0]}x{adaptive.size[1]}, RGBA)")

    # --- 3. Splash Icon (splash-icon.png) ---
    # スプラッシュスクリーン用: 1024x1024, 白背景
    print("\n[3/4] Splash Icon (splash-icon.png)")
    splash = bottom_left.convert("RGB")
    # ラベルテキストを白で塗りつぶし
    draw_s = ImageDraw.Draw(splash)
    draw_s.rectangle([0, 0, splash.width, 100], fill=(255, 255, 255))
    # チェッカー柄が混入している部分を白で修正
    data_s = np.array(splash)
    r, g, b = data_s[:,:,0].astype(int), data_s[:,:,1].astype(int), data_s[:,:,2].astype(int)
    is_gray = (np.abs(r - g) < 12) & (np.abs(g - b) < 12)
    brightness = (r + g + b) / 3
    # グレースケールで明るいピクセルを白に（チェッカーの灰色部分）
    checker_in_splash = is_gray & (brightness > 170) & (brightness < 253)
    # ロゴの緑は保護
    is_green = (g > r + 15) & (g > b + 15)
    is_dark = brightness < 100
    checker_in_splash = checker_in_splash & ~is_green & ~is_dark
    data_s[checker_in_splash] = [255, 255, 255]
    # ラベルエリアの下にある微細なドットも処理
    # 非白・非緑・非黒のピクセルで孤立しているものを白に
    from scipy.ndimage import binary_dilation
    noise_mask = is_gray & (brightness > 150) & (brightness < 253) & ~is_green & ~is_dark
    data_s[noise_mask] = [255, 255, 255]
    splash = Image.fromarray(data_s)
    splash.save(f"{output_dir}/splash-icon.png", "PNG")
    print(f"  保存: {output_dir}/splash-icon.png ({splash.size[0]}x{splash.size[1]}, RGB)")

    # --- 4. Favicon (favicon.png) ---
    # Web用: 48x48, 透過あり
    print("\n[4/4] Favicon (favicon.png)")
    favicon_large = remove_all_checker(bottom_right)
    favicon = favicon_large.resize((48, 48), Image.LANCZOS)
    favicon.save(f"{output_dir}/favicon.png", "PNG")
    print(f"  保存: {output_dir}/favicon.png (48x48, RGBA)")

    # assets/ ルートにもコピー
    for fname in ["icon.png", "adaptive-icon.png", "splash-icon.png", "favicon.png"]:
        shutil.copy2(f"{output_dir}/{fname}", f"assets/{fname}")
    print(f"\nassets/ にもコピーしました")
    print("\n全アイコンの処理が完了しました！")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使い方: python3 scripts/process_icons.py <ソース画像パス>")
        sys.exit(1)
    process_source_image(sys.argv[1])
