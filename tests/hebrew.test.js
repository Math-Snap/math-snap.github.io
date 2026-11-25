// Hebrew words from the second reader, put in place between the math (photofix.js), then the coordinate solver.
// The fixture is a real exercise photo read by two readers: one for math (Latin), one for Hebrew.
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/index.html"), "utf8");
global.ocrLines = eval("(" + html.slice(html.indexOf("function ocrLines("), html.indexOf("function cleanOcrLine(")).trim() + ")");
Object.assign(global, { window: global, Android: {}, document: { createElement: () => ({}), head: { append(){} } }, pick: (a, b) => b, lang: "he", el: () => ({}), setStatus: () => {}, onOcr: () => {} });
require(path.join(__dirname, "../app/src/main/assets/photofix.js"));
const C = require(path.join(__dirname, "../app/src/main/assets/coord.js"));
const m = PhotoFixMerge("", JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/heb-trapezoid.json"), "utf8")));
let bad = 0;
for (const want of ["א. הוכיחו שהמרובע הוא טרפז", "ב. מצאו את משוואת השוק AD", "נקודה G (נקודת", "ציר y"]) if (!m.text.includes(want)) { bad++; console.log("FAIL text:", want, "\n" + m.text); }
const a = C.solve(m.text.replace(/\n/g, " "), "he").answer.replace(/[⁦-⁩]/g, "");
for (const want of ["ABCD טרפז", "AD: y = ⅔x + 14/3", "G(0, 14/3)", "AE: y = 2x + 2"]) if (!a.includes(want)) { bad++; console.log("FAIL answer:", want, "in", a); }
if (PhotoFixMerge("x", [{ t: "2x", x: 1, y: 1, h: 10, id: "0.0" }]) !== null) { bad++; console.log("FAIL no Hebrew should change nothing"); }
console.log(bad ? bad + " hebrew failures" : "hebrew reading: ok");
process.exitCode = bad ? 1 : 0;
