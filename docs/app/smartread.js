// ---------- Smart reading (AI): handwriting, Hebrew, fractions and drawings ----------
// Off until a server address is filled in below. When it's on, a PRO user who is signed in and online sends the
// cropped, cleaned photo to the Math Snap reading server (server/smart-read), which asks an AI vision model to copy
// the exercise out exactly. The server holds the AI key (never the app) and checks the sign-in token, with a daily
// limit per account. If anything fails, the app reads the photo on the device as before.
(function(){
  "use strict";
  // ⬇ the server's address, e.g. "https://mathsnap-read.example.workers.dev" (empty: smart reading is off)
  const SERVER = "";
  const TIMEOUT = 25000;

  let waiting = [];
  window.onIdToken = t => { const w = waiting; waiting = []; w.forEach(f => f(t || "")); };
  const token = () => new Promise(res => {
    if (typeof Android === "undefined" || typeof Android.idToken !== "function") return res("");
    waiting.push(res); setTimeout(() => res(""), 8000);
    try { Android.idToken(); } catch (e) { res(""); }
  });

  window.SmartRead = {
    lastWasSmart: false,
    available(){
      try { return !!SERVER && navigator.onLine !== false && typeof isPro === "function" && isPro() && !!account; } catch (e) { return false; }
    },
    async read(dataUrl, target){
      this.lastWasSmart = false;
      const t = await token();
      if (!t) throw new Error("signin");
      const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = setTimeout(() => ctl && ctl.abort(), TIMEOUT);
      try {
        const r = await fetch(SERVER.replace(/\/$/, "") + "/read", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + t },
          body: JSON.stringify({ image: String(dataUrl).split(",")[1], mime: "image/jpeg", kind: target === "geo" ? "geo" : "solve", lang }),
          signal: ctl ? ctl.signal : undefined,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || typeof j.text !== "string") throw new Error(j.error || ("http " + r.status));
        this.lastWasSmart = true;
        return j.text;
      } finally { clearTimeout(timer); }
    },
  };
})();
