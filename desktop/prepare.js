// Copies the app screens (built into docs/app by tools/build_web.py) into ./app,
// and puts the text scanner (Tesseract) next to them so reading pictures works offline.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "docs", "app");
const OUT = path.join(__dirname, "app");
const NM = path.join(__dirname, "node_modules");
const LANG = "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.cpSync(SRC, OUT, { recursive: true });
  fs.rmSync(path.join(OUT, "sw.js"), { force: true }); // the offline cache is only for the website

  const ocr = path.join(OUT, "ocr");
  fs.mkdirSync(path.join(ocr, "core"), { recursive: true });
  fs.mkdirSync(path.join(ocr, "lang"), { recursive: true });
  for (const f of ["tesseract.min.js", "worker.min.js"]) fs.copyFileSync(path.join(NM, "tesseract.js", "dist", f), path.join(ocr, f));
  const core = path.join(NM, "tesseract.js-core");
  let n = 0;
  for (const f of fs.readdirSync(core)) if (/\.wasm(\.js)?$/.test(f)) { fs.copyFileSync(path.join(core, f), path.join(ocr, "core", f)); n++; }
  if (!n) throw new Error("no tesseract core files found");

  const res = await fetch(LANG);
  if (!res.ok) throw new Error("language data: HTTP " + res.status);
  fs.writeFileSync(path.join(ocr, "lang", "eng.traineddata.gz"), Buffer.from(await res.arrayBuffer()));
  console.log("app ready:", fs.readdirSync(OUT).length, "files,", n, "scanner core files");
})().catch(e => { console.error(e); process.exit(1); });
