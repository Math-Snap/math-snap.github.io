// Runs in the GitHub build after math.js is downloaded. Fails the build if the solver crashes
// or gives a wrong answer on these known problems.
const path = require("path");
globalThis.math = require(path.join(__dirname, "../app/src/main/assets/math.js"));
const { solve } = require(path.join(__dirname, "../app/src/main/assets/solver.js"));
const strip = s => String(s).replace(/[⁦-⁩]/g, "");

const cases = [
  // arithmetic & fractions
  ["3/4 + 2/3", "17/12"],
  ["12 ÷ 4 × 3", "9"],
  ["√144 + 2³", "20"],
  ["20% of 80", "16"],
  ["1 1/2 + 2 3/4", "17/4"],
  ["7 × 8", "56"],
  ["2 x 3 + 4", "10"],
  ["0.5 + 1/4", "3/4"],
  ["(2/3) × (9/4)", "3/2"],
  ["3 - 5 × 2", "−7"],
  ["(3 + 5) × 2", "16"],
  ["sin(30)", "1/2"],
  ["4 / 0", null],
  ["1. 15 + 27", "42"],
  // equations
  ["2x + 5 = 17", "x = 6"],
  ["Solve: 5x - 7 = 3x + 9", "x = 8"],
  ["3(x - 2) = 2x + 4", "x = 10"],
  ["x/4 = 3", "x = 12"],
  ["x² - 5x + 6 = 0", "x = 3  or  x = 2"],
  ["x^2 + 1 = 0", "No real solution"],
  // power laws
  ["2^3 · 2^5", "2⁸ = 256"],
  ["5^7 : 5^5", "5² = 25"],
  ["(x^2)^3", "x⁶"],
  ["x^5 · x^3 / x^2", "x⁶"],
  ["7^0", "1"],
  ["2^-3", "1/2³ = 1/8"],
  ["(2a^3)^2", "4a⁶"],
  ["a^4 · a^-6", "1/a²"],
  ["3 · 3^2", "3³ = 27"],
  // prime factorization
  ["360", "360 = 2³ · 3² · 5"],
  ["13", "13 is a prime number"],
  // extended distributive law
  ["2x + 3(x - 1)", "5x − 3"],
  ["(x+2)(x-3)", "x² − x − 6"],
  ["(2x - 1)(x + 4)", "2x² + 7x − 4"],
  ["5 - (x+1)(x+2)", "−x² − 3x + 3"],
  ["(x+2)(x+3) = x^2 + 10", "x = 4/5"],
  ["(x-1)(x+1) = x(x-2) + 7", "x = 4"],
];

let failed = 0;
function run(input, expect, lang, needHebrew) {
  let r;
  try { r = solve(input, lang)[0]; } catch (e) { console.log("CRASH", JSON.stringify(input), e.stack); failed++; return; }
  const got = r && strip(r.answer || "ERROR: " + r.error);
  const text = r ? strip([r.answer, r.error].concat((r.steps || []).map(s => s.join(" | "))).join("\n")) : "";
  let ok = expect === null ? !!(r && r.error) : !!(got && got.startsWith(expect));
  if (needHebrew && !/[֐-׿]/.test(text)) ok = false;
  if (r && r.steps && !r.steps.every(s => Array.isArray(s) && s.length === 2)) ok = false;
  console.log((ok ? "PASS " : "FAIL ") + (lang === "he" ? "[he] " : "") + JSON.stringify(input) + "  ->  " + got);
  if (!ok) { failed++; console.log("      expected: " + expect); }
  if (r && r.steps) for (const [c, why] of r.steps) console.log("      " + strip(c) + "   |   " + strip(why));
}
for (const [input, expect] of cases) run(input, expect, "en");

// Hebrew
run("פתור: 2x + 5 = 17", "x = 6", "he", true);
run("x² - 5x + 6 = 0", "x = 3  או  x = 2", "he", true);
run("2^3 · 2^5", "2⁸ = 256", "he", true);
run("(x+2)(x-3)", "x² − x − 6", "he", true);
run("360", "360 = 2³ · 3² · 5", "he", true);
run("4 / 0", null, "he", true);

console.log(failed ? failed + " failed" : "All passed");
process.exit(failed ? 1 : 0);
