// ---------- Photo fix: crop the exercise, clean the photo, check what was read ----------
// photo → mark the exercise with four corners (a book photographed at an angle gets straightened) → the photo is
// cleaned (shadows and page colour removed, contrast, sharper, enlarged) → read on the device (or by smart reading
// when it's set up) → "this is what I read": fix it and solve.
// Uses the main script's: $, el, pick, lang, photoFor, setStatus, hasBridge, Android, onOcr, ocrLines, cleanOcrLine.
(function(){
  "use strict";
  if (typeof Android === "undefined") return;
  const STR = {
    title: ["Mark the exercise", "סמנו את התרגיל"],
    hint: ["Drag the four corners around the exercise only. A book photographed at an angle is straightened.", "גררו את ארבע הפינות סביב התרגיל בלבד. דף שצולם באלכסון יתיישר."],
    rotate: ["Rotate", "סיבוב"], all: ["Whole photo", "כל התמונה"], clean: ["Clean up", "ניקוי תמונה"],
    read: ["Read the exercise", "קרא את התרגיל"], cancel: ["Cancel", "ביטול"],
    working: ["Cleaning the photo…", "מנקה את התמונה…"],
    confirmT: ["This is what I read", "זה מה שקראתי"],
    confirmS: ["Check it against the photo and fix anything that's wrong, then solve.", "בדקו מול התמונה ותקנו מה שלא נכון, ואז לחצו פתרון."],
    solve: ["Solve", "פתרון"], again: ["Take it again", "לצלם שוב"], empty: ["I couldn't read anything. Type it, or take the photo again closer and with more light.", "לא הצלחתי לקרוא כלום. אפשר להקליד, או לצלם שוב מקרוב ועם יותר אור."],
    smart: ["✨ Smart reading", "✨ קריאה חכמה"],
  };
  const S = k => pick(...STR[k]);
  const calm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };

  const css = document.createElement("style"); css.textContent = `
.pf{position:fixed;inset:0;z-index:2000;background:#0E1222;color:#fff;display:flex;flex-direction:column;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));gap:10px;animation:pfin .3s ease both;font-family:var(--sans)}
.pf .top{display:flex;align-items:center;gap:10px}
.pf .top b{font-size:18px;flex:1}
.pf .x{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:20px;cursor:pointer}
.pf .hint{margin:0;font-size:14px;opacity:.8;line-height:1.4}
.pf .area{flex:1;min-height:0;position:relative;touch-action:none;display:flex;align-items:center;justify-content:center}
.pf canvas{max-width:100%;max-height:100%;display:block}
.pf .ov{position:absolute;pointer-events:none}
.pf .h{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:#fff;border:4px solid var(--pen,#3346E0);box-shadow:0 2px 10px rgba(0,0,0,.4);touch-action:none;cursor:grab}
.pf .h::after{content:"";position:absolute;inset:-14px;border-radius:50%}
.pf .tools{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.pf .tools button{border:1.5px solid rgba(255,255,255,.3);background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font:600 14px/1 var(--sans);cursor:pointer}
.pf .tools button[aria-pressed="true"]{background:#fff;color:#0E1222;border-color:#fff}
.pf .go{border:0;border-radius:16px;padding:15px;font:700 17px/1 var(--sans);background:var(--pen,#3346E0);color:#fff;cursor:pointer}
.pf .busy{position:absolute;inset:0;display:grid;place-items:center;background:rgba(14,18,34,.6);font-weight:700}
.pf .busy span{display:flex;align-items:center;gap:10px}
.pf .busy i{width:20px;height:20px;border-radius:50%;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;animation:pfspin .8s linear infinite}
.pfc{position:fixed;inset:0;z-index:2000;background:var(--bg,#F4F6FB);color:var(--ink);display:flex;flex-direction:column;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));gap:12px;overflow:auto;animation:pfin .3s ease both}
.pfc .card{background:var(--surface);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px;max-width:720px;width:100%;margin:0 auto}
.pfc h2{margin:0;font-size:20px}
.pfc p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}
.pfc .shot{max-height:200px;overflow:hidden;border-radius:12px;border:1.5px solid var(--line);background:#fff;display:flex;justify-content:center}
.pfc .shot img{max-width:100%;max-height:200px;object-fit:contain}
.pfc textarea{font:600 18px/1.5 var(--mono);padding:12px;border-radius:14px;border:2px solid var(--line);background:var(--surface-2);color:var(--ink);min-height:120px;resize:vertical;width:100%;direction:ltr;text-align:left}
.pfc textarea:focus{outline:none;border-color:var(--pen)}
.pfc .keys{display:flex;flex-wrap:wrap;gap:6px}
.pfc .keys button{min-width:42px;height:40px;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);font:600 17px/1 var(--mono);cursor:pointer}
.pfc .row{display:flex;gap:10px}
.pfc .row .btn{flex:1}
.pfc .tag{align-self:flex-start;font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px;background:var(--pen-soft);color:var(--pen)}
@keyframes pfin{from{opacity:0;transform:translateY(14px)}}
@keyframes pfspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pf,.pfc{animation:none}}
`; document.head.append(css);

  // ---------- 1. the photo comes in ----------
  let target = "solve", src = null, pending = null;     // pending: a photo we sent to be read, waiting for its text
  window.PhotoFix = {
    capture(t, gallery){
      target = t;
      if (gallery ? typeof Android.pickPhotoRaw === "function" : typeof Android.takePhotoRaw === "function") { photoFor = t; gallery ? Android.pickPhotoRaw() : Android.takePhotoRaw(); return true; }
      return false;
    },
    openBlob(blob, t){ target = t || target; photoFor = target; load(blob); },
  };
  window.onPhotoImage = img => load(img);
  function load(img){
    setStatus("");
    const im = new Image();
    im.onload = () => { src = toCanvas(im, 2200); if (typeof img !== "string") try { URL.revokeObjectURL(im.src); } catch (e) {} editor(); };
    im.onerror = () => window.onOcrError && window.onOcrError("open");
    im.src = typeof img === "string" ? img : URL.createObjectURL(img);
  }
  function toCanvas(im, max){
    const k = Math.min(1, max / Math.max(im.naturalWidth || im.width, im.naturalHeight || im.height));
    const c = document.createElement("canvas"); c.width = Math.round((im.naturalWidth || im.width) * k); c.height = Math.round((im.naturalHeight || im.height) * k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); return c;
  }
  function rotate90(c){
    const r = document.createElement("canvas"); r.width = c.height; r.height = c.width;
    const g = r.getContext("2d"); g.translate(r.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return r;
  }

  // ---------- 2. mark the exercise: four corners ----------
  function editor(){
    close();
    const ui = el("div", "pf"); ui.dir = lang === "he" ? "rtl" : "ltr";
    const top = el("div", "top"), x = el("button", "x", "✕"); x.type = "button"; x.setAttribute("aria-label", S("cancel"));
    top.append(el("b", null, S("title")), x);
    const area = el("div", "area"), cv = el("canvas"), ov = el("canvas", "ov");
    area.append(cv, ov);
    const tools = el("div", "tools");
    const bRot = el("button", null, "↻ " + S("rotate")), bAll = el("button", null, "⛶ " + S("all")), bClean = el("button", null, "✨ " + S("clean"));
    [bRot, bAll, bClean].forEach(b => b.type = "button"); bClean.setAttribute("aria-pressed", "true");
    tools.append(bRot, bAll, bClean);
    const go = el("button", "go", S("read")); go.type = "button";
    ui.append(top, el("p", "hint", S("hint")), area, tools, go);
    document.body.append(ui);
    let clean = true;
    // the corners, in photo pixels: start a little inside the edges
    let Q;
    const resetQ = full => { const w = src.width, h = src.height, m = full ? 0 : 0.015; Q = [[w * m, h * m], [w * (1 - m), h * m], [w * (1 - m), h * (1 - m)], [w * m, h * (1 - m)]]; };
    // the page's own corners when they can be found, else just inside the edges
    const autoQ = () => { let f = null; try { f = findPage(src); } catch (e) {} if (f) Q = f; else resetQ(false); return !!f; };
    autoQ();
    const handles = Q.map(() => { const h = el("div", "h"); area.append(h); return h; });
    let scale = 1, ox = 0, oy = 0;
    function layout(){
      const r = area.getBoundingClientRect();
      scale = Math.min(r.width / src.width, r.height / src.height);
      cv.width = Math.round(src.width * scale); cv.height = Math.round(src.height * scale);
      cv.getContext("2d").drawImage(src, 0, 0, cv.width, cv.height);
      const cr = cv.getBoundingClientRect(); ox = cr.left - r.left; oy = cr.top - r.top;
      ov.width = cv.width; ov.height = cv.height; ov.style.left = ox + "px"; ov.style.top = oy + "px";
      draw();
    }
    function draw(){
      const g = ov.getContext("2d"); g.clearRect(0, 0, ov.width, ov.height);
      g.fillStyle = "rgba(14,18,34,.55)"; g.beginPath(); g.rect(0, 0, ov.width, ov.height);
      g.moveTo(Q[0][0] * scale, Q[0][1] * scale); for (let i = 3; i >= 0; i--) g.lineTo(Q[i][0] * scale, Q[i][1] * scale); g.closePath(); g.fill("evenodd");
      g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.beginPath(); Q.forEach((p, i) => i ? g.lineTo(p[0] * scale, p[1] * scale) : g.moveTo(p[0] * scale, p[1] * scale)); g.closePath(); g.stroke();
      handles.forEach((h, i) => { h.style.left = (ox + Q[i][0] * scale) + "px"; h.style.top = (oy + Q[i][1] * scale) + "px"; });
    }
    handles.forEach((h, i) => {
      h.onpointerdown = e => {
        e.preventDefault(); h.setPointerCapture(e.pointerId);
        const move = ev => {
          const r = cv.getBoundingClientRect();
          Q[i] = [Math.max(0, Math.min(src.width, (ev.clientX - r.left) / scale)), Math.max(0, Math.min(src.height, (ev.clientY - r.top) / scale))];
          draw();
        };
        h.onpointermove = move; h.onpointerup = h.onpointercancel = () => { h.onpointermove = null; };
      };
    });
    bRot.onclick = () => { src = rotate90(src); autoQ(); layout(); };
    bAll.onclick = () => { resetQ(true); draw(); };
    bClean.onclick = () => { clean = !clean; bClean.setAttribute("aria-pressed", String(clean)); };
    x.onclick = () => { close(); setStatus(""); };
    go.onclick = () => {
      const busy = el("div", "busy"); const sp = el("span"); sp.append(el("i"), document.createTextNode(S("working"))); busy.append(sp); area.append(busy);
      setTimeout(() => {
        let out;
        try { out = warp(src, Q); if (clean) out = enhance(out); } catch (e) { console.error(e); out = src; }
        close(); read(out);
      }, 30);
    };
    const onResize = () => { if (ui.isConnected) layout(); else window.removeEventListener("resize", onResize); };
    window.addEventListener("resize", onResize);
    requestAnimationFrame(layout);
    PhotoFix.ui = ui;
  }
  function close(){ for (const n of document.querySelectorAll(".pf,.pfc")) n.remove(); }

  // ---------- finding the page by itself ----------
  // A page is the big bright patch: a small copy of the photo, the brightness that splits page from table (Otsu),
  // the largest connected bright patch, and its four extreme points (top-left = smallest x+y, and so on).
  // Nothing found (the page fills the photo, or no clear patch): null, and the corners start just inside the edges.
  function findPage(c){
    const k = Math.min(1, 240 / Math.max(c.width, c.height)), w = Math.max(8, Math.round(c.width * k)), h = Math.max(8, Math.round(c.height * k));
    const sm = document.createElement("canvas"); sm.width = w; sm.height = h; const g = sm.getContext("2d"); g.drawImage(c, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, N = w * h, v = new Uint8Array(N), hist = new Uint32Array(256);
    for (let i = 0; i < N; i++) { v[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) | 0; hist[v[i]]++; }
    let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
    let sB = 0, wB = 0, best = -1, th = 128;
    for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = N - wB; if (!wF) break; sB += t * hist[t];
      const mB = sB / wB, mF = (sum - sB) / wF, b = wB * wF * (mB - mF) * (mB - mF); if (b > best) { best = b; th = t; } }
    const lab = new Int32Array(N).fill(-1); let bestId = -1, bestN = 0; const q = new Int32Array(N);
    for (let s0 = 0; s0 < N; s0++) {
      if (lab[s0] !== -1 || v[s0] <= th) continue;
      let qh = 0, qt = 0, n = 0; q[qt++] = s0; lab[s0] = s0;
      while (qh < qt) { const p = q[qh++]; n++; const x = p % w, y = (p / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const r = yy * w + xx; if (lab[r] === -1 && v[r] > th) { lab[r] = s0; q[qt++] = r; } } }
      if (n > bestN) { bestN = n; bestId = s0; }
    }
    const frac = bestN / N; if (bestId < 0 || frac < 0.12 || frac > 0.9) return null;
    let tl, tr, br, bl, a1 = Infinity, a2 = -Infinity, a3 = -Infinity, a4 = Infinity, touch = 0;
    for (let i = 0; i < N; i++) { if (lab[i] !== bestId) continue; const x = i % w, y = (i / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touch++;
      if (x + y < a1) { a1 = x + y; tl = [x, y]; } if (x + y > a2) { a2 = x + y; br = [x, y]; }
      if (x - y > a3) { a3 = x - y; tr = [x, y]; } if (x - y < a4) { a4 = x - y; bl = [x, y]; } }
    const Qs = [tl, tr, br, bl];
    // the four corners must make a real, convex shape that covers most of the patch, and the patch must not run off the photo much
    const area = Math.abs(Qs.reduce((a, p, i) => { const n = Qs[(i + 1) % 4]; return a + p[0] * n[1] - n[0] * p[1]; }, 0)) / 2;
    const cross = i => { const [a, b, c2] = [Qs[i], Qs[(i + 1) % 4], Qs[(i + 2) % 4]]; return (b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0]); };
    const sg = [0, 1, 2, 3].map(cross);
    if (!(sg.every(x => x > 0) || sg.every(x => x < 0)) || area < bestN * 0.75 || touch > (w + h) * 0.5) return null;
    return Qs.map(p => [Math.min(c.width, (p[0] + 0.5) / k), Math.min(c.height, (p[1] + 0.5) / k)]);
  }
  PhotoFix.findPage = findPage;

  // ---------- 3. straighten: the marked corners become a flat rectangle ----------
  function homography(from, to){
    // the 3×3 matrix taking 4 points to 4 points (solved as 8 linear equations)
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = from[i], [u, v] = to[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let c = 0; c < 8; c++) {
      let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    const h = b.map((v, i) => v / A[i][i]); return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function warp(c, Q){
    let W = Math.max(dist(Q[0], Q[1]), dist(Q[3], Q[2])), H = Math.max(dist(Q[0], Q[3]), dist(Q[1], Q[2]));
    // small text reads better a little bigger: aim for ~1600 px on the long side, at most ×2.5
    const k = Math.max(0.5, Math.min(2.5, 1600 / Math.max(W, H)));
    W = Math.max(40, Math.round(W * k)); H = Math.max(40, Math.round(H * k));
    const M = homography([[0, 0], [W, 0], [W, H], [0, H]], Q);
    const sd = c.getContext("2d").getImageData(0, 0, c.width, c.height), s = sd.data, sw = c.width, sh = c.height;
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d"), od = g.createImageData(W, H), o = od.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const z = M[6] * x + M[7] * y + M[8], X = (M[0] * x + M[1] * y + M[2]) / z, Y = (M[3] * x + M[4] * y + M[5]) / z;
      const x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, j = (y * W + x) * 4;
      if (x0 < 0 || y0 < 0 || x0 >= sw - 1 || y0 >= sh - 1) { o[j] = o[j + 1] = o[j + 2] = 255; o[j + 3] = 255; continue; }
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      for (let ch = 0; ch < 3; ch++) o[j + ch] = (s[i00 + ch] * (1 - fx) + s[i10 + ch] * fx) * (1 - fy) + (s[i01 + ch] * (1 - fx) + s[i11 + ch] * fx) * fy;
      o[j + 3] = 255;
    }
    g.putImageData(od, 0, 0); return out;
  }

  // ---------- 4. clean: shadows and paper colour out, ink dark, edges sharp ----------
  function enhance(c){
    const W = c.width, H = c.height, g = c.getContext("2d"), d = g.getImageData(0, 0, W, H), p = d.data, N = W * H;
    const gray = new Float32Array(N);
    for (let i = 0; i < N; i++) gray[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
    // the paper's own brightness, very blurred (shadows, a yellow page): divide it out
    const sm = document.createElement("canvas"), bw = Math.max(8, Math.round(W / 24)), bh = Math.max(8, Math.round(H / 24));
    sm.width = bw; sm.height = bh; const sg = sm.getContext("2d"); sg.imageSmoothingQuality = "high"; sg.drawImage(c, 0, 0, bw, bh);
    const bd = sg.getImageData(0, 0, bw, bh).data, bg0 = new Float32Array(bw * bh);
    // the paper is the bright part: take the brightest of each pixel's neighbours, then smooth
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.min(bw - 1, Math.max(0, x + dx)), yy = Math.min(bh - 1, Math.max(0, y + dy)), q = (yy * bw + xx) * 4; m = Math.max(m, 0.299 * bd[q] + 0.587 * bd[q + 1] + 0.114 * bd[q + 2]); }
      bg0[y * bw + x] = m;
    }
    const bgAt = (x, y) => {   // bilinear, in full-size pixels
      const X = Math.min(bw - 1.001, Math.max(0, x / W * bw - 0.5)), Y = Math.min(bh - 1.001, Math.max(0, y / H * bh - 0.5)), x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0;
      return (bg0[y0 * bw + x0] * (1 - fx) + bg0[y0 * bw + x0 + 1] * fx) * (1 - fy) + (bg0[(y0 + 1) * bw + x0] * (1 - fx) + bg0[(y0 + 1) * bw + x0 + 1] * fx) * fy;
    };
    const n = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; n[i] = Math.min(255, gray[i] / Math.max(30, bgAt(x, y)) * 255); }
    // stretch the contrast: the darkest 1% black, the paper white
    const hist = new Uint32Array(256); for (let i = 0; i < N; i++) hist[n[i] | 0]++;
    let lo = 0, acc = 0; while (lo < 254 && (acc += hist[lo]) < N * 0.01) lo++;
    const hi = 235;
    // and sharpen a little (unsharp mask)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = n[i];
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) v = v * 1.6 - 0.15 * (n[i - 1] + n[i + 1] + n[i - W] + n[i + W]);
      v = (v - lo) / Math.max(1, hi - lo) * 255;
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      v = 255 * Math.pow(v / 255, 1.25);           // ink a bit darker
      if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) v = 255;   // the cut edge: white, not a dotted line
      p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v;
    }
    g.putImageData(d, 0, 0); return c;
  }

  // ---------- 5. read it: smart reading when it's set up, otherwise on the device ----------
  function read(c){
    const url = c.toDataURL("image/jpeg", 0.92);
    pending = { target, url };
    photoFor = target;
    if (window.SmartRead && SmartRead.available()) {
      if (window.onPhotoStart) window.onPhotoStart();
      SmartRead.read(url, target).then(text => { if (pending) window.onOcr(text, []); }).catch(() => device(c, url));
      return;
    }
    device(c, url);
  }
  function device(c, url){
    if (typeof Android.scanData === "function") Android.scanData(url);
    else if (typeof Android.scanImage === "function") c.toBlob(b => Android.scanImage(b), "image/jpeg", 0.92);
    else { pending = null; setStatus("appOnly", true); }
  }

  // ---------- Hebrew words in their place ----------
  // The phone's main reader knows only Latin letters and digits; a second reader (Tesseract, Hebrew) gives the Hebrew
  // words with their place in the photo. Words are grouped into lines by height; a line with Hebrew reads right to left,
  // with each run of math inside it kept left to right. Where both readers saw the same spot, math wins over a Hebrew
  // guess at it, and Hebrew wins over the Latin reader's junk for a Hebrew word.
  const HEB = /[\u05D0-\u05EA]/;
  const mathy = t => /[0-9=()+^\/;<>∥|√²³°]/.test(t) || /^[A-Z]{1,5}[.,:]?$/.test(t) || /^[a-z][.,]?$/.test(t);
  function mergeHebrew(text, items){
    if (!Array.isArray(items)) return null;
    // a Hebrew word: mostly Hebrew letters (the Hebrew reader also "reads" numbers as Hebrew-ish junk like (ש2;6)א)
    const heOk = t => { const a = String(t).replace(/[^\u05D0-\u05EAA-Za-z0-9]/g, ""), h = (a.match(/[\u05D0-\u05EA]/g) || []).length; return h >= 1 && h / a.length >= 0.75; };
    const he = items.filter(i => i && i.he && heOk(i.t)).map(i => Object.assign({}, i, { t: String(i.t).replace(/[A-Za-z0-9]/g, "") })), la = items.filter(i => i && !i.he);
    if (!he.length) return null;
    // the point names this exercise really uses: letters right before a "(" (A(2;6)), and names made of them (ABCD)
    const known = new Set();
    for (const m of la.slice().sort((a, b) => a.y - b.y || a.x - b.x).map(l => l.t).join(" ").matchAll(/(?<![A-Za-z])([A-Z])\s*\(\s*[-−–]?\s*[\dlIO.]/g)) known.add(m[1]);
    for (const l of la) { const m = String(l.t).match(/^[.,(]?([A-HKMOST])[.,:)]?$/); if (m) known.add(m[1]); }   // a letter alone: a point's name (E, G; not N, W, I, which the Latin reader makes of Hebrew)
    const okName = t => t.length === 1 || (t.length <= 5 && [...t].every(c => known.has(c)));
    // the Latin reader's guesses at Hebrew words ("NN", "IN2DIN", "0n"), inside a line that has Hebrew
    const junk = (t, mathLine) => {
      const w = String(t).replace(/[^A-Za-z]/g, "");
      if (!w) return false;
      if (/[A-Z]/.test(w) && known.size && !okName(w.replace(/[a-z]/g, "")) && !/\(/.test(t)) return true;
      if (/[a-z]/.test(w) && /[A-Z]/.test(w) && !/\(/.test(t)) return true;
      if (!mathLine && /^[a-z]{2,}$/.test(w) && !/^(sin|cos|tan|log|ln|sqrt)$/.test(w)) return true;
      if (/^[^A-Za-z]*[a-z]{3,}[^A-Za-z]*$/.test(t) && !/^(sin|cos|tan|log|ln|sqrt)$/.test(w)) return true;
      return false;
    };
    const wd = i => i.w || i.h * Math.max(1, String(i.t).length) * 0.55;
    const overlap = (a, b) => Math.abs(a.y - b.y) < Math.max(a.h, b.h) * 0.6 && Math.abs(a.x - b.x) < (wd(a) + wd(b)) / 2 * 0.85;
    const keepLa = [], dropHe = new Set();
    for (const l of la) {
      const hit = he.filter(h => overlap(l, h));
      if (!hit.length) { keepLa.push(l); continue; }
      // math wins; a lone letter only beats an unsure Hebrew word (the Latin reader turns "ב." into "a")
      const strong = /[0-9=()+^\/;<>∥|√²³°]/.test(l.t) || /^[A-Z]{1,5}[.,:]?$/.test(l.t);
      // a numbering mark (א. ב. ג.) read with confidence beats a short Latin guess at it ("a", ">]", "7")
      const marker = hit.some(h => /^[\u05D0-\u05EA]\.$/.test(h.t) && (h.c == null || h.c >= 60)) && String(l.t).length <= 2;
      if (!marker && mathy(l.t) && !junk(l.t) && (strong || hit.every(h => (h.c == null ? 0 : h.c) < 60))) { keepLa.push(l); hit.forEach(h => dropHe.add(h)); }
    }
    const words = keepLa.concat(he.filter(h => !dropHe.has(h))).sort((a, b) => a.y - b.y);
    const lines = [];
    for (const w of words) {
      const L = lines.find(L => Math.abs(L.y - w.y) < Math.max(L.h, w.h) * 0.6);
      if (L) { L.ws.push(w); if (!w.he) { L.n++; } L.h = Math.max(L.h, w.h); }
      else lines.push({ y: w.y, h: w.h, ws: [w], n: 0 });
    }
    lines.sort((a, b) => a.y - b.y);
    const out = lines.map(L => {
      if (!L.ws.some(w => w.he)) {
        L.ws = L.ws.filter(w => !junk(w.t, true)); if (!L.ws.length) return "";
        // only math: the page's own line builder (it knows small raised digits are powers)
        const ids = [...new Set(L.ws.map(w => w.id))].sort((a, b) => Math.min(...L.ws.filter(w => w.id === a).map(w => w.x)) - Math.min(...L.ws.filter(w => w.id === b).map(w => w.x)));
        try { return ids.map(id => ocrLines("", L.ws.filter(w => w.id === id))[0]).join(" "); } catch (e) { return L.ws.sort((a, b) => a.x - b.x).map(w => w.t).join(" "); }
      }
      const ws = L.ws.slice().sort((a, b) => b.x - a.x), parts = []; let run = [];
      const flush = () => { if (run.length) { parts.push(run.reverse().map(w => w.t).join(" ")); run = []; } };
      for (const w of ws) { if (w.he) { flush(); parts.push(w.t); } else if (!junk(w.t)) run.push(w); }
      flush();
      return parts.join(" ");
    }).filter(l => l.trim());
    // "ציר y" read with the Hebrew reader turns into "ציר צ"
    return { text: out.join("\n").replace(/ציר\s+צ(?=[\s).,]|$)/g, "ציר y").replace(/ציר\s+(?:א|ж)(?=[\s).,]|$)/g, "ציר x"), items: la };
  }
  window.PhotoFixMerge = mergeHebrew;

  // ---------- 6. "this is what I read" ----------
  const baseOcr = window.onOcr;
  window.onOcr = (text, items) => {
    const m = mergeHebrew(text, items);
    if (m) {
      if (pending) { const p = pending; pending = null; setStatus(""); return confirm(p, m.text, [], m.items); }
      return photoFor === "geo" ? baseOcr(m.text, m.items) : baseOcr(m.text, []);
    }
    if (!pending) return baseOcr(text, items);
    const p = pending; pending = null; setStatus("");
    confirm(p, String(text || ""), items || []);
  };
  const baseErr = window.onOcrError;
  window.onOcrError = key => { pending = null; return baseErr ? baseErr(key) : undefined; };
  function cleaned(text, items){
    if (target === "geo") return String(text).trim();
    try {
      return ocrLines(text, items).map(l => HEB.test(l) ? l : cleanOcrLine(l)).filter(l => l.trim() && (!HEB.test(l) || /[\d=]/.test(l))).join("\n");
    } catch (e) { return String(text).trim(); }
  }
  function confirm(p, text, items, drawItems){
    close();
    const ui = el("div", "pfc"); ui.dir = lang === "he" ? "rtl" : "ltr";
    const card = el("div", "card");
    card.append(el("h2", null, S("confirmT")), el("p", null, S("confirmS")));
    if (window.SmartRead && SmartRead.lastWasSmart) card.append(el("span", "tag", S("smart")));
    const shot = el("div", "shot"), im = el("img"); im.src = p.url; im.alt = ""; shot.append(im);
    const ta = el("textarea"); ta.value = cleaned(text, items); ta.spellcheck = false;
    if (/[֐-׿]/.test(ta.value)) { ta.style.direction = "rtl"; ta.style.textAlign = "right"; }
    const keys = el("div", "keys");
    for (const k of ["²", "³", "√", "/", "^", "(", ")", "π", "°", "≤", "≥", "∥", "∠", "△", "·"]) {
      const b = el("button", null, k); b.type = "button";
      b.onclick = () => { const s0 = ta.selectionStart, e0 = ta.selectionEnd; ta.setRangeText(k, s0, e0, "end"); ta.focus(); };
      keys.append(b);
    }
    const row = el("div", "row"), ok = el("button", "btn", S("solve")), again = el("button", "btn quiet", "📷 " + S("again"));
    ok.type = again.type = "button"; row.append(ok, again);
    card.append(shot, ta, keys, row);
    if (!ta.value.trim()) card.insertBefore(el("p", null, S("empty")), shot);
    ui.append(card); document.body.append(ui);
    PhotoFix.ui = ui;
    setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) {} }, 60);
    const t0 = ta.value;
    ok.onclick = () => {
      const v = ta.value.trim(); close();
      photoFor = p.target;
      if (p.target === "geo") return baseOcr(v, v === t0 ? (drawItems || items) : []);
      if (!v) return;
      $("problem").value = v; setStatus("checkText"); solveNow();
    };
    again.onclick = () => { close(); PhotoFix.capture(p.target, false) || setStatus(""); };
  }
  // the hardware back button closes the photo screens
  const prevBack = window.onBack;
  window.onBack = () => { if (document.querySelector(".pf,.pfc")) { close(); setStatus(""); return true; } return prevBack ? prevBack() : false; };
})();
