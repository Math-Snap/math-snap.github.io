// Factoring: prime factors, divisors, common factor, the three formulas, trinomials, grouping.
const path = require("path");
globalThis.math = require(path.join(__dirname, "../app/src/main/assets/math.js"));
const { solve } = require(path.join(__dirname, "../app/src/main/assets/solver.js"));
const strip = s => String(s).replace(/[⁦-⁩\s]/g, "");
const cases = [
  ["פרק לגורמים ראשוניים 360", "360=2³·3²·5"],
  ["prime factors of 84", "84=2²·3·7"],
  ["גורמים של 36", "הגורמיםשל36:1,2,3,4,6,9,12,18,36"],
  ["פרק לגורמים 6x^2+9x", "6x²+9x=3x(2x+3)"],
  ["x^2-9", "x²−9=(x+3)(x−3)"],
  ["x^4-16", "x⁴−16=(x²+4)(x+2)(x−2)"],
  ["x^2+6x+9", "x²+6x+9=(x+3)²"],
  ["4x^2-12xy+9y^2", "4x²−12xy+9y²=(2x−3y)²"],
  ["x^2+5x+6", "x²+5x+6=(x+2)(x+3)"],
  ["2x^2+7x+3", "2x²+7x+3=(2x+1)(x+3)"],
  ["6x^2-x-2", "6x²−x−2=(2x+1)(3x−2)"],
  ["-x^2+5x-6", "−x²+5x−6=−(x−2)(x−3)"],
  ["3x^3-12x", "3x³−12x=3x(x+2)(x−2)"],
  ["2x^3-8x^2+8x", "2x³−8x²+8x=2x(x−2)²"],
  ["ax+ay+bx+by", "ax+ay+bx+by=(x+y)(a+b)"],
  ["x^3+2x^2+3x+6", "x³+2x²+3x+6=(x+2)(x²+3)"],
  ["פרק לגורמים x^2+4", "לאניתןלפרק:x²+4"],
  ["(x+2)^2", "x²+4x+4"],
  ["3x+2x", "5x"],
];
let bad = 0;
for (const [q, want] of cases) {
  const r = solve(q, "he")[0]; const got = strip(r && (r.answer || r.error));
  const okCheck = !/=/.test(want) || !/[a-z]/.test(want) || /^(לא|הגורמים)/.test(want) || (r.steps || []).some(s => /✓$/.test(s[0]));
  if (got !== strip(want) || !okCheck) { bad++; console.log("FAIL", q, "→", got, "want", strip(want), okCheck ? "" : "(no check step)"); }
}
console.log(bad ? bad + " factoring failures" : "factoring: all " + cases.length + " passed");
process.exit(bad ? 1 : 0);
