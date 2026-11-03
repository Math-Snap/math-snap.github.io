"""Builds the iPhone / browser version of Math Snap into docs/app.

The app screen (index.html, solver.js, math.js, fonts) is shared with the Android app.
This script copies it, adds the web bridge, home-screen tags and offline support,
and draws the icons. Run it after changing anything in app/src/main/assets:

    python3 tools/build_web.py
"""
import hashlib, os, shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "app/src/main/assets"
WEB = ROOT / "web"
OUT = ROOT / "docs/app"

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "fonts").mkdir(exist_ok=True)

for name in ["solver.js", "math.js"]:
    shutil.copy(ASSETS / name, OUT / name)
for f in (ASSETS / "fonts").iterdir():
    shutil.copy(f, OUT / "fonts" / f.name)
for name in ["web-bridge.js", "install-gate.js", "manifest.webmanifest"]:
    shutil.copy(WEB / name, OUT / name)
if not (OUT / "firebase-config.js").exists():
    shutil.copy(WEB / "firebase-config.js", OUT / "firebase-config.js")

html = (ASSETS / "index.html").read_text(encoding="utf-8")
html = html.replace('<meta name="viewport" content="width=device-width,initial-scale=1">',
                    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">', 1)
head_tags = """
<meta name="description" content="Math Snap: פותר תרגילים במתמטיקה עם הסבר לכל שלב.">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#F2F4F9">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Math Snap">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
"""
html = html.replace("<title>Math Snap</title>", "<title>Math Snap</title>" + head_tags, 1)
html = html.replace('<script src="math.js"></script>',
                    '<script src="firebase-config.js"></script>\n<script src="web-bridge.js"></script>\n<script src="math.js"></script>', 1)
html = html.replace("</body>", """<script src="install-gate.js"></script>
<script>
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
</script>
</body>""", 1)
(OUT / "index.html").write_text(html, encoding="utf-8")

# offline cache name changes whenever the app changes, so phones pick up updates
h = hashlib.sha1()
for name in ["index.html", "solver.js", "web-bridge.js", "install-gate.js", "manifest.webmanifest"]:
    h.update((OUT / name).read_bytes())
sw = (WEB / "sw.js").read_text(encoding="utf-8").replace("__VERSION__", h.hexdigest()[:10])
(OUT / "sw.js").write_text(sw, encoding="utf-8")

# icons: the Math Snap mark (ink-blue square, white viewfinder, equals sign, highlighter dot)
def icon(size, pad=0.0, rounded=True):
    S = 4 * size
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    blue, white, mark = (51, 70, 224, 255), (255, 255, 255, 255), (255, 226, 122, 255)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=blue)
    else:
        d.rectangle([0, 0, S, S], fill=blue)
    inner = S * (1 - 2 * pad)
    o = S * pad
    u = inner / 28.0
    def P(x, y): return (o + x * u, o + y * u)
    w = max(2, int(2.6 * u))
    for pts in [[(5, 10), (5, 5), (10, 5)], [(18, 5), (23, 5), (23, 10)], [(23, 18), (23, 23), (18, 23)], [(10, 23), (5, 23), (5, 18)]]:
        d.line([P(*p) for p in pts], fill=white, width=w, joint="curve")
        for p in (pts[0], pts[2]):
            x, y = P(*p); d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=white)
    for y in (12, 16):
        d.line([P(10, y), P(18, y)], fill=white, width=w)
        for x0 in (10, 18):
            x, yy = P(x0, y); d.ellipse([x - w / 2, yy - w / 2, x + w / 2, yy + w / 2], fill=white)
    x, y = P(20.3, 20.3); r = 1.2 * u
    d.ellipse([x - r, y - r, x + r, y + r], fill=mark)
    return im.resize((size, size), Image.LANCZOS)

icon(192).save(OUT / "icon-192.png")
icon(512).save(OUT / "icon-512.png")
icon(180, rounded=False).save(OUT / "apple-touch-icon.png")
icon(512, pad=0.12, rounded=False).save(OUT / "icon-maskable-512.png")
print("built", OUT)
