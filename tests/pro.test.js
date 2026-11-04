// Pro: answer checking, practice problems and the mistake checker.
const path = require("path");
globalThis.math = require(path.join(__dirname, "../app/src/main/assets/math.js"));
const { solve, normalize } = require(path.join(__dirname, "../app/src/main/assets/solver.js"));
const P = require(path.join(__dirname, "../app/src/main/assets/pro-core.js"));
let bad = 0;
const ok = (cond, msg) => { if (!cond) { bad++; console.log("FAIL", msg); } };
const same = [
  ["x = 3  or  x = 2", "x=2, x=3", true], ["x = 3  or  x = 2", "2,3", true], ["x = 3  or  x = 2", "x=2", false],
  ["17/12", "17/12", true], ["17/12", "1.41666666667", true], ["x > 5", "x>5", true], ["x > 5", "x<5", false],
  ["x > 5", "5 < x", true], ["x = 3, y = 2", "x=2,y=3", false], ["x = 3, y = 2", "y=2 x=3", true], ["x = 6", "6", true],
  ["x = 6", "x = 7", false], ["50/9 = 5 5/9 ≈ 5.5556", "50/9", true], ["2⁸ = 256", "256", true], ["x = −23", "x=-23", true],
];
for (const [a, b, e] of same) ok(P.sameAnswer(a, b) === e, "sameAnswer " + a + " | " + b);
for (const src of ["2x + 5 = 17", "x^2 - 5x + 6 = 0", "3/4 + 2/3", "x + y = 5\nx - y = 1", "2x - 3 > 7"]) {
  const ps = P.practice(solve, src, "en");
  ok(ps.length >= 3, "practice " + src + " gave " + ps.length);
  for (const p of ps) ok(P.sameAnswer(p.answer, p.answer), "self-check " + p.problem);
}
ok(!P.canPractice(solve, "f(x) = x^3 - 3x", "en"), "no practice for a function investigation");
const c1 = P.checkWork(solve, math, normalize, "2x + 5 = 17\n2x = 12\nx = 6", "en");
ok(c1.firstBad === -1 && c1.final === true, "all right");
const c2 = P.checkWork(solve, math, normalize, "2(x+3) = 14\n2x + 3 = 14\n2x = 11\nx = 5.5", "en");
ok(c2.firstBad === 1 && c2.rows[2].status === "after", "mistake in line 2");
const c3 = P.checkWork(solve, math, normalize, "(x+2)^2\nx^2 + 4", "en");
ok(c3.firstBad === 1, "expression mistake");
if (bad) { console.log(bad + " failed"); process.exit(1); } else console.log("Pro tests passed");
