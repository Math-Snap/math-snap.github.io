/* Math Snap offline solver. Needs mathjs loaded as global `math`. */
(function (root) {
  "use strict";
  const M = () => root.math || globalThis.math;

  function fail(msg) { const e = new Error(msg); e.friendly = true; throw e; }

  // ---------- exact numbers (fractions) with float fallback ----------
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  const SAFE = 1e15;
  function rat(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) fail("You can't divide by zero.");
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (Math.abs(n) > SAFE || d > SAFE) return flt(n / d);
    return { exact: true, n: n === 0 ? 0 : n, d };
  }
  function flt(v) { if (!isFinite(v)) fail("The answer is too big or undefined."); return { exact: false, v }; }
  function val(a) { return a.exact ? a.n / a.d : a.v; }
  function fromNumber(x) {
    if (Number.isInteger(x)) return rat(x, 1);
    const m = String(x).match(/^-?\d+\.(\d{1,6})$/);
    if (m) { const k = Math.pow(10, m[1].length); return rat(Math.round(x * k), k); }
    return flt(x);
  }
  function approxRat(x) {
    if (!isFinite(x)) return flt(x);
    for (let d = 1; d <= 1000; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9 * Math.max(1, Math.abs(x))) return rat(n, d); }
    return flt(x);
  }
  function round(v) { let r = Math.round(v * 1e4) / 1e4; if (Object.is(r, -0)) r = 0; return String(r).replace("-", "−"); }
  function fmt(a) { if (!a.exact) return round(a.v); const s = a.d === 1 ? String(a.n) : a.n + "/" + a.d; return s.replace("-", "−"); }
  function fmtShort(a) { return a.exact ? fmt(a) : "≈ " + round(a.v); }
  function fmtFull(a) {
    if (!a.exact) return "≈ " + round(a.v);
    if (a.d === 1) return fmt(a);
    let s = fmt(a);
    const w = Math.trunc(a.n / a.d);
    if (w !== 0) s += " = " + String(w).replace("-", "−") + " " + Math.abs(a.n % a.d) + "/" + a.d;
    return s + " ≈ " + round(a.n / a.d);
  }
  function paren(a) { return val(a) < 0 || (a.exact && a.d !== 1) ? "(" + fmt(a) + ")" : fmt(a); }
  const neg = a => ops.multiply(rat(-1), a);
  const abs = a => (val(a) < 0 ? neg(a) : a);

  const ops = {
    add: (a, b) => (a.exact && b.exact ? rat(a.n * b.d + b.n * a.d, a.d * b.d) : flt(val(a) + val(b))),
    subtract: (a, b) => (a.exact && b.exact ? rat(a.n * b.d - b.n * a.d, a.d * b.d) : flt(val(a) - val(b))),
    multiply: (a, b) => (a.exact && b.exact ? rat(a.n * b.n, a.d * b.d) : flt(val(a) * val(b))),
    divide: (a, b) => {
      if (val(b) === 0) fail("You can't divide by zero.");
      return a.exact && b.exact ? rat(a.n * b.d, a.d * b.n) : flt(val(a) / val(b));
    },
    pow: (a, b) => {
      if (a.exact && b.exact && b.d === 1 && Math.abs(b.n) <= 30) {
        const k = Math.abs(b.n); let n = Math.pow(a.n, k), d = Math.pow(a.d, k);
        if (b.n < 0) { if (n === 0) fail("You can't divide by zero."); [n, d] = [d, n]; }
        return rat(n, d);
      }
      if (val(a) < 0 && !(b.exact && b.d === 1)) fail("That power has no real answer.");
      return flt(Math.pow(val(a), val(b)));
    },
  };
  const DEG = Math.PI / 180;
  function trig(f) { return a => { const r = f(val(a) * DEG); if (Math.abs(r) > 1e10) fail("That has no answer (it's undefined)."); return approxRat(r); }; }
  const fns = {
    sqrt: a => {
      if (val(a) < 0) fail("A negative number has no real square root.");
      if (a.exact) { const n = Math.round(Math.sqrt(a.n)), d = Math.round(Math.sqrt(a.d)); if (n * n === a.n && d * d === a.d) return rat(n, d); }
      return flt(Math.sqrt(val(a)));
    },
    abs: a => abs(a),
    sin: trig(Math.sin), cos: trig(Math.cos), tan: trig(Math.tan),
  };
  const KNOWN = new Set(["sqrt", "abs", "sin", "cos", "tan", "pi", "e"]);

  // ---------- step-by-step arithmetic ----------
  const SYM = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
  const PREC = { add: 1, subtract: 1, multiply: 2, divide: 2, neg: 3, pow: 4 };
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

  function convert(node) {
    switch (node.type) {
      case "ParenthesisNode": return convert(node.content);
      case "ConstantNode":
        if (typeof node.value !== "number") fail("I couldn't read a number in this problem.");
        return { t: "c", v: fromNumber(node.value) };
      case "SymbolNode":
        if (node.name === "pi") return { t: "c", v: flt(Math.PI), label: "π" };
        if (node.name === "e") return { t: "c", v: flt(Math.E), label: "e" };
        fail("I don't know what \"" + node.name + "\" means here.");
        break;
      case "OperatorNode": {
        const args = node.args.map(convert);
        if (node.fn === "unaryPlus") return args[0];
        if (node.fn === "unaryMinus") return args[0].t === "c" && !args[0].label ? { t: "c", v: neg(args[0].v) } : { t: "op", op: "neg", args };
        if (!(node.fn in ops)) fail("I can't do \"" + node.op + "\" yet.");
        return { t: "op", op: node.fn, args };
      }
      case "FunctionNode": {
        const name = node.fn && node.fn.name;
        if (!fns[name]) fail("I don't know the function \"" + name + "\".");
        if (node.args.length !== 1) fail(name + " needs one number.");
        return { t: "fn", name, args: node.args.map(convert) };
      }
    }
    fail("I couldn't understand this problem.");
  }

  function show(n, minP, right, hasParent) {
    minP = minP || 0;
    let s, p;
    if (n.t === "c") {
      s = n.label || fmt(n.v);
      if (!n.label && val(n.v) < 0 && hasParent) return "(" + s + ")";
      p = n.v.exact && n.v.d !== 1 ? 2 : 5;
    } else if (n.t === "fn") {
      const inner = show(n.args[0]);
      return n.name === "sqrt" ? "√(" + inner + ")" : n.name + "(" + inner + "°)";
    } else if (n.op === "neg") {
      p = 3; s = "−" + show(n.args[0], 4, true, true);
    } else if (n.op === "pow") {
      p = 4;
      const [a, b] = n.args;
      const base = show(a, 5, false, true);
      if (b.t === "c" && b.v.exact && b.v.d === 1 && b.v.n >= 0) s = base + String(b.v.n).split("").map(c => SUP[c]).join("");
      else s = base + "^" + show(b, 5, true, true);
    } else {
      p = PREC[n.op];
      const [a, b] = n.args;
      const rightMin = n.op === "subtract" || n.op === "divide" ? p + 1 : p;
      s = show(a, p, false, true) + " " + SYM[n.op] + " " + show(b, rightMin, true, true);
    }
    return p < minP ? "(" + s + ")" : s;
  }

  function reducible(n) { return (n.t === "op" || n.t === "fn") && n.args.every(a => a.t === "c"); }
  function rank(n) { return n.t === "fn" ? 5 : PREC[n.op]; }
  function findBest(n, best) {
    if (n.t === "c") return best;
    if (reducible(n)) return !best || rank(n) > rank(best) ? n : best;
    for (const a of n.args) best = findBest(a, best);
    return best;
  }

  function arithmetic(expr) {
    const tree = convert(M().parse(expr));
    const steps = [show(tree)];
    let guard = 0;
    while (tree.t !== "c") {
      if (guard++ > 80) fail("This problem is too long for me.");
      const b = findBest(tree, null);
      const x = b.args[0], y = b.args[1];
      let note = "";
      if (b.t === "op" && (b.op === "add" || b.op === "subtract") && x.v.exact && y.v.exact && x.v.d !== y.v.d) {
        const L = (x.v.d / gcd(x.v.d, y.v.d)) * y.v.d;
        note = "    (common denominator " + L + ": " + fmt(rat(x.v.n * (L / x.v.d), 1)) + "/" + L + " " + SYM[b.op] + " " + fmt(rat(y.v.n * (L / y.v.d), 1)) + "/" + L + ")";
      }
      const v = b.t === "fn" ? fns[b.name](x.v) : b.op === "neg" ? neg(x.v) : ops[b.op](x.v, y.v);
      for (const k of Object.keys(b)) delete b[k];
      b.t = "c"; b.v = v;
      steps.push("= " + show(tree) + note);
    }
    return { answer: fmtFull(tree.v), steps, value: tree.v };
  }

  // ---------- equations ----------
  function symbols(node) {
    const s = new Set();
    node.traverse((n, path, parent) => {
      if (n.type === "SymbolNode" && !KNOWN.has(n.name) && !(parent && parent.type === "FunctionNode" && path === "fn")) s.add(n.name);
    });
    return [...s];
  }
  function evalAt(code, v, x) {
    const r = code.evaluate({ [v]: x });
    if (typeof r !== "number" || !isFinite(r)) throw new Error("not a number");
    return r;
  }
  const close = (a, b) => Math.abs(a - b) <= 1e-7 * (1 + Math.abs(b));
  function linCoef(code, v) {
    try {
      const q = evalAt(code, v, 0), p = evalAt(code, v, 1) - q;
      for (const t of [2, -3, 0.5, 7]) if (!close(evalAt(code, v, t), p * t + q)) return null;
      return { p: approxRat(p), q: approxRat(q) };
    } catch (e) { return null; }
  }
  function quadCoef(f, v) {
    try {
      const c = f(0), f1 = f(1), fm = f(-1);
      const a = (f1 + fm) / 2 - c, b = (f1 - fm) / 2;
      for (const t of [2, -3, 0.5, 5]) if (!close(f(t), a * t * t + b * t + c)) return null;
      return { a: approxRat(a), b: approxRat(b), c: approxRat(c) };
    } catch (e) { return null; }
  }
  function term(k, v) {
    if (k.exact && k.d === 1 && k.n === 1) return v;
    if (k.exact && k.d === 1 && k.n === -1) return "−" + v;
    if (k.exact && k.d !== 1) return "(" + fmt(k) + ")" + v;
    return fmt(k) + v;
  }
  function combo(parts) { // [[coef, varString], ...]
    const out = [];
    for (const [k, v] of parts) {
      if (val(k) === 0) continue;
      if (!out.length) out.push(v ? term(k, v) : fmt(k));
      else out.push((val(k) < 0 ? " − " : " + ") + (v ? term(abs(k), v) : fmt(abs(k))));
    }
    return out.length ? out.join("") : "0";
  }

  function solveLinear(L, R, v, display, cl, cr) {
    const a = ops.subtract(L.p, R.p);
    const steps = [display];
    if (val(a) === 0) {
      const same = val(ops.subtract(L.q, R.q)) === 0;
      steps.push(same ? "Both sides are always equal." : "The " + v + " terms cancel and the numbers don't match.");
      return { answer: same ? "Every value of " + v + " works" : "No solution", steps };
    }
    let c = R.q;
    if (val(R.p) !== 0) steps.push((val(R.p) > 0 ? "Subtract " + term(R.p, v) + " from" : "Add " + term(abs(R.p), v) + " to") + " both sides:   " + combo([[a, v], [L.q, ""]]) + " = " + fmt(c));
    if (val(L.q) !== 0) {
      c = ops.subtract(c, L.q);
      steps.push((val(L.q) > 0 ? "Subtract " + fmt(L.q) + " from" : "Add " + fmt(abs(L.q)) + " to") + " both sides:   " + term(a, v) + " = " + fmt(c));
    }
    const x = ops.divide(c, a);
    if (!(a.exact && a.n === 1 && a.d === 1)) steps.push("Divide both sides by " + paren(a) + ":   " + v + " = " + fmt(c) + " ÷ " + paren(a) + " = " + fmt(x));
    try {
      const lv = evalAt(cl, v, val(x)), rv = evalAt(cr, v, val(x));
      if (close(lv, rv)) steps.push("Check: put " + v + " = " + fmt(x) + " back in. Left side = " + round(lv) + ", right side = " + round(rv) + " ✓");
    } catch (e) { /* skip check */ }
    return { answer: v + " = " + fmtFull(x), steps };
  }

  function solveQuad(Q, v, display) {
    const { a, b, c } = Q;
    const steps = [display, "Move everything to one side:   " + combo([[a, v + "²"], [b, v], [c, ""]]) + " = 0", "a = " + fmt(a) + ",  b = " + fmt(b) + ",  c = " + fmt(c)];
    const D = ops.subtract(ops.multiply(b, b), ops.multiply(rat(4), ops.multiply(a, c)));
    steps.push("Discriminant:  b² − 4ac = " + paren(b) + "² − 4 × " + paren(a) + " × " + paren(c) + " = " + fmt(D));
    if (val(D) < 0) { steps.push("The discriminant is negative, so there is no real solution."); return { answer: "No real solution", steps }; }
    const twoA = ops.multiply(rat(2), a), mb = neg(b);
    if (val(D) === 0) {
      const x = ops.divide(mb, twoA);
      steps.push("The discriminant is 0, so there is one solution:   " + v + " = −b ÷ 2a = " + fmt(mb) + " ÷ " + paren(twoA) + " = " + fmt(x));
      return { answer: v + " = " + fmtFull(x), steps };
    }
    const sq = fns.sqrt(D);
    steps.push("Quadratic formula:   " + v + " = (−b ± √D) ÷ 2a = (" + fmt(mb) + " ± √" + fmt(D) + ") ÷ " + paren(twoA));
    if (sq.exact) steps.push("√" + fmt(D) + " = " + fmt(sq));
    const x1 = ops.divide(ops.add(mb, sq), twoA), x2 = ops.divide(ops.subtract(mb, sq), twoA);
    steps.push(v + "₁ = (" + fmt(mb) + " + " + fmt(sq) + ") ÷ " + paren(twoA) + " = " + fmtShort(x1));
    steps.push(v + "₂ = (" + fmt(mb) + " − " + fmt(sq) + ") ÷ " + paren(twoA) + " = " + fmtShort(x2));
    return { answer: v + " = " + fmtShort(x1) + "  or  " + v + " = " + fmtShort(x2), steps };
  }

  function solveNumeric(f, v, display) {
    const roots = [];
    const add = r => { if (!roots.some(x => Math.abs(x - r) < 1e-6)) roots.push(r); };
    let px = -100, py = safe(f, px);
    for (let x = -100 + 0.25; x <= 100 && roots.length < 6; x += 0.25) {
      const y = safe(f, x);
      if (y !== null && Math.abs(y) < 1e-12) add(x);
      else if (y !== null && py !== null && py * y < 0) {
        let lo = px, hi = x, flo = py;
        for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2, fm = safe(f, m); if (fm === null) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
        const r = (lo + hi) / 2; const fr = safe(f, r);
        if (fr !== null && Math.abs(fr) < 1e-6) add(Math.round(r * 1e8) / 1e8);
      }
      px = x; py = y;
    }
    if (!roots.length) fail("I couldn't find a solution to this equation.");
    return {
      answer: roots.map(r => v + " " + fmtShort(approxRat(r)).replace(/^(?!≈)/, "= ")).join("  or  "),
      steps: [display, "I can't solve this kind of equation step by step, so I found the answer by trying values of " + v + " until both sides matched."],
    };
  }
  function safe(f, x) { try { const y = f(x); return typeof y === "number" && isFinite(y) ? y : null; } catch (e) { return null; } }

  function equation(ls, rs, display) {
    const lhs = M().parse(ls), rhs = M().parse(rs);
    const vars = [...new Set([...symbols(lhs), ...symbols(rhs)])];
    if (vars.length === 0) {
      const a = arithmetic(ls), b = arithmetic(rs);
      const ok = close(val(a.value), val(b.value));
      a.steps.push(ok ? "That matches the right side (" + fmt(b.value) + ") ✓" : "The right side says " + fmt(b.value) + ", but the correct answer is " + fmt(a.value) + ".");
      return { answer: a.answer, steps: a.steps };
    }
    if (vars.length > 1) fail("This has more than one unknown (" + vars.join(", ") + "). I can only solve for one.");
    const v = vars[0], cl = lhs.compile(), cr = rhs.compile();
    const L = linCoef(cl, v), R = linCoef(cr, v);
    if (L && R) return solveLinear(L, R, v, display, cl, cr);
    const f = x => evalAt(cl, v, x) - evalAt(cr, v, x);
    const Q = quadCoef(f, v);
    if (Q && val(Q.a) !== 0) return solveQuad(Q, v, display);
    return solveNumeric(f, v, display);
  }

  // ---------- algebra ----------
  function algebra(expr, display) {
    let out;
    try { out = M().rationalize(expr).toString(); } catch (e) { out = M().simplify(expr).toString(); }
    const result = pretty(out);
    const steps = [display];
    if (result.replace(/\s/g, "") === display.replace(/\s/g, "")) steps.push("This is already as simple as it gets.");
    else steps.push("Expand the brackets and combine like terms:", "= " + result);
    return { answer: result, steps };
  }

  // ---------- reading the text ----------
  const WORDS_OK = /^(sqrt|sin|cos|tan|abs|pi)$/i;
  function normalize(raw) {
    let s = " " + String(raw) + " ";
    s = s.replace(/[−–—]/g, "-").replace(/[×✕·•∙]/g, "*").replace(/÷/g, "/");
    s = s.replace(/π/g, "pi").replace(/²/g, "^2").replace(/³/g, "^3");
    s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*of\b/gi, "($1/100)*").replace(/%/g, "/100");
    s = s.replace(/\b[a-z]{2,}\b\s*:?/gi, w => (WORDS_OK.test(w.replace(/[\s:]/g, "")) ? w : " "));
    s = s.replace(/^\s*(\(?\d{1,2}[.)]|\(?[a-hA-H][.)])\s+/, " ");
    s = s.replace(/^[\s:]+/, "");
    s = s.replace(/:/g, "/");
    s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").replace(/(\d),(\d)/g, "$1.$2");
    s = s.replace(/√\s*\(/g, "sqrt(").replace(/√\s*([0-9.]+|[a-z])/gi, "sqrt($1)");
    s = s.replace(/[?]/g, "").replace(/=\s*$/, "").replace(/[\[{]/g, "(").replace(/[\]}]/g, ")");
    if (!s.includes("=")) s = s.replace(/(\d)\s*[xX]\s*(?=\d)/g, "$1*");
    s = s.replace(/X/g, "x");
    s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, "($1+$2/$3)");
    return s.trim();
  }
  function pretty(s) {
    return s.replace(/\s+/g, "")
      .replace(/(\d)\*([a-z(])/gi, "$1$2")
      .replace(/sqrt\(/g, "√(").replace(/\bpi\b/g, "π")
      .replace(/\^2(?!\d)/g, "²").replace(/\^3(?!\d)/g, "³")
      .replace(/\*/g, " × ").replace(/=/g, " = ").replace(/\+/g, " + ")
      .replace(/([\w)²³.])-/g, "$1 − ").replace(/-/g, "−");
  }

  function solveOne(raw) {
    const s = normalize(raw);
    if (!/[0-9]/.test(s) && !/[a-z]/i.test(s)) return null;
    const display = pretty(s);
    try {
      const parts = s.split("=");
      if (parts.length > 2) fail("This has more than one = sign.");
      if (parts.length === 2) {
        if (!parts[0].trim() || !parts[1].trim()) fail("One side of the = is empty.");
        return Object.assign({ problem: display }, equation(parts[0], parts[1], display));
      }
      const vars = symbols(M().parse(s));
      const r = vars.length ? algebra(s, display) : arithmetic(s);
      return { problem: display, answer: r.answer, steps: r.steps };
    } catch (e) {
      return { problem: display, error: e.friendly ? e.message : "I couldn't understand this one. Check the text and fix anything the camera misread." };
    }
  }

  function solve(text) {
    return String(text).split(/\n|;/).map(solveOne).filter(Boolean);
  }

  const api = { solve, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Solver = api;
})(typeof window !== "undefined" ? window : globalThis);
