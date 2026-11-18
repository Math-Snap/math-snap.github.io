// ---------- Pro: study for a test (לימוד למבחן) ----------
// Load a PDF or photos of pages (worksheets, old tests, summaries), read them here with notes on each page,
// and practice exercises like the ones in the file. Files stay on this device (IndexedDB).
// Uses the main script's helpers: $, el, svgEl, mathEl, dirOf, pick, lang, isPro, openPro, ProCore, Solver,
// practiceSet / renderPractice / openProSheet, ocrLines / cleanOcrLine, tab, solveNow.
(function(){
  "use strict";
  const STR = {
    title: ["Study for a test", "לימוד למבחן"],
    intro: ["Load a PDF or photos of a worksheet, an old test or your summary. Read it here, write notes on the pages, and practice exercises like the ones in it.",
            "העלו PDF או תמונות של דף עבודה, מבחן קודם או סיכום. קוראים אותו כאן, כותבים הערות על הדפים ומתרגלים תרגילים כמו שבקובץ."],
    add: ["Add a PDF or photos", "הוספת PDF או תמונות"],
    empty: ["No files yet.", "עוד אין קבצים."],
    pages: [n => n + (n === 1 ? " page" : " pages"), n => n === 1 ? "עמוד אחד" : n + " עמודים"],
    exN: [n => n + (n === 1 ? " exercise" : " exercises"), n => n === 1 ? "תרגיל אחד" : n + " תרגילים"],
    photos: ["Photos", "תמונות"],
    del: ["Delete", "מחיקה"], delSure: ["Delete?", "למחוק?"],
    back: ["Back", "חזרה"], close: ["Close", "סגירה"],
    read: ["Read", "קריאה"], exTab: ["Exercises", "תרגילים"],
    practice: ["🎯 Practice like this file", "🎯 תרגול כמו בקובץ"],
    page: [n => "Page " + n, n => "עמוד " + n],
    note: ["Note", "הערה"], notePh: ["Write a note for this page…", "כתבו הערה לעמוד הזה…"], save: ["Save", "שמירה"], cancel: ["Cancel", "ביטול"],
    find: ["🔍 Find the exercises in this file", "🔍 מציאת התרגילים בקובץ"],
    finding: ["Looking for exercises…", "מחפש תרגילים…"],
    reading: [(i, n) => "Reading picture " + i + " of " + n + "…", (i, n) => "קורא תמונה " + i + " מתוך " + n + "…"],
    found: [n => n ? "Found " + n + (n === 1 ? " exercise" : " exercises") : "No exercises found. You can add them yourself below.",
            n => n ? (n === 1 ? "נמצא תרגיל אחד" : "נמצאו " + n + " תרגילים") : "לא נמצאו תרגילים. אפשר להוסיף אותם בעצמכם למטה."],
    noScan: ["Reading text from photos needs the newest version of the app. You can add the exercises yourself below.",
             "קריאת טקסט מתמונות צריכה את הגרסה החדשה של האפליקציה. אפשר להוסיף את התרגילים בעצמכם למטה."],
    addEx: ["Add an exercise", "הוספת תרגיל"], addPh: ["2x + 5 = 17", "2x + 5 = 17"],
    badEx: ["I can't solve that one. Check how it's written.", "את זה אני לא מצליח לפתור. בדקו איך הוא כתוב."],
    solve: ["Solve", "פתרון"], remove: ["Remove", "הסרה"],
    noEx: ["No exercises yet. Find them in the file or add them yourself.", "עוד אין תרגילים. אפשר למצוא אותם בקובץ או להוסיף בעצמכם."],
    noPractice: ["None of these exercises can be turned into practice yet. Practice works on equations, inequalities and calculations with a number answer.",
                 "אי אפשר עדיין ליצור תרגול מהתרגילים האלה. התרגול עובד על משוואות, אי-שוויונים וחישובים עם תשובה במספרים."],
    topics: ["Topics to practice", "נושאים לתרגול"],
    topicsFound: ["Found in the file. Tap to add or remove topics.", "זוהו בקובץ. אפשר ללחוץ כדי להוסיף או להוריד נושאים."],
    topicsNone: ["I didn't find topics in this file. Pick some, or practice a general mix.", "לא מצאתי נושאים בקובץ. בחרו נושאים, או שהתרגול יהיה כללי."],
    tooBig: ["That file is too big (over 40 MB).", "הקובץ גדול מדי (מעל 40MB)."],
    badPdf: ["I couldn't open this PDF.", "לא הצלחתי לפתוח את ה-PDF הזה."],
    loading: ["Opening…", "פותח…"],
    local: ["Files stay on this device only.", "הקבצים נשמרים רק במכשיר הזה."],
    memOnly: ["This device can't keep files, so they'll be gone when you close the app.", "המכשיר הזה לא שומר קבצים, אז הם יימחקו כשסוגרים את האפליקציה."],
  };
  const S = (k, ...a) => { const v = pick(...STR[k]); return typeof v === "function" ? v(...a) : v; };
  const ICON = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  };

  // ---------- storage: IndexedDB, or memory if this device won't keep files ----------
  const mem = new Map(); let dbp = null, memOnly = false;
  function db(){
    if (dbp) return dbp;
    dbp = new Promise(res => {
      try {
        const rq = indexedDB.open("mathsnap-study", 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore("files", { keyPath: "id" });
        rq.onsuccess = () => res(rq.result);
        rq.onerror = rq.onblocked = () => { memOnly = true; res(null); };
      } catch (e) { memOnly = true; res(null); }
    });
    return dbp;
  }
  async function tx(mode, fn){
    const d = await db(); if (!d) return fn(null);
    return new Promise((res, rej) => { const t = d.transaction("files", mode), st = t.objectStore("files"); const r = fn(st); t.oncomplete = () => res(r && r.result !== undefined ? r.result : r); t.onerror = () => rej(t.error); });
  }
  const putFile = f => tx("readwrite", st => st ? st.put(f) : mem.set(f.id, f)).catch(() => { memOnly = true; mem.set(f.id, f); });
  const getFile = id => tx("readonly", st => st ? st.get(id) : mem.get(id)).catch(() => mem.get(id));
  const delFile = id => tx("readwrite", st => st ? st.delete(id) : mem.delete(id)).catch(() => mem.delete(id));
  const allFiles = () => tx("readonly", st => st ? st.getAll() : [...mem.values()]).then(a => (a || []).concat(memOnly ? [] : [...mem.values()])).catch(() => [...mem.values()]);

  // ---------- pdf.js, loaded only when it's needed (the worker runs on the page, so it works from the app's files too) ----------
  let pdfp = null;
  const loadJs = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });
  function pdfjs(){
    if (!pdfp) pdfp = loadJs("pdfjs/pdf.worker.min.js").then(() => loadJs("pdfjs/pdf.min.js")).then(() => {
      const L = window.pdfjsLib; L.GlobalWorkerOptions.workerSrc = "pdfjs/pdf.worker.min.js"; return L;
    }).catch(e => { pdfp = null; throw e; });
    return pdfp;
  }
  const docs = new Map(); // file id -> open pdf document
  async function openPdf(f){
    if (docs.has(f.id)) return docs.get(f.id);
    const L = await pdfjs(); const buf = await f.blobs[0].arrayBuffer();
    const d = await L.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise; docs.set(f.id, d); return d;
  }

  // ---------- finding exercises in text ----------
  const MATHCH = /[0-9a-zA-Z+\-*/^=().,:²³⁴√×÷−–<>≤≥·\s]/;
  function exercisesIn(lines){
    const out = [], seen = new Set();
    for (let line of lines) {
      line = String(line).replace(/[−–—]/g, "-").replace(/[⁦-⁩‎‏]/g, "");
      for (let seg of line.split(/[֐-׿"'״׳?!;]+/)) {
        seg = seg.replace(/^\s*(?:\(?\d{1,2}[.)]|[a-hא-י][.)]|\d{1,2}\s*\))\s+/, "").replace(/[.,:\s]+$/, "").trim();
        if (seg.length < 3 || seg.length > 70 || !/\d/.test(seg) || !/[+\-*/^=×÷:<>≤≥²³√]/.test(seg)) continue;
        if ([...seg].some(c => !MATHCH.test(c))) continue;
        if (/^\d{1,4}([./-])\d{1,2}\1\d{2,4}$/.test(seg) || /^[\d\s.,:-]+$/.test(seg) && !/[+*/^=]/.test(seg)) continue; // dates, page numbers
        if (/[a-z]{3,}/i.test(seg.replace(/sin|cos|tan|log|ln|sqrt/gi, ""))) continue; // English words
        const k = seg.replace(/\s+/g, ""); if (seen.has(k)) continue;
        let r; try { r = Solver.solve(seg, lang); } catch (e) { r = null; }
        if (!r || !r.length || r.some(x => x.error)) continue;
        seen.add(k); out.push(seg.replace(/\^(\d)(?!\d)/g, (m, d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]));
        if (out.length >= 80) return out;
      }
    }
    return out;
  }
  async function pdfLines(f){
    const d = await openPdf(f), lines = [];
    for (let p = 1; p <= d.numPages; p++) {
      const tc = await (await d.getPage(p)).getTextContent(), rows = [];
      for (const it of tc.items) {
        if (!it.str || !it.str.trim()) continue;
        const y = it.transform[5], x = it.transform[4];
        let row = rows.find(r => Math.abs(r.y - y) < 3); if (!row) rows.push(row = { y, parts: [] });
        row.parts.push({ x, s: it.str });
      }
      rows.sort((a, b) => b.y - a.y).forEach(r => lines.push(r.parts.sort((a, b) => a.x - b.x).map(q => q.s).join(" ")));
    }
    return lines;
  }
  // reading a picture: the web and Windows app read a file, the Android app reads a picture we hand it
  const canScan = () => typeof Android !== "undefined" && (typeof Android.scanImage === "function" || typeof Android.scanData === "function");
  let scanWait = null;
  async function toDataUrl(blob, max){
    const bmp = await createImageBitmap(blob); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.9);
  }
  function scanOne(blob){
    return new Promise(async res => {
      scanWait = res; photoFor = "study";
      try {
        if (typeof Android.scanImage === "function") Android.scanImage(blob);
        else Android.scanData(await toDataUrl(blob, 2000));
      } catch (e) { scanWait = null; photoFor = "solve"; res([]); }
    });
  }
  function scanDone(lines){ const f = scanWait; scanWait = null; photoFor = "solve"; if (f) f(lines); }
  // route the scanner's answers here while study mode is reading
  const prev = { ocr: window.onOcr, err: window.onOcrError, start: window.onPhotoStart, cancel: window.onPhotoCancelled };
  window.onOcr = (text, items) => photoFor === "study" ? scanDone(ocrLines(text, items).map(cleanOcrLine)) : prev.ocr(text, items);
  window.onOcrError = k => photoFor === "study" ? scanDone([]) : prev.err(k);
  window.onPhotoStart = () => { if (photoFor !== "study") prev.start(); };
  window.onPhotoCancelled = () => photoFor === "study" ? scanDone([]) : prev.cancel();

  // ---------- the sheet ----------
  const wrap = el("div", "bookwrap"); wrap.id = "studySheet"; wrap.hidden = true; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-labelledby", "studyTitle");
  const sheet = el("div", "bsheet studysheet"); const inner = el("div", "inner"); inner.id = "studyInner";
  sheet.append(el("div", "grab"), inner); wrap.append(sheet); document.body.append(wrap);
  wrap.addEventListener("click", e => { if (e.target === wrap) closeStudy(); });
  let view = { file: null, tab: "read" };
  const css = el("style"); css.textContent = `
.studysheet{max-height:96vh;max-height:96dvh}
.stlist{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}
.stfile{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px 14px}
.stfile button.open{flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:none;border:0;padding:0;color:var(--ink);font:inherit;text-align:start;cursor:pointer}
.stfile .ic{font-size:26px;line-height:1}.stfile b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stfile small{color:var(--muted)}
.stfile .linkbtn.sure{color:var(--warn);font-weight:700}
.stadd{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
.stadd input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.sttabs{display:flex;gap:6px;background:var(--surface-2);border-radius:14px;padding:4px}
.sttabs button{flex:1;border:0;background:none;color:var(--muted);font:600 15px/1 var(--sans);padding:10px;border-radius:10px;cursor:pointer}
.sttabs button[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--shadow)}
.stpage{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.stpage .pg{display:block;width:100%;min-height:120px;background:#fff}
.stpage canvas.pg,.stpage img.pg{height:auto}
.stpage .bar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;color:var(--muted);font-size:13px}
.stnote{margin:0 12px 12px;background:var(--mark);color:var(--ink);border-radius:10px;padding:10px 12px;white-space:pre-wrap;font-size:14px}
.stnote-ed{display:flex;flex-direction:column;gap:8px;padding:0 12px 12px}
.stnote-ed textarea{min-height:80px;resize:vertical;border:1px solid var(--line);border-radius:10px;padding:10px;font:15px/1.4 var(--sans);background:var(--surface-2);color:var(--ink)}
.stnote-ed .row,.stexadd{display:flex;gap:8px}.stnote-ed .row .btn,.stexadd .btn{flex:none}
.stex{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.stex .math{flex:1;min-width:0;overflow-x:auto}
.stexadd input{flex:1;min-width:0;border:1px solid var(--line);border-radius:12px;padding:12px;font:16px var(--mono);background:var(--surface);color:var(--ink)}
.stmsg{color:var(--muted);margin:0;font-size:14px}.stmsg.bad{color:var(--warn)}
.stbusy{display:flex;align-items:center;gap:10px;color:var(--muted)}
.stbusy i{width:18px;height:18px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--pen);animation:stspin .8s linear infinite}
@keyframes stspin{to{transform:rotate(360deg)}}
.sttopicbox{display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px 14px}
.sttopics{display:flex;flex-wrap:wrap;gap:8px}
.sttopics button{border:1px solid var(--line);background:var(--surface-2);color:var(--muted);border-radius:999px;padding:8px 12px;font:600 14px/1 var(--sans);cursor:pointer}
.sttopics button[aria-pressed="true"]{background:var(--pen);border-color:var(--pen);color:var(--on-pen)}
.sttopics button[aria-pressed="true"]::before{content:"✓ "}
.formbtn .prtag{flex:none}
.prtag{font-size:11px;font-weight:800;background:var(--mark);color:var(--ink);border-radius:6px;padding:2px 6px;flex:none}
`; document.head.append(css);

  function head(title, onBack){
    const h = el("div", "sheethead");
    if (onBack) { const b = el("button", "iconbtn"); b.type = "button"; b.setAttribute("aria-label", S("back")); b.append(svgEl(ICON.back)); b.onclick = onBack; if (lang === "he") b.style.transform = "scaleX(-1)"; h.append(b); }
    const t = el("h2", null, title); t.id = "studyTitle"; t.style.flex = "1"; t.style.minWidth = "0"; t.style.overflow = "hidden"; t.style.textOverflow = "ellipsis"; dirOf(t, title);
    const x = el("button", "iconbtn"); x.type = "button"; x.setAttribute("aria-label", S("close")); x.append(svgEl(ICON.x)); x.onclick = closeStudy;
    h.append(t, x); inner.append(h);
  }
  const busy = text => { const b = el("div", "stbusy"); b.append(el("i"), el("span", null, text)); return b; };

  function openStudy(){
    if (!isPro()) return openPro("study");
    view = { file: null, tab: "read" }; wrap.hidden = false; document.body.classList.add("noscroll"); renderList();
  }
  function closeStudy(){ wrap.hidden = true; document.body.classList.remove("noscroll"); }
  window.openStudy = openStudy; window.closeStudy = closeStudy;
  window.studyBack = () => { if (wrap.hidden) return false; if (view.file) { view.file = null; renderList(); } else closeStudy(); return true; };

  // ---- the list of files ----
  async function renderList(){
    inner.innerHTML = ""; head(S("title"));
    inner.append(el("p", "hint", S("intro")));
    const add = el("label", "btn stadd"); add.append(svgEl(ICON.plus), el("span", null, S("add")));
    const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = "application/pdf,.pdf,image/*"; inp.setAttribute("aria-label", S("add"));
    inp.onchange = () => { const fs = [...(inp.files || [])]; inp.value = ""; if (fs.length) addFiles(fs); };
    add.append(inp); inner.append(add);
    const msg = el("p", "stmsg"); msg.id = "stMsg"; msg.hidden = true; inner.append(msg);
    const files = (await allFiles()).sort((a, b) => b.created - a.created);
    if (wrap.hidden || view.file) return;
    if (!files.length) inner.append(el("p", "stmsg", S("empty")));
    const ul = el("ul", "stlist");
    files.forEach(f => {
      const li = el("li", "stfile"), open = el("button", "open"); open.type = "button";
      const tx = el("div"); tx.style.minWidth = "0"; const nm = el("b", null, f.name); dirOf(nm, f.name);
      tx.append(nm, el("small", null, S("pages", f.pages || f.blobs.length) + (f.ex && f.ex.length ? " · " + S("exN", f.ex.length) : "")));
      open.append(el("span", "ic", f.kind === "pdf" ? "📄" : "🖼️"), tx); open.onclick = () => openFile(f.id);
      const del = el("button", "linkbtn", S("del")); del.type = "button";
      del.onclick = async () => { if (!del.classList.contains("sure")) { del.classList.add("sure"); del.textContent = S("delSure"); setTimeout(() => { del.classList.remove("sure"); del.textContent = S("del"); }, 3000); return; } docs.delete(f.id); await delFile(f.id); renderList(); };
      li.append(open, del); ul.append(li);
    });
    inner.append(ul);
    inner.append(el("p", "stmsg", memOnly ? S("memOnly") : S("local")));
  }
  async function addFiles(fs){
    const msg = $("stMsg"); const say = (t, bad) => { if (msg) { msg.hidden = false; msg.textContent = t; msg.className = "stmsg" + (bad ? " bad" : ""); } };
    const pdfs = fs.filter(f => /pdf/i.test(f.type) || /\.pdf$/i.test(f.name)), imgs = fs.filter(f => /^image\//.test(f.type));
    let last = null;
    for (const p of pdfs) {
      if (p.size > 40e6) { say(S("tooBig"), true); continue; }
      say(S("loading"));
      const f = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: p.name.replace(/\.pdf$/i, ""), kind: "pdf", blobs: [p], created: Date.now(), notes: {}, ex: [], scanned: false };
      try { const d = await openPdf(f); f.pages = d.numPages; } catch (e) { say(S("badPdf"), true); continue; }
      try { const lines = await pdfLines(f); f.ex = exercisesIn(lines); f.text = lines.join("\n").slice(0, 30000); f.topics = Topics.detect(f.text); f.scanned = true; } catch (e) {}
      await putFile(f); last = f;
    }
    if (imgs.length) {
      const d = new Date(), name = S("photos") + " " + d.toLocaleDateString(lang === "he" ? "he-IL" : "en-GB") + " " + d.toTimeString().slice(0, 5);
      const f = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, kind: "img", blobs: imgs, pages: imgs.length, created: Date.now(), notes: {}, ex: [], scanned: false };
      await putFile(f); last = f;
    }
    if (last) openFile(last.id, last.kind === "img" ? "ex" : "read"); else if (!wrap.hidden && !view.file) { /* keep the message */ }
  }

  // ---- one file ----
  let io = null;
  async function openFile(id, tabName){
    const f = await getFile(id); if (!f) return renderList();
    view = { file: f, tab: tabName || view.tab || "read" }; renderFile();
    if (f.kind === "pdf" && f.text === undefined) {
      try { const lines = await pdfLines(f); f.text = lines.join("\n").slice(0, 30000); if (!f.topicsEdited) f.topics = Topics.detect(f.text); if (!(f.ex || []).length) f.ex = exercisesIn(lines); await putFile(f); if (view.file === f) renderFile(); } catch (e) {}
    }
  }
  function renderFile(){
    const f = view.file; if (io) { io.disconnect(); io = null; }
    inner.innerHTML = ""; head(f.name, () => { view.file = null; renderList(); });
    const pr = el("button", "btn", S("practice")); pr.type = "button"; pr.onclick = () => practiceFile(f); inner.append(pr);
    const tb = el("section", "sttopicbox"); tb.append(el("b", null, S("topics")));
    const sel = new Set(f.topics || []);
    tb.append(el("p", "stmsg", sel.size ? S("topicsFound") : S("topicsNone")));
    const chips = el("div", "sttopics");
    const order = Topics.TOPICS.slice().sort((a, b) => (sel.has(b.id) ? 1 : 0) - (sel.has(a.id) ? 1 : 0));
    order.forEach(t => {
      const c = el("button", null, lang === "he" ? t.he : t.en); c.type = "button"; c.setAttribute("aria-pressed", String(sel.has(t.id)));
      c.onclick = async () => { if (sel.has(t.id)) sel.delete(t.id); else sel.add(t.id); c.setAttribute("aria-pressed", String(sel.has(t.id))); f.topics = [...sel]; f.topicsEdited = true; await putFile(f); };
      chips.append(c);
    });
    tb.append(chips); inner.append(tb);
    const tabs = el("div", "sttabs"); tabs.setAttribute("role", "tablist");
    [["read", S("read")], ["ex", S("exTab") + " (" + (f.ex || []).length + ")"]].forEach(([k, t]) => {
      const b = el("button", null, t); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(view.tab === k));
      b.onclick = () => { view.tab = k; renderFile(); }; tabs.append(b);
    });
    inner.append(tabs);
    if (view.tab === "read") renderPages(f); else renderEx(f);
  }
  function renderPages(f){
    const list = el("div"); list.style.display = "flex"; list.style.flexDirection = "column"; list.style.gap = "14px"; inner.append(list);
    const n = f.pages || f.blobs.length;
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); drawPage(f, e.target); } }), { root: sheet, rootMargin: "600px 0px" });
    for (let p = 1; p <= n; p++) {
      const box = el("section", "stpage"); box.dataset.p = p;
      const ph = el("div", "pg"); ph.style.aspectRatio = "0.72"; box.append(ph);
      const bar = el("div", "bar"); bar.append(el("span", null, S("page", p)));
      const nb = el("button", "linkbtn", "📝 " + S("note")); nb.type = "button"; nb.onclick = () => editNote(f, box, p); bar.append(nb); box.append(bar);
      if (f.notes && f.notes[p]) { const nt = el("p", "stnote", f.notes[p]); dirOf(nt, f.notes[p]); box.append(nt); }
      list.append(box); io.observe(box);
    }
  }
  async function drawPage(f, box){
    const p = +box.dataset.p, ph = box.querySelector(".pg");
    try {
      if (f.kind === "img") {
        const img = document.createElement("img"); img.className = "pg"; img.alt = S("page", p); img.src = URL.createObjectURL(f.blobs[p - 1]); ph.replaceWith(img);
      } else {
        const d = await openPdf(f), page = await d.getPage(p), vp1 = page.getViewport({ scale: 1 });
        const w = Math.max(320, box.clientWidth || 600) * Math.min(2, window.devicePixelRatio || 1), vp = page.getViewport({ scale: w / vp1.width });
        const c = document.createElement("canvas"); c.className = "pg"; c.width = Math.round(vp.width); c.height = Math.round(vp.height); c.setAttribute("aria-label", S("page", p));
        await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; ph.replaceWith(c);
      }
    } catch (e) { ph.textContent = S("badPdf"); ph.style.padding = "20px"; ph.style.aspectRatio = "auto"; }
  }
  function editNote(f, box, p){
    if (box.querySelector(".stnote-ed")) return;
    const old = box.querySelector(".stnote"); if (old) old.hidden = true;
    const ed = el("div", "stnote-ed"), ta = document.createElement("textarea"); ta.value = (f.notes && f.notes[p]) || ""; ta.placeholder = S("notePh"); ta.dir = "auto";
    const row = el("div", "row"), sv = el("button", "btn", S("save")), cn = el("button", "btn quiet", S("cancel")); sv.type = cn.type = "button";
    sv.onclick = async () => {
      f.notes = f.notes || {}; const v = ta.value.trim(); if (v) f.notes[p] = v; else delete f.notes[p]; await putFile(f);
      ed.remove(); if (old) old.remove(); if (v) { const nt = el("p", "stnote", v); dirOf(nt, v); box.append(nt); }
    };
    cn.onclick = () => { ed.remove(); if (old) old.hidden = false; };
    row.append(sv, cn); ed.append(ta, row); box.append(ed); setTimeout(() => ta.focus(), 50);
  }
  function renderEx(f){
    const msg = el("p", "stmsg"); msg.hidden = true;
    const scanBtn = el("button", "btn quiet", S("find")); scanBtn.type = "button";
    const can = f.kind === "pdf" || canScan();
    scanBtn.onclick = async () => {
      scanBtn.disabled = true; const b = busy(S("finding")); scanBtn.after(b);
      let lines = [];
      try {
        if (f.kind === "pdf") lines = await pdfLines(f);
        else for (let i = 0; i < f.blobs.length; i++) { b.lastChild.textContent = S("reading", i + 1, f.blobs.length); lines = lines.concat(await scanOne(f.blobs[i])); }
      } catch (e) {}
      if (!f.topicsEdited) { const extra = Topics.detect(lines.join("\n")); f.topics = [...new Set((f.topics || []).concat(extra))]; }
      if (f.kind === "pdf" && !f.text) f.text = lines.join("\n").slice(0, 30000);
      const found = exercisesIn(lines), have = new Set((f.ex || []).map(x => x.replace(/\s+/g, "")));
      f.ex = (f.ex || []).concat(found.filter(x => !have.has(x.replace(/\s+/g, "")))); f.scanned = true; await putFile(f);
      if (view.file !== f) return;
      renderFile(); const m = inner.querySelector(".stmsg"); if (m) { m.hidden = false; m.textContent = S("found", found.length); }
    };
    if (can) inner.append(scanBtn); else { msg.hidden = false; msg.textContent = S("noScan"); }
    inner.append(msg);
    const list = el("div"); list.style.display = "flex"; list.style.flexDirection = "column"; list.style.gap = "8px";
    if (!(f.ex || []).length) list.append(el("p", "stmsg", S("noEx")));
    (f.ex || []).forEach((x, i) => {
      const row = el("div", "stex"); const m = mathEl("div", "math", x); if (!m.classList.contains("mv")) m.dir = "ltr";
      const go = el("button", "linkbtn", S("solve")); go.type = "button";
      go.onclick = () => { closeStudy(); tab("solve"); $("problem").value = x; solveNow(); };
      const rm = el("button", "iconbtn"); rm.type = "button"; rm.setAttribute("aria-label", S("remove")); rm.append(svgEl(ICON.x));
      rm.onclick = async () => { f.ex.splice(i, 1); await putFile(f); renderFile(); };
      row.append(m, go, rm); list.append(row);
    });
    inner.append(list);
    const add = el("form", "stexadd"); add.noValidate = true;
    const ai = document.createElement("input"); ai.type = "text"; ai.dir = "ltr"; ai.placeholder = S("addPh"); ai.setAttribute("aria-label", S("addEx")); ai.autocomplete = "off"; ai.spellcheck = false; ai.setAttribute("autocapitalize", "off");
    const ab = el("button", "btn", S("addEx")); ab.type = "submit";
    const am = el("p", "stmsg bad"); am.hidden = true;
    add.onsubmit = async e => {
      e.preventDefault(); const v = ai.value.trim(); if (!v) return ai.focus();
      let r; try { r = Solver.solve(v, lang); } catch (er) { r = null; }
      if (!r || !r.length || r.some(q => q.error)) { am.hidden = false; am.textContent = S("badEx"); return; }
      f.ex = f.ex || []; f.ex.push(v); await putFile(f); renderFile();
      const inp = inner.querySelector(".stexadd input"); if (inp) inp.focus();
    };
    add.append(ai, ab); inner.append(add, am);
  }

  // ---- practice like the file: new numbers for the file's own exercises, checked as usual ----
  function practiceFile(f){
    const srcs = (f.ex || []).filter(x => ProCore.canPractice(Solver.solve, x, lang));
    const topics = f.topics || [];
    let items = [];
    // exercises like the file's own (at most half when it has topics too), then questions made up for its topics
    const fromEx = topics.length ? 4 : 10, per = Math.max(1, Math.ceil(fromEx / Math.max(1, srcs.length)));
    for (const s of srcs.sort(() => Math.random() - .5)) { items = items.concat(ProCore.practice(Solver.solve, s, lang, Math.min(3, per))); if (items.length >= fromEx) break; }
    items = items.slice(0, fromEx);
    if (items.length < 10) {
      const env = { solve: Solver.solve, math, normalize: Solver.normalize, lang, sameAnswer: ProCore.sameAnswer, sameExpr: (a, b) => ProCore.sameExpr(math, Solver.normalize, a, b) };
      // the file's topics; a file with no topics and no exercises gets a general mix
      if (topics.length || !srcs.length) items = items.concat(Topics.make(topics, env, 10 - items.length));
    }
    items = items.sort(() => Math.random() - .5).slice(0, 10);
    if (!items.length) {
      if (view.tab !== "ex") { view.tab = "ex"; renderFile(); }
      const m = inner.querySelector(".stmsg"); if (m) { m.hidden = false; m.className = "stmsg bad"; m.textContent = (f.ex || []).length ? S("noPractice") : S("noEx"); }
      return;
    }
    closeStudy();
    practiceSet = { src: null, items, i: 0, score: 0, answered: false, again: () => { openStudy(); openFile(f.id); practiceFile(f); } };
    openProSheet("practice"); renderPractice();
  }

  // ---- the button in the solve tab ----
  const btn = el("button", "formbtn"); btn.id = "openStudy"; btn.type = "button";
  const lbl = el("span"); const tag = el("span", "prtag", "PRO");
  btn.append(svgEl(ICON.book), lbl, tag, svgEl('<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>'));
  const paint = () => { lbl.textContent = S("title"); tag.hidden = isPro(); };
  paint(); document.addEventListener("langchange", () => { paint(); if (!wrap.hidden) view.file ? renderFile() : renderList(); });
  window.studyProChanged = paint;
  btn.onclick = openStudy;
  const anchor = $("openChecker"); if (anchor) anchor.after(btn);
})();
