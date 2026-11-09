/* Math Snap: the daily challenge. One question a day, the same for everyone (it comes from the date),
   so friends can compare. Math, physics and chemistry in turn. Needs science.js. */
(function (root) {
  "use strict";
  const S = root.Science || (typeof require !== "undefined" ? require("./science.js") : null);
  let LANG = "en";
  const P = (en, he) => (LANG === "he" ? he : en);
  const F = x => S.format(x);

  function rng(seed) {   // small, repeatable random numbers from a string
    let h = 2166136261;
    for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function options(r, correct, wrong, fmt) {
    const f = fmt || F, seen = new Set([f(correct)]), out = [f(correct)];
    for (const w of wrong) { const t = f(w); if (!seen.has(t) && isFinite(w)) { seen.add(t); out.push(t); } if (out.length === 4) break; }
    let k = 2; while (out.length < 4) { const t = f(correct * k + k); if (!seen.has(t)) { seen.add(t); out.push(t); } k++; }
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return { options: out, answer: out.indexOf(f(correct)) };
  }
  const steps = (id, vals, form) => (S.solveTopic(id, vals, LANG, form).steps || []);

  const KINDS = [
    { s: "phys", make(r) {
      const h = pick(r, [5, 20, 45, 80, 125, 180]), t = Math.sqrt(2 * h / 10);
      return { q: P(`A stone falls from ${h} m (g = 10). How many seconds until it hits the ground?`, `אבן נופלת מגובה ${h} מטר (g = 10). כמה שניות עד שהיא פוגעת בקרקע?`),
        ...options(r, t, [t * 2, h / 10, t + 1, Math.sqrt(h)], x => F(x) + " s"), explain: steps("fall", { h, g: 10 }) };
    } },
    { s: "units", make(r) {
      const v = pick(r, [36, 54, 72, 90, 108, 126]), c = v / 3.6;
      return { q: P(`${v} km/h is how many m/s?`, `${v} קמ״ש זה כמה מטר לשנייה?`),
        ...options(r, c, [v * 3.6, v / 3, c + 5, v / 60], x => F(x) + " m/s"), explain: S.convert("speed", "km/h", "m/s", v, LANG).steps };
    } },
    { s: "chem", make(r) {
      const [eq, ask, i] = pick(r, [["H2 + O2 -> H2O", "O₂", 1], ["Fe + O2 -> Fe2O3", "Fe", 0], ["CH4 + O2 -> CO2 + H2O", "O₂", 1], ["Al + HCl -> AlCl3 + H2", "HCl", 1], ["C3H8 + O2 -> CO2 + H2O", "O₂", 1], ["N2 + H2 -> NH3", "H₂", 1], ["Na + Cl2 -> NaCl", "Na", 0]]);
      const b = S.balance(eq, LANG), c = b.coefs[i];
      return { q: P(`Balance ${S.sub(eq.replace("->", "→"))}. What is the coefficient of ${ask}?`, `אזנו את ${S.sub(eq.replace("->", "→"))}. מה המקדם של ${ask}?`),
        ...options(r, c, [c + 1, c - 1, c * 2, c + 2], x => String(x)), explain: b.steps.concat([[b.answer, P("The balanced reaction", "התגובה המאוזנת")]]) };
    } },
    { s: "math", make(r) {
      const a = pick(r, [2, 3, 4, 5, 6]), x = pick(r, [-4, -3, -2, 2, 3, 4, 5, 7]), b = pick(r, [1, 3, 5, 7, 9, -2, -5]), c = a * x + b;
      const bs = b < 0 ? `− ${-b}` : `+ ${b}`;
      return { q: P(`Solve: ${a}x ${bs} = ${c}`, `פתרו: ${a}x ${bs} = ${c}`), ...options(r, x, [-x, x + 1, (c + b) / a, c / a], v => "x = " + F(v)),
        explain: [[`${a}x = ${c} ${b < 0 ? "+ " + (-b) : "− " + b} = ${c - b}`, P("Move the number to the other side", "מעבירים את המספר לצד השני")], [`x = ${c - b} / ${a} = ${x}`, P("Divide by the coefficient of x", "מחלקים במקדם של x")]] };
    } },
    { s: "phys", make(r) {
      const V = pick(r, [6, 9, 12, 24, 36]), R = pick(r, [2, 3, 4, 6]), I = V / R;
      return { q: P(`A ${V} V battery is connected to a ${R} Ω resistor. What is the current?`, `סוללה של ${V} וולט מחוברת לנגד של ${R} אוהם. מה הזרם?`),
        ...options(r, I, [V * R, R / V, I + 1, I * 2], x => F(x) + " A"), explain: steps("ohm", { V, R }) };
    } },
    { s: "chem", make(r) {
      const f = pick(r, ["H2O", "CO2", "NaCl", "H2SO4", "NH3", "CaCO3", "C6H12O6", "NaOH"]), m = S.molarMass(f, LANG);
      return { q: P(`What is the molar mass of ${S.sub(f)}?`, `מה המסה המולרית של ${S.sub(f)}?`),
        ...options(r, m.value, [m.value + 16, m.value - 12, m.value * 2, m.value + 1], x => F(x) + " g/mol"), explain: m.steps };
    } },
    { s: "math", make(r) {
      const p = pick(r, [10, 15, 20, 25, 30, 40, 75]), n = pick(r, [40, 60, 80, 120, 200, 240]), c = p * n / 100;
      return { q: P(`What is ${p}% of ${n}?`, `כמה זה ${p}% מ-${n}?`), ...options(r, c, [c * 2, n / p, c + 10, p + n / 10], x => F(x)),
        explain: [[`${p}% = ${p}/100 = ${F(p / 100)}`, P("A percent is a part of 100", "אחוז הוא חלק ממאה")], [`${F(p / 100)} × ${n} = ${F(c)}`, P("Multiply by the number", "כופלים במספר")]] };
    } },
    { s: "phys", make(r) {
      const m = pick(r, [2, 4, 5, 10, 50]), a = pick(r, [2, 3, 4, 5]), Fz = m * a;
      return { q: P(`A ${m} kg cart speeds up at ${a} m/s². What is the net force?`, `עגלה של ${m} ק״ג מאיצה ב-${a} מ׳/ש². מה הכוח השקול?`),
        ...options(r, Fz, [m + a, m / a, Fz * 10, Fz + a], x => F(x) + " N"), explain: steps("newton", { m, a }) };
    } },
    { s: "math", make(r) {
      const n = pick(r, [2, 3, 4]), x0 = pick(r, [1, 2, 3, -1, -2]), c = n * Math.pow(x0, n - 1);
      return { q: P(`f(x) = x${"⁰¹²³⁴"[n]}. What is f'(${x0})?`, `f(x) = x${"⁰¹²³⁴"[n]}. כמה זה f'(${x0})?`),
        ...options(r, c, [Math.pow(x0, n), c * x0, n * x0, c + n], x => F(x)),
        explain: [[`f'(x) = ${n}x${n - 1 > 1 ? "⁰¹²³⁴"[n - 1] : ""}`, P("Power rule: bring the power down and take 1 off it", "כלל החזקה: מורידים את החזקה ומפחיתים ממנה 1")], [`f'(${x0}) = ${n} · ${x0 < 0 ? "(" + x0 + ")" : x0}${n - 1 > 1 ? "⁰¹²³⁴"[n - 1] : ""} = ${F(c)}`, P("Put the number in", "מציבים את המספר")]] };
    } },
    { s: "chem", make(r) {
      const k = pick(r, [1, 2, 3, 4, 5]), H = Math.pow(10, -k);
      return { q: P(`[H⁺] = ${F(H)} M. What is the pH?`, `[H⁺] = ${F(H)} M. מה ה-pH?`), ...options(r, k, [14 - k, -k, k + 1, 10 * k], x => "pH = " + F(x)), explain: steps("ph", { H }) };
    } },
  ];
  const SUBJ = { math: ["Math", "מתמטיקה"], phys: ["Physics", "פיזיקה"], chem: ["Chemistry", "כימיה"], units: ["Units", "המרת יחידות"] };

  // dateStr like "2026-11-09"
  function challenge(dateStr, lang) {
    LANG = lang === "he" ? "he" : "en";
    const day = Math.floor(Date.parse(dateStr + "T00:00:00Z") / 864e5);
    const kind = KINDS[((day % KINDS.length) + KINDS.length) % KINDS.length];
    const c = kind.make(rng("mathsnap-" + dateStr));
    return Object.assign({ date: dateStr, subject: P(...SUBJ[kind.s]), kind: kind.s }, c);
  }
  // streak: stored as {last: "YYYY-MM-DD", streak: n, best: n, done: {date: true/false}}
  function record(state, dateStr, correct) {
    const s = Object.assign({ last: null, streak: 0, best: 0, done: {} }, state || {});
    if (s.done[dateStr] !== undefined) return s;
    const prev = new Date(Date.parse(dateStr + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
    s.done[dateStr] = !!correct;
    s.streak = correct ? (s.last === prev ? s.streak + 1 : 1) : 0;
    if (correct) s.last = dateStr;
    s.best = Math.max(s.best, s.streak);
    const keys = Object.keys(s.done).sort(); while (keys.length > 60) delete s.done[keys.shift()];
    return s;
  }
  function liveStreak(state, todayStr) {   // a streak that skipped yesterday is gone
    if (!state || !state.last) return 0;
    const prev = new Date(Date.parse(todayStr + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
    return state.last === todayStr || state.last === prev ? state.streak : 0;
  }
  const api = { challenge, record, liveStreak, count: KINDS.length };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Daily = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
