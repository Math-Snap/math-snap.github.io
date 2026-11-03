// Runs in the GitHub build after math.js is downloaded. Fails the build if the solver crashes
// or gives a wrong answer on these known problems.
const path = require("path");
globalThis.math = require(path.join(__dirname, "../app/src/main/assets/math.js"));
const { solve } = require(path.join(__dirname, "../app/src/main/assets/solver.js"));

const cases = [
  ["3/4 + 2/3", "17/12"],
  ["2x + 5 = 17", "x = 6"],
  ["Solve: 5x - 7 = 3x + 9", "x = 8"],
  ["3(x - 2) = 2x + 4", "x = 10"],
  ["x/4 = 3", "x = 12"],
  ["x² - 5x + 6 = 0", "x = 3  or  x = 2"],
  ["x^2 + 1 = 0", "No real solution"],
  ["2x + 3(x - 1)", "5x − 3"],
  ["12 ÷ 4 × 3", "9"],
  ["√144 + 2³", "20"],
  ["20% of 80", "16"],
  ["1 1/2 + 2 3/4", "17/4"],
  ["7 × 8", "56"],
  ["45 - 19", "26"],
  ["2 x 3 + 4", "10"],
  ["0.5 + 1/4", "3/4"],
  ["(2/3) × (9/4)", "3/2"],
  ["3 - 5 × 2", "−7"],
  ["sin(30)", "1/2"],
  ["4 / 0", null],
  ["1. 15 + 27", "42"],
];

let failed = 0;
for (const [input, expect] of cases) {
  let r;
  try { r = solve(input); } catch (e) { console.log("CRASH", JSON.stringify(input), e.stack); failed++; continue; }
  const got = r[0] && (r[0].answer || "ERROR: " + r[0].error);
  const ok = expect === null ? !!(r[0] && r[0].error) : !!(got && got.startsWith(expect));
  console.log((ok ? "PASS " : "FAIL ") + JSON.stringify(input) + "  ->  " + got);
  if (!ok) { failed++; console.log("      expected: " + expect); }
  if (r[0] && r[0].steps) console.log("      " + r[0].steps.join("\n      "));
}
// Hebrew
const strip = s => s.replace(/[⁦-⁩]/g, "");
for (const [input, expect, needHebrew] of [
  ["פתור: 2x + 5 = 17", "x = 6", true],
  ["x² - 5x + 6 = 0", "x = 3  או  x = 2", true],
  ["3/4 + 2/3", "17/12", false],
  ["4 / 0", null, true],
]) {
  const r = solve(input, "he")[0];
  const got = r && strip(r.answer || "ERROR: " + r.error);
  const allText = r ? [r.answer, r.error].concat(r.steps || []).join("\n") : "";
  const ok = (expect === null ? !!(r && r.error) : !!(got && got.startsWith(expect))) && (!needHebrew || /[֐-׿]/.test(allText));
  console.log((ok ? "PASS " : "FAIL ") + "[he] " + JSON.stringify(input) + "  ->  " + got);
  if (!ok) failed++;
  if (r && r.steps) console.log("      " + r.steps.map(strip).join("\n      "));
}
console.log(failed ? failed + " failed" : "All passed");
process.exit(failed ? 1 : 0);
