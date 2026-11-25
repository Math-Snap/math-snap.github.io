// ---------- "Something wrong in the solution?" ----------
// Under every solution: a small link. It opens a sheet that shows exactly what would be sent (the exercise's text and
// the app's answer, never a photo, a name or an email), an optional note, and Send. Reports go to the Math Snap
// database, where only the owner can read them (the owner dashboard on the site), so wrong answers can be fixed.
(function(){
  "use strict";
  const STR = {
    link: ["⚑ Something wrong in the solution?", "⚑ משהו לא נכון בפתרון?"],
    title: ["Report a wrong solution", "דיווח על פתרון לא נכון"],
    what: ["This is what will be sent: the exercise and the answer, with no photo, no name and no email.", "זה מה שיישלח: התרגיל והתשובה, בלי תמונה, בלי שם ובלי מייל."],
    ex: ["Exercise", "התרגיל"], ans: ["The app's answer", "התשובה של האפליקציה"],
    note: ["What's wrong? (not required)", "מה לא נכון? (לא חובה)"],
    notePh: ["e.g. the answer should be x = 4, or it read the photo wrong", "למשל: התשובה צריכה להיות x = 4, או שהוא קרא את התמונה לא נכון"],
    send: ["Send", "שליחה"], cancel: ["Cancel", "ביטול"],
    sending: ["Sending…", "שולח…"], thanks: ["Thank you! We'll use this to fix it.", "תודה! נשתמש בזה כדי לתקן."],
    fail: ["Couldn't send. Check the internet and try again.", "לא הצלחתי לשלוח. בדקו שיש אינטרנט ונסו שוב."],
  };
  const S = k => pick(...STR[k]);
  const css = document.createElement("style"); css.textContent = `
.replink{display:block;margin:14px auto 2px;border:0;background:none;color:var(--muted);font:600 13px/1.2 var(--sans);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.replink:hover{color:var(--pen)}
.repwrap{position:fixed;inset:0;z-index:1900;background:rgba(10,14,28,.45);display:flex;align-items:flex-end;justify-content:center}
.repbox{background:var(--surface);color:var(--ink);width:100%;max-width:560px;max-height:88vh;overflow:auto;border-radius:22px 22px 0 0;padding:18px max(16px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));display:flex;flex-direction:column;gap:10px;animation:repin .25s ease both}
@media (min-width:600px){.repwrap{align-items:center}.repbox{border-radius:22px}}
.repbox h2{margin:0;font-size:19px}
.repbox p{margin:0;color:var(--muted);font-size:14px;line-height:1.45}
.repbox small{font-weight:700;color:var(--muted);font-size:12px}
.repbox pre{margin:0;white-space:pre-wrap;word-break:break-word;font:500 14px/1.45 var(--mono);background:var(--surface-2);border-radius:12px;padding:10px;max-height:140px;overflow:auto}
.repbox textarea{font:500 15px/1.4 var(--sans);padding:10px;border-radius:12px;border:2px solid var(--line);background:var(--surface-2);color:var(--ink);min-height:70px;resize:vertical}
.repbox .row{display:flex;gap:10px}.repbox .row .btn{flex:1}
@keyframes repin{from{transform:translateY(20px);opacity:0}}
@media (prefers-reduced-motion:reduce){.repbox{animation:none}}`;
  document.head.append(css);

  const clip = (t, n) => { t = String(t || "").replace(/[⁦-⁩]/g, "").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  function exerciseOf(tab){
    try {
      if (tab === "geo") { const g = $("geoText").value, a = $("geoAsk") ? $("geoAsk").value : ""; return g + (a.trim() ? "\n? " + a : ""); }
      return $("problem").value;
    } catch (e) { return ""; }
  }
  function answerOf(box){ const a = box.querySelector(".ans"); return a ? a.innerText.replace(/\s*\n\s*/g, "\n") : ""; }

  function send(data){
    if (typeof Android !== "undefined" && typeof Android.report === "function") { Android.report(JSON.stringify(data)); return; }
    // the website and Windows: straight to the database (the same way the app counts phones)
    const base = "projects/math-snap-529bc/databases/(default)/documents";
    const id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "").slice(0, 28);
    const str = v => ({ stringValue: String(v) });
    const fields = { problem: str(data.problem), answer: str(data.answer), note: str(data.note), tab: str(data.tab), lang: str(data.lang),
      platform: str((typeof Android !== "undefined" && Android.appPlatform) || "web"), version: str((typeof Android !== "undefined" && Android.appVersion) || "") };
    fetch("https://firestore.googleapis.com/v1/" + base + ":commit", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{ update: { name: base + "/reports/" + id, fields }, currentDocument: { exists: false }, updateTransforms: [{ fieldPath: "at", setToServerValue: "REQUEST_TIME" }] }] }) })
      .then(r => window.onReportSent(r.ok), () => window.onReportSent(false));
  }

  let sheet = null;
  window.onReportSent = ok => {
    if (!sheet) return;
    const st = sheet.querySelector(".repstat"), go = sheet.querySelector(".repgo");
    st.textContent = ok ? S("thanks") : S("fail"); st.style.color = ok ? "var(--ok,#16A34A)" : "var(--bad,#DC2626)";
    if (ok) { go.hidden = true; sheet.querySelector(".repx").textContent = pick("Close", "סגירה"); setTimeout(close, 1800); } else go.disabled = false;
  };
  function close(){ if (sheet) { sheet.remove(); sheet = null; } }
  function open(box, tab){
    close();
    const problem = clip(exerciseOf(tab), 2000), answer = clip(answerOf(box), 2000);
    const wrap = el("div", "repwrap"); wrap.dir = lang === "he" ? "rtl" : "ltr"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true");
    const b = el("div", "repbox");
    const pe = el("pre"), pa = el("pre"); pe.textContent = problem || "—"; pa.textContent = answer || "—"; pe.dir = pa.dir = "auto";
    const ta = el("textarea"); ta.placeholder = S("notePh"); ta.maxLength = 500; ta.dir = "auto";
    const st = el("p", "repstat"); st.setAttribute("aria-live", "polite");
    const row = el("div", "row"), go = el("button", "btn repgo", S("send")), x = el("button", "btn quiet repx", S("cancel"));
    go.type = x.type = "button"; row.append(go, x);
    b.append(el("h2", null, S("title")), el("p", null, S("what")), el("small", null, S("ex")), pe, el("small", null, S("ans")), pa, el("small", null, S("note")), ta, st, row);
    wrap.append(b); document.body.append(wrap); sheet = wrap;
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    x.onclick = close;
    go.onclick = () => {
      if (!problem) return;
      go.disabled = true; st.textContent = S("sending"); st.style.color = "";
      try { send({ problem, answer, note: ta.value.trim().slice(0, 500), tab, lang }); } catch (e) { window.onReportSent(false); }
    };
  }
  // the link under each solution (the solve tab and the geometry tab)
  function add(panel, tab){
    if (!panel) return;
    const put = () => {
      const box = panel.querySelector(".result");
      if (!box || box.querySelector(".replink")) return;
      const l = el("button", "replink", S("link")); l.type = "button"; l.onclick = () => open(box, tab);
      box.append(l);
    };
    new MutationObserver(put).observe(panel, { childList: true, subtree: false, attributes: true, attributeFilter: ["hidden"] });
    put();
  }
  add($("results"), "solve"); add($("geoResults"), "geo");
  const prevBack = window.onBack;
  window.onBack = () => { if (sheet) { close(); return true; } return prevBack ? prevBack() : false; };
})();
