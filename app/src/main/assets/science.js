/* Math Snap: physics, chemistry and unit conversion, offline.
   Every step is a pair [claim, reason], like the math solver. Works in the browser (global Science)
   and in Node (module.exports) so the build can test it. */
(function (root) {
  "use strict";
  let LANG = "en";
  const P = (en, he) => (LANG === "he" ? he : en);
  const LRI = s => (LANG === "he" ? "⁦" + s + "⁩" : s);

  // ---------- numbers ----------
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  function F(x) {
    if (!isFinite(x)) return "?";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e6 || a < 1e-3) {
      let e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
      m = +m.toPrecision(4); if (Math.abs(m) >= 10) { m /= 10; e += 1; }
      return String(+m.toPrecision(4)).replace("-", "−") + " × 10" + String(e).replace(/./g, c => SUP[c]);
    }
    return String(+x.toPrecision(4)).replace("-", "−");
  }
  const FP = x => (x < 0 ? "(" + F(x) + ")" : F(x)); // in a substitution, negative numbers get brackets
  const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => FP(v[k]));
  const sub = s => String(s).replace(/(\)|[A-Za-z\]])(\d+)/g, (m, a, d) => a + d.replace(/./g, c => "₀₁₂₃₄₅₆₇₈₉"[c]));

  // ---------- physics and chemistry formula topics ----------
  // vars: [key, label en, label he, unit, symbol, default]
  // eqs: { n:[name en, name he], solve: [[target, symbolic, substitution template, fn(v)], ...] }
  const sq = Math.sqrt;
  const TOPICS = [
    { id: "speed", s: "phys", l: ["Constant speed", "מהירות קבועה"],
      vars: [["d", "Distance", "דרך", "m", "d"], ["v", "Speed", "מהירות", "m/s", "v"], ["t", "Time", "זמן", "s", "t"]],
      ex: { d: 120, t: 8 },
      eqs: [{ n: ["d = v·t", "d = v·t"], solve: [
        ["d", "d = v · t", "{v} · {t}", v => v.v * v.t],
        ["v", "v = d / t", "{d} / {t}", v => v.d / v.t],
        ["t", "t = d / v", "{d} / {v}", v => v.d / v.v]] }] },
    { id: "accel", s: "phys", l: ["Acceleration", "תנועה בתאוצה"],
      vars: [["v0", "Start speed", "מהירות התחלתית", "m/s", "v₀"], ["v", "End speed", "מהירות סופית", "m/s", "v"], ["a", "Acceleration", "תאוצה", "m/s²", "a"], ["t", "Time", "זמן", "s", "t"], ["x", "Distance", "העתק", "m", "Δx"]],
      ex: { v0: 0, a: 2, t: 5 },
      eqs: [
        { n: ["v = v₀ + a·t", "v = v₀ + a·t"], solve: [
          ["v", "v = v₀ + a · t", "{v0} + {a} · {t}", v => v.v0 + v.a * v.t],
          ["v0", "v₀ = v − a · t", "{v} − {a} · {t}", v => v.v - v.a * v.t],
          ["a", "a = (v − v₀) / t", "({v} − {v0}) / {t}", v => (v.v - v.v0) / v.t],
          ["t", "t = (v − v₀) / a", "({v} − {v0}) / {a}", v => (v.v - v.v0) / v.a]] },
        { n: ["Δx = (v₀ + v)/2 · t", "Δx = (v₀ + v)/2 · t"], solve: [
          ["x", "Δx = (v₀ + v) / 2 · t", "({v0} + {v}) / 2 · {t}", v => (v.v0 + v.v) / 2 * v.t],
          ["t", "t = 2Δx / (v₀ + v)", "2 · {x} / ({v0} + {v})", v => 2 * v.x / (v.v0 + v.v)],
          ["v", "v = 2Δx / t − v₀", "2 · {x} / {t} − {v0}", v => 2 * v.x / v.t - v.v0],
          ["v0", "v₀ = 2Δx / t − v", "2 · {x} / {t} − {v}", v => 2 * v.x / v.t - v.v]] },
        { n: ["v² = v₀² + 2a·Δx", "v² = v₀² + 2a·Δx"], solve: [
          ["v", "v = √(v₀² + 2a · Δx)", "√({v0}² + 2 · {a} · {x})", v => sq(v.v0 * v.v0 + 2 * v.a * v.x)],
          ["a", "a = (v² − v₀²) / (2Δx)", "({v}² − {v0}²) / (2 · {x})", v => (v.v * v.v - v.v0 * v.v0) / (2 * v.x)],
          ["x", "Δx = (v² − v₀²) / (2a)", "({v}² − {v0}²) / (2 · {a})", v => (v.v * v.v - v.v0 * v.v0) / (2 * v.a)],
          ["v0", "v₀ = √(v² − 2a · Δx)", "√({v}² − 2 · {a} · {x})", v => sq(v.v * v.v - 2 * v.a * v.x)]] },
        { n: ["Δx = v₀·t + ½·a·t²", "Δx = v₀·t + ½·a·t²"], solve: [
          ["x", "Δx = v₀ · t + ½ · a · t²", "{v0} · {t} + 0.5 · {a} · {t}²", v => v.v0 * v.t + 0.5 * v.a * v.t * v.t],
          ["a", "a = 2(Δx − v₀ · t) / t²", "2 · ({x} − {v0} · {t}) / {t}²", v => 2 * (v.x - v.v0 * v.t) / (v.t * v.t)],
          ["v0", "v₀ = (Δx − ½ · a · t²) / t", "({x} − 0.5 · {a} · {t}²) / {t}", v => (v.x - 0.5 * v.a * v.t * v.t) / v.t],
          ["t", "t = (−v₀ + √(v₀² + 2a · Δx)) / a", "(−{v0} + √({v0}² + 2 · {a} · {x})) / {a}", v => v.a === 0 ? v.x / v.v0 : (-v.v0 + sq(v.v0 * v.v0 + 2 * v.a * v.x)) / v.a]] }] },
    { id: "fall", s: "phys", l: ["Free fall", "נפילה חופשית"],
      vars: [["h", "Height", "גובה", "m", "h"], ["t", "Time", "זמן", "s", "t"], ["v", "Speed at the bottom", "מהירות בפגיעה", "m/s", "v"], ["g", "g", "g", "m/s²", "g", 10]],
      ex: { h: 45 },
      eqs: [
        { n: ["h = ½·g·t²", "h = ½·g·t²"], solve: [
          ["h", "h = ½ · g · t²", "0.5 · {g} · {t}²", v => 0.5 * v.g * v.t * v.t],
          ["t", "t = √(2h / g)", "√(2 · {h} / {g})", v => sq(2 * v.h / v.g)]] },
        { n: ["v = g·t", "v = g·t"], solve: [
          ["v", "v = g · t", "{g} · {t}", v => v.g * v.t],
          ["t", "t = v / g", "{v} / {g}", v => v.v / v.g]] },
        { n: ["v² = 2·g·h", "v² = 2·g·h"], solve: [
          ["v", "v = √(2 · g · h)", "√(2 · {g} · {h})", v => sq(2 * v.g * v.h)],
          ["h", "h = v² / (2g)", "{v}² / (2 · {g})", v => v.v * v.v / (2 * v.g)]] }] },
    { id: "newton", s: "phys", l: ["Newton's 2nd law", "החוק השני של ניוטון"],
      vars: [["F", "Net force", "כוח שקול", "N", "ΣF"], ["m", "Mass", "מסה", "kg", "m"], ["a", "Acceleration", "תאוצה", "m/s²", "a"]],
      ex: { m: 4, a: 3 },
      eqs: [{ n: ["ΣF = m·a", "ΣF = m·a"], solve: [
        ["F", "ΣF = m · a", "{m} · {a}", v => v.m * v.a],
        ["m", "m = ΣF / a", "{F} / {a}", v => v.F / v.a],
        ["a", "a = ΣF / m", "{F} / {m}", v => v.F / v.m]] }] },
    { id: "weight", s: "phys", l: ["Weight & friction", "משקל וחיכוך"],
      vars: [["m", "Mass", "מסה", "kg", "m"], ["g", "g", "g", "m/s²", "g", 10], ["W", "Weight", "משקל", "N", "W"], ["mu", "Friction coefficient", "מקדם חיכוך", "", "μ"], ["f", "Friction force", "כוח חיכוך", "N", "f"]],
      ex: { m: 5, mu: 0.3 },
      eqs: [
        { n: ["W = m·g", "W = m·g"], solve: [
          ["W", "W = m · g", "{m} · {g}", v => v.m * v.g],
          ["m", "m = W / g", "{W} / {g}", v => v.W / v.g]] },
        { n: ["f = μ·N (on a flat surface N = W)", "f = μ·N (על משטח אופקי N = W)"], solve: [
          ["f", "f = μ · W", "{mu} · {W}", v => v.mu * v.W],
          ["mu", "μ = f / W", "{f} / {W}", v => v.f / v.W],
          ["W", "W = f / μ", "{f} / {mu}", v => v.f / v.mu]] }] },
    { id: "energy", s: "phys", l: ["Energy", "אנרגיה"],
      vars: [["m", "Mass", "מסה", "kg", "m"], ["v", "Speed", "מהירות", "m/s", "v"], ["h", "Height", "גובה", "m", "h"], ["g", "g", "g", "m/s²", "g", 10], ["Ek", "Kinetic energy", "אנרגיה קינטית", "J", "Eₖ"], ["Ep", "Potential energy", "אנרגיה פוטנציאלית", "J", "Eₚ"], ["E", "Total energy", "אנרגיה מכנית", "J", "E"]],
      ex: { m: 2, v: 6, h: 3 },
      eqs: [
        { n: ["Eₖ = ½·m·v²", "Eₖ = ½·m·v²"], solve: [
          ["Ek", "Eₖ = ½ · m · v²", "0.5 · {m} · {v}²", v => 0.5 * v.m * v.v * v.v],
          ["v", "v = √(2Eₖ / m)", "√(2 · {Ek} / {m})", v => sq(2 * v.Ek / v.m)],
          ["m", "m = 2Eₖ / v²", "2 · {Ek} / {v}²", v => 2 * v.Ek / (v.v * v.v)]] },
        { n: ["Eₚ = m·g·h", "Eₚ = m·g·h"], solve: [
          ["Ep", "Eₚ = m · g · h", "{m} · {g} · {h}", v => v.m * v.g * v.h],
          ["h", "h = Eₚ / (m · g)", "{Ep} / ({m} · {g})", v => v.Ep / (v.m * v.g)],
          ["m", "m = Eₚ / (g · h)", "{Ep} / ({g} · {h})", v => v.Ep / (v.g * v.h)]] },
        { n: ["E = Eₖ + Eₚ", "E = Eₖ + Eₚ"], solve: [
          ["E", "E = Eₖ + Eₚ", "{Ek} + {Ep}", v => v.Ek + v.Ep],
          ["Ek", "Eₖ = E − Eₚ", "{E} − {Ep}", v => v.E - v.Ep],
          ["Ep", "Eₚ = E − Eₖ", "{E} − {Ek}", v => v.E - v.Ek]] }] },
    { id: "work", s: "phys", l: ["Work & power", "עבודה והספק"],
      vars: [["F", "Force", "כוח", "N", "F"], ["d", "Distance", "דרך", "m", "d"], ["W", "Work", "עבודה", "J", "W"], ["t", "Time", "זמן", "s", "t"], ["P", "Power", "הספק", "W", "P"]],
      ex: { F: 50, d: 10, t: 4 },
      eqs: [
        { n: ["W = F·d", "W = F·d"], solve: [
          ["W", "W = F · d", "{F} · {d}", v => v.F * v.d],
          ["F", "F = W / d", "{W} / {d}", v => v.W / v.d],
          ["d", "d = W / F", "{W} / {F}", v => v.W / v.F]] },
        { n: ["P = W / t", "P = W / t"], solve: [
          ["P", "P = W / t", "{W} / {t}", v => v.W / v.t],
          ["W", "W = P · t", "{P} · {t}", v => v.P * v.t],
          ["t", "t = W / P", "{W} / {P}", v => v.W / v.P]] }] },
    { id: "momentum", s: "phys", l: ["Momentum", "תנע"],
      vars: [["m", "Mass", "מסה", "kg", "m"], ["v", "Speed", "מהירות", "m/s", "v"], ["p", "Momentum", "תנע", "kg·m/s", "p"], ["F", "Force", "כוח", "N", "F"], ["t", "Time", "זמן", "s", "Δt"]],
      ex: { m: 3, v: 4 },
      eqs: [
        { n: ["p = m·v", "p = m·v"], solve: [
          ["p", "p = m · v", "{m} · {v}", v => v.m * v.v],
          ["m", "m = p / v", "{p} / {v}", v => v.p / v.v],
          ["v", "v = p / m", "{p} / {m}", v => v.p / v.m]] },
        { n: ["Impulse: F·Δt = Δp", "מתקף: F·Δt = Δp"], solve: [
          ["F", "F = p / Δt", "{p} / {t}", v => v.p / v.t],
          ["t", "Δt = p / F", "{p} / {F}", v => v.p / v.F],
          ["p", "p = F · Δt", "{F} · {t}", v => v.F * v.t]] }] },
    { id: "ohm", s: "phys", l: ["Electricity (Ohm)", "חשמל (חוק אוהם)"],
      vars: [["V", "Voltage", "מתח", "V", "V"], ["I", "Current", "זרם", "A", "I"], ["R", "Resistance", "התנגדות", "Ω", "R"], ["P", "Power", "הספק", "W", "P"]],
      ex: { V: 12, R: 4 },
      eqs: [
        { n: ["Ohm's law V = I·R", "חוק אוהם V = I·R"], solve: [
          ["V", "V = I · R", "{I} · {R}", v => v.I * v.R],
          ["I", "I = V / R", "{V} / {R}", v => v.V / v.R],
          ["R", "R = V / I", "{V} / {I}", v => v.V / v.I]] },
        { n: ["P = V·I", "P = V·I"], solve: [
          ["P", "P = V · I", "{V} · {I}", v => v.V * v.I],
          ["I", "I = P / V", "{P} / {V}", v => v.P / v.V],
          ["V", "V = P / I", "{P} / {I}", v => v.P / v.I]] }] },
    { id: "resist", s: "phys", l: ["Resistors", "נגדים בטור ובמקביל"],
      vars: [["R1", "R₁", "R₁", "Ω", "R₁"], ["R2", "R₂", "R₂", "Ω", "R₂"], ["Rs", "In series", "בטור", "Ω", "R_series"], ["Rp", "In parallel", "במקביל", "Ω", "R_parallel"]],
      ex: { R1: 6, R2: 3 },
      eqs: [
        { n: ["Series: R = R₁ + R₂", "בטור: R = R₁ + R₂"], solve: [
          ["Rs", "R = R₁ + R₂", "{R1} + {R2}", v => v.R1 + v.R2],
          ["R2", "R₂ = R − R₁", "{Rs} − {R1}", v => v.Rs - v.R1]] },
        { n: ["Parallel: 1/R = 1/R₁ + 1/R₂", "במקביל: 1/R = 1/R₁ + 1/R₂"], solve: [
          ["Rp", "R = R₁ · R₂ / (R₁ + R₂)", "{R1} · {R2} / ({R1} + {R2})", v => v.R1 * v.R2 / (v.R1 + v.R2)]] }] },
    { id: "density", s: "phys", l: ["Density & pressure", "צפיפות ולחץ"],
      vars: [["m", "Mass", "מסה", "kg", "m"], ["V", "Volume", "נפח", "m³", "V"], ["rho", "Density", "צפיפות", "kg/m³", "ρ"], ["F", "Force", "כוח", "N", "F"], ["A", "Area", "שטח", "m²", "A"], ["p", "Pressure", "לחץ", "Pa", "p"]],
      ex: { m: 270, V: 0.1 },
      eqs: [
        { n: ["ρ = m / V", "ρ = m / V"], solve: [
          ["rho", "ρ = m / V", "{m} / {V}", v => v.m / v.V],
          ["m", "m = ρ · V", "{rho} · {V}", v => v.rho * v.V],
          ["V", "V = m / ρ", "{m} / {rho}", v => v.m / v.rho]] },
        { n: ["p = F / A", "p = F / A"], solve: [
          ["p", "p = F / A", "{F} / {A}", v => v.F / v.A],
          ["F", "F = p · A", "{p} · {A}", v => v.p * v.A],
          ["A", "A = F / p", "{F} / {p}", v => v.F / v.p]] }] },
    { id: "waves", s: "phys", l: ["Waves", "גלים"],
      vars: [["v", "Wave speed", "מהירות הגל", "m/s", "v"], ["f", "Frequency", "תדירות", "Hz", "f"], ["lam", "Wavelength", "אורך גל", "m", "λ"], ["T", "Period", "זמן מחזור", "s", "T"]],
      ex: { f: 50, lam: 4 },
      eqs: [
        { n: ["v = f·λ", "v = f·λ"], solve: [
          ["v", "v = f · λ", "{f} · {lam}", v => v.f * v.lam],
          ["f", "f = v / λ", "{v} / {lam}", v => v.v / v.lam],
          ["lam", "λ = v / f", "{v} / {f}", v => v.v / v.f]] },
        { n: ["T = 1 / f", "T = 1 / f"], solve: [
          ["T", "T = 1 / f", "1 / {f}", v => 1 / v.f],
          ["f", "f = 1 / T", "1 / {T}", v => 1 / v.T]] }] },

    // chemistry formula topics (molar mass comes from the formula box when there is one)
    { id: "mole", s: "chem", l: ["Moles & mass", "מול ומסה"], formula: "H2O",
      vars: [["M", "Molar mass", "מסה מולרית", "g/mol", "M"], ["m", "Mass", "מסה", "g", "m"], ["n", "Moles", "מספר מולים", "mol", "n"], ["N", "Particles", "מספר חלקיקים", "", "N"]],
      ex: { m: 36 },
      eqs: [
        { n: ["n = m / M", "n = m / M"], solve: [
          ["n", "n = m / M", "{m} / {M}", v => v.m / v.M],
          ["m", "m = n · M", "{n} · {M}", v => v.n * v.M],
          ["M", "M = m / n", "{m} / {n}", v => v.m / v.n]] },
        { n: ["N = n · Nₐ (Avogadro: 6.022 × 10²³)", "N = n · Nₐ (אבוגדרו: 6.022 × 10²³)"], solve: [
          ["N", "N = n · 6.022 × 10²³", "{n} · 6.022 × 10²³", v => v.n * 6.022e23],
          ["n", "n = N / (6.022 × 10²³)", "{N} / (6.022 × 10²³)", v => v.N / 6.022e23]] }] },
    { id: "conc", s: "chem", l: ["Concentration", "ריכוז"], formula: "NaCl",
      vars: [["M", "Molar mass", "מסה מולרית", "g/mol", "M"], ["m", "Mass", "מסה", "g", "m"], ["n", "Moles", "מספר מולים", "mol", "n"], ["V", "Volume", "נפח", "L", "V"], ["C", "Concentration", "ריכוז", "M (mol/L)", "C"]],
      ex: { m: 11.7, V: 0.5 },
      eqs: [
        { n: ["n = m / M", "n = m / M"], solve: [
          ["n", "n = m / M", "{m} / {M}", v => v.m / v.M],
          ["m", "m = n · M", "{n} · {M}", v => v.n * v.M]] },
        { n: ["C = n / V", "C = n / V"], solve: [
          ["C", "C = n / V", "{n} / {V}", v => v.n / v.V],
          ["n", "n = C · V", "{C} · {V}", v => v.C * v.V],
          ["V", "V = n / C", "{n} / {C}", v => v.n / v.C]] }] },
    { id: "ph", s: "chem", l: ["pH", "pH"],
      vars: [["H", "[H⁺]", "[H⁺]", "M", "[H⁺]"], ["pH", "pH", "pH", "", "pH"], ["pOH", "pOH", "pOH", "", "pOH"], ["OH", "[OH⁻]", "[OH⁻]", "M", "[OH⁻]"]],
      ex: { H: 0.001 },
      eqs: [
        { n: ["pH = −log[H⁺]", "pH = −log[H⁺]"], solve: [
          ["pH", "pH = −log[H⁺]", "−log({H})", v => -Math.log10(v.H)],
          ["H", "[H⁺] = 10^(−pH)", "10^(−{pH})", v => Math.pow(10, -v.pH)]] },
        { n: ["pH + pOH = 14 (at 25°C)", "pH + pOH = 14 (ב-25°C)"], solve: [
          ["pOH", "pOH = 14 − pH", "14 − {pH}", v => 14 - v.pH],
          ["pH", "pH = 14 − pOH", "14 − {pOH}", v => 14 - v.pOH]] },
        { n: ["pOH = −log[OH⁻]", "pOH = −log[OH⁻]"], solve: [
          ["OH", "[OH⁻] = 10^(−pOH)", "10^(−{pOH})", v => Math.pow(10, -v.pOH)],
          ["pOH", "pOH = −log[OH⁻]", "−log({OH})", v => -Math.log10(v.OH)]] }] },
    { id: "gas", s: "chem", l: ["Ideal gas", "גז אידיאלי"],
      vars: [["p", "Pressure", "לחץ", "kPa", "P"], ["V", "Volume", "נפח", "L", "V"], ["n", "Moles", "מספר מולים", "mol", "n"], ["T", "Temperature", "טמפרטורה", "K", "T"]],
      ex: { n: 1, T: 273, p: 101.3 },
      eqs: [{ n: ["PV = nRT (R = 8.314)", "PV = nRT (R = 8.314)"], solve: [
        ["V", "V = nRT / P", "{n} · 8.314 · {T} / {p}", v => v.n * 8.314 * v.T / v.p],
        ["p", "P = nRT / V", "{n} · 8.314 · {T} / {V}", v => v.n * 8.314 * v.T / v.V],
        ["n", "n = PV / (RT)", "{p} · {V} / (8.314 · {T})", v => v.p * v.V / (8.314 * v.T)],
        ["T", "T = PV / (nR)", "{p} · {V} / ({n} · 8.314)", v => v.p * v.V / (v.n * 8.314)]] }] },
  ];

  const ERR = {
    none: () => P("Fill in at least one value and leave the ones you want empty.", "מלאו לפחות ערך אחד והשאירו ריקים את מה שרוצים למצוא."),
    stuck: names => P("I can't find " + names + " from these values. Add one more value.", "אי אפשר למצוא את " + names + " מהערכים האלה. הוסיפו עוד ערך."),
    bad: name => P(name + " doesn't come out as a real number with these values. Check the numbers.", name + " לא יוצא מספר אמיתי עם הערכים האלה. בדקו את המספרים."),
    num: name => P(name + " needs to be a number.", name + " צריך להיות מספר."),
    nothing: () => P("Everything is already filled in. Clear the value you want to find.", "הכול כבר מלא. מחקו את הערך שרוצים למצוא."),
  };
  const label = (vr) => P(vr[1], vr[2]);

  // Solve a formula topic. vals: {key: number or null}. Returns {answer, found:[{key,label,value,unit}], steps, error}
  function solveTopic(id, vals, lang, formula) {
    LANG = lang === "he" ? "he" : "en";
    const tp = TOPICS.find(t => t.id === id);
    if (!tp) return { error: "?" };
    const v = {}, steps = [], given = [];
    for (const vr of tp.vars) {
      const raw = vals[vr[0]];
      if ((raw === null || raw === undefined || raw === "") && vr[5] !== undefined) { v[vr[0]] = vr[5]; continue; }   // g = 10 unless changed
      if (raw === null || raw === undefined || raw === "") { v[vr[0]] = null; continue; }
      const x = typeof raw === "number" ? raw : parseFloat(String(raw).replace("−", "-").replace(",", "."));
      if (!isFinite(x)) return { error: ERR.num(label(vr)) };
      v[vr[0]] = x; given.push(vr);
    }
    // molar mass from the chemical formula
    if (tp.formula !== undefined && formula && String(formula).trim() && v.M === null) {
      const mm = molarMass(formula, LANG);
      if (mm.error) return { error: mm.error };
      mm.steps.forEach(s => steps.push(s));
      v.M = mm.value;
    }
    if (!given.length && v.M === null) return { error: ERR.none() };
    if (given.length) steps.unshift([given.map(vr => vr[4] + " = " + LRI(F(v[vr[0]]) + (vr[3] ? " " + vr[3] : ""))).join(",   "), P("The values we know", "הנתונים")]);
    const unknown = () => tp.vars.filter(vr => v[vr[0]] === null);
    if (!unknown().length) return { error: ERR.nothing() };
    const found = [];
    let progress = true;
    while (progress) {
      progress = false;
      for (const eq of tp.eqs) {
        for (const [tg, sym, tpl, fn] of eq.solve) {
          if (v[tg] !== null) continue;
          const need = (tpl.match(/\{(\w+)\}/g) || []).map(s => s.slice(1, -1));
          if (need.some(k => v[k] === null)) continue;
          const vr = tp.vars.find(x => x[0] === tg);
          const x = fn(v);
          if (!isFinite(x) || isNaN(x)) return { error: ERR.bad(label(vr)) };
          v[tg] = x; progress = true;
          const unit = vr[3] ? " " + vr[3] : "";
          steps.push([sym + " = " + LRI(fill(tpl, v)) + " = " + LRI(F(x) + unit), P("From " + eq.n[0] + ", isolate " + vr[4], "מתוך " + eq.n[1] + " מבודדים את " + vr[4])]);
          found.push({ key: tg, label: label(vr), sym: vr[4], value: x, unit: vr[3] });
        }
      }
    }
    const left = unknown();
    if (!found.length) return { error: ERR.stuck(left.map(vr => vr[4]).join(", ")), steps };
    return {
      answer: found.map(f => f.sym + " = " + F(f.value) + (f.unit ? " " + f.unit : "")).join("   ;   "),
      found, steps, missing: left.map(vr => vr[4]), vals: Object.assign({}, v),
    };
  }

  // ---------- chemistry: formulas, molar mass, balancing ----------
  // standard atomic masses (one decimal, like the periodic table used in school)
  const AM = { H: 1.0, He: 4.0, Li: 6.9, Be: 9.0, B: 10.8, C: 12.0, N: 14.0, O: 16.0, F: 19.0, Ne: 20.2, Na: 23.0, Mg: 24.3, Al: 27.0, Si: 28.1, P: 31.0, S: 32.1, Cl: 35.5, Ar: 39.9,
    K: 39.1, Ca: 40.1, Sc: 45.0, Ti: 47.9, V: 50.9, Cr: 52.0, Mn: 54.9, Fe: 55.8, Co: 58.9, Ni: 58.7, Cu: 63.5, Zn: 65.4, Ga: 69.7, Ge: 72.6, As: 74.9, Se: 79.0, Br: 79.9, Kr: 83.8,
    Rb: 85.5, Sr: 87.6, Y: 88.9, Zr: 91.2, Nb: 92.9, Mo: 96.0, Tc: 98, Ru: 101.1, Rh: 102.9, Pd: 106.4, Ag: 107.9, Cd: 112.4, In: 114.8, Sn: 118.7, Sb: 121.8, Te: 127.6, I: 126.9, Xe: 131.3,
    Cs: 132.9, Ba: 137.3, La: 138.9, Ce: 140.1, Pr: 140.9, Nd: 144.2, Sm: 150.4, Eu: 152.0, Gd: 157.3, Hf: 178.5, Ta: 180.9, W: 183.8, Re: 186.2, Os: 190.2, Ir: 192.2, Pt: 195.1, Au: 197.0,
    Hg: 200.6, Tl: 204.4, Pb: 207.2, Bi: 209.0, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226, Ac: 227, Th: 232.0, Pa: 231.0, U: 238.0, Np: 237, Pu: 244 };
  const HE_EL = { H: "מימן", C: "פחמן", N: "חנקן", O: "חמצן", Na: "נתרן", Cl: "כלור", S: "גופרית", Ca: "סידן", K: "אשלגן", Mg: "מגנזיום", Fe: "ברזל", Cu: "נחושת", Al: "אלומיניום", P: "זרחן", Zn: "אבץ", Ag: "כסף", Au: "זהב", I: "יוד", Br: "ברום", F: "פלואור", Si: "צורן", Pb: "עופרת", He: "הליום", Li: "ליתיום" };

  function parseFormula(str) {
    let s = String(str).replace(/\s+/g, "").replace(/\((s|l|g|aq)\)$/i, "").replace(/[·•∙*]/g, ".");
    s = s.replace(/[₀-₉]/g, c => String("₀₁₂₃₄₅₆₇₈₉".indexOf(c)));
    if (!s) throw new Error("empty");
    const parts = s.split(".");
    const total = {}, order = [];
    const add = (map, el, n) => { if (!(el in map)) { map[el] = 0; } map[el] += n; };
    for (let p of parts) {
      let mult = 1; const m = p.match(/^(\d+)(.*)$/); if (m) { mult = +m[1]; p = m[2]; }
      let i = 0;
      const group = () => {
        const map = {};
        while (i < p.length) {
          const c = p[i];
          if (c === "(" || c === "[") { i++; const inner = group(); if (p[i] !== ")" && p[i] !== "]") throw new Error("paren"); i++; let num = ""; while (/\d/.test(p[i] || "")) num += p[i++]; const k = num ? +num : 1; for (const e in inner) add(map, e, inner[e] * k); }
          else if (c === ")" || c === "]") break;
          else if (/[A-Z]/.test(c)) { let el = c; i++; if (/[a-z]/.test(p[i] || "")) el += p[i++]; if (!(el in AM)) throw new Error("el:" + el); let num = ""; while (/\d/.test(p[i] || "")) num += p[i++]; add(map, el, num ? +num : 1); if (!order.includes(el)) order.push(el); }
          else throw new Error("char:" + c);
        }
        return map;
      };
      const g = group();
      if (i < p.length) throw new Error("paren");
      for (const e in g) add(total, e, g[e] * mult);
    }
    if (!order.length) throw new Error("empty");
    return { counts: total, order };
  }
  const formulaErr = (e, f) => {
    const m = String(e.message || e);
    if (m.startsWith("el:")) return P("\"" + m.slice(3) + "\" is not an element. Write elements like H, O, Na, Cl (capital letter first).", "\"" + m.slice(3) + "\" הוא לא יסוד. כותבים יסודות כמו H, O, Na, Cl (אות גדולה בהתחלה).");
    return P("I couldn't read the formula \"" + f + "\". Try for example H2SO4 or Ca(OH)2.", "לא הצלחתי לקרוא את הנוסחה \"" + f + "\". נסו למשל H2SO4 או Ca(OH)2.");
  };

  function molarMass(formula, lang) {
    if (lang) LANG = lang === "he" ? "he" : "en";
    let f;
    try { f = parseFormula(formula); } catch (e) { return { error: formulaErr(e, formula) }; }
    const steps = [], parts = [];
    let M = 0;
    for (const el of f.order) {
      const n = f.counts[el], m = AM[el] * n; M += m;
      parts.push(F(+m.toFixed(2)));
      const name = LANG === "he" && HE_EL[el] ? HE_EL[el] + " (" + el + ")" : el;
      steps.push([el + ":  " + LRI(n + " × " + AM[el].toFixed(1) + " = " + (+m.toFixed(2))), P("Atomic mass of " + name + " is " + AM[el].toFixed(1) + ", times " + n + " atom" + (n > 1 ? "s" : ""), "המסה האטומית של " + name + " היא " + AM[el].toFixed(1) + ", כפול " + n + " אטומים")]);
    }
    M = +M.toFixed(2);
    steps.push(["M(" + sub(formula.replace(/\s+/g, "")) + ") = " + LRI(parts.join(" + ") + " = " + M + " g/mol"), P("Add the masses of all the atoms", "מחברים את המסות של כל האטומים")]);
    return { value: M, steps, answer: "M = " + M + " g/mol", counts: f.counts, order: f.order };
  }

  // rational numbers for exact balancing
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
  const rsub = (a, b) => R(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const rmul = (a, b) => R(a[0] * b[0], a[1] * b[1]);
  const rdiv = (a, b) => R(a[0] * b[1], a[1] * b[0]);

  function nullspace(A) {
    const rows = A.length, cols = A[0].length;
    const M = A.map(r => r.map(x => R(x)));
    const piv = []; let r = 0;
    for (let c = 0; c < cols && r < rows; c++) {
      let p = r; while (p < rows && M[p][c][0] === 0) p++;
      if (p === rows) continue;
      [M[r], M[p]] = [M[p], M[r]];
      const pv = M[r][c]; M[r] = M[r].map(x => rdiv(x, pv));
      for (let i = 0; i < rows; i++) if (i !== r && M[i][c][0] !== 0) { const f = M[i][c]; M[i] = M[i].map((x, j) => rsub(x, rmul(f, M[r][j]))); }
      piv.push(c); r++;
    }
    const free = []; for (let c = 0; c < cols; c++) if (!piv.includes(c)) free.push(c);
    return { free, vec: fc => { const x = new Array(cols).fill(null).map(() => R(0)); x[fc] = R(1); piv.forEach((c, i) => { x[c] = R(-M[i][fc][0], M[i][fc][1]); }); return x; } };
  }

  const LET = "abcdefghjk";
  function balance(eqStr, lang) {
    LANG = lang === "he" ? "he" : "en";
    const s = String(eqStr).replace(/⟶|→|=>|->|=|⇌|<->/g, "→");
    const sides = s.split("→");
    const bad = P("Write the reaction with an arrow, for example: H2 + O2 -> H2O", "כתבו את התגובה עם חץ, למשל: H2 + O2 -> H2O");
    if (sides.length !== 2) return { error: bad };
    const split = side => side.split(/\s\+\s|\+(?=\s*[A-Z(\[\d])/).map(x => x.trim()).filter(Boolean).map(x => x.replace(/^\d+\s*/, "").replace(/\((s|l|g|aq)\)$/i, "").trim());
    const L = split(sides[0]), Rt = split(sides[1]);
    if (!L.length || !Rt.length) return { error: bad };
    const sp = [...L, ...Rt];
    if (sp.length > LET.length) return { error: P("That reaction is too long for me.", "התגובה ארוכה מדי בשבילי.") };
    let parsed;
    try { parsed = sp.map(parseFormula); } catch (e) { return { error: formulaErr(e, sp.find(x => { try { parseFormula(x); return false; } catch (_) { return true; } }) || eqStr) }; }
    const els = []; parsed.forEach(p => p.order.forEach(e => { if (!els.includes(e)) els.push(e); }));
    // every element must be on both sides
    for (const e of els) {
      const inL = parsed.slice(0, L.length).some(p => p.counts[e]), inR = parsed.slice(L.length).some(p => p.counts[e]);
      if (!inL || !inR) return { error: P(e + " is only on one side, so this reaction can't be balanced. Check the formulas.", e + " נמצא רק בצד אחד, אז אי אפשר לאזן. בדקו את הנוסחאות.") };
    }
    const A = els.map(e => sp.map((_, j) => (parsed[j].counts[e] || 0) * (j < L.length ? 1 : -1)));
    const ns = nullspace(A);
    if (ns.free.length !== 1) return { error: P("I couldn't find one clear way to balance this. Check the formulas.", "לא מצאתי דרך אחת ברורה לאזן את התגובה. בדקו את הנוסחאות.") };
    const vec = ns.vec(ns.free[0]);
    const lcmD = vec.reduce((acc, x) => acc * x[1] / gcd(acc, x[1]), 1);
    let ints = vec.map(x => x[0] * lcmD / x[1]);
    if (ints.some(x => x <= 0)) { ints = ints.map(x => -x); }
    if (ints.some(x => x <= 0)) return { error: P("I couldn't balance this reaction. Check the formulas.", "לא הצלחתי לאזן את התגובה. בדקו את הנוסחאות.") };
    const g = ints.reduce((a, b) => gcd(a, b)); ints = ints.map(x => x / g);

    const nice = sp.map(x => sub(x));
    const side = (from, to) => nice.slice(from, to).map((x, k) => (ints[from + k] > 1 ? ints[from + k] : "") + x).join(" + ");
    const result = side(0, L.length) + " → " + side(L.length, sp.length);
    const steps = [];
    steps.push([nice.slice(0, L.length).map((x, k) => LET[k] + "·" + x).join(" + ") + " → " + nice.slice(L.length).map((x, k) => LET[L.length + k] + "·" + x).join(" + "),
      P("Give every substance an unknown coefficient", "נותנים לכל חומר מקדם לא ידוע")]);
    const term = (j, e) => { const c = parsed[j].counts[e]; return c ? (c > 1 ? c : "") + LET[j] : null; };
    for (const e of els) {
      const l = sp.map((_, j) => j < L.length ? term(j, e) : null).filter(Boolean).join(" + ");
      const r = sp.map((_, j) => j >= L.length ? term(j, e) : null).filter(Boolean).join(" + ");
      steps.push([e + ":   " + LRI(l + " = " + r), P("Count the " + e + " atoms on each side, they must be equal", "סופרים את אטומי ה-" + e + " בכל צד, הם חייבים להיות שווים")]);
    }
    steps.push([LRI(sp.map((_, j) => LET[j] + " = " + ints[j]).join(",  ")), P("Solve the equations and take the smallest whole numbers", "פותרים את המשוואות ולוקחים את המספרים השלמים הקטנים ביותר")]);
    for (const e of els) {
      const l = sp.reduce((acc, _, j) => acc + (j < L.length ? (parsed[j].counts[e] || 0) * ints[j] : 0), 0);
      const r = sp.reduce((acc, _, j) => acc + (j >= L.length ? (parsed[j].counts[e] || 0) * ints[j] : 0), 0);
      steps.push([e + ":   " + LRI(l + " = " + r + " ✓"), P("Check: the same number of " + e + " atoms on both sides", "בדיקה: אותו מספר אטומי " + e + " בשני הצדדים")]);
    }
    return { answer: result, coefs: ints, steps };
  }

  // ---------- unit conversion ----------
  // factor = how many base units in one unit
  const UNITS = {
    length: { l: ["Length", "אורך"], base: "m", u: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.344 } },
    mass: { l: ["Mass", "מסה"], base: "kg", u: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, lb: 0.45359237, oz: 0.028349523 } },
    time: { l: ["Time", "זמן"], base: "s", u: { ms: 0.001, s: 1, min: 60, h: 3600, day: 86400 } },
    speed: { l: ["Speed", "מהירות"], base: "m/s", u: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704 } },
    area: { l: ["Area", "שטח"], base: "m²", u: { "cm²": 1e-4, "m²": 1, "km²": 1e6, dunam: 1000, hectare: 10000 } },
    volume: { l: ["Volume", "נפח"], base: "L", u: { mL: 0.001, L: 1, "cm³": 0.001, "m³": 1000 } },
    temp: { l: ["Temperature", "טמפרטורה"], base: "", u: { "°C": 0, "°F": 0, K: 0 } },
  };
  const UNIT_HE = { day: "יום", dunam: "דונם", hectare: "הקטר", t: "טון", min: "דקה", h: "שעה", mi: "מייל", in: "אינץ׳", ft: "רגל", lb: "פאונד", oz: "אונקיה" };
  const uName = u => (LANG === "he" && UNIT_HE[u] ? UNIT_HE[u] : u);
  function convert(cat, from, to, value, lang) {
    LANG = lang === "he" ? "he" : "en";
    const C = UNITS[cat]; if (!C || !(from in C.u) || !(to in C.u)) return { error: "?" };
    const x = typeof value === "number" ? value : parseFloat(String(value).replace("−", "-").replace(",", "."));
    if (!isFinite(x)) return { error: ERR.num(P("The value", "הערך")) };
    const steps = [];
    let y;
    if (cat === "temp") {
      const toC = { "°C": c => c, "°F": f => (f - 32) * 5 / 9, K: k => k - 273.15 };
      const fromC = { "°C": c => c, "°F": c => c * 9 / 5 + 32, K: c => c + 273.15 };
      const fx = { "°C": "", "°F": "°C = (°F − 32) × 5/9", K: "°C = K − 273.15" };
      const tx = { "°C": "", "°F": "°F = °C × 9/5 + 32", K: "K = °C + 273.15" };
      const c = toC[from](x);
      if (from !== "°C") steps.push([LRI(F(x) + " " + from + " → " + F(c) + " °C"), P("First to Celsius: " + fx[from], "קודם לצלזיוס: " + fx[from])]);
      y = fromC[to](c);
      if (to !== "°C") steps.push([LRI(F(c) + " °C → " + F(y) + " " + to), P("Then: " + tx[to], "ואז: " + tx[to])]);
      if (from === to) steps.push([LRI(F(x) + " " + from), P("Same unit, nothing to change", "אותה יחידה, אין מה לשנות")]);
    } else {
      const k = C.u[from] / C.u[to];
      steps.push([LRI("1 " + uName(from) + " = " + F(k) + " " + uName(to)), P("How many " + to + " are in one " + from, "כמה " + uName(to) + " יש ב-" + uName(from) + " אחד")]);
      y = x * k;
      steps.push([LRI(F(x) + " " + uName(from) + " = " + F(x) + " × " + F(k) + " = " + F(y) + " " + uName(to)), P("Multiply by the conversion factor", "כופלים במקדם ההמרה")]);
    }
    return { answer: F(x) + " " + uName(from) + " = " + F(y) + " " + uName(to), value: y, steps };
  }

  // ---------- periodic table ----------
  const SYMS = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" ");
  const NAMES_EN = "Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminium Silicon Phosphorus Sulfur Chlorine Argon Potassium Calcium Scandium Titanium Vanadium Chromium Manganese Iron Cobalt Nickel Copper Zinc Gallium Germanium Arsenic Selenium Bromine Krypton Rubidium Strontium Yttrium Zirconium Niobium Molybdenum Technetium Ruthenium Rhodium Palladium Silver Cadmium Indium Tin Antimony Tellurium Iodine Xenon Caesium Barium Lanthanum Cerium Praseodymium Neodymium Promethium Samarium Europium Gadolinium Terbium Dysprosium Holmium Erbium Thulium Ytterbium Lutetium Hafnium Tantalum Tungsten Rhenium Osmium Iridium Platinum Gold Mercury Thallium Lead Bismuth Polonium Astatine Radon Francium Radium Actinium Thorium Protactinium Uranium Neptunium Plutonium Americium Curium Berkelium Californium Einsteinium Fermium Mendelevium Nobelium Lawrencium Rutherfordium Dubnium Seaborgium Bohrium Hassium Meitnerium Darmstadtium Roentgenium Copernicium Nihonium Flerovium Moscovium Livermorium Tennessine Oganesson".split(" ");
  Object.assign(HE_EL, { Ne: "ניאון", Ar: "ארגון", Be: "בריליום", B: "בור", Sn: "בדיל", Hg: "כספית", U: "אורניום", Ni: "ניקל", Cr: "כרום", Mn: "מנגן", Co: "קובלט", Ti: "טיטניום", Pt: "פלטינה", Ba: "בריום", Sr: "סטרונציום", Kr: "קריפטון", Xe: "קסנון", Rn: "ראדון", W: "טונגסטן", Ra: "רדיום", As: "ארסן", Se: "סלניום", Rb: "רובידיום", Cs: "צסיום", Ga: "גליום", Ge: "גרמניום", Sb: "אנטימון", Bi: "ביסמוט", Cd: "קדמיום", Pu: "פלוטוניום" });
  const NOBLE = [2, 10, 18, 36, 54, 86, 118], HALO = [9, 17, 35, 53, 85, 117], METALLOID = [5, 14, 32, 33, 51, 52], NONMETAL = [1, 6, 7, 8, 15, 16, 34];
  function elementPos(z) {           // [row, column] in the usual 18-column table; rows 9-10 are the f-block
    if (z === 1) return [1, 1]; if (z === 2) return [1, 18];
    const per = [[3, 10, 2], [11, 18, 3], [19, 36, 4], [37, 54, 5], [55, 86, 6], [87, 118, 7]];
    for (const [a, b, row] of per) if (z >= a && z <= b) {
      const i = z - a;
      if (row <= 3) return [row, i < 2 ? i + 1 : i + 11];
      if (row <= 5) return [row, i + 1];
      if (i < 2) return [row, i + 1];
      if (i < 17) return [row + 3, i + 1];        // La..Lu / Ac..Lr go to the f-block rows (columns 3..17)
      return [row, i - 13];                        // Hf.. / Rf.. back in the main table from column 4
    }
    return [0, 0];
  }
  function elementKind(z) {
    if (NOBLE.includes(z)) return "noble"; if (HALO.includes(z)) return "halogen"; if (METALLOID.includes(z)) return "metalloid"; if (NONMETAL.includes(z)) return "nonmetal";
    const [row, col] = elementPos(z); if (row >= 8) return "fblock"; if (col === 1) return "alkali"; if (col === 2) return "alkaline"; if (col >= 3 && col <= 12) return "transition"; return "metal";
  }
  const ELEMENTS = SYMS.map((s, i) => ({ z: i + 1, sym: s, en: NAMES_EN[i], he: HE_EL[s] || null, mass: AM[s] !== undefined ? AM[s] : null, pos: elementPos(i + 1), kind: elementKind(i + 1) }));

  const api = { ELEMENTS, TOPICS, UNITS, solveTopic, molarMass, balance, convert, parseFormula, format: F, sub, uName: u => uName(u) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Science = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
