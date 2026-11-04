/* Math Snap web bridge.
   The Android app gives the page a native `Android` object (camera, text scanner, account).
   In a browser (iPhone, computer) this file provides the same object with web tools:
   - photos: the phone's own camera / photo picker
   - text scanner: Tesseract.js (downloaded once, then cached for offline use)
   - account: Firebase in the browser, with an offline cache of saved problems */
(function () {
  "use strict";
  if (window.Android) return; // inside the Android app: the native bridge is already here

  const call = (name, ...args) => { try { typeof window[name] === "function" && window[name](...args); } catch (e) { console.error(e); } };
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s);
  });
  const B = { isWeb: true, noWifiSetting: true };

  // ---------------- photos + text scanner ----------------
  function pickImage(useCamera) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    if (useCamera) inp.setAttribute("capture", "environment");
    inp.style.display = "none";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      inp.remove();
      if (f) scan(f); else call("onPhotoCancelled");
    };
    document.body.appendChild(inp);
    inp.click();
  }
  B.takePhoto = () => pickImage(true);
  B.pickPhoto = () => pickImage(false);

  async function shrink(file, max) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      return c;
    } catch (e) { return file; }
  }

  let worker = null;
  async function scan(file) {
    call("onPhotoStart");
    try {
      if (!window.Tesseract) await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js");
      if (!worker) {
        worker = await Tesseract.createWorker("eng");
        await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1", tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=*/:().,%<>|^°√π²³×÷−∢∥ " });
      }
      const img = await shrink(file, 1800);
      const { data } = await worker.recognize(img);
      const items = [];
      (data.lines || []).forEach((line, li) => (line.words || []).forEach(w => items.push({
        t: w.text, x: (w.bbox.x0 + w.bbox.x1) / 2, y: (w.bbox.y0 + w.bbox.y1) / 2, h: w.bbox.y1 - w.bbox.y0,
        line: String(line.text || "").trim(), id: "0." + li,
      })));
      call("onOcr", data.text || "", items);
    } catch (e) {
      console.error(e);
      call("onOcrError", navigator.onLine ? "read" : "offline");
    }
  }

  // look: the browser's top bar follows the theme chosen in the app
  B.setBars = (bg) => {
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement("meta"); m.name = "theme-color"; document.head.appendChild(m); }
    m.content = bg;
  };

  // ---------------- account (only when the Firebase web settings are filled in) ----------------
  const cfg = window.MATHSNAP_FIREBASE;
  if (cfg && cfg.apiKey) {
    const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
    let auth = null, db = null, user = null, unsub = null;
    const boot = (async () => {
      await loadScript(FB + "firebase-app-compat.js");
      await loadScript(FB + "firebase-auth-compat.js");
      await loadScript(FB + "firebase-firestore-compat.js");
      firebase.initializeApp(cfg);
      auth = firebase.auth(); db = firebase.firestore();
      try { await db.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* private mode etc. */ }
      auth.onAuthStateChanged(u => { user = u; pushAuth(); if (u) listen(); else stop(); });
      try { await auth.getRedirectResult(); } catch (e) { fail(e); }
    })().catch(e => { console.error(e); });

    const state = () => user
      ? { signedIn: true, email: user.email || "", name: user.displayName || "", provider: (user.providerData[0] || {}).providerId || "password" }
      : { signedIn: false };
    const pushAuth = () => call("onAuth", state());
    const CODES = {
      "auth/invalid-email": "bad_email", "auth/wrong-password": "bad_password", "auth/invalid-credential": "bad_password",
      "auth/invalid-login-credentials": "bad_password", "auth/user-not-found": "no_user", "auth/email-already-in-use": "email_in_use",
      "auth/weak-password": "weak_password", "auth/network-request-failed": "network",
    };
    function fail(e) {
      const code = e && e.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || code === "auth/user-cancelled") return call("onAuthInfo", "cancelled");
      if (code && code.startsWith("auth/popup") ) return call("onAuthError", "google", e.message || "");
      call("onAuthError", CODES[code] || "other", (e && e.message) || "");
    }

    B.authState = () => JSON.stringify(state());
    B.ready = () => { boot.then(() => { pushAuth(); if (user) listen(); call("onSync", { paused: false }); }); };
    B.signInEmail = (email, pass) => boot.then(() => auth.signInWithEmailAndPassword(String(email).trim(), pass)).catch(fail);
    B.signUpEmail = (email, pass, name) => boot.then(async () => {
      const cred = await auth.createUserWithEmailAndPassword(String(email).trim(), pass);
      if (name && String(name).trim()) { await cred.user.updateProfile({ displayName: String(name).trim() }); pushAuth(); }
    }).catch(fail);
    B.resetPassword = email => boot.then(() => auth.sendPasswordResetEmail(String(email).trim())).then(() => call("onAuthInfo", "reset_sent")).catch(fail);
    B.signInGoogle = () => boot.then(() => {
      const p = new firebase.auth.GoogleAuthProvider();
      const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
      return standalone ? auth.signInWithRedirect(p) : auth.signInWithPopup(p);
    }).catch(fail);
    B.signOut = () => boot.then(() => { stop(); return auth.signOut(); });

    const col = () => user && db ? db.collection("users").doc(user.uid).collection("problems") : null;
    B.saveProblem = json => {
      const c = col(); if (!c) return "";
      const o = JSON.parse(json), ref = c.doc();
      ref.set({
        kind: String(o.kind || "solve").slice(0, 10), input: String(o.input || "").slice(0, 2000), answer: String(o.answer || "").slice(0, 1000),
        tool: String(o.tool || "").slice(0, 40), vals: String(o.vals || "").slice(0, 500), fav: !!o.fav, note: String(o.note || "").slice(0, 2000),
        created: Date.now(),
      }).catch(e => console.error(e));
      return ref.id;
    };
    B.updateProblem = (id, json) => {
      const c = col(); if (!c) return;
      const o = JSON.parse(json), data = {};
      if ("fav" in o) data.fav = !!o.fav;
      if ("note" in o) data.note = String(o.note).slice(0, 2000);
      if (Object.keys(data).length) c.doc(id).update(data).catch(e => console.error(e));
    };
    B.deleteProblem = id => { const c = col(); if (c) c.doc(id).delete().catch(e => console.error(e)); };
    B.wifiOnly = () => false;
    B.setWifiOnly = () => {};

    function listen() {
      stop(false);
      const c = col(); if (!c) return;
      unsub = c.orderBy("created", "desc").limit(300).onSnapshot({ includeMetadataChanges: true }, snap => {
        let pending = 0;
        const list = snap.docs.map(d => {
          const x = d.data(), p = d.metadata.hasPendingWrites; if (p) pending++;
          return { id: d.id, kind: x.kind || "solve", input: x.input || "", answer: x.answer || "", tool: x.tool || "", vals: x.vals || "",
                   fav: !!x.fav, note: x.note || "", created: x.created || 0, pending: p };
        });
        call("onHistory", list);
        call("onSync", { pending, offline: snap.metadata.fromCache, paused: false });
      }, e => console.error(e));
    }
    function stop(clear) {
      if (unsub) { unsub(); unsub = null; }
      if (clear !== false) call("onHistory", []);
    }
  }

  window.Android = B;

  // counting phones: one anonymous ID per installed copy, sent at most once a day (no personal details)
  try {
    const installed = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
    const day = new Date().toISOString().slice(0, 10);
    if (installed && navigator.onLine && localStorage.getItem("pingDay") !== day) {
      let id = localStorage.getItem("installId");
      if (!id) { id = "w" + (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "").slice(0, 32); localStorage.setItem("installId", id); }
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const base = "projects/math-snap-529bc/databases/(default)/documents";
      const tr = [{ fieldPath: "last", setToServerValue: "REQUEST_TIME" }, { fieldPath: "opens", increment: { integerValue: "1" } }];
      if (!localStorage.getItem("installSent")) tr.push({ fieldPath: "first", setToServerValue: "REQUEST_TIME" });
      fetch("https://firestore.googleapis.com/v1/" + base + ":commit", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writes: [{ update: { name: base + "/installs/" + id, fields: { platform: { stringValue: ios ? "ios" : "web" }, version: { stringValue: "__APPVER__" } } },
          updateMask: { fieldPaths: ["platform", "version"] }, updateTransforms: tr }] }) })
        .then(r => { if (r.ok) { localStorage.setItem("pingDay", day); localStorage.setItem("installSent", "1"); } }).catch(() => {});
    }
  } catch (e) { /* counting must never get in the way */ }
})();
