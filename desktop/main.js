// Math Snap for Windows.
// The window shows the same screens and math engine as the phone app (copied into ./app by prepare.js).
// They are served from a small local server on "localhost", so accounts and saved settings work like on the web.
const { app, BrowserWindow, shell, dialog, ipcMain, Menu } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "app");
const PORT = 47321; // fixed, so settings saved in the page stay between launches
const SMOKE = process.argv.includes("--smoke");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff2": "font/woff2", ".wasm": "application/wasm", ".gz": "application/gzip",
};

function serve(){
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch (e) { res.writeHead(400); return res.end(); }
    if (p.endsWith("/")) p += "index.html";
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(data);
    });
  });
  return new Promise(resolve => {
    server.once("error", () => { server.listen(0, "localhost", () => resolve(server.address().port)); });
    server.listen(PORT, "localhost", () => resolve(server.address().port));
  });
}

let win = null;
const isHttps = u => { try { return new URL(u).protocol === "https:"; } catch (e) { return false; } };

async function createWindow(){
  const port = await serve();
  const home = "http://localhost:" + port + "/";
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 560,
    title: "Math Snap", backgroundColor: "#F2F4F9", show: false,
    icon: path.join(__dirname, "build", "icon.ico"),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  // links to websites open in the normal browser; the window itself never leaves the app
  win.webContents.setWindowOpenHandler(({ url }) => { if (isHttps(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith(home)) { e.preventDefault(); if (isHttps(url)) shell.openExternal(url); } });
  win.once("ready-to-show", () => { if (!SMOKE) win.show(); });
  await win.loadURL(home);
  if (SMOKE) smoke();
}

// ---- what the page can ask for (see preload.js) ----
ipcMain.handle("version", () => app.getVersion());
ipcMain.handle("open-external", (e, url) => { if (isHttps(url)) shell.openExternal(url); });
ipcMain.handle("save-pdf", async (e, title) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  const safe = String(title).replace(/[\\/:*?"<>|]+/g, " ").trim() || "Math Snap";
  const { canceled, filePath } = await dialog.showSaveDialog(w, {
    defaultPath: path.join(app.getPath("documents"), safe + ".pdf"),
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return false;
  const pdf = await e.sender.printToPDF({ printBackground: true, pageSize: "A4", margins: { marginType: "default" } });
  fs.writeFileSync(filePath, pdf);
  shell.openPath(filePath);
  return true;
});

// ---- self-test used by the build: solve a problem and read a picture, then quit ----
async function smoke(){
  const out = path.join(__dirname, "smoke.txt");
  const done = (ok, msg) => { fs.writeFileSync(out, (ok ? "OK " : "FAIL ") + msg); app.exit(ok ? 0 : 1); };
  setTimeout(() => done(false, "timeout"), 150000);
  try {
    const solved = await win.webContents.executeJavaScript(`new Promise(r => {
      document.getElementById("problem").value = "2x + 5 = 17"; solveNow(true, true);
      setTimeout(() => r(document.getElementById("results").innerText), 400);
    })`);
    if (!/x\s*=\s*6/.test(solved)) return done(false, "solve: " + solved.slice(0, 200));
    const desk = await win.webContents.executeJavaScript(`!!(window.MathSnapDesktop && Android.isDesktop && Android.scanImage)`);
    if (!desk) return done(false, "bridge missing");
    const ocr = await win.webContents.executeJavaScript(`new Promise((resolve) => {
      const c = document.createElement("canvas"); c.width = 900; c.height = 200;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 900, 200); g.fillStyle = "#000"; g.font = "bold 90px Arial"; g.fillText("3x + 4 = 19", 60, 135);
      const prevOk = window.onOcr, prevErr = window.onOcrError;
      window.onOcr = (text) => { window.onOcr = prevOk; resolve("text:" + text); };
      window.onOcrError = (code) => { window.onOcrError = prevErr; resolve("error:" + code); };
      c.toBlob(b => Android.scanImage(new File([b], "t.png", { type: "image/png" })), "image/png");
    })`);
    if (!/3x|3 x|19/.test(ocr)) return done(false, "ocr: " + ocr);
    done(true, "solve and ocr work: " + ocr.replace(/\s+/g, " ").slice(0, 80));
  } catch (err) { done(false, String(err)); }
}

// ---- updates: new versions come from the GitHub releases ----
function checkUpdates(){
  if (!app.isPackaged || SMOKE) return;
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  } catch (e) {}
}

if (!SMOKE && !app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    app.setAppUserModelId("com.mathsnap.desktop");
    createWindow();
    checkUpdates();
  });
  app.on("window-all-closed", () => app.quit());
}
