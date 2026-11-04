/* Math Snap install screen.
   The web version only runs after it is installed (added to the home screen).
   Opened in a normal browser tab, it shows how to install instead of the app:
   - iPhone / iPad: Share → Add to Home Screen
   - Android: download the Android app (APK)
   - computer: the browser's own Install button when there is one */
(function () {
  "use strict";
  const standalone = window.navigator.standalone === true ||
    matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches;
  if (standalone || window.MathSnapDesktop || window.Android && !window.Android.isWeb) return;

  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const safari = ios && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  let he = true;
  try { he = (localStorage.getItem("lang") || ((navigator.language || "").match(/^(he|iw)/) ? "he" : "en")) === "he"; } catch (e) {}

  const APK = "https://github.com/Math-Snap/math-snap.github.io/releases/latest/download/MathSnap.apk";
  const EXE = "https://github.com/Math-Snap/math-snap.github.io/releases/latest/download/MathSnap-Setup.exe";
  const GUIDE = "../#install";
  const S = he ? {
    title: "מתקינים את Math Snap", sub: "Math Snap עובדת אחרי התקנה בטלפון. זה לוקח פחות מדקה.",
    iosSteps: ["לוחצים על <b>שיתוף</b> בתחתית המסך", "בוחרים <b>הוספה למסך הבית</b>", "לוחצים <b>הוספה</b>, ופותחים את Math Snap מהאייקון"],
    notSafari: "כדי להתקין באייפון, פותחים את הדף הזה ב-<b>Safari</b>.", copy: "העתקת הכתובת", copied: "הועתק",
    androidTxt: "באנדרואיד מתקינים את האפליקציה המלאה, עם סורק מהיר שעובד גם בלי אינטרנט.", apk: "הורדת האפליקציה לאנדרואיד",
    pcTxt: "מתקינים את Math Snap במחשב ישר מהדפדפן: בלי להוריד קובץ ובלי אזהרות. היא תיפתח בחלון משלה ותופיע בתפריט התחל.", install: "התקנה במחשב", guide: "מדריך התקנה מלא",
    pcHow: "לא רואים כפתור? ב-Chrome או ב-Edge לוחצים על סמל ההתקנה בסוף שורת הכתובת, או בתפריט ⋮ על <b>התקנת Math Snap</b>.", pcExe: "מעדיפים קובץ התקנה? MathSnap-Setup.exe",
  } : {
    title: "Install Math Snap", sub: "Math Snap runs once it is installed on your phone. It takes under a minute.",
    iosSteps: ["Tap <b>Share</b> at the bottom of the screen", "Choose <b>Add to Home Screen</b>", "Tap <b>Add</b>, then open Math Snap from its icon"],
    notSafari: "To install on iPhone, open this page in <b>Safari</b>.", copy: "Copy the address", copied: "Copied",
    androidTxt: "On Android you install the full app, with a fast scanner that also works offline.", apk: "Download the Android app",
    pcTxt: "Install Math Snap on this computer straight from the browser: no file to download and no warnings. It opens in its own window and appears in the Start menu.", install: "Install on this computer", guide: "Full install guide",
    pcHow: "No button? In Chrome or Edge, click the install icon at the end of the address bar, or open the ⋮ menu and choose <b>Install Math Snap</b>.", pcExe: "Prefer a setup file? MathSnap-Setup.exe",
  };

  const css = `
#msGate{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:#F2F4F9;color:#141936;font-family:Rubik,system-ui,sans-serif;
  padding:max(28px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(28px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
#msGate .in{max-width:420px;width:100%;display:flex;flex-direction:column;align-items:center;gap:16px}
#msGate img{width:84px;height:84px;border-radius:22px;box-shadow:0 10px 30px rgba(51,70,224,.3)}
#msGate h1{margin:0;font-size:26px;line-height:1.2}
#msGate p{margin:0;color:#5A6080;font-size:16px;line-height:1.5}
#msGate ol{list-style:none;margin:6px 0 0;padding:0;width:100%;display:flex;flex-direction:column;gap:10px;counter-reset:s}
#msGate li{counter-increment:s;display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:14px 16px;text-align:start;font-size:16px;box-shadow:0 2px 10px rgba(20,25,54,.06)}
#msGate li::before{content:counter(s);flex:none;width:30px;height:30px;border-radius:10px;background:#E4E8FF;color:#3346E0;display:grid;place-items:center;font-weight:800}
#msGate li svg{flex:none;width:22px;height:22px;color:#3346E0;margin-inline-start:auto}
#msGate a.b,#msGate button.b{appearance:none;border:0;cursor:pointer;display:inline-flex;justify-content:center;align-items:center;gap:8px;width:100%;
  padding:15px 18px;border-radius:16px;background:#3346E0;color:#fff;font:600 17px/1.2 Rubik,system-ui,sans-serif;text-decoration:none}
#msGate .ghost{background:transparent!important;color:#3346E0!important;box-shadow:inset 0 0 0 1.5px #C9D0F5}
#msGate .arrow{position:fixed;bottom:max(10px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);color:#3346E0;animation:msb 1.4s ease-in-out infinite}
#msGate .arrow svg{width:34px;height:34px}
@keyframes msb{50%{transform:translate(-50%,8px)}}
@media (prefers-reduced-motion:reduce){#msGate .arrow{animation:none}}
@media (prefers-color-scheme:dark){#msGate{background:#0E1124;color:#EEF0FA}#msGate p{color:#A3A9C8}#msGate li{background:#1A1E38;box-shadow:none}
  #msGate li::before{background:#262C5A;color:#A9B4FF}#msGate li svg,#msGate .arrow{color:#A9B4FF}#msGate .ghost{color:#A9B4FF!important;box-shadow:inset 0 0 0 1.5px #3A4170}}
@media (min-width:768px){#msGate .arrow{display:none}}`;

  const share = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/></svg>';
  const plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

  if (!ios && !android) S.sub = he ? "זה לוקח פחות מדקה." : "It takes under a minute.";
  let body = "";
  if (ios && safari) {
    body = `<ol><li><span>${S.iosSteps[0]}</span>${share}</li><li><span>${S.iosSteps[1]}</span>${plus}</li><li><span>${S.iosSteps[2]}</span></li></ol>
      <div class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M6 14l6 6 6-6"/></svg></div>`;
  } else if (ios) {
    body = `<p>${S.notSafari}</p><button class="b" type="button" id="msCopy">${S.copy}</button>`;
  } else if (android) {
    body = `<p>${S.androidTxt}</p><a class="b" href="${APK}">${S.apk}</a>`;
  } else {
    body = `<p>${S.pcTxt}</p><button class="b" type="button" id="msInstall" hidden>${S.install}</button><p id="msHow">${S.pcHow}</p>
      <a class="b ghost" href="${EXE}">${S.pcExe}</a>`;
  }

  const gate = document.createElement("div");
  gate.id = "msGate"; gate.dir = he ? "rtl" : "ltr"; gate.setAttribute("role", "dialog"); gate.setAttribute("aria-modal", "true"); gate.setAttribute("aria-labelledby", "msGateT");
  gate.innerHTML = `<style>${css}</style><div class="in"><img src="icon-192.png" alt=""><h1 id="msGateT">${S.title}</h1><p>${S.sub}</p>${body}
    <a class="b ghost" href="${GUIDE}">${S.guide}</a></div>`;

  const mount = () => {
    document.body.appendChild(gate);
    document.querySelectorAll("body > :not(#msGate)").forEach(n => { try { n.inert = true; n.setAttribute("aria-hidden", "true"); } catch (e) {} });
    const c = document.getElementById("msCopy");
    if (c) c.onclick = () => {
      const done = () => { c.textContent = S.copied; };
      const show = () => { c.outerHTML = `<p dir="ltr" style="user-select:all;word-break:break-all;font-weight:600">${location.href.replace(/[<>"&]/g, "")}</p>`; };
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(done, show);
    };
  };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  // computers with an Install button in the browser (Chrome, Edge)
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    const b = document.getElementById("msInstall"); if (!b) return;
    b.hidden = false; const how = document.getElementById("msHow"); if (how) how.hidden = true;
    b.onclick = async () => { e.prompt(); try { await e.userChoice; } catch (x) {} };
  });
  // once installed from this tab, the app opens on its own; this tab can stay on the install screen
})();
