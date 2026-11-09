// Daily challenge: every day gives a sound question, in both languages, and the streak counts right.
const path = require("path");
globalThis.Science = require(path.join(__dirname, "../app/src/main/assets/science.js"));
const D = require(path.join(__dirname, "../app/src/main/assets/daily.js"));
let bad = 0;
const ok = (n, c, g) => { if (!c) { bad++; console.log("FAIL", n, g); } };
const day0 = Date.parse("2026-11-01T00:00:00Z");
for (let i = 0; i < 400; i++) {
  const d = new Date(day0 + i * 864e5).toISOString().slice(0, 10);
  for (const lang of ["en", "he"]) {
    const c = D.challenge(d, lang);
    ok(d + " options", c.options.length === 4 && new Set(c.options).size === 4, c);
    ok(d + " answer", c.answer >= 0 && c.answer < 4, c);
    ok(d + " explain", Array.isArray(c.explain) && c.explain.length > 0 && c.explain.every(s => s.length === 2 && s[0] && s[1]), c);
    ok(d + " no NaN", !/NaN|undefined|\?$/.test(c.options.join("|")) && !/NaN|undefined/.test(c.q), c);
  }
  ok(d + " same for everyone", JSON.stringify(D.challenge(d, "en")) === JSON.stringify(D.challenge(d, "en")));
}
let s = D.record(null, "2026-11-09", true); ok("first", s.streak === 1 && s.best === 1, s);
s = D.record(s, "2026-11-10", true); ok("two days", s.streak === 2, s);
s = D.record(s, "2026-11-10", false); ok("only once a day", s.streak === 2, s);
s = D.record(s, "2026-11-12", true); ok("gap resets", s.streak === 1 && s.best === 2, s);
s = D.record(s, "2026-11-13", false); ok("wrong resets", s.streak === 0, s);
ok("live streak gone after a skipped day", D.liveStreak({ last: "2026-11-09", streak: 5 }, "2026-11-11") === 0);
ok("live streak kept until the end of the next day", D.liveStreak({ last: "2026-11-09", streak: 5 }, "2026-11-10") === 5);
console.log(D.challenge("2026-11-09", "he").q, D.challenge("2026-11-09", "he").options);
if (bad) { console.log(bad + " daily checks failed"); process.exit(1); }
console.log("daily: all checks passed");
