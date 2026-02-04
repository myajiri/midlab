"""
MidLab アプリアイコン・スプラッシュスクリーン生成スクリプト

デザインコンセプト:
- エメラルドグリーン基調のスポーティなデザイン
- 陸上トラックのオーバル（横向き）+ 上昇グラフ（ラボのメタファー）
- 2026年フラットデザイントレンド
- 全年齢に親しまれるクリーンなデザイン
"""

from PIL import Image, ImageDraw, ImageFont
import math

# カラーパレット
BG_DARK = (10, 10, 15)           # #0a0a0f
EMERALD = (45, 159, 45)          # #2d9f2d プライマリ
EMERALD_LIGHT = (60, 200, 80)    # 明るいエメラルド
EMERALD_DARK = (25, 120, 35)     # 暗いエメラルド
TEAL = (30, 180, 140)            # ティール（アクセント）
WHITE = (255, 255, 255)
WHITE_50 = (255, 255, 255, 128)
WHITE_20 = (255, 255, 255, 51)
WHITE_10 = (255, 255, 255, 26)


def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    """角丸矩形を描画"""
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)


def draw_track_oval(draw, cx, cy, rx, ry, thickness, color, alpha_img=None):
    """トラックオーバルを描画（楕円リング）"""
    # 外側楕円
    draw.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=color
    )
    # 内側を切り抜き（背景色で塗りつぶし）
    inner_rx = rx - thickness
    inner_ry = ry - thickness
    draw.ellipse(
        [cx - inner_rx, cy - inner_ry, cx + inner_rx, cy + inner_ry],
        fill=BG_DARK
    )


def draw_rising_graph(draw, points, color, width=8):
    """上昇グラフを描画"""
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=color, width=width)


def draw_graph_dots(draw, points, color, radius=10):
    """グラフのドットを描画"""
    for px, py in points:
        draw.ellipse(
            [px - radius, py - radius, px + radius, py + radius],
            fill=color
        )


def create_icon(size=1024):
    """メインアプリアイコンを生成"""
    img = Image.new('RGBA', (size, size), BG_DARK + (255,))
    draw = ImageDraw.Draw(img)

    # 背景にサブトルなグラデーション風の円
    for i in range(3):
        r = size // 2 - i * 60
        alpha = 15 + i * 5
        overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse(
            [size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r],
            fill=(45, 159, 45, alpha)
        )
        img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    # --- トラックオーバル ---
    cx, cy = size // 2, size // 2 + 30
    rx, ry = 340, 240
    track_thickness = 48

    # トラックの影（深み）
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([cx - rx - 4, cy - ry + 8, cx + rx + 4, cy + ry + 8], fill=(0, 0, 0, 40))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)

    # トラック本体 (外側)
    draw.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=EMERALD
    )
    # トラック内側を切り抜き
    inner_rx = rx - track_thickness
    inner_ry = ry - track_thickness
    draw.ellipse(
        [cx - inner_rx, cy - inner_ry, cx + inner_rx, cy + inner_ry],
        fill=BG_DARK
    )

    # トラック上半分にグラデーション風のハイライト
    highlight = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.ellipse(
        [cx - rx, cy - ry, cx + rx, cy],
        fill=(255, 255, 255, 20)
    )
    # 内側部分をマスク
    hd.ellipse(
        [cx - inner_rx, cy - inner_ry, cx + inner_rx, cy],
        fill=(0, 0, 0, 0)
    )
    img = Image.alpha_composite(img, highlight)
    draw = ImageDraw.Draw(img)

    # トラックのレーンライン（内側）
    lane_overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lane_overlay)
    lane_rx = rx - track_thickness + 6
    lane_ry = ry - track_thickness + 6
    ld.ellipse(
        [cx - lane_rx, cy - lane_ry, cx + lane_rx, cy + lane_ry],
        outline=(255, 255, 255, 60), width=3
    )
    img = Image.alpha_composite(img, lane_overlay)
    draw = ImageDraw.Draw(img)

    # --- 上昇グラフ（トラック内部） ---
    # グラフのポイント（トラック内部に収まるように）
    graph_points = [
        (cx - 180, cy + 80),
        (cx - 90, cy + 40),
        (cx - 10, cy + 10),
        (cx + 80, cy - 50),
        (cx + 170, cy - 130),
    ]

    # グラフの下にグロー効果
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    # グラフ下の塗りつぶし領域
    fill_points = list(graph_points) + [
        (cx + 170, cy + 100),
        (cx - 180, cy + 100),
    ]
    gd.polygon(fill_points, fill=(45, 159, 45, 35))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # グラフライン
    for i in range(len(graph_points) - 1):
        draw.line(
            [graph_points[i], graph_points[i + 1]],
            fill=EMERALD_LIGHT, width=10
        )

    # グラフのドット
    for i, (px, py) in enumerate(graph_points):
        dot_r = 12 if i == len(graph_points) - 1 else 8
        # 外側のリング
        draw.ellipse(
            [px - dot_r - 3, py - dot_r - 3, px + dot_r + 3, py + dot_r + 3],
            fill=EMERALD_DARK
        )
        # 内側のドット
        draw.ellipse(
            [px - dot_r, py - dot_r, px + dot_r, py + dot_r],
            fill=EMERALD_LIGHT if i < len(graph_points) - 1 else WHITE
        )

    # --- 矢印（最後のドットから上方向） ---
    arrow_x = graph_points[-1][0]
    arrow_y = graph_points[-1][1] - 16
    arrow_top = arrow_y - 40
    draw.line([(arrow_x, arrow_y), (arrow_x, arrow_top)], fill=WHITE, width=6)
    # 矢じり
    draw.polygon([
        (arrow_x, arrow_top - 12),
        (arrow_x - 14, arrow_top + 6),
        (arrow_x + 14, arrow_top + 6),
    ], fill=WHITE)

    # --- "M" テキスト（左上） ---
    # フォントなしでも見栄えするようにシンプルに
    m_x, m_y = 140, 140
    m_size = 120
    # "M" を線で描画
    m_weight = 14
    draw.line([(m_x, m_y + m_size), (m_x, m_y)], fill=WHITE, width=m_weight)
    draw.line([(m_x, m_y), (m_x + m_size // 2, m_y + m_size * 0.5)], fill=WHITE, width=m_weight)
    draw.line([(m_x + m_size // 2, m_y + m_size * 0.5), (m_x + m_size, m_y)], fill=WHITE, width=m_weight)
    draw.line([(m_x + m_size, m_y), (m_x + m_size, m_y + m_size)], fill=WHITE, width=m_weight)

    # RGB に変換（iOS はアルファチャンネルなし必須）
    rgb_img = Image.new('RGB', (size, size), BG_DARK)
    rgb_img.paste(img, mask=img.split()[3])

    return rgb_img


def create_adaptive_icon(size=1024):
    """Android 適応型アイコン前景を生成（中央66%にコンテンツ）"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Android 適応型アイコンは外側が切り抜かれるため、
    # 重要な要素を中央 66% に収める
    safe_margin = int(size * 0.17)  # 17% マージン

    cx, cy = size // 2, size // 2 + 20
    rx, ry = 240, 170
    track_thickness = 36

    # トラック本体
    draw.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=EMERALD
    )
    inner_rx = rx - track_thickness
    inner_ry = ry - track_thickness
    draw.ellipse(
        [cx - inner_rx, cy - inner_ry, cx + inner_rx, cy + inner_ry],
        fill=(0, 0, 0, 0)
    )

    # 上昇グラフ
    graph_points = [
        (cx - 120, cy + 55),
        (cx - 50, cy + 25),
        (cx + 10, cy + 5),
        (cx + 70, cy - 30),
        (cx + 130, cy - 85),
    ]

    # グラフ下の塗りつぶし
    fill_points = list(graph_points) + [
        (cx + 130, cy + 70),
        (cx - 120, cy + 70),
    ]
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(fill_points, fill=(45, 159, 45, 50))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    for i in range(len(graph_points) - 1):
        draw.line(
            [graph_points[i], graph_points[i + 1]],
            fill=EMERALD_LIGHT, width=8
        )

    for i, (px, py) in enumerate(graph_points):
        dot_r = 9 if i == len(graph_points) - 1 else 6
        draw.ellipse(
            [px - dot_r, py - dot_r, px + dot_r, py + dot_r],
            fill=EMERALD_LIGHT if i < len(graph_points) - 1 else WHITE
        )

    # 矢印
    arrow_x = graph_points[-1][0]
    arrow_y = graph_points[-1][1] - 12
    arrow_top = arrow_y - 30
    draw.line([(arrow_x, arrow_y), (arrow_x, arrow_top)], fill=WHITE, width=5)
    draw.polygon([
        (arrow_x, arrow_top - 10),
        (arrow_x - 11, arrow_top + 5),
        (arrow_x + 11, arrow_top + 5),
    ], fill=WHITE)

    # "M" テキスト
    m_x, m_y = safe_margin + 30, safe_margin + 30
    m_size = 90
    m_weight = 11
    draw.line([(m_x, m_y + m_size), (m_x, m_y)], fill=WHITE, width=m_weight)
    draw.line([(m_x, m_y), (m_x + m_size // 2, m_y + m_size * 0.5)], fill=WHITE, width=m_weight)
    draw.line([(m_x + m_size // 2, m_y + m_size * 0.5), (m_x + m_size, m_y)], fill=WHITE, width=m_weight)
    draw.line([(m_x + m_size, m_y), (m_x + m_size, m_y + m_size)], fill=WHITE, width=m_weight)

    return img


def create_splash_icon(size=1024):
    """スプラッシュスクリーン用アイコンを生成"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2 - 20

    # トラックオーバル
    rx, ry = 300, 210
    track_thickness = 40

    draw.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=EMERALD
    )
    inner_rx = rx - track_thickness
    inner_ry = ry - track_thickness
    draw.ellipse(
        [cx - inner_rx, cy - inner_ry, cx + inner_rx, cy + inner_ry],
        fill=(0, 0, 0, 0)
    )

    # 上昇グラフ
    graph_points = [
        (cx - 160, cy + 70),
        (cx - 80, cy + 35),
        (cx, cy + 10),
        (cx + 80, cy - 40),
        (cx + 155, cy - 110),
    ]

    # グラフ下の塗りつぶし
    fill_points = list(graph_points) + [
        (cx + 155, cy + 85),
        (cx - 160, cy + 85),
    ]
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(fill_points, fill=(60, 200, 80, 40))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    for i in range(len(graph_points) - 1):
        draw.line(
            [graph_points[i], graph_points[i + 1]],
            fill=EMERALD_LIGHT, width=9
        )

    for i, (px, py) in enumerate(graph_points):
        dot_r = 10 if i == len(graph_points) - 1 else 7
        draw.ellipse(
            [px - dot_r, py - dot_r, px + dot_r, py + dot_r],
            fill=EMERALD_LIGHT if i < len(graph_points) - 1 else WHITE
        )

    # 矢印
    arrow_x = graph_points[-1][0]
    arrow_y = graph_points[-1][1] - 14
    arrow_top = arrow_y - 35
    draw.line([(arrow_x, arrow_y), (arrow_x, arrow_top)], fill=WHITE, width=5)
    draw.polygon([
        (arrow_x, arrow_top - 10),
        (arrow_x - 12, arrow_top + 5),
        (arrow_x + 12, arrow_top + 5),
    ], fill=WHITE)

    # "MidLab" テキストをトラック下に
    text_y = cy + ry + 60
    # "M" ロゴ大きめ
    m_x = cx - 160
    m_size = 80
    m_weight = 10
    draw.line([(m_x, text_y + m_size), (m_x, text_y)], fill=WHITE, width=m_weight)
    draw.line([(m_x, text_y), (m_x + m_size // 2, text_y + m_size * 0.5)], fill=WHITE, width=m_weight)
    draw.line([(m_x + m_size // 2, text_y + m_size * 0.5), (m_x + m_size, text_y)], fill=WHITE, width=m_weight)
    draw.line([(m_x + m_size, text_y), (m_x + m_size, text_y + m_size)], fill=WHITE, width=m_weight)

    return img


def create_favicon(size=48):
    """ファビコン用の簡略アイコン"""
    img = Image.new('RGBA', (size, size), BG_DARK + (255,))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2 + 2
    rx, ry = 18, 13
    thickness = 4

    # トラック
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=EMERALD)
    draw.ellipse(
        [cx - rx + thickness, cy - ry + thickness, cx + rx - thickness, cy + ry - thickness],
        fill=BG_DARK
    )

    # ミニグラフ
    pts = [
        (cx - 8, cy + 4),
        (cx - 2, cy),
        (cx + 4, cy - 4),
        (cx + 9, cy - 9),
    ]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i + 1]], fill=EMERALD_LIGHT, width=2)

    # ドット
    last = pts[-1]
    draw.ellipse([last[0] - 2, last[1] - 2, last[0] + 2, last[1] + 2], fill=WHITE)

    rgb_img = Image.new('RGB', (size, size), BG_DARK)
    rgb_img.paste(img, mask=img.split()[3])
    return rgb_img


if __name__ == '__main__':
    base_path = '/home/user/midlab/assets/images'

    # アプリアイコン（iOS / ストア用）
    icon = create_icon(1024)
    icon.save(f'{base_path}/icon.png', 'PNG')
    print('icon.png 生成完了 (1024x1024)')

    # Android 適応型アイコン前景
    adaptive = create_adaptive_icon(1024)
    adaptive.save(f'{base_path}/adaptive-icon.png', 'PNG')
    print('adaptive-icon.png 生成完了 (1024x1024)')

    # スプラッシュスクリーン
    splash = create_splash_icon(1024)
    splash.save(f'{base_path}/splash-icon.png', 'PNG')
    print('splash-icon.png 生成完了 (1024x1024)')

    # ファビコン
    fav = create_favicon(48)
    fav.save(f'{base_path}/favicon.png', 'PNG')
    print('favicon.png 生成完了 (48x48)')

    print('\nすべてのアセット生成完了')
