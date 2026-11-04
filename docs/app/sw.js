/* Math Snap offline support.
   The app's own files are kept on the phone and refreshed in the background.
   The text scanner and Firebase libraries are saved the first time they are used.
   Account traffic (sign-in, saving) is never cached. */
const CACHE = "mathsnap-e756d9e7d0";
const LIBS = "mathsnap-libs";
const SHELL = ["./", "index.html", "solver.js", "pro-core.js", "math.js", "web-bridge.js", "install-gate.js", "firebase-config.js", "manifest.webmanifest",
  "fonts/Rubik.ttf", "fonts/JetBrainsMono.ttf", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("mathsnap-") && k !== CACHE && k !== LIBS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/googleapis\.com|identitytoolkit|securetoken|firestore|firebaseapp\.com|accounts\.google/.test(url.host)) return;

  if (url.origin === self.location.origin && (req.mode === "navigate" || /\.(html|js)$/.test(url.pathname) || url.pathname.endsWith("/"))) {
    // the app's own page and code: newest from the internet, the saved copy when offline
    e.respondWith(caches.open(CACHE).then(async c => {
      try { const r = await fetch(req, { cache: "no-store" }); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req, { ignoreSearch: true })) || Response.error(); }
    }));
    return;
  }
  if (url.origin === self.location.origin) {
    // show the saved copy right away, and quietly fetch a fresh one for next time
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (/cdn\.jsdelivr\.net|gstatic\.com|tessdata|unpkg\.com/.test(url.host)) {
    e.respondWith(caches.open(LIBS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === "opaque") c.put(req, r.clone());
      return r;
    }));
  }
});
