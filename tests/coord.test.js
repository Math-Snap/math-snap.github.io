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
process.exit(bad ? 1 : 0);
