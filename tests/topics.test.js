// Study mode: questions made up by topic. Every question must be solvable and its own answer must pass its checker.
const path = require("path");
globalThis.math = require(path.join(__dirname, "../app/src/main/assets/math.js"));
const S = require(path.join(__dirname, "../app/src/main/assets/solver.js"));
const P = require(path.join(__dirname, "../app/src/main/assets/pro-core.js"));
const Topics = require(path.join(__dirname, "../app/src/main/assets/topics.js"));
const strip = s => String(s).replace(/[⁦-⁩]/g, "");
let bad = 0;
for (const lang of ["he", "en"]) {
  const env = { solve: S.solve, math, normalize: S.normalize, lang, sameAnswer: P.sameAnswer, sameExpr: (a, b) => P.sameExpr(math, S.normalize, a, b) };
  for (const t of Topics.TOPICS) {
    const qs = Topics.make([t.id], env, 25);
    if (qs.length < 8) { bad++; console.log("FAIL few questions", lang, t.id, qs.length); }
    for (const q of qs) {
      // the right answer, as a student would type it: the last part after "=" (or the whole answer)
      const a = strip(q.answer).replace(/\s*≈.*$/, ""); const typed = /[<>≤≥]|או|or|,/.test(a) ? a : a.split("=").pop().trim();
      if (!q.check(typed)) { bad++; console.log("FAIL own answer rejected", lang, t.id, q.problem, "→", typed); }
      if (q.check("12345")) { bad++; console.log("FAIL wrong answer accepted", lang, t.id, q.problem); }
      if (!q.result || !q.result.steps || !q.result.steps.length) { bad++; console.log("FAIL no steps", t.id, q.problem); }
    }
  }
}
const det = Topics.detect("חוקי חזקות והרחבת מושג החזקה כולל תרגילי פירוק לגורמים ראשוניים חוק הפילוג המורחב משולש שווה שוקיים");
if (det.join() !== "powers,primes,distrib,isosceles") { bad++; console.log("FAIL detect", det); }
// wrong-but-close answers are rejected
const env = { solve: S.solve, math, normalize: S.normalize, lang: "he", sameAnswer: P.sameAnswer, sameExpr: (a, b) => P.sameExpr(math, S.normalize, a, b) };
const f = Topics.make(["factor"], env, 30).find(q => /x² \+ \d+x \+ \d+$/.test(q.problem));
if (f && f.check(f.problem.split(":").pop().trim())) { bad++; console.log("FAIL unfactored answer accepted", f.problem); }
const pr = Topics.make(["primes"], env, 5)[0]; if (pr.check("2·2·2·45")) { bad++; console.log("FAIL non-prime factor accepted"); }
console.log(bad ? bad + " topic failures" : "topics: all checks passed");
process.exit(bad ? 1 : 0);
