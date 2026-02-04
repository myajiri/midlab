"""
nanobanana proで生成された2x2グリッド画像を
4つの個別アイコンファイルに分割・処理するスクリプト

使い方:
  python3 scripts/process_icons.py scripts/source_icon.png

処理内容:
  1. 2x2グリッドを4分割
  2. チェッカー柄背景を透過に変換（adaptive-icon, favicon）
  3. 各アイコンを適切なサイズにリサイズ
  4. assets/images/ に保存
"""

import sys
import numpy as np
from PIL import Image

def detect_checkerboard_and_make_transparent(img):
    """チェッカー柄（透過を示す市松模様）を検出して透過に変換する"""
    rgba = img.convert("RGBA")
    data = np.array(rgba)

    # チェッカー柄の色（灰色と白の市松模様）を検出
    # 一般的なチェッカー柄: #C0C0C0 と #FFFFFF、または #CCCCCC と #FFFFFF 等
    # ピクセルごとにチェッカーパターンかどうか判定

    h, w = data.shape[:2]

    # まずチェッカー柄の色を特定するためにコーナー部分をサンプリング
    # 右上象限の右上隅（確実にチェッカー柄エリア）を参照
    corner_colors = set()
    sample_size = min(20, h // 10, w // 10)
    for y in range(sample_size):
        for x in range(w - sample_size, w):
            r, g, b = data[y, x, :3]
            # 灰色〜白の範囲をチェッカー候補として収集
            if r == g == b and r >= 180:
                corner_colors.add(r)

    if len(corner_colors) < 2:
        # チェッカー柄が検出できない場合、一般的な値を使用
        checker_light = 255  # 白
        checker_dark = 204   # #CCCCCC
    else:
        sorted_colors = sorted(corner_colors)
        checker_dark = sorted_colors[0]
        checker_light = sorted_colors[-1]

    # チェッカーパターンマスクを作成
    # チェッカーは通常8x8〜16x16ピクセルの市松模様
    # ピクセルがチェッカー色（灰/白）であり、かつ周囲も同パターンなら透過
    checker_mask = np.zeros((h, w), dtype=bool)

    for y in range(h):
        for x in range(w):
            r, g, b = data[y, x, :3]
            if r == g == b and (abs(int(r) - checker_light) <= 5 or abs(int(r) - checker_dark) <= 5):
                checker_mask[y, x] = True

    # チェッカー柄は連続した領域になるので、境界のアイコン部分を保護
    # 小さなブロック単位でチェッカーパターンかどうか判定
    block_size = 8
    refined_mask = np.zeros((h, w), dtype=bool)

    for by in range(0, h, block_size):
        for bx in range(0, w, block_size):
            block = checker_mask[by:by+block_size, bx:bx+block_size]
            # ブロック内の大半がチェッカー色ならチェッカーと判定
            if block.sum() > block.size * 0.8:
                refined_mask[by:by+block_size, bx:bx+block_size] = True

    # マスク適用：チェッカー部分を透過に
    data[refined_mask, 3] = 0

    return Image.fromarray(data)


def make_background_transparent_simple(img, bg_color_threshold=200):
    """
    シンプルな背景透過処理。
    灰色〜白のチェッカー柄背景をまとめて透過にする。
    アイコンの主要色（緑系、黒系）は保持する。
    """
    rgba = img.convert("RGBA")
    data = np.array(rgba)

    h, w = data.shape[:2]

    # 各ピクセルについて、R==G==B（グレースケール）かつ明るい色なら透過候補
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]

    # グレースケールピクセル（R≈G≈B）かつ明るい（>180）→ チェッカー柄の背景
    is_gray = (np.abs(r.astype(int) - g.astype(int)) < 10) & \
              (np.abs(g.astype(int) - b.astype(int)) < 10) & \
              (np.abs(r.astype(int) - b.astype(int)) < 10)
    is_bright = (r.astype(int) + g.astype(int) + b.astype(int)) / 3 > 180

    bg_mask = is_gray & is_bright

    # Flood fill from edges to only remove background, not internal gray pixels
    from scipy import ndimage
    # エッジからの連結成分のみを透過に
    edge_mask = np.zeros((h, w), dtype=bool)
    edge_mask[0, :] = True
    edge_mask[-1, :] = True
    edge_mask[:, 0] = True
    edge_mask[:, -1] = True

    # bg_maskとedge_maskの共通部分から連結成分を取得
    seed = bg_mask & edge_mask
    # ラベリングして、エッジに接している連結成分だけを透過に
    labeled, num_features = ndimage.label(bg_mask)

    # エッジに接しているラベルを特定
    edge_labels = set(labeled[edge_mask].flatten()) - {0}

    # そのラベルに属するピクセルのみ透過に
    final_mask = np.isin(labeled, list(edge_labels))

    data[final_mask, 3] = 0

    return Image.fromarray(data)


def process_source_image(source_path):
    """ソース画像を4分割して個別アイコンとして保存"""
    print(f"ソース画像を読み込み中: {source_path}")
    source = Image.open(source_path).convert("RGBA")
    sw, sh = source.size
    print(f"  サイズ: {sw}x{sh}")

    # 2x2グリッドの中央を計算
    mid_x = sw // 2
    mid_y = sh // 2

    # 4分割（ラベルテキストを含む領域があるので少し余裕を持つ）
    # 各象限を切り出し
    top_left = source.crop((0, 0, mid_x, mid_y))        # App Icon
    top_right = source.crop((mid_x, 0, sw, mid_y))       # Adaptive Icon
    bottom_left = source.crop((0, mid_y, mid_x, sh))     # Splash Icon
    bottom_right = source.crop((mid_x, mid_y, sw, sh))   # Favicon

    output_dir = "assets/images"

    # --- 1. App Icon (icon.png) ---
    # iOS用: 1024x1024, 透過なし（黒背景のまま）
    print("\n[1/4] App Icon (icon.png)")
    icon = top_left.resize((1024, 1024), Image.LANCZOS)
    # アルファチャンネル除去（iOS要件）
    icon_rgb = Image.new("RGB", icon.size, (0, 0, 0))
    icon_rgb.paste(icon, mask=icon.split()[3] if icon.mode == 'RGBA' else None)
    icon_rgb.save(f"{output_dir}/icon.png", "PNG")
    print(f"  保存: {output_dir}/icon.png (1024x1024, RGB)")

    # --- 2. Adaptive Icon (adaptive-icon.png) ---
    # Android用: 1024x1024, 透過あり（チェッカー柄→透過）
    print("\n[2/4] Adaptive Icon (adaptive-icon.png)")
    adaptive = top_right.resize((1024, 1024), Image.LANCZOS)
    try:
        adaptive = make_background_transparent_simple(adaptive)
        print("  チェッカー柄→透過変換: 成功")
    except ImportError:
        print("  scipy未インストール、フォールバック処理を使用")
        adaptive = detect_checkerboard_and_make_transparent(adaptive)
    adaptive.save(f"{output_dir}/adaptive-icon.png", "PNG")
    print(f"  保存: {output_dir}/adaptive-icon.png (1024x1024, RGBA)")

    # --- 3. Splash Icon (splash-icon.png) ---
    # スプラッシュスクリーン用: 1024x1024
    # 白背景＋テキスト付きのデザイン
    print("\n[3/4] Splash Icon (splash-icon.png)")
    splash = bottom_left.resize((1024, 1024), Image.LANCZOS)
    # スプラッシュは背景色付きで使うのでRGBでOK
    # ただしapp.config.jsでbackgroundColor: "#0a0a0f"（暗い背景）を使っている
    # 白背景の画像なのでそのままRGBで保存
    splash_rgb = Image.new("RGB", splash.size, (255, 255, 255))
    splash_rgb.paste(splash, mask=splash.split()[3] if splash.mode == 'RGBA' else None)
    splash_rgb.save(f"{output_dir}/splash-icon.png", "PNG")
    print(f"  保存: {output_dir}/splash-icon.png (1024x1024, RGB)")

    # --- 4. Favicon (favicon.png) ---
    # Web用: 48x48, 透過あり
    print("\n[4/4] Favicon (favicon.png)")
    favicon = bottom_right.resize((48, 48), Image.LANCZOS)
    try:
        # 先にリサイズ前の大きいサイズで透過処理してからリサイズ
        favicon_large = bottom_right.resize((512, 512), Image.LANCZOS)
        favicon_large = make_background_transparent_simple(favicon_large)
        favicon = favicon_large.resize((48, 48), Image.LANCZOS)
        print("  チェッカー柄→透過変換: 成功")
    except ImportError:
        print("  scipy未インストール、フォールバック処理を使用")
        favicon_large = bottom_right.resize((512, 512), Image.LANCZOS)
        favicon_large = detect_checkerboard_and_make_transparent(favicon_large)
        favicon = favicon_large.resize((48, 48), Image.LANCZOS)
    favicon.save(f"{output_dir}/favicon.png", "PNG")
    print(f"  保存: {output_dir}/favicon.png (48x48, RGBA)")

    print("\n全アイコンの処理が完了しました！")
    print(f"出力先: {output_dir}/")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使い方: python3 scripts/process_icons.py <ソース画像パス>")
        print("例: python3 scripts/process_icons.py scripts/source_icon.png")
        sys.exit(1)

    process_source_image(sys.argv[1])
