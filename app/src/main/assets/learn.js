// ---------- Learn: courses and lessons, each with a short animated video, the idea, a worked example and practice ----------
// The content is in courses.js. This draws the screens, plays the lesson videos (offline, drawn here) and keeps progress.
// Uses the main script's helpers: $, el, svgEl, mathEl, dirOf, pick, lang, tab, practiceSet / renderPractice / openProSheet,
// Topics, ProCore, Solver, math.
(function(){
  "use strict";
  if (typeof Courses === "undefined") return;
  const HE = /[֐-׿]/;
  const STR = {
    tab: ["Learn", "לימוד"],
    title: ["Learn", "לימוד"],
    sub: ["Courses and short lessons on every topic: a video, the idea, an example and practice.", "קורסים ושיעורים קצרים בכל הנושאים: סרטון, הסבר, דוגמה ותרגול."],
    heNote: ["The lessons are in Hebrew for now.", ""],
    cont: ["Continue where you stopped", "המשך מאיפה שעצרת"],
    start: ["Start here", "מתחילים מכאן"],
    all: ["All", "הכל"],
    of: [(a, b) => a + " of " + b + " lessons", (a, b) => a + " מתוך " + b + " שיעורים"],
    total: [(a, b) => a + " / " + b + " lessons done", (a, b) => a + " / " + b + " שיעורים הושלמו"],
    min: [n => n + " min", n => n + " דק'"],
    back: ["Back", "חזרה"],
    video: ["Video", "סרטון"],
    idea: ["The idea", "הרעיון"],
    rules: ["Remember", "לזכור"],
    example: ["Worked example", "דוגמה פתורה"],
    answer: ["Answer", "תשובה"],
    mistake: ["A common mistake", "טעות נפוצה"],
    practice: ["Practice", "תרגול"],
    practiceBtn: [n => "🎯 Practice (" + n + " questions)", n => "🎯 תרגול (" + n + " שאלות)"],
    done: ["✓ I finished this lesson", "✓ סיימתי את השיעור"],
    isDone: ["✓ Done", "✓ הושלם"],
    next: ["Next lesson", "השיעור הבא"],
    courseDone: ["🎉 You finished the course!", "🎉 סיימתם את הקורס!"],
    play: ["Play", "הפעלה"], pause: ["Pause", "השהיה"], again: ["Watch again", "לצפות שוב"],
    lessons: [n => n + " lessons", n => n + " שיעורים"],
  };
  const S = (k, ...a) => { const v = pick(...STR[k]); return typeof v === "function" ? v(...a) : v; };
  const nameOf = o => lang === "he" ? o.he : o.en;

  // ---------- progress ----------
  const KEY = "learn.v1";
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.done) return v; } catch (e) {} return { done: {}, last: null }; };
  let P = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  const isDone = id => !!P.done[id];
  function markDone(id){ P.done[id] = Date.now(); save(); }
  const courseDone = co => co.lessons.filter(l => isDone(l.id)).length;

  // ---------- styles ----------
  const css = document.createElement("style"); css.textContent = `
.learn{gap:16px}
.lr-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.lr-cont{display:flex;align-items:center;gap:14px;border:0;width:100%;text-align:start;border-radius:20px;padding:16px;color:#fff;cursor:pointer;font:inherit}
.lr-cont .ic{width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,.18);display:grid;place-items:center;font-size:26px;flex:none}
.lr-cont small{display:block;opacity:.85;font-size:13px;font-weight:600;margin-bottom:2px}
.lr-cont b{display:block;font-size:18px;line-height:1.25}
.lr-cont .go{margin-inline-start:auto;width:40px;height:40px;border-radius:50%;background:#fff;display:grid;place-items:center;flex:none}
.lr-cont .go svg{width:20px;height:20px}
html[dir="rtl"] .lr-cont .go svg,html[dir="rtl"] .lr-row .pl svg{transform:scaleX(-1)}
.lr-total{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:14px;font-weight:600}
.lr-bar{flex:1;height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden}
.lr-bar i{display:block;height:100%;border-radius:4px;background:var(--pen)}
.lr-subj{display:flex;gap:8px;flex-wrap:wrap}
.lr-subj button{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;padding:8px 16px;font:600 14px/1 var(--sans);cursor:pointer}
.lr-subj button[aria-pressed="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.lr-h{margin:6px 2px 0;font-size:13px;letter-spacing:.05em;color:var(--muted);font-weight:700}
.lr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.lr-card{display:flex;flex-direction:column;gap:10px;text-align:start;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);border-radius:20px;padding:16px;cursor:pointer;font:inherit;min-width:0}
.lr-card:hover{border-color:var(--pen)}
.lr-card .top{display:flex;align-items:center;gap:12px}
.lr-card .ic{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;color:#fff;flex:none}
.lr-card b{font-size:17px;line-height:1.25}
.lr-card p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}
.lr-card .meta{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted);font-weight:600}
.lr-back{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--pen);font:600 15px/1 var(--sans);padding:6px 0;cursor:pointer;align-self:flex-start}
.lr-back svg{width:20px;height:20px}
html[dir="rtl"] .lr-back svg{transform:scaleX(-1)}
.lr-hero{border-radius:22px;padding:20px;color:#fff;display:flex;flex-direction:column;gap:8px}
.lr-hero .ic{font-size:34px}
.lr-hero h2{margin:0;font-size:24px;line-height:1.2}
.lr-hero p{margin:0;opacity:.9;font-size:15px;line-height:1.45}
.lr-hero .lr-bar{background:rgba(255,255,255,.25);max-width:320px}
.lr-hero .lr-bar i{background:#fff}
.lr-list{display:flex;flex-direction:column;gap:8px}
.lr-row{display:flex;align-items:center;gap:14px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);border-radius:16px;padding:12px 14px;cursor:pointer;font:inherit;text-align:start;width:100%}
.lr-row:hover{border-color:var(--pen)}
.lr-row .n{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:var(--surface-2);color:var(--muted);flex:none}
.lr-row.done .n{background:var(--ok);color:#fff}
.lr-row b{display:block;font-size:16px}
.lr-row small{color:var(--muted);font-size:13px}
.lr-row .pl{margin-inline-start:auto;color:var(--pen)}
.lr-row .pl svg{width:22px;height:22px}
.lr-sec{display:flex;flex-direction:column;gap:10px}
.lr-sec h3{margin:0;font-size:17px}
.lr-p{margin:0;font-size:16px;line-height:1.7}
.lr-m{font-family:var(--mono);font-size:.95em;direction:ltr;unicode-bidi:isolate;background:var(--surface-2);border-radius:6px;padding:1px 6px;white-space:nowrap}
.lr-rules{display:flex;flex-direction:column;gap:8px}
.lr-rule{background:var(--pen-soft);border-radius:12px;padding:10px 14px;font-size:16px}
.lr-ex{background:var(--surface-2);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px}
.lr-ex .q{font-weight:700;font-size:16px;line-height:1.5}
.lr-ans{align-self:flex-start;background:var(--mark);color:var(--ink);border-radius:10px;padding:6px 12px;font-weight:700}
.lr-mis{border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;background:var(--warn-soft)}
.lr-mis .w{color:var(--warn);text-decoration:line-through;font-weight:600}
.lr-mis .r{color:var(--ok);font-weight:700}
.lr-mis .why{font-size:15px;line-height:1.5}
.lr-actions{display:flex;flex-direction:column;gap:10px}
.lr-next{display:flex;align-items:center;gap:10px}
/* the video */
.lr-vid{position:relative;border-radius:20px;overflow:hidden;background:linear-gradient(160deg,var(--surface-2),var(--pen-soft));border:1.5px solid var(--line);aspect-ratio:4/3;max-width:100%;user-select:none;cursor:pointer}
@media (max-width:560px){.lr-vid{aspect-ratio:1/1}}
.lr-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 74px}
.lr-fig{width:100%;max-width:380px;flex:1 1 0;min-height:80px;display:flex;align-items:center;justify-content:center}
.lr-fig svg{width:100%;height:100%}
.lr-lines{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%;flex:none}
.lr-cap .lt{direction:ltr;unicode-bidi:isolate}
.lr-line{font-size:22px;font-weight:600;text-align:center;opacity:0;transform:translateY(8px) scale(.96);transition:opacity .35s,transform .45s cubic-bezier(.2,1.4,.4,1);max-width:100%;overflow-wrap:anywhere}
.lr-line.on{opacity:1;transform:none}
.lr-line.mv{font-size:20px}
.lr-stage.many .lr-line{font-size:18px}
.lr-cap{position:absolute;left:12px;right:12px;bottom:12px;background:rgba(14,18,34,.82);color:#fff;border-radius:12px;padding:9px 12px;font-size:15px;line-height:1.45;text-align:center;opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s}
.lr-cap.on{opacity:1;transform:none}
.lr-poster{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:linear-gradient(160deg,var(--c,#3346E0),#0E1222);color:#fff;border:0;width:100%;cursor:pointer;font:inherit;padding:20px;text-align:center}
.lr-poster .big{width:76px;height:76px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 8px 30px rgba(0,0,0,.35)}
.lr-poster .big svg{width:34px;height:34px;margin-inline-start:4px;color:var(--c,#3346E0)}
.lr-poster b{font-size:20px}
.lr-poster small{opacity:.85;font-size:14px}
.lr-ctrl{display:flex;align-items:center;gap:10px}
.lr-ctrl .pb{width:44px;height:44px;border-radius:50%;border:0;background:var(--pen);color:var(--on-pen);display:grid;place-items:center;cursor:pointer;flex:none}
.lr-ctrl .pb svg{width:20px;height:20px}
.lr-segs{flex:1;display:flex;gap:4px;direction:ltr}
html[dir="rtl"] .lr-segs{direction:rtl}
.lr-segs button{flex:1;height:8px;border-radius:4px;border:0;padding:0;background:var(--surface-2);cursor:pointer;overflow:hidden;position:relative}
.lr-segs button i{position:absolute;inset:0;background:var(--pen);transform-origin:left;transform:scaleX(0)}
html[dir="rtl"] .lr-segs button i{transform-origin:right}
.lr-time{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums;min-width:38px;text-align:end}
/* figures: lines draw themselves, labels pop in */
.lr-vid svg .d{stroke-dasharray:1;stroke-dashoffset:1;animation:lrdraw 1s ease forwards}
.lr-vid svg .d2{animation-delay:.5s}.lr-vid svg .d3{animation-delay:1s}.lr-vid svg .d4{animation-delay:1.5s}
.lr-vid svg .t{opacity:0;animation:lrpop .4s ease forwards;animation-delay:.7s}
.lr-vid svg .t2{animation-delay:1.2s}.lr-vid svg .t3{animation-delay:1.7s}
.lr-vid svg .f{opacity:0;animation:lrfade .6s ease forwards;animation-delay:.4s}
.lr-vid.paused *{animation-play-state:paused!important}
@keyframes lrdraw{to{stroke-dashoffset:0}}
@keyframes lrpop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes lrfade{to{opacity:1}}
.lr-vid svg .t{transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:reduce){.lr-vid svg .d{animation:none;stroke-dashoffset:0}.lr-vid svg .t,.lr-vid svg .f{animation:none;opacity:1}.lr-line{transition:none}}
`; document.head.append(css);

  // ---------- the panel and the tab ----------
  const panel = document.createElement("section"); panel.id = "learnPanel"; panel.className = "panel learn"; panel.hidden = true;
  const solveP = $("solvePanel"); solveP.parentNode.insertBefore(panel, solveP);
  const ICON = {
    learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4.5" height="16" rx="1.2"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.2"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  };
  const tb = document.createElement("button"); tb.type = "button"; tb.id = "tabLearn"; tb.setAttribute("role", "tab"); tb.setAttribute("aria-selected", "false");
  const pill = el("span", "pill"); pill.append(svgEl(ICON.learn)); tb.append(pill, el("span", null, S("tab")));
  const nav = document.querySelector(".bottomnav"); if (nav) nav.prepend(tb);
  const baseTab = window.tab;
  window.tab = function(which){
    const L = which === "learn";
    panel.hidden = !L; tb.setAttribute("aria-selected", String(L));
    if (!L) { stopVideo(); return baseTab(which); }
    baseTab("learn");            // hides every other screen
    render();
  };
  tb.onclick = () => tab("learn");
  // a photo (pasted, dropped or shared into the app) while on Learn: show it where it gets solved
  for (const name of ["onPhotoStart", "onOcr"]) {
    const orig = window[name]; if (typeof orig !== "function") continue;
    window[name] = function(...a){ if (!panel.hidden) tab(typeof photoFor !== "undefined" && photoFor === "geo" ? "geo" : "solve"); return orig.apply(this, a); };
  }

  // ---------- where we are: home, a course, a lesson ----------
  const view = { at: "home", course: null, lesson: null, subj: "all" };
  function go(at, id){
    stopVideo();
    if (at === "home") Object.assign(view, { at, course: null, lesson: null });
    if (at === "course") Object.assign(view, { at, course: id, lesson: null });
    if (at === "lesson") { const l = Courses.lesson(id); Object.assign(view, { at, course: l.course, lesson: id }); P.last = id; save(); }
    render(); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.learnBack = () => {
    if (panel.hidden) return false;
    if (view.at === "lesson") { go("course", view.course); return true; }
    if (view.at === "course") { go("home"); return true; }
    return false;
  };
  const prevBack = window.onBack;
  window.onBack = () => {
    if (!$("proSheet").hidden) return prevBack ? prevBack() : false;
    if (window.learnBack()) return true;
    return prevBack ? prevBack() : false;
  };
  window.openLearn = (lessonId) => { tab("learn"); if (lessonId && Courses.lesson(lessonId)) go("lesson", lessonId); };

  // ---------- text with `math` and **bold** inside ----------
  function rich(tag, cls, text){
    const e = el(tag, cls); dirOf(e, text);
    String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/).forEach(part => {
      if (!part) return;
      if (part[0] === "`") { const m = el("span", "lr-m", part.slice(1, -1)); m.dir = "ltr"; e.append(m); }
      else if (part.startsWith("**")) e.append(el("b", null, part.slice(2, -2)));
      else e.append(document.createTextNode(part));
    });
    return e;
  }
  // a line that is math, or Hebrew with math in it
  const line = (cls, text) => HE.test(text) ? dirOf(el("div", cls, text), text) : mathEl("div", cls, text);
  function steps(list){
    const ol = el("ol", "steps");
    for (const [c, why] of list) { const li = el("li"); li.append(line("math", c)); if (why) li.append(dirOf(el("div", "why", why), why)); ol.append(li); }
    return ol;
  }
  function backBtn(text, fn){ const b = el("button", "lr-back"); b.type = "button"; b.append(svgEl(ICON.back), el("span", null, text)); b.onclick = fn; return b; }
  function bar(frac){ const b = el("div", "lr-bar"); const i = el("i"); i.style.width = Math.round(frac * 100) + "%"; b.append(i); return b; }

  function render(){
    panel.innerHTML = "";
    if (view.at === "lesson") return renderLesson(Courses.lesson(view.lesson));
    if (view.at === "course") return renderCourse(Courses.course(view.course));
    renderHome();
  }

  // ---------- home: continue, subjects, courses ----------
  function renderHome(){
    const head = el("div", "phead"); head.append(el("h2", null, S("title")), el("p", "lr-sub", S("sub")));
    if (lang !== "he") head.append(el("p", "lr-sub", S("heNote")));
    panel.append(head);
    const all = Courses.all(), doneN = all.filter(l => isDone(l.id)).length;
    // continue: the last lesson, or the next one after it once it's done
    let next = P.last && Courses.lesson(P.last);
    if (next && isDone(next.id)) { const i = all.indexOf(next); next = all.slice(i + 1).find(l => !isDone(l.id)) || all.find(l => !isDone(l.id)) || next; }
    if (!next) next = all[0];
    const co = Courses.course(next.course);
    const cont = el("button", "lr-cont"); cont.type = "button"; cont.style.background = co.color;
    const t = el("div"); t.append(el("small", null, P.last ? S("cont") : S("start")), el("b", null, nameOf(next)));
    const g = el("span", "go"); g.style.color = co.color; g.append(svgEl(ICON.go));
    cont.append(el("span", "ic", co.icon), t, g); cont.onclick = () => go("lesson", next.id);
    panel.append(cont);
    const tot = el("div", "lr-total"); tot.append(el("span", null, S("total", doneN, all.length)), bar(doneN / all.length)); panel.append(tot);
    const sj = el("div", "lr-subj");
    for (const s of [{ id: "all", he: STR.all[1], en: STR.all[0] }].concat(Courses.SUBJECTS)) {
      const b = el("button", null, nameOf(s)); b.type = "button"; b.setAttribute("aria-pressed", String(view.subj === s.id));
      b.onclick = () => { view.subj = s.id; render(); }; sj.append(b);
    }
    panel.append(sj);
    for (const s of Courses.SUBJECTS) {
      if (view.subj !== "all" && view.subj !== s.id) continue;
      const list = Courses.COURSES.filter(c => c.subject === s.id); if (!list.length) continue;
      panel.append(el("div", "lr-h", nameOf(s)));
      const grid = el("div", "lr-grid");
      for (const c of list) {
        const card = el("button", "lr-card"); card.type = "button";
        const top = el("div", "top"); const ic = el("span", "ic", c.icon); ic.style.background = c.color; top.append(ic, el("b", null, nameOf(c)));
        const d = courseDone(c), meta = el("div", "meta"); meta.append(el("span", null, d ? S("of", d, c.lessons.length) : S("lessons", c.lessons.length)), bar(d / c.lessons.length));
        card.append(top, rich("p", null, c.blurb), meta); card.onclick = () => go("course", c.id);
        grid.append(card);
      }
      panel.append(grid);
    }
  }

  // ---------- a course: its lessons ----------
  function renderCourse(c){
    panel.append(backBtn(S("title"), () => go("home")));
    const hero = el("div", "lr-hero"); hero.style.background = `linear-gradient(150deg, ${c.color}, #0E1222)`;
    const d = courseDone(c);
    hero.append(el("div", "ic", c.icon), el("h2", null, nameOf(c)), rich("p", null, c.blurb));
    const pr = el("div", "lr-total"); pr.style.color = "#fff"; pr.append(el("span", null, S("of", d, c.lessons.length)), bar(d / c.lessons.length)); hero.append(pr);
    if (d === c.lessons.length) hero.append(el("b", null, S("courseDone")));
    panel.append(hero);
    const list = el("div", "lr-list");
    c.lessons.forEach((l, i) => {
      const r = el("button", "lr-row" + (isDone(l.id) ? " done" : "")); r.type = "button";
      const tx = el("div"); tx.append(el("b", null, nameOf(l)), el("small", null, "▶ " + S("video") + " · " + S("min", l.min)));
      const pl = el("span", "pl"); pl.append(svgEl(ICON.go));
      r.append(el("span", "n", isDone(l.id) ? "✓" : String(i + 1)), tx, pl); r.onclick = () => go("lesson", l.id);
      list.append(r);
    });
    panel.append(list);
  }

  // ---------- a lesson ----------
  function renderLesson(l){
    const c = Courses.course(l.course);
    panel.append(backBtn(nameOf(c), () => go("course", c.id)));
    const head = el("div", "phead"); head.append(el("h2", null, nameOf(l)), el("p", "lr-sub", c.icon + " " + nameOf(c) + " · " + S("min", l.min)));
    panel.append(head);
    panel.append(videoPlayer(l, c));
    // the idea
    const s1 = el("div", "lr-sec"); s1.append(el("h3", null, "💡 " + S("idea"))); for (const p of l.idea) s1.append(rich("p", "lr-p", p)); panel.append(s1);
    if (l.rules && l.rules.length) {
      const s2 = el("div", "lr-sec"); s2.append(el("h3", null, "📌 " + S("rules")));
      const rl = el("div", "lr-rules"); for (const r of l.rules) rl.append(line("lr-rule", r)); s2.append(rl); panel.append(s2);
    }
    // the example
    const s3 = el("div", "lr-sec"); s3.append(el("h3", null, "✏️ " + S("example")));
    const ex = el("div", "lr-ex"); ex.append(line("q", l.example.q), steps(l.example.steps));
    const a = el("div", "lr-ans"); a.append(el("span", null, S("answer") + ": "), (() => { const m = el("span", "lr-m", l.example.a); m.style.background = "transparent"; m.dir = HE.test(l.example.a) ? "rtl" : "ltr"; return m; })());
    ex.append(a); s3.append(ex); panel.append(s3);
    // the mistake
    const s4 = el("div", "lr-sec"); s4.append(el("h3", null, "⚠️ " + S("mistake")));
    const mi = el("div", "lr-mis");
    const w = line("w", "✗ " + l.mistake.wrong), r = line("r", "✓ " + l.mistake.right);
    mi.append(w, r, rich("div", "why", l.mistake.why)); s4.append(mi); panel.append(s4);
    // practice and finishing
    const acts = el("div", "lr-actions");
    const n = practiceCount(l);
    if (n) { const pb = el("button", "btn", S("practiceBtn", n)); pb.type = "button"; pb.onclick = () => { markDone(l.id); startPractice(l); }; acts.append(pb); }
    const db = el("button", "btn quiet", isDone(l.id) ? S("isDone") : S("done")); db.type = "button";
    db.onclick = () => { markDone(l.id); db.textContent = S("isDone"); };
    acts.append(db);
    const all = Courses.all(), nx = all[all.indexOf(l) + 1];
    if (nx) {
      const nb = el("button", "lr-row"); nb.type = "button";
      const tx = el("div"); tx.append(el("small", null, S("next")), el("b", null, nameOf(nx)));
      const pl = el("span", "pl"); pl.append(svgEl(ICON.go));
      nb.append(el("span", "n", Courses.course(nx.course).icon), tx, pl); nb.onclick = () => { markDone(l.id); go("lesson", nx.id); };
      acts.append(nb);
    }
    panel.append(acts);
  }

  // ---------- practice: new questions for the lesson's topic, and its own questions ----------
  function numOf(s){
    let t = String(s).trim().replace(/[−–]/g, "-").replace(/,(\d)/g, ".$1").replace(/^[a-zA-Z]\s*=\s*/, "");
    t = t.replace(/(m\/s²|m\/s\^2|m\/s|g\/mol|kmh|km\/h|kg|mol|cm|km|Ω|ohm|°)/gi, "").replace(/[֐-׿"'׳״%]/g, "").trim();
    t = t.replace(/(\d)\s*π/g, "$1*pi").replace(/π/g, "pi").replace(/√\s*(\d+(\.\d+)?)/g, "sqrt($1)").replace(/\b([A-Z])\b/g, "").trim();
    if (!t) return NaN;
    try { const v = (typeof math !== "undefined") ? math.evaluate(t) : Number(t); return typeof v === "number" ? v : NaN; } catch (e) { return NaN; }
  }
  const squash = s => String(s).replace(/[\s.'"׳״\-−–]/g, "").toLowerCase();
  function accept(it, v){
    for (const want of it.v) {
      if (typeof want === "string") { if (squash(v) === squash(want)) return true; continue; }
      const got = numOf(v);
      if (isFinite(got) && Math.abs(got - want) <= Math.max(1e-6, 0.006 * Math.abs(want))) return true;
    }
    return false;
  }
  const fixed = l => (l.practice.items || []).map(it => ({ problem: it.q, answer: it.a, rtl: HE.test(it.q), ph: pick("Your answer", "התשובה שלכם"),
    result: { problem: it.q, answer: it.a, steps: it.steps }, check: v => accept(it, v) }));
  const practiceCount = l => Math.min(6, (l.practice.topic && typeof Topics !== "undefined" ? 5 : 0) + (l.practice.items || []).length) || 0;
  function startPractice(l){
    let items = [];
    if (l.practice.topic && typeof Topics !== "undefined") {
      try {
        const env = { solve: Solver.solve, math, normalize: Solver.normalize, lang, sameAnswer: ProCore.sameAnswer, sameExpr: (a, b) => ProCore.sameExpr(math, Solver.normalize, a, b) };
        items = Topics.make([l.practice.topic], env, 5);
      } catch (e) { console.error(e); items = []; }
    }
    items = items.concat(fixed(l).sort(() => Math.random() - .5)).slice(0, 6);
    if (!items.length) return;
    practiceSet = { src: null, items, i: 0, score: 0, answered: false, again: () => startPractice(l) };
    openProSheet("practice"); renderPractice();
  }

  // ---------- the lesson video: scenes drawn here, with captions instead of a voice ----------
  let player = null;
  function stopVideo(){ if (player) player.stop(); player = null; }
  const sceneDur = sc => sc.dur || Math.max(4.2, Math.min(9, 1.2 + String(sc.cap || "").length / 15 + (sc.show || []).length * 0.9));
  const fmt = t => Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");

  function videoPlayer(l, c){
    stopVideo();
    const box = el("div", "lr-sec");
    const vid = el("div", "lr-vid paused"); vid.style.setProperty("--c", c.color);
    const stage = el("div", "lr-stage"), cap = el("div", "lr-cap"); cap.dir = "rtl";
    vid.append(stage, cap);
    const scenes = l.video, durs = scenes.map(sceneDur), total = durs.reduce((a, b) => a + b, 0);
    const poster = el("button", "lr-poster"); poster.type = "button";
    const big = el("span", "big"); big.append(svgEl(ICON.play));
    poster.append(big, el("b", null, nameOf(l)), el("small", null, "▶ " + S("video") + " · " + fmt(total)));
    vid.append(poster);
    const ctrl = el("div", "lr-ctrl"), pb = el("button", "pb"); pb.type = "button"; pb.setAttribute("aria-label", S("play")); pb.append(svgEl(ICON.play));
    const segs = el("div", "lr-segs"), time = el("span", "lr-time", "0:00");
    scenes.forEach((s, i) => { const b = el("button"); b.type = "button"; b.setAttribute("aria-label", (i + 1) + "/" + scenes.length); b.append(el("i")); b.onclick = () => { seekTo(durs.slice(0, i).reduce((a, x) => a + x, 0)); if (!playing) play(); }; segs.append(b); });
    ctrl.append(pb, segs, time);
    box.append(vid, ctrl);

    let t = 0, playing = false, last = 0, raf = 0, cur = -1, ended = false;
    function setCap(text){
      cap.innerHTML = "";
      String(text).split(/([A-Za-z0-9ΔΣαβγπ][A-Za-z0-9ΔΣαβγπ²³⁰-⁹ₙₖₚ₀-₉'+\-−=·×:/()., ]*[A-Za-z0-9²³ΔΣαβγπ)ₙ₀-₉'])/).forEach((part, i) => {
        if (!part) return;
        if (i % 2) { const b = el("span", "lt", part); b.dir = "ltr"; cap.append(b); } else cap.append(document.createTextNode(part));
      });
    }
    function sceneAt(tt){ let a = 0; for (let i = 0; i < durs.length; i++) { if (tt < a + durs[i]) return [i, tt - a]; a += durs[i]; } return [durs.length - 1, durs[durs.length - 1]]; }
    function build(i){
      cur = i; const sc = scenes[i];
      stage.innerHTML = ""; stage.classList.toggle("many", (sc.show || []).length > 3);
      if (sc.fig) { const f = el("div", "lr-fig"); f.innerHTML = FIG(sc.fig); stage.append(f); }
      const ls = el("div", "lr-lines"); (sc.show || []).forEach(s => ls.append(line("lr-line", s))); stage.append(ls);
      setCap(sc.cap || ""); cap.classList.remove("on"); void cap.offsetWidth;
      stage.style.paddingBottom = (cap.offsetHeight + 24) + "px";
    }
    function paint(){
      const [i, lt] = sceneAt(t);
      if (i !== cur) build(i);
      cap.classList.toggle("on", lt > 0.15);
      const base = scenes[i].fig ? 0.9 : 0.35;
      [...stage.querySelectorAll(".lr-line")].forEach((e, k) => e.classList.toggle("on", lt > base + k * 0.9));
      [...segs.children].forEach((b, k) => { const s0 = durs.slice(0, k).reduce((a, x) => a + x, 0); b.firstChild.style.transform = `scaleX(${Math.max(0, Math.min(1, (t - s0) / durs[k]))})`; });
      time.textContent = fmt(t);
    }
    function frame(now){
      if (!playing) return;
      t += Math.min(0.1, (now - last) / 1000); last = now;
      if (t >= total) { t = total; paint(); end(); return; }
      paint(); raf = requestAnimationFrame(frame);
    }
    function play(){
      if (ended) { seekTo(0); ended = false; }
      poster.remove(); playing = true; vid.classList.remove("paused");
      pb.innerHTML = ""; pb.append(svgEl(ICON.pause)); pb.setAttribute("aria-label", S("pause"));
      last = performance.now(); paint(); raf = requestAnimationFrame(frame);
    }
    function pause(){
      playing = false; cancelAnimationFrame(raf); vid.classList.add("paused");
      pb.innerHTML = ""; pb.append(svgEl(ICON.play)); pb.setAttribute("aria-label", S("play"));
    }
    function end(){
      pause(); ended = true; markDone(l.id);
      pb.innerHTML = ""; pb.append(svgEl(ICON.redo)); pb.setAttribute("aria-label", S("again"));
    }
    function seekTo(x){ t = Math.max(0, Math.min(total - 0.01, x)); cur = -1; ended = false; build(sceneAt(t)[0]); paint(); }
    poster.onclick = play;
    pb.onclick = () => playing ? pause() : play();
    vid.onclick = e => { if (e.target === poster || poster.contains(e.target)) return; playing ? pause() : play(); };
    player = { stop: pause };
    return box;
  }

  // ---------- the figures in the videos (SVG, drawn with the app's colours) ----------
  const PEN = "var(--pen)", INK = "var(--ink)", MUTED = "var(--muted)", SOFT = "var(--pen-soft)", MARK = "var(--mark)", WARN = "var(--warn)", OK = "var(--ok)";
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="Rubik, sans-serif" direction="ltr">${body}</svg>`;
  const P_ = pts => pts.map(p => p.join(",")).join(" ");
  const path = (d, cls = "d", stroke = PEN, sw = 3, fill = "none") => `<path class="${cls}" pathLength="1" d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const poly = (pts, cls = "d", fill = "none", stroke = PEN) => `<polygon class="${cls}" pathLength="1" points="${P_(pts)}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`;
  const txt = (x, y, s, cls = "t", size = 15, color = INK, anchor = "middle", weight = 700) => `<text class="${cls}" x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}" direction="${HE.test(s) ? "rtl" : "ltr"}">${s}</text>`;
  const fillPoly = (pts, color = SOFT) => `<polygon class="f" points="${P_(pts)}" fill="${color}"/>`;
  const arc = (cx, cy, r, a0, a1, color = WARN, cls = "d d2") => { const rad = d => d * Math.PI / 180; const x0 = cx + r * Math.cos(rad(a0)), y0 = cy - r * Math.sin(rad(a0)), x1 = cx + r * Math.cos(rad(a1)), y1 = cy - r * Math.sin(rad(a1)); return path(`M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 0 ${x1.toFixed(1)},${y1.toFixed(1)}`, cls, color, 2.5); };
  function triPts(A, B, w = 220, x0 = 50, y0 = 170){
    // a triangle with base angles A (left) and B (right)
    const ta = Math.tan(A * Math.PI / 180), tb = Math.tan(B * Math.PI / 180), x = w * tb / (ta + tb), h = x * ta;
    const sc = Math.min(1, 140 / h); return [[x0, y0], [x0 + w, y0], [x0 + x * (sc < 1 ? 1 : 1), y0 - h * sc]];
  }
  const FIGS = {
    frac({ parts = 4, take = 3 }){
      let b = ""; const w = 260 / parts;
      for (let i = 0; i < parts; i++) b += `<rect class="f" x="${30 + i * w}" y="50" width="${w - 6}" height="70" rx="8" fill="${i < take ? PEN : SOFT}" style="animation-delay:${0.2 + i * 0.25}s"/>`;
      return svg(320, 150, b + txt(160, 145, take + " / " + parts, "t t3", 18));
    },
    bar({ pct = 25 }){
      let b = `<rect x="20" y="60" width="280" height="40" rx="10" fill="${SOFT}"/>`;
      b += `<rect class="f" x="20" y="60" width="${2.8 * pct}" height="40" rx="10" fill="${PEN}"/>`;
      for (let i = 1; i < 10; i++) b += `<line x1="${20 + i * 28}" y1="60" x2="${20 + i * 28}" y2="100" stroke="var(--surface)" stroke-width="2"/>`;
      return svg(320, 140, b + txt(20 + 1.4 * pct, 50, pct + "%") + txt(160, 128, "100%", "t t2", 13, MUTED));
    },
    scale(){
      let b = path("M160,40 L160,140", "d", INK) + path("M60,60 L260,60", "d d2", INK) + path("M120,150 L200,150", "d", INK);
      b += path("M40,60 L60,100 L80,60", "d d3", MUTED, 2) + path("M240,60 L260,100 L280,60", "d d3", MUTED, 2);
      b += `<rect class="f" x="35" y="100" width="50" height="10" rx="4" fill="${PEN}"/><rect class="f" x="235" y="100" width="50" height="10" rx="4" fill="${PEN}"/>`;
      return svg(320, 170, b + txt(60, 92, "2x + 5", "t", 14) + txt(260, 92, "17", "t", 14));
    },
    numline({ at = 3, dir = ">" }){
      let b = path("M20,80 L300,80", "d", INK, 2.5); const X = v => 160 + (v - at) * 30;
      for (let v = at - 4; v <= at + 4; v++) b += `<line x1="${X(v)}" y1="74" x2="${X(v)}" y2="86" stroke="${MUTED}" stroke-width="2"/>` + `<text x="${X(v)}" y="106" font-size="12" fill="${MUTED}" text-anchor="middle">${v}</text>`;
      const right = dir.includes(">");
      b += path(right ? `M${X(at)},62 L295,62` : `M${X(at)},62 L25,62`, "d d2", PEN, 6);
      b += `<circle class="t" cx="${X(at)}" cy="62" r="8" fill="${dir.includes("=") ? PEN : "var(--surface)"}" stroke="${PEN}" stroke-width="3"/>`;
      return svg(320, 120, b + txt(160, 36, "x " + dir + " " + at, "t t2", 16));
    },
    axes({ lines = [], points = [], seg = null, legs = false, step = null, range = [-5, 5, -5, 5] }){
      const [x0, x1, y0, y1] = range, W = 300, H = 210, X = x => 10 + (x - x0) / (x1 - x0) * W, Y = y => 10 + (y1 - y) / (y1 - y0) * H;
      let b = "";
      for (let x = Math.ceil(x0); x <= x1; x++) b += `<line x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y1)}" stroke="var(--line)" stroke-width="1"/>`;
      for (let y = Math.ceil(y0); y <= y1; y++) b += `<line x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}" stroke="var(--line)" stroke-width="1"/>`;
      if (x0 <= 0 && x1 >= 0) b += `<line x1="${X(0)}" y1="${Y(y0)}" x2="${X(0)}" y2="${Y(y1)}" stroke="${MUTED}" stroke-width="2"/>`;
      if (y0 <= 0 && y1 >= 0) b += `<line x1="${X(x0)}" y1="${Y(0)}" x2="${X(x1)}" y2="${Y(0)}" stroke="${MUTED}" stroke-width="2"/>`;
      b += `<defs><clipPath id="lrclip"><rect x="10" y="10" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#lrclip)">`;
      lines.forEach(([m, c], i) => { b += path(`M${X(x0)},${Y(m * x0 + c)} L${X(x1)},${Y(m * x1 + c)}`, "d" + (i ? " d2" : ""), i ? WARN : PEN, 3); });
      b += "</g>";
      if (seg) b += path(`M${X(seg[0][0])},${Y(seg[0][1])} L${X(seg[1][0])},${Y(seg[1][1])}`, "d", PEN, 3.5);
      if (seg && legs) b += path(`M${X(seg[0][0])},${Y(seg[0][1])} L${X(seg[1][0])},${Y(seg[0][1])} L${X(seg[1][0])},${Y(seg[1][1])}`, "d d3", WARN, 2.5);
      if (step) b += path(`M${X(step[0][0])},${Y(step[0][1])} L${X(step[1][0])},${Y(step[0][1])} L${X(step[1][0])},${Y(step[1][1])}`, "d d3", WARN, 3) + txt((X(step[0][0]) + X(step[1][0])) / 2, Y(step[0][1]) + 16, "1", "t t3", 13, WARN) + txt(X(step[1][0]) + 14, (Y(step[0][1]) + Y(step[1][1])) / 2 + 5, String(step[1][1] - step[0][1]), "t t3", 13, WARN);
      points.forEach(([x, y, label], i) => { b += `<circle class="t t2" cx="${X(x)}" cy="${Y(y)}" r="5.5" fill="${PEN}" stroke="var(--surface)" stroke-width="2"/>`; if (label) b += txt(X(x) + 8, Y(y) - 9, label, "t t2", 13, INK, "start"); });
      return svg(320, 230, b);
    },
    adj({ a = 130 }){
      const cx = 160, cy = 130, r = 120, rad = a * Math.PI / 180;
      let b = path(`M${cx - r},${cy} L${cx + r},${cy}`, "d", INK) + path(`M${cx},${cy} L${cx + r * Math.cos(rad)},${cy - r * Math.sin(rad)}`, "d d2", INK);
      b += arc(cx, cy, 34, 0, a, PEN, "d d3") + arc(cx, cy, 46, a, 180, WARN, "d d3");
      return svg(320, 150, b + txt(cx + 50 * Math.cos(rad / 2), cy - 50 * Math.sin(rad / 2), "α", "t t3", 17, PEN) + txt(cx + 62 * Math.cos((rad + Math.PI) / 2), cy - 62 * Math.sin((rad + Math.PI) / 2), "β", "t t3", 17, WARN));
    },
    vert({ a = 50 }){
      const cx = 160, cy = 85, r = 110, h = a / 2 * Math.PI / 180;
      let b = path(`M${cx - r * Math.cos(h)},${cy + r * Math.sin(h)} L${cx + r * Math.cos(h)},${cy - r * Math.sin(h)}`, "d", INK) + path(`M${cx - r * Math.cos(h)},${cy - r * Math.sin(h)} L${cx + r * Math.cos(h)},${cy + r * Math.sin(h)}`, "d d2", INK);
      b += arc(cx, cy, 34, -a / 2, a / 2, PEN, "d d3") + arc(cx, cy, 34, 180 - a / 2, 180 + a / 2, PEN, "d d3");
      return svg(320, 170, b + txt(cx + 52, cy + 6, "α", "t t3", 17, PEN) + txt(cx - 52, cy + 6, "β", "t t3", 17, PEN));
    },
    par({ a = 60 }){
      const rad = a * Math.PI / 180, k = 1 / Math.tan(rad);
      let b = path("M20,60 L300,60", "d", INK) + path("M20,140 L300,140", "d", INK);
      const xa = 130, xb = xa - 80 * k; b += path(`M${xa + 40 * k},20 L${xb - 40 * k},180`, "d d2", PEN);
      b += txt(285, 52, "▶", "t", 12, MUTED) + txt(285, 132, "▶", "t", 12, MUTED);
      b += arc(xa, 60, 22, 0, a, WARN, "d d3") + arc(xb, 140, 22, 0, a, WARN, "d d3") + arc(xb, 140, 22, 180, 180 + a, OK, "d d4");
      return svg(320, 200, b + txt(xa + 32, 46, a + "°", "t t3", 14, WARN) + txt(xb + 32, 126, a + "°", "t t3", 14, WARN) + txt(xb - 34, 165, a + "°", "t t3", 14, OK));
    },
    tri({ A = 60, B = 60, h = false }){
      const [p, q, r] = triPts(A, B);
      let b = fillPoly([p, q, r]) + poly([p, q, r]);
      b += arc(p[0], p[1], 26, 0, A, WARN, "d d2") + arc(q[0], q[1], 26, 180 - B, 180, WARN, "d d2");
      const C = 180 - A - B, aR = Math.atan2(p[1] - r[1], p[0] - r[0]) * -180 / Math.PI;
      b += arc(r[0], r[1], 22, aR, aR + C, WARN, "d d2");
      if (h) b += path(`M${r[0]},${r[1]} L${r[0]},${p[1]}`, "d d3", INK, 2.5) + `<rect class="f" x="${r[0]}" y="${p[1] - 12}" width="12" height="12" fill="none" stroke="${INK}" stroke-width="2"/>` + txt(r[0] + 12, (r[1] + p[1]) / 2, "h", "t t3", 16, INK, "start");
      return svg(320, 190, b + txt(p[0] + 40, p[1] - 8, "α", "t", 15, WARN) + txt(q[0] - 40, q[1] - 8, "β", "t", 15, WARN) + txt(r[0], r[1] + 40, "γ", "t", 15, WARN));
    },
    iso(){
      const A = [160, 20], B = [70, 170], C = [250, 170];
      let b = fillPoly([A, B, C]) + poly([A, B, C]);
      b += path("M108,92 L122,100", "d d2", INK, 3) + path("M198,100 L212,92", "d d2", INK, 3);
      b += arc(B[0], B[1], 26, 0, 59, WARN, "d d3") + arc(C[0], C[1], 26, 121, 180, WARN, "d d3");
      return svg(320, 195, b + txt(160, 14, "A", "t") + txt(58, 186, "B", "t") + txt(262, 186, "C", "t"));
    },
    twotri(){
      const t1 = [[30, 160], [140, 160], [60, 60]], t2 = t1.map(([x, y]) => [x + 150, y]);
      let b = fillPoly(t1) + poly(t1) + fillPoly(t2) + poly(t2, "d d2");
      b += txt(160, 115, "≅", "t t3", 30, PEN);
      return svg(320, 180, b);
    },
    right({ a = 3, b: bb = 4 }){
      const s = 34, A = [60, 170], B = [60 + bb * s, 170], C = [60, 170 - a * s];
      let b = fillPoly([A, B, C]) + poly([A, B, C]) + `<rect class="f" x="60" y="152" width="18" height="18" fill="none" stroke="${INK}" stroke-width="2"/>`;
      b += txt(48, 170 - a * s / 2 + 5, "a = " + a, "t", 14, INK, "end") + txt(60 + bb * s / 2, 192, "b = " + bb, "t t2", 14) + txt(60 + bb * s / 2 + 16, 170 - a * s / 2 - 4, "c = ?", "t t3", 14, WARN, "start");
      return svg(320, 200, b);
    },
    quad({ kind = "para" }){
      const Q = { para: [[60, 150], [220, 150], [270, 50], [110, 50]], rect: [[60, 150], [260, 150], [260, 50], [60, 50]], rhom: [[160, 175], [260, 100], [160, 25], [60, 100]],
        square: [[90, 165], [230, 165], [230, 25], [90, 25]], trap: [[40, 150], [280, 150], [220, 50], [100, 50]], isotrap: [[40, 150], [280, 150], [210, 50], [110, 50]] }[kind];
      let b = fillPoly(Q) + poly(Q);
      if (kind === "rect" || kind === "square" || kind === "rhom") b += path(`M${Q[0][0]},${Q[0][1]} L${Q[2][0]},${Q[2][1]}`, "d d2", WARN, 2) + path(`M${Q[1][0]},${Q[1][1]} L${Q[3][0]},${Q[3][1]}`, "d d2", WARN, 2);
      if (kind === "para" || kind === "trap" || kind === "isotrap") b += txt((Q[0][0] + Q[1][0]) / 2, Q[0][1] + 6, "›", "t t2", 22, MUTED) + txt((Q[2][0] + Q[3][0]) / 2, Q[2][1] + 6, "›", "t t2", 22, MUTED);
      if (kind === "para") b += txt((Q[1][0] + Q[2][0]) / 2 + 2, (Q[1][1] + Q[2][1]) / 2 + 6, "»", "t t2", 20, MUTED) + txt((Q[0][0] + Q[3][0]) / 2 + 2, (Q[0][1] + Q[3][1]) / 2 + 6, "»", "t t2", 20, MUTED);
      if (kind === "isotrap") b += path("M66,102 L80,96", "d d3", INK, 3) + path("M240,96 L254,102", "d d3", INK, 3);
      const L = ["D", "C", "B", "A"];
      if (kind === "trap" || kind === "isotrap") Q.forEach((p, i) => { b += txt(p[0] + (i === 0 || i === 3 ? -12 : 12), p[1] + (i < 2 ? 16 : -6), L[i], "t t3", 14); });
      return svg(320, 190, b);
    },
    circle(){
      let b = `<circle class="f" cx="160" cy="100" r="80" fill="${SOFT}"/>` + `<circle class="d" pathLength="1" cx="160" cy="100" r="80" fill="none" stroke="${PEN}" stroke-width="3"/>`;
      b += path("M160,100 L240,100", "d d2", WARN, 3) + path("M80,100 L160,100", "d d3", OK, 3) + `<circle class="t" cx="160" cy="100" r="4" fill="${INK}"/>`;
      return svg(320, 200, b + txt(200, 92, "r", "t t2", 16, WARN) + txt(120, 92, "r", "t t3", 16, OK) + txt(160, 125, "d = 2r", "t t3", 14));
    },
    parab({ a = 1, b: bb = 0, c = 0, roots = false, vertex = false }){
      const vx = -bb / (2 * a), vy = a * vx * vx + bb * vx + c, x0 = vx - 4, x1 = vx + 4;
      const ys = [vy, a * 16 + vy]; const y0 = Math.min(...ys, 0) - 2, y1 = Math.max(...ys, 0) + 2;
      const W = 300, H = 210, X = x => 10 + (x - x0) / (x1 - x0) * W, Y = y => 10 + (y1 - y) / (y1 - y0) * H;
      let d = ""; for (let i = 0; i <= 60; i++) { const x = x0 + (x1 - x0) * i / 60; d += (i ? "L" : "M") + X(x).toFixed(1) + "," + Y(a * x * x + bb * x + c).toFixed(1); }
      let s = "";
      if (y0 <= 0 && y1 >= 0) s += `<line x1="10" y1="${Y(0)}" x2="310" y2="${Y(0)}" stroke="${MUTED}" stroke-width="2"/>`;
      if (x0 <= 0 && x1 >= 0) s += `<line x1="${X(0)}" y1="10" x2="${X(0)}" y2="220" stroke="${MUTED}" stroke-width="2"/>`;
      s += `<defs><clipPath id="lrpc"><rect x="10" y="10" width="300" height="210"/></clipPath></defs><g clip-path="url(#lrpc)">` + path(d, "d", PEN, 3.5) + "</g>";
      const disc = bb * bb - 4 * a * c;
      if (roots && disc >= 0) for (const r of [(-bb - Math.sqrt(disc)) / (2 * a), (-bb + Math.sqrt(disc)) / (2 * a)]) s += `<circle class="t t2" cx="${X(r)}" cy="${Y(0)}" r="6" fill="${WARN}"/>` + txt(X(r), Y(0) + (a > 0 ? -12 : 22), String(+r.toFixed(2)), "t t2", 13, WARN);
      if (vertex) s += `<circle class="t t3" cx="${X(vx)}" cy="${Y(vy)}" r="6" fill="${OK}"/>` + txt(X(vx), Y(vy) + (a > 0 ? 22 : -12), "(" + (+vx.toFixed(2)) + ", " + (+vy.toFixed(2)) + ")", "t t3", 13, OK);
      return svg(320, 230, s);
    },
    seq({ vals = [] }){
      const n = vals.length, w = 280 / n, mx = Math.max(...vals);
      let b = "";
      vals.forEach((v, i) => { const h = 20 + 110 * v / mx; b += `<rect class="f" x="${25 + i * w}" y="${150 - h}" width="${w - 12}" height="${h}" rx="8" fill="${PEN}" style="animation-delay:${0.2 + i * 0.3}s"/>` + txt(25 + i * w + (w - 12) / 2, 172, String(v), "t", 15, INK, "middle"); });
      return svg(320, 185, b);
    },
    bars({ vals = [] }){
      const n = vals.length, w = 280 / n, mx = Math.max(...vals), mean = vals.reduce((a, b) => a + b, 0) / n;
      let b = "";
      vals.forEach((v, i) => { const h = 120 * v / mx; b += `<rect class="f" x="${25 + i * w}" y="${150 - h}" width="${w - 14}" height="${h}" rx="6" fill="${SOFT}" stroke="${PEN}" stroke-width="2" style="animation-delay:${0.2 + i * 0.2}s"/>` + txt(25 + i * w + (w - 14) / 2, 168, String(v), "t", 14); });
      b += path(`M15,${150 - 120 * mean / mx} L305,${150 - 120 * mean / mx}`, "d d4", WARN, 3) + txt(300, 150 - 120 * mean / mx - 6, "ממוצע " + (+mean.toFixed(2)), "t t3", 13, WARN, "end");
      return svg(320, 180, b);
    },
    dice(){
      let b = ""; const dots = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
      for (let k = 1; k <= 6; k++) {
        const x = 18 + (k - 1) * 50, even = k % 2 === 0;
        b += `<rect class="f" x="${x}" y="45" width="40" height="40" rx="8" fill="${even ? PEN : "var(--surface)"}" stroke="${PEN}" stroke-width="2.5" style="animation-delay:${0.15 * k}s"/>`;
        for (const [dx, dy] of dots[k]) b += `<circle class="f" cx="${x + 20 + dx * 10}" cy="${65 + dy * 10}" r="3.5" fill="${even ? "#fff" : INK}" style="animation-delay:${0.15 * k}s"/>`;
      }
      return svg(320, 120, b + txt(160, 115, "3 / 6", "t t3", 16, PEN));
    },
    tangent(){
      const X = x => 40 + x * 60, Y = y => 190 - y * 40;
      let d = ""; for (let i = 0; i <= 40; i++) { const x = i * 4 / 40; d += (i ? "L" : "M") + X(x) + "," + Y(x * x / 4 + 0.3).toFixed(1); }
      const x1 = 2, y1 = 1.3, m = 1;
      let b = path(d, "d", PEN, 3.5) + path(`M${X(0.4)},${Y(y1 + m * (0.4 - x1))} L${X(3.9)},${Y(y1 + m * (3.9 - x1))}`, "d d2", WARN, 3);
      b += `<circle class="t t2" cx="${X(x1)}" cy="${Y(y1)}" r="6" fill="${WARN}"/>`;
      return svg(320, 200, b + txt(X(3.6), Y(y1 + m * 1.6) - 10, "m = f'(x)", "t t3", 14, WARN, "end"));
    },
    car(){
      let b = path("M10,150 L310,150", "d", MUTED, 2.5);
      b += `<g class="f"><rect x="40" y="105" width="80" height="30" rx="8" fill="${PEN}"/><rect x="58" y="88" width="44" height="22" rx="6" fill="${PEN}"/><circle cx="62" cy="138" r="10" fill="${INK}"/><circle cx="100" cy="138" r="10" fill="${INK}"/></g>`;
      b += path("M130,120 L290,120", "d d2", WARN, 3) + path("M280,112 L292,120 L280,128", "d d3", WARN, 3);
      return svg(320, 170, b + txt(210, 108, "s", "t t2", 16, WARN) + txt(210, 75, "v = s / t", "t t3", 18));
    },
    vt(){
      const X = t => 40 + t * 50, Y = v => 170 - v * 12;
      let b = path("M40,170 L300,170", "d", MUTED, 2) + path("M40,170 L40,20", "d", MUTED, 2);
      b += `<polygon class="f" points="${X(0)},${Y(2)} ${X(5)},${Y(12)} ${X(5)},170 ${X(0)},170" fill="${SOFT}" style="animation-delay:1.2s"/>`;
      b += path(`M${X(0)},${Y(2)} L${X(5)},${Y(12)}`, "d d2", PEN, 3.5);
      return svg(320, 195, b + txt(300, 188, "t", "t", 14, MUTED) + txt(30, 22, "v", "t", 14, MUTED) + txt(X(2.5), Y(7) - 12, "a = שיפוע", "t t2", 13, PEN) + txt(X(2.5), 150, "דרך = שטח", "t t3", 13, INK));
    },
    fall(){
      let b = "";
      [0, 1, 2, 3].forEach(k => { const y = 22 + 14 * k + 12 * k * k; b += `<circle class="f" cx="140" cy="${y}" r="12" fill="${PEN}" style="animation-delay:${0.25 + k * 0.35}s;opacity:${0.35 + k * 0.2}"/>` + txt(165, y + 5, "t = " + k, "t", 13, MUTED, "start"); });
      b += path("M100,20 L100,180", "d", MUTED, 2) + path("M92,168 L100,182 L108,168", "d", MUTED, 2.5);
      return svg(320, 195, b + txt(250, 110, "g ≈ 10", "t t3", 18, WARN));
    },
    forces({ F = 1 }){
      let b = path("M20,150 L300,150", "d", MUTED, 2.5) + `<rect class="f" x="120" y="90" width="80" height="60" rx="8" fill="${SOFT}" stroke="${PEN}" stroke-width="3"/>`;
      if (F) b += path("M205,120 L295,120", "d d2", WARN, 4) + path("M283,110 L297,120 L283,130", "d d2", WARN, 4) + txt(250, 108, "F", "t t2", 17, WARN) + path("M150,70 L190,70", "d d3", OK, 3) + path("M182,63 L192,70 L182,77", "d d3", OK, 3) + txt(170, 58, "a", "t t3", 15, OK);
      else b += txt(160, 60, "ΣF = 0", "t t2", 17, INK);
      return svg(320, 170, b + txt(160, 126, "m", "t", 18, PEN));
    },
    ramp(){
      let b = path("M20,40 C120,40 160,170 300,170", "d", INK, 3);
      b += `<circle class="t" cx="34" cy="28" r="12" fill="${PEN}"/>` + `<circle class="t t3" cx="280" cy="158" r="12" fill="${PEN}"/>`;
      return svg(320, 190, b + txt(70, 26, "Eₚ = mgh", "t t2", 14, WARN, "start") + txt(270, 135, "Eₖ = mv²/2", "t t3", 14, OK, "end"));
    },
    circuit(){
      let b = path("M60,50 L260,50 L260,150 L60,150 L60,50", "d", INK, 3);
      b += `<rect class="f" x="45" y="85" width="30" height="30" fill="var(--surface)"/>` + path("M48,92 L72,92", "d d2", INK, 3) + path("M53,104 L67,104", "d d2", INK, 5);
      b += `<rect class="f" x="135" y="138" width="50" height="24" rx="4" fill="${SOFT}" stroke="${PEN}" stroke-width="3"/>`;
      b += path("M150,38 L180,50 L150,62", "d d3", WARN, 3);
      return svg(320, 190, b + txt(30, 104, "V", "t t2", 16, INK) + txt(160, 185, "R", "t t2", 16, PEN) + txt(165, 30, "I", "t t3", 16, WARN));
    },
    atom({ p = 6, shells = [2, 4] }){
      let b = `<circle class="t" cx="160" cy="100" r="18" fill="${WARN}"/>` + txt(160, 106, p + "+", "t", 13, "#fff");
      shells.forEach((n, k) => { const r = 45 + k * 32; b += `<circle class="d d${k + 2}" pathLength="1" cx="160" cy="100" r="${r}" fill="none" stroke="${MUTED}" stroke-width="2"/>`;
        for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n + k; b += `<circle class="t t${k + 2}" cx="${(160 + r * Math.cos(a)).toFixed(1)}" cy="${(100 + r * Math.sin(a)).toFixed(1)}" r="6" fill="${PEN}"/>`; } });
      return svg(320, 200, b);
    },
    ptable(){
      let b = ""; const cols = 8, rows = 4, w = 34, h = 30;
      const SYM = [["H", "", "", "", "", "", "", "He"], ["Li", "Be", "B", "C", "N", "O", "F", "Ne"], ["Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"], ["K", "Ca", "Ga", "Ge", "As", "Se", "Br", "Kr"]];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const s = SYM[r][c]; if (!s) continue;
        const col = c < 2 || (r >= 2 && c === 2) ? PEN : c === 7 ? OK : WARN;
        b += `<rect class="f" x="${24 + c * w}" y="${20 + r * h}" width="${w - 4}" height="${h - 4}" rx="5" fill="${col}" opacity=".85" style="animation-delay:${0.1 + (r * cols + c) * 0.04}s"/>` + `<text class="f" x="${24 + c * w + (w - 4) / 2}" y="${20 + r * h + 18}" font-size="12" font-weight="700" fill="#fff" text-anchor="middle" style="animation-delay:${0.1 + (r * cols + c) * 0.04}s">${s}</text>`;
      }
      return svg(320, 150, b + txt(60, 145, "מתכות", "t t3", 12, PEN) + txt(200, 145, "אל-מתכות", "t t3", 12, WARN) + txt(282, 145, "אצילים", "t t3", 12, OK));
    },
  };
  function FIG(f){ try { return (FIGS[f.type] || (() => ""))(f); } catch (e) { console.error(e); return ""; } }
  window.LearnFigures = FIGS;
  window.LearnCheck = { accept, numOf, startPractice };

  // ---------- after solving: a link to the lesson on that topic ----------
  const TOPIC_LESSON = { fractions: "fractions", percent: "percent", powers: "powers", roots: "roots", distrib: "distrib", linear: "linear", quadratic: "quadratic",
    ineq: "ineq", factor: "factor", isosceles: "isosceles", angles: "triangle", pythag: "pythag", area: "area", trapezoid: "trapezoid", coord: "coord", slope: "slope",
    sequences: "arith", mean: "mean", primes: "powers" };
  function lessonFor(text){
    const t = String(text || "");
    if (typeof Topics !== "undefined") { const ids = Topics.detect(t); for (const id of ids) if (TOPIC_LESSON[id]) return TOPIC_LESSON[id]; }
    if (/[A-Z]\(\s*-?\d/.test(t)) return "coord";
    if (/[<>≤≥]/.test(t)) return "ineq";
    if (/(x²|x\^2)/.test(t)) return /=/.test(t) ? "quadratic" : "factor";
    if (/=/.test(t) && /[a-z]/i.test(t)) return /[a-z].*=.*[a-z]/i.test(t) && /,|\n/.test(t) && /y/.test(t) ? "system" : "linear";
    if (/√/.test(t)) return "roots";
    if (/%/.test(t)) return "percent";
    if (/\d\s*\/\s*\d/.test(t)) return "fractions";
    if (/\^|[²³⁴⁵⁶⁷⁸⁹]/.test(t)) return "powers";
    if (/\(.*\)/.test(t) && /[a-z]/i.test(t)) return "distrib";
    return null;
  }
  window.learnLessonFor = lessonFor;
  if (typeof window.solveNow === "function") {
    const baseSolve = window.solveNow;
    window.solveNow = function(...a){
      const r = baseSolve.apply(this, a);
      try {
        const box = $("results"), id = lessonFor($("problem").value), l = id && Courses.lesson(id);
        const old = box.querySelector(".lr-link"); if (old) old.remove();
        if (l && box.childElementCount) {
          const b = el("button", "lr-row lr-link"); b.type = "button"; b.style.marginTop = "4px";
          const tx = el("div"); tx.append(el("small", null, pick("Didn't get it? A short lesson:", "לא הבנתם? שיעור קצר על זה:")), el("b", null, nameOf(l)));
          const pl = el("span", "pl"); pl.append(svgEl(ICON.go));
          b.append(el("span", "n", Courses.course(l.course).icon), tx, pl); b.onclick = () => window.openLearn(l.id);
          box.append(b);
        }
      } catch (e) { console.error(e); }
      return r;
    };
  }

  // the app opens on Learn
  try { tab("learn"); } catch (e) { console.error(e); }
})();
