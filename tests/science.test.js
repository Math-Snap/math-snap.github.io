// Checks the physics, chemistry and unit answers. Runs in the GitHub build.
const path = require("path");
const S = require(path.join(__dirname, "../app/src/main/assets/science.js"));
const strip = s => String(s).replace(/[⁦-⁩]/g, "");
let bad = 0;
const ok = (name, cond, got) => { if (!cond) { bad++; console.log("FAIL", name, "→", got); } };
const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
const val = (r, k) => { const f = (r.found || []).find(x => x.key === k); return f ? f.value : NaN; };

for (const lang of ["en", "he"]) {
  let r = S.solveTopic("speed", { d: 120, t: 8 }, lang); ok("speed", near(val(r, "v"), 15), r);
  r = S.solveTopic("accel", { v0: 0, a: 2, t: 5 }, lang); ok("accel v", near(val(r, "v"), 10), r); ok("accel x", near(val(r, "x"), 25), r);
  r = S.solveTopic("accel", { v0: 5, a: 2, x: 24 }, lang); ok("accel t quad", near(val(r, "t"), 3), r); ok("accel v2", near(val(r, "v"), 11), r);
  r = S.solveTopic("accel", { v0: 20, v: 0, t: 4 }, lang); ok("braking a", near(val(r, "a"), -5), r); ok("braking x", near(val(r, "x"), 40), r);
  r = S.solveTopic("fall", { h: 45 }, lang); ok("fall t", near(val(r, "t"), 3), r); ok("fall v", near(val(r, "v"), 30), r);
  r = S.solveTopic("newton", { m: 4, a: 3 }, lang); ok("newton", near(val(r, "F"), 12), r);
  r = S.solveTopic("weight", { m: 5, mu: 0.3 }, lang); ok("weight", near(val(r, "W"), 50), r); ok("friction", near(val(r, "f"), 15), r);
  r = S.solveTopic("energy", { m: 2, v: 6, h: 3 }, lang); ok("Ek", near(val(r, "Ek"), 36), r); ok("Ep", near(val(r, "Ep"), 60), r); ok("E", near(val(r, "E"), 96), r);
  r = S.solveTopic("work", { F: 50, d: 10, t: 4 }, lang); ok("work", near(val(r, "W"), 500), r); ok("power", near(val(r, "P"), 125), r);
  r = S.solveTopic("ohm", { V: 12, R: 4 }, lang); ok("ohm I", near(val(r, "I"), 3), r); ok("ohm P", near(val(r, "P"), 36), r);
  r = S.solveTopic("resist", { R1: 6, R2: 3 }, lang); ok("series", near(val(r, "Rs"), 9), r); ok("parallel", near(val(r, "Rp"), 2), r);
  r = S.solveTopic("density", { m: 270, V: 0.1 }, lang); ok("density", near(val(r, "rho"), 2700), r);
  r = S.solveTopic("waves", { f: 50, lam: 4 }, lang); ok("waves", near(val(r, "v"), 200), r); ok("period", near(val(r, "T"), 0.02), r);
  r = S.solveTopic("mole", { m: 36 }, lang, "H2O"); ok("mole", near(val(r, "n"), 2), r); ok("particles", near(val(r, "N"), 2 * 6.022e23), r);
  r = S.solveTopic("conc", { m: 11.7, V: 0.5 }, lang, "NaCl"); ok("conc", near(val(r, "C"), 0.4), r);
  r = S.solveTopic("ph", { H: 0.001 }, lang); ok("pH", near(val(r, "pH"), 3), r); ok("pOH", near(val(r, "pOH"), 11), r);
  r = S.solveTopic("gas", { n: 1, T: 273, p: 101.3 }, lang); ok("gas V", Math.abs(val(r, "V") - 22.4) < 0.05, r);
  r = S.solveTopic("speed", {}, lang); ok("empty error", !!r.error, r);
  r = S.solveTopic("speed", { d: 5 }, lang); ok("stuck error", !!r.error, r);
  r = S.solveTopic("fall", { h: -5 }, lang); ok("sqrt negative error", !!r.error, r);
  r = S.solveTopic("speed", { d: 10, t: 0 }, lang); ok("div zero error", !!r.error, r);

  ok("M water", S.molarMass("H2O", lang).value === 18, S.molarMass("H2O", lang));
  ok("M H2SO4", S.molarMass("H2SO4", lang).value === 98.1, S.molarMass("H2SO4", lang));
  ok("M Ca(OH)2", S.molarMass("Ca(OH)2", lang).value === 74.1, S.molarMass("Ca(OH)2", lang));
  ok("M glucose", S.molarMass("C6H12O6", lang).value === 180, S.molarMass("C6H12O6", lang));
  ok("M hydrate", S.molarMass("CuSO4·5H2O", lang).value === 249.6, S.molarMass("CuSO4·5H2O", lang));
  ok("M bad", !!S.molarMass("Xx2", lang).error, S.molarMass("Xx2", lang));

  const bal = (e, want) => { const b = S.balance(e, lang); ok("balance " + e, b.coefs && b.coefs.join(",") === want, b); };
  bal("H2 + O2 -> H2O", "2,1,2");
  bal("CH4 + O2 -> CO2 + H2O", "1,2,1,2");
  bal("Fe + O2 → Fe2O3", "4,3,2");
  bal("C3H8 + O2 = CO2 + H2O", "1,5,3,4");
  bal("Al + HCl -> AlCl3 + H2", "2,6,2,3");
  bal("Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O", "3,2,1,6");
  bal("KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2", "2,16,2,2,8,5");
  ok("balance error", !!S.balance("H2 + O2", lang).error, S.balance("H2 + O2", lang));
  ok("balance one side", !!S.balance("H2 -> O2", lang).error, S.balance("H2 -> O2", lang));

  let c = S.convert("length", "km", "m", 5, lang); ok("km→m", near(c.value, 5000), c);
  c = S.convert("speed", "km/h", "m/s", 72, lang); ok("kmh→ms", near(c.value, 20), c);
  c = S.convert("temp", "°C", "°F", 100, lang); ok("C→F", near(c.value, 212), c);
  c = S.convert("temp", "°F", "K", 32, lang); ok("F→K", near(c.value, 273.15), c);
  c = S.convert("area", "dunam", "m²", 3, lang); ok("dunam", near(c.value, 3000), c);
}
// every step is [claim, reason] text
for (const t of S.TOPICS) { const vals = Object.assign({}, t.ex); const r = S.solveTopic(t.id, vals, "he", t.formula); ok("example " + t.id, !r.error && r.steps.every(s => s.length === 2 && strip(s[0]) && s[1]), r); }
console.log(S.format(6.022e23 * 2), S.format(0.0004), S.format(-2.5), strip(S.balance("Al + HCl -> AlCl3 + H2", "en").answer));
if (bad) { console.log(bad + " science checks failed"); process.exit(1); }
console.log("science: all checks passed");
