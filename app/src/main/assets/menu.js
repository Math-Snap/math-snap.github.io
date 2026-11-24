// ---------- the ☰ menu: the app's screens and tools in a side drawer (instead of the tabs at the bottom) ----------
(function(){
  "use strict";
  const L = (en, he) => pick(en, he);
  const ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h6M8 11h4"/></svg>',
    study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 0-5.5 1-8.5z"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.5-.3-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 2.5 15.2 0 18M12 3c-2.5 2.8-2.5 15.2 0 18"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    upd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/></svg>',
  };

  const css = document.createElement("style"); css.textContent = `
body.menunav .bottomnav{display:none}
body.menunav .wrap{padding-bottom:calc(32px + env(safe-area-inset-bottom,0px))}
body.menunav #openBookTop,body.menunav #openCustom,body.menunav #langBtn{display:none}
#menuBtn{order:-2}
html[dir="ltr"] #menuBtn{order:-2}
.menuwrap{position:fixed;inset:0;z-index:45;background:rgba(10,14,25,.45);display:flex}
.menuwrap[hidden]{display:none}
.drawer{width:min(320px,86vw);height:100%;background:var(--bg);box-shadow:0 0 40px rgba(0,0,0,.25);overflow-y:auto;overscroll-behavior:contain;
  padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(20px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:6px}
html[dir="rtl"] .drawer{padding-right:max(14px,env(safe-area-inset-right,0px))}
html[dir="ltr"] .drawer{padding-left:max(14px,env(safe-area-inset-left,0px))}
.drawer .dhead{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.drawer .dhead b{flex:1;font-size:20px}
.drawer h3{margin:12px 6px 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.drawer .mi{display:flex;align-items:center;gap:14px;width:100%;border:0;background:none;color:var(--ink);font:600 16px/1.2 var(--sans);padding:12px;border-radius:14px;cursor:pointer;text-align:start}
.drawer .mi svg{width:22px;height:22px;flex:none;color:var(--muted)}
.drawer .mi:hover{background:var(--surface-2)}
.drawer .mi[aria-current="page"]{background:var(--pen-soft);color:var(--pen)}
.drawer .mi[aria-current="page"] svg{color:var(--pen)}
.drawer .mi .tag{margin-inline-start:auto;font-size:11px;font-weight:800;background:var(--mark);color:var(--ink);border-radius:6px;padding:2px 6px}
.drawer .mi .val{margin-inline-start:auto;color:var(--muted);font-size:14px}
@media (prefers-reduced-motion:no-preference){
  .menuwrap:not([hidden]){animation:fadein .2s ease both}
  html[dir="rtl"] .menuwrap:not([hidden]) .drawer{animation:drawR .28s cubic-bezier(.2,.8,.2,1) both}
  html[dir="ltr"] .menuwrap:not([hidden]) .drawer{animation:drawL .28s cubic-bezier(.2,.8,.2,1) both}
}
@keyframes drawR{from{transform:translateX(100%)}}@keyframes drawL{from{transform:translateX(-100%)}}
`; document.head.append(css);
  document.body.classList.add("menunav");

  // the ☰ button, at the start of the header
  const btn = document.createElement("button"); btn.className = "iconbtn"; btn.id = "menuBtn"; btn.type = "button";
  btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false"); btn.append(svgEl(ICON.menu));
  const bar = document.querySelector("header.appbar"); bar.prepend(btn);

  const wrap = document.createElement("div"); wrap.className = "menuwrap"; wrap.hidden = true; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true");
  const dr = document.createElement("nav"); dr.className = "drawer"; wrap.append(dr); document.body.append(wrap);
  wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !wrap.hidden) close(); });

  const current = () => ["tabLearn", "tabSolve", "tabGeo", "tabSci", "tabMe"].find(id => $(id) && $(id).getAttribute("aria-selected") === "true");
  function item(svg, text, onclick, extra){
    const b = document.createElement("button"); b.type = "button"; b.className = "mi";
    b.append(typeof svg === "string" ? svgEl(svg) : svg, el("span", null, text)); if (extra) b.append(extra);
    b.onclick = () => { close(); setTimeout(onclick, 60); }; return b;
  }
  function render(){
    dr.innerHTML = "";
    const head = el("div", "dhead"); head.append(el("b", null, "Math Snap"));
    const x = document.createElement("button"); x.type = "button"; x.className = "iconbtn"; x.setAttribute("aria-label", L("Close menu", "סגירת התפריט")); x.append(svgEl(ICON.x)); x.onclick = close;
    head.append(x); dr.append(head);
    // the screens: the same as the tabs at the bottom were
    const cur = current();
    for (const id of ["tabLearn", "tabSolve", "tabGeo", "tabSci", "tabMe"]) {
      const t = $(id); if (!t) continue;
      const ic = t.querySelector("svg") ? t.querySelector("svg").cloneNode(true) : svgEl(ICON.book);
      const b = item(ic, t.textContent.trim(), () => t.click()); if (id === cur) b.setAttribute("aria-current", "page"); dr.append(b);
    }
    dr.append(el("h3", null, L("Tools", "כלים")));
    const go = (tabId, btnId) => () => { if (current() !== tabId) $(tabId).click(); const b = $(btnId); if (b) b.click(); };
    if ($("openDaily")) dr.append(item(ICON.fire, L("Daily challenge", "אתגר יומי"), go("tabSolve", "openDaily")));
    dr.append(item(ICON.book, L("Formula sheet", "דף נוסחאות"), () => $("openBookTop").click()));
    if ($("openChecker")) dr.append(item(ICON.check, L("Check my solution", "בדיקת הפתרון שלי"), go("tabSolve", "openChecker")));
    if (window.openStudy) { const tag = el("span", "tag", "PRO"); tag.hidden = isPro(); dr.append(item(ICON.study, L("Study for a test", "לימוד למבחן"), () => window.openStudy(), tag)); }
    dr.append(el("h3", null, L("Settings", "הגדרות")));
    dr.append(item(ICON.star, isPro() ? L("Pro is on", "PRO פעיל") : "Math Snap PRO", () => $("proBtn").click()));
    dr.append(item(ICON.palette, L("Look and theme", "עיצוב"), () => $("openCustom").click()));
    dr.append(item(ICON.globe, L("Language", "שפה"), () => $("langBtn").click(), el("span", "val", lang === "he" ? "עברית" : "English")));
    const u = $("updBtn"); if (u && !u.hidden) dr.append(item(ICON.upd, u.getAttribute("aria-label") || L("Updates", "עדכונים"), () => u.click()));
  }
  function open(){ render(); wrap.hidden = false; btn.setAttribute("aria-expanded", "true"); setTimeout(() => { const f = dr.querySelector(".mi[aria-current]") || dr.querySelector(".mi"); if (f) f.focus(); }, 50); }
  function close(){ if (wrap.hidden) return; wrap.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  btn.onclick = open;
  const label = () => btn.setAttribute("aria-label", L("Menu", "תפריט"));
  label(); document.addEventListener("langchange", () => { label(); if (!wrap.hidden) render(); });

  // Android back button closes the menu first
  const prevBack = window.onBack;
  window.onBack = () => { if (!wrap.hidden) { close(); return true; } return prevBack ? prevBack() : false; };
})();
