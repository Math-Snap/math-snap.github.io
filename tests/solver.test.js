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
  // grades 10–12: inequalities
  ["2x + 3 > 7", "x > 2"],
  ["-2x + 4 ≥ 10", "x ≤ −3"],
  ["x^2 - 5x + 6 < 0", "2 < x < 3"],
  ["x^2 - 5x + 6 >= 0", "x ≤ 2  or  x ≥ 3"],
  ["(x-1)/(x+2) > 0", "x < −2  or  x > 1"],
  ["-3 < 2x + 1 < 7", "−2 < x < 3"],
  // systems
  ["x + y = 5\nx - y = 1", "x = 3 ,  y = 2"],
  ["2x + 3y = 12, 4x - y = 10", "x = 3 ,  y = 2"],
  ["3x + 2y = 7\n5x - 3y = 18", "x = 3 ,  y = −1"],
  // exponents and logarithms
  ["2^x = 8", "x = 3"],
  ["3^(x+1) = 27", "x = 2"],
  ["4^x = 2^(x+3)", "x = 3"],
  ["5 * 2^x = 40", "x = 3"],
  ["2^x = 5", "x ≈ 2.3219"],
  ["log2(8)", "3"],
  ["log(1000)", "3"],
  ["log_3(81)", "4"],
  ["log2(x) = 5", "x = 32"],
  ["log(x+1) = 2", "x = 99"],
  // trig equations
  ["sin(x) = 0.5", "x = 30° + 360°k  or  x = 150° + 360°k"],
  ["2sin(x) - 1 = 0", "x = 30° + 360°k"],
  ["tan(x) = 1", "x = 45° + 180°k"],
  ["sin(x) = 0.5, 0 ≤ x ≤ 360", "x = 30°, 150°"],
  ["sin(x) = 2", "No solution"],
  // calculus
  ["derivative of x^3 - 3x^2 + 2", "f'(x) = 3x² − 6x"],
  ["derivative 5/x^2 + sqrt(x)", "f'(x) = 1/(2√x) − 10/x³"],
  ["f(x) = x^3 - 3x, x = 2 derivative", "f'(x) = 3x² − 3  ,  f'(2) = 9"],
  ["tangent to f(x) = x^2 at x = 3", "y = 6x − 9"],
  ["f(x) = x^3 - 3x", "max (−1 , 2) ,  min (1 , −2)"],
  ["investigate f(x) = (x^2+1)/x", "max (−1 , −2) ,  min (1 , 2)"],
  ["integral of x^2 + 3x", "(1/3)x³ + (3/2)x² + C"],
  ["integral sin(x) from 0 to pi", "= 2"],
  ["area of x^2 - 4 from 0 to 3", "S = 23/3"],
  // sequences
  ["3, 7, 11, 15", "d = 4 ,  aₙ = 4n − 1"],
  ["2, 6, 18, 54", "q = 3"],
  ["arithmetic sequence a3 = 7, a8 = 22, find a20", "a₁ = 1 ,  d = 3 ,  a₂₀ = 58"],
  ["geometric a1=2, q=3, n=5", "a₁ = 2 ,  q = 3 ,  a₅ = 162 ,  S₅ = 242"],
  // analytic geometry
  ["(1,2) (3,6)", "y = 2x ,  distance 2√5"],
  ["A(0,0) B(4,0) C(0,3)", "area S = 6"],
  ["x^2 + y^2 - 4x + 2y - 4 = 0", "center (2 , −1) ,  radius R = 3"],
  ["y = x^2 - 4x + 3", "vertex (2 , −1)"],
  ["(1,2) perpendicular to y = 2x + 1", "y = (−1/2)x + 5/2"],
  // counting and statistics
  ["C(10,3)", "120"],
  ["P(5,2)", "20"],
  ["10!/(3!*7!)", "120"],
  ["mean 2, 4, 4, 4, 5, 5, 7, 9", "mean 5 ,  median 4.5"],
  ["10 - 3 - 2", "5"],
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
run("סדרה חשבונית a1=3, d=2, n=10", "a₁ = 3 ,  d = 2 ,  a₁₀ = 21 ,  S₁₀ = 120", "he", true);
run("משיק לפונקציה f(x)=x^3-2x בנקודה x=1", "y = x − 2", "he", true);
run("אינטגרל של x^2 מ-0 עד 3", "= 9", "he", true);
run("חקירה f(x) = x^2 - 4x + 3", "מינימום (2 , −1)", "he", true);
run("בחירת 3 מתוך 10", "120", "he", true);

console.log(failed ? failed + " failed" : "All passed");
process.exit(failed ? 1 : 0);
