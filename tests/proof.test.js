// Geometry problems with several shapes: the proof engine reads the problem and proves the goals.
const path = require("path");
const P = require(path.join(__dirname, "../app/src/main/assets/proof.js"));
let bad = 0;
const ok = (n, c, g) => { if (!c) { bad++; console.log("FAIL", n, g); } };
const run = (g, a, lang) => P.solve(g, a, lang || "he");
const has = (r, re) => r.rows.some(([c, w]) => re.test(c + " " + w));
// the problem that started it all
let r = run("נתונים: משולש שווה שוקיים וישר הזווית ABC\nהנקודות E ו-D נמצאות על הצלעות AB ו-AC בהתאמה.", "חשבו את הזווית ABC\nנתון שהמשולש ADE הוא שווה שוקיים.\nהוכיחו: המרובע BCED הוא טרפז שווה שוקיים");
ok("iso right: both goals", r.ok && r.goals.length === 2 && r.goals.every(g => g.ok), r);
ok("iso right: 45", /∢ABC = 45°/.test(r.answer), r.answer);
ok("iso right: parallel step", has(r, /(?:DE|ED) ∥ BC|BC ∥ (?:DE|ED)/), r.rows);
ok("iso right: legs equal", has(r, /EB = DC|CD = EB/), r.rows);
ok("iso right: trapezoid last", /טרפז שווה שוקיים/.test(r.rows[r.rows.length - 1][0]), r.rows);
// the same with D and E the other way round, and the quadrilateral named in a crossing order
r = run("משולש שווה שוקיים וישר הזווית ABC. הנקודות D ו-E נמצאות על הצלעות AB ו-AC בהתאמה. נתון שהמשולש ADE הוא שווה שוקיים.", "הוכיחו: המרובע BCED הוא טרפז שווה שוקיים");
ok("swapped points", r.ok && r.goals[0].ok, r);
// angle bisector and the implied triangle ABD
r = run("משולש ABC, זווית B = 50, זווית C = 70. D על BC, AD חוצה זווית A.", "חשבו את זווית ADB");
ok("bisector", r.ok && /∢ADB = 100°/.test(r.answer), r.answer);
// trapezoid: co-interior angles
r = run("טרפז ABCD (AB ∥ DC), זווית A = 110", "חשבו את זווית D");
ok("trapezoid", r.ok && /= 70°/.test(r.answer), r.answer);
// isosceles triangle: the median is a height and a bisector
r = run("משולש ABC שווה שוקיים (AB = AC), זווית A = 40, D אמצע BC", "חשבו את זווית ADB ואת זווית BAD");
ok("median", r.ok && /∢ADB = 90°/.test(r.answer) && /∢BAD = 20°/.test(r.answer), r.answer);
// English, parallel line cuts off an isosceles triangle
r = run("Triangle ABC is isosceles (AB = AC). D is on AB and E is on AC, and DE is parallel to BC.", "Prove that triangle ADE is isosceles", "en");
ok("english iso", r.ok && r.goals[0].ok && has(r, /corresponding/), r);
// parallelogram angles
r = run("מקבילית ABCD, זווית A = 70", "חשבו את זווית B ואת זווית C");
ok("parallelogram", r.ok && /= 110°/.test(r.answer) && /= 70°/.test(r.answer), r.answer);
// corresponding angles give a triangle angle
r = run("משולש ABC, D על AB, E על AC, DE מקביל ל-BC, זווית ADE = 65, זווית C = 40", "חשבו את זווית BAC");
ok("corresponding", r.ok && /= 75°/.test(r.answer), r.answer);
// prove parallel from equal angles
r = run("משולש ABC, D על AB, E על AC, זווית ADE = זווית ABC", "הוכיחו: DE מקביל ל-BC");
ok("prove parallel", r.ok && r.goals[0].ok, r);
// not enough givens: say so instead of guessing
r = run("משולש ABC, D על BC", "חשבו את זווית ADB");
ok("not enough", !r.ok, r);
// applies(): only for problems with several shapes or named points
ok("applies yes", P.applies("משולש ABC, D על BC, AD חוצה זווית A", "חשבו את זווית ADB"));
ok("applies no", !P.applies("משולש שווה שוקיים, זווית הראש 40", ""));
ok("applies no 2", !P.applies("טרפז ABCD, AB מקביל ל-DC, זווית A שווה 110", ""));
if (bad) { console.log(bad + " proof checks failed"); process.exit(1); }
console.log("proof: all checks passed");
