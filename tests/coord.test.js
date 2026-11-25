// Shapes in a coordinate system: the kind of shape, the area and the perimeter.
const path = require("path");
const C = require(path.join(__dirname, "../app/src/main/assets/coord.js"));
const cases = [
  ["A(1,1) B(7,1) C(5,4) D(3,4)", /טרפז שווה שוקיים/, 12],
  ["A(0,0) B(6,0) C(4,3) D(0,3)", /טרפז ישר זווית/, 15],
  ["A(-2,1), B(4,1), C(2,5), D(-1,5)", /^ABCD טרפז ,/, 18],
  ["A(1,1) B(5,1) C(5,4) D(1,4)", /מלבן/, 12],
  ["A(0,0) B(3,1) C(4,4) D(1,3)", /מעוין/, 8],
  ["A(0,0) B(2,1) C(3,5) D(1,4)", /מקבילית/, 7],
  ["A(0,0) B(4,0) C(0,3)", /משולש ישר זווית/, 6],
  ["A(1,1) B(5,1) C(3,4)", /משולש שווה שוקיים/, 6],
  ["A(0,0) B(4,0) C(4,4) D(0,4)", /ריבוע/, 16],
  ["A(0,0) B(5,1) C(4,4) D(1,3)", /בלי צלעות מקבילות/, 12],
];
let bad = 0;
for (const [q, kind, area] of cases) {
  const r = C.solve(q, "he");
  const ans = r ? String(r.answer).replace(/[\u2066-\u2069]/g, "") : "";
  if (!r || !kind.test(ans) || Math.abs(r.area - area) > 1e-9 || !/<svg/.test(r.coord)) { bad++; console.log("FAIL", q, "→", r && r.answer, r && r.area); }
}
if (C.detect("A(1,2), B(7,2)")) { bad++; console.log("FAIL two points should stay with the solver"); }
console.log(bad ? bad + " coordinate failures" : "coordinates: all " + cases.length + " passed");
if (bad) process.exitCode = 1;

// a missing vertex from a side's equation and a parallel (also as text read from a photo)
{
  const C2 = require("../app/src/main/assets/coord.js"), strip = x => x.replace(/[\u2066\u2069]/g, "");
  for (const q of ["בטרפז ABCD (AB || CD) נתון: A(4;1), B(8;3), C(10;-1). משוואת הצלע AD היא y = 3x − 11.", "ABCD (AB || CD) : B(8;3) , A(4;1) C(10;-1) . AD y = 3x - 11 . AB . CD . D"]) {
    const r = C2.solve(q, "he"), a = strip(r.answer);
    if (!a.includes("½") || !a.includes("y = ½x − 6") || !a.includes("D(2, −5)") || r.area !== 30) { console.error("FAIL missing vertex:", a); process.exit(1); }
  }
  const p = strip(C2.solve("מקבילית ABCD, A(1,1) B(5,1) C(7,4). מצאו את D", "he").answer);
  if (!p.includes("D(3, 4)")) { console.error("FAIL parallelogram D:", p); process.exit(1); }
  console.log("ok missing vertex");
}

// the exercise's own questions: a side's equation, where it meets the y axis, a height (given foot, or not)
{
  const C3 = require("../app/src/main/assets/coord.js"), strip = x => x.replace(/[⁦⁩]/g, "");
  const base = "קדקודי המרובע ABCD הם: D(-l; 4) , C(5;1) , B(6;4) , A(2;6). א. הוכיחו שהמרובע הוא טרפז. ב. מצאו את משוואת השוק AD. ג. מצאו את שיעורי נקודה G (נקודת החיתוך של AD עם ציר y). ";
  for (const q of [base + "ד. ידוע כי שיעורי הנקודה E (0.6 , 3.2). מצאו את משוואת הגובה AE.", base + "ד. מצאו את משוואת הגובה AE."]) {
    const a = strip(C3.solve(q, "he").answer);
    for (const want of ["ABCD טרפז", "AD: y = ⅔x + 14/3", "G(0, 14/3)", "AE: y = 2x + 2"]) if (!a.includes(want)) { console.log("FAIL questions:", want, "in", a); process.exitCode = 1; }
  }
}
