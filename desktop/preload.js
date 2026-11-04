// What the Math Snap page may ask of Windows. Nothing else from the computer is reachable from the page.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("MathSnapDesktop", {
  platform: process.platform,
  store: !!process.windowsStore,
  savePdf: title => ipcRenderer.invoke("save-pdf", String(title || "Math Snap")),
  openExternal: url => ipcRenderer.invoke("open-external", String(url || "")),
  version: () => ipcRenderer.invoke("version"),
  license: (action, params) => ipcRenderer.invoke("license", String(action), params || {}),
  checkUpdates: () => ipcRenderer.invoke("check-updates"),
  onUpdate: cb => ipcRenderer.on("update-status", (e, s) => { try { cb(s); } catch (err) {} }),
});
