/* Math Snap offline solver. Needs mathjs loaded as global `math`.
   Every step is a pair [claim, reason], like a "טענה / נימוק" table in class. */
(function (root) {
  "use strict";
  const M = () => root.math || globalThis.math;

  // ---------- language ----------
  let LANG = "en";
  const iso = x => (LANG === "en" ? x : "⁦" + x + "⁩"); // keep math left-to-right inside Hebrew
  const MSG = {
    en: {
      divZero: "You can't divide by zero.",
      tooBig: "The answer is too big or undefined.",
      powNoReal: "That power has no real answer.",
      undefinedTrig: "That has no answer (it's undefined).",
      negSqrt: "A negative number has no real square root.",
      noNumber: "I couldn't read a number in this problem.",
      unknownSym: n => "I don't know what \"" + n + "\" means here.",
      cantOp: o => "I can't do \"" + o + "\" yet.",
      unknownFn: n => "I don't know the function \"" + n + "\".",
      fnOne: n => n + " needs one number.",
      notUnderstood: "I couldn't understand this problem.",
      tooLong: "This problem is too long for me.",
      // order of operations
      rParen: "Brackets first: ",
      rOrder: " (multiply and divide before adding and subtracting)",
      rPow: "Power", rSqrt: "Square root", rAbs: "Absolute value", rTrig: n => n + " (in degrees)", rNeg: "Minus sign",
      rMul: "Multiply", rMulFrac: "Multiplying fractions: numerator × numerator, denominator × denominator",
      rDiv: "Divide", rDivFrac: "Dividing by a fraction = multiplying by its reciprocal",
      rAdd: "Add", rSub: "Subtract", rSameDen: "Same denominator: work with the numerators",
      commonDen: (L, e) => "Common denominator " + L + ":  " + e,
      // equations
      alwaysEqual: "Both sides are always equal.",
      cancel: v => "The " + v + " terms cancel and the numbers don't match.",
      everyValue: v => "Every value of " + v + " works",
      noSolution: "No solution",
      subFrom: x => "Subtract " + x + " from both sides",
      addTo: x => "Add " + x + " to both sides",
      divide: x => "Divide both sides by " + x,
      multiply: x => "Multiply both sides by " + x,
      simplified: "After simplifying both sides",
      check: "Check: substitute the answer in the original equation",
      oneSide: "Move everything to one side",
      x2cancel: v => "Move everything to one side (the " + v + "² terms cancel)",
      coefs: "The coefficients",
      disc: "Discriminant",
      discNeg: "The discriminant is negative, so there is no real solution",
      noReal: "No real solution",
      discZero: "The discriminant is 0, so there is one solution",
      quadFormula: "Quadratic formula",
      or: "  or  ",
      noFound: "I couldn't find a solution to this equation.",
      numeric: v => "Found by trying values of " + v + " until both sides matched",
      matches: x => "That matches the right side (" + x + ") ✓",
      mismatch: (x, y) => "The right side says " + x + ", but the correct answer is " + y + ".",
      multiVars: l => "This has more than one unknown (" + l + "). I can only solve for one.",
      // algebra
      already: "This is already as simple as it gets.",
      rDist: "Distributive law",
      rExtDist: "Extended distributive law: multiply every term in the first bracket by every term in the second",
      rMinus: " (a minus before the brackets flips every sign inside)",
      rCombine: "Combine like terms",
      left: "Left side: ", right: "Right side: ",
      // powers
      rProd: "Product of powers with the same base:  aˣ · aʸ = aˣ⁺ʸ",
      rQuot: "Quotient of powers with the same base:  aˣ : aʸ = aˣ⁻ʸ",
      rPowPow: "Power of a power:  (aˣ)ʸ = aˣ·ʸ",
      rPowProd: "Power of a product:  (a·b)ⁿ = aⁿ·bⁿ",
      rZero: "Power with exponent 0:  a⁰ = 1",
      rNegExp: "Power with a negative exponent:  a⁻ⁿ = 1/aⁿ",
      rCalc: "Calculate",
      // primes
      divBy: p => "Divisible by " + p,
      primeFact: "Prime factorization (equal factors written as a power)",
      isPrime: n => n + " is a prime number",
      multiEq: "This has more than one = sign.",
      emptySide: "One side of the = is empty.",
      generic: "I couldn't understand this one. Check the text and fix anything the camera misread.",
    },
    he: {
      divZero: "אי אפשר לחלק באפס.",
      tooBig: "התשובה גדולה מדי או לא מוגדרת.",
      powNoReal: "לחזקה הזו אין תשובה ממשית.",
      undefinedTrig: "אין לזה תשובה (הערך לא מוגדר).",
      negSqrt: "למספר שלילי אין שורש ריבועי ממשי.",
      noNumber: "לא הצלחתי לקרוא מספר בתרגיל.",
      unknownSym: n => "לא ברור לי מה זה \"" + n + "\" כאן.",
      cantOp: o => "עוד לא יודע לחשב \"" + o + "\".",
      unknownFn: n => "לא מכיר את הפונקציה \"" + n + "\".",
      fnOne: n => n + " צריך מספר אחד.",
      notUnderstood: "לא הצלחתי להבין את התרגיל.",
      tooLong: "התרגיל ארוך מדי בשבילי.",
      rParen: "קודם סוגריים: ",
      rOrder: " (כפל וחילוק לפני חיבור וחיסור)",
      rPow: "חזקה", rSqrt: "שורש ריבועי", rAbs: "ערך מוחלט", rTrig: n => n + " (במעלות)", rNeg: "סימן מינוס",
      rMul: "כפל", rMulFrac: "כפל שברים: מונה כפול מונה, מכנה כפול מכנה",
      rDiv: "חילוק", rDivFrac: "חילוק בשבר = כפל בשבר ההופכי",
      rAdd: "חיבור", rSub: "חיסור", rSameDen: "אותו מכנה: מחשבים את המונים",
      commonDen: (L, e) => "מכנה משותף " + L + ":  " + e,
      alwaysEqual: "שני האגפים תמיד שווים.",
      cancel: v => "האיברים עם " + v + " מתבטלים, והמספרים לא שווים.",
      everyValue: v => "כל ערך של " + v + " מתאים",
      noSolution: "אין פתרון",
      subFrom: x => "נחסר " + x + " משני האגפים",
      addTo: x => "נוסיף " + x + " לשני האגפים",
      divide: x => "נחלק את שני האגפים ב-" + x,
      multiply: x => "נכפול את שני האגפים ב-" + x,
      simplified: "אחרי פישוט שני האגפים",
      check: "בדיקה: הצבה במשוואה המקורית",
      oneSide: "נעביר הכול לאגף אחד",
      x2cancel: v => "נעביר הכול לאגף אחד (האיברים עם " + v + "² מתבטלים)",
      coefs: "המקדמים",
      disc: "דיסקרימיננטה",
      discNeg: "הדיסקרימיננטה שלילית, ולכן אין פתרון ממשי",
      noReal: "אין פתרון ממשי",
      discZero: "הדיסקרימיננטה היא 0, ולכן יש פתרון אחד",
      quadFormula: "נוסחת השורשים",
      or: "  או  ",
      noFound: "לא מצאתי פתרון למשוואה הזו.",
      numeric: v => "נמצא בניסוי ערכים של " + v + " עד ששני האגפים שווים",
      matches: x => "זה מתאים לאגף ימין (" + x + ") ✓",
      mismatch: (x, y) => "באגף ימין כתוב " + x + ", אבל התשובה הנכונה היא " + y + ".",
      multiVars: l => "יש כאן יותר מנעלם אחד (" + l + "). אני יודע לפתור רק עם נעלם אחד.",
      already: "התרגיל כבר מפושט עד הסוף.",
      rDist: "חוק הפילוג",
      rExtDist: "חוק הפילוג המורחב: כופלים כל איבר בסוגריים הראשונים בכל איבר בסוגריים השניים",
      rMinus: " (מינוס לפני הסוגריים הופך את כל הסימנים בפנים)",
      rCombine: "כינוס איברים דומים",
      left: "אגף שמאל: ", right: "אגף ימין: ",
      rProd: "מכפלת חזקות בעלות אותו בסיס:  ⁦aˣ · aʸ = aˣ⁺ʸ⁩",
      rQuot: "מנה של חזקות בעלות אותו בסיס:  ⁦aˣ : aʸ = aˣ⁻ʸ⁩",
      rPowPow: "חזקה של חזקה:  ⁦(aˣ)ʸ = aˣ·ʸ⁩",
      rPowProd: "חזקה של מכפלה:  ⁦(a·b)ⁿ = aⁿ·bⁿ⁩",
      rZero: "חזקה בעלת מעריך 0:  ⁦a⁰ = 1⁩",
      rNegExp: "חזקה בעלת מעריך שלילי:  ⁦a⁻ⁿ = 1/aⁿ⁩",
      rCalc: "חישוב",
      divBy: p => "מתחלק ב-" + p,
      primeFact: "פירוק לגורמים ראשוניים (גורמים שווים כותבים כחזקה)",
      isPrime: n => n + " הוא מספר ראשוני",
      multiEq: "יש כאן יותר מסימן = אחד.",
      emptySide: "אחד האגפים של ה-= ריק.",
      generic: "לא הצלחתי להבין את התרגיל הזה. בדקו את הטקסט ותקנו מה שהמצלמה קראה לא נכון.",
    },
  };
  function t(k) {
    const m = (MSG[LANG] && MSG[LANG][k]) || MSG.en[k];
    return typeof m === "function" ? m.apply(null, [].slice.call(arguments, 1)) : m;
  }
  function fail(msg) { const e = new Error(msg); e.friendly = true; throw e; }

  // ---------- exact numbers (fractions) with float fallback ----------
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const x = a % b; a = b; b = x; } return a; }
  const SAFE = 1e15;
  function rat(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) fail(t("divZero"));
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (Math.abs(n) > SAFE || d > SAFE) return flt(n / d);
    return { exact: true, n: n === 0 ? 0 : n, d };
  }
  function flt(v) { if (!isFinite(v)) fail(t("tooBig")); return { exact: false, v }; }
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
  const isInt = a => a.exact && a.d === 1;

  const ops = {
    add: (a, b) => (a.exact && b.exact ? rat(a.n * b.d + b.n * a.d, a.d * b.d) : flt(val(a) + val(b))),
    subtract: (a, b) => (a.exact && b.exact ? rat(a.n * b.d - b.n * a.d, a.d * b.d) : flt(val(a) - val(b))),
    multiply: (a, b) => (a.exact && b.exact ? rat(a.n * b.n, a.d * b.d) : flt(val(a) * val(b))),
    divide: (a, b) => {
      if (val(b) === 0) fail(t("divZero"));
      return a.exact && b.exact ? rat(a.n * b.d, a.d * b.n) : flt(val(a) / val(b));
    },
    pow: (a, b) => {
      if (a.exact && isInt(b) && Math.abs(b.n) <= 40) {
        const k = Math.abs(b.n); let n = Math.pow(a.n, k), d = Math.pow(a.d, k);
        if (b.n < 0) { if (n === 0) fail(t("divZero")); [n, d] = [d, n]; }
        if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return rat(n, d);
      }
      if (val(a) < 0 && !isInt(b)) fail(t("powNoReal"));
      return flt(Math.pow(val(a), val(b)));
    },
  };
  const DEG = Math.PI / 180;
  function trig(f) { return a => { const r = f(val(a) * DEG); if (Math.abs(r) > 1e10) fail(t("undefinedTrig")); return approxRat(r); }; }
  const fns = {
    sqrt: a => {
      if (val(a) < 0) fail(t("negSqrt"));
      if (a.exact) { const n = Math.round(Math.sqrt(a.n)), d = Math.round(Math.sqrt(a.d)); if (n * n === a.n && d * d === a.d) return rat(n, d); }
      return flt(Math.sqrt(val(a)));
    },
    abs: a => abs(a),
    sin: trig(Math.sin), cos: trig(Math.cos), tan: trig(Math.tan),
  };
  const KNOWN = new Set(["sqrt", "abs", "sin", "cos", "tan", "pi", "e"]);

  // ---------- superscripts ----------
  const SUPM = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻", "+": "⁺", "(": "⁽", ")": "⁾" };
  function sup(str) { str = String(str); return /^[0-9+\-−()]+$/.test(str) ? str.split("").map(c => SUPM[c]).join("") : "^(" + str + ")"; }
  function powStr(base, e) { return isInt(e) && e.n === 1 ? base : base + (isInt(e) ? sup(e.n) : "^(" + fmt(e) + ")"); }

  // ---------- step-by-step arithmetic (order of operations) ----------
  const SYM = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
  const PREC = { add: 1, subtract: 1, multiply: 2, divide: 2, neg: 3, pow: 4 };

  function convert(node) {
    switch (node.type) {
      case "ParenthesisNode": { const c = convert(node.content); c.paren = true; return c; }
      case "ConstantNode":
        if (typeof node.value !== "number") fail(t("noNumber"));
        return { t: "c", v: fromNumber(node.value) };
      case "SymbolNode":
        if (node.name === "pi") return { t: "c", v: flt(Math.PI), label: "π" };
        if (node.name === "e") return { t: "c", v: flt(Math.E), label: "e" };
        fail(t("unknownSym", node.name));
        break;
      case "OperatorNode": {
        const args = node.args.map(convert);
        if (node.fn === "unaryPlus") return args[0];
        if (node.fn === "unaryMinus") return args[0].t === "c" && !args[0].label ? { t: "c", v: neg(args[0].v) } : { t: "op", op: "neg", args };
        if (!(node.fn in ops)) fail(t("cantOp", node.op));
        return { t: "op", op: node.fn, args };
      }
      case "FunctionNode": {
        const name = node.fn && node.fn.name;
        if (name === "frac") return { t: "c", v: rat(node.args[0].value, node.args[1].value) };
        if (!fns[name]) fail(t("unknownFn", name));
        if (node.args.length !== 1) fail(t("fnOne", name));
        return { t: "fn", name, args: node.args.map(convert) };
      }
    }
    fail(t("notUnderstood"));
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
      s = b.t === "c" && isInt(b.v) ? base + sup(b.v.n) : base + "^" + show(b, 5, true, true);
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
  function hasOp(n, set) { return n.t !== "c" && ((n.t === "op" && set.has(n.op)) || n.args.some(a => hasOp(a, set))); }
  const ADDSUB = new Set(["add", "subtract"]);

  function stepReason(b, tree) {
    const [x, y] = b.args;
    let r;
    if (b.t === "fn") r = b.name === "sqrt" ? t("rSqrt") : b.name === "abs" ? t("rAbs") : t("rTrig", b.name);
    else if (b.op === "neg") r = t("rNeg");
    else if (b.op === "pow") r = t("rPow");
    else if (b.op === "multiply") r = (x.v.exact && x.v.d !== 1) || (y.v.exact && y.v.d !== 1) ? t("rMulFrac") : t("rMul");
    else if (b.op === "divide") r = y.v.exact && y.v.d !== 1 ? t("rDivFrac") : t("rDiv");
    else {
      if (x.v.exact && y.v.exact && x.v.d !== y.v.d) {
        const L = (x.v.d / gcd(x.v.d, y.v.d)) * y.v.d;
        r = t("commonDen", L, iso(fmt(rat(x.v.n * (L / x.v.d), 1)) + "/" + L + " " + SYM[b.op] + " " + fmt(rat(y.v.n * (L / y.v.d), 1)) + "/" + L));
      } else if (x.v.exact && y.v.exact && x.v.d !== 1) r = t("rSameDen");
      else r = b.op === "add" ? t("rAdd") : t("rSub");
    }
    if ((b.op === "multiply" || b.op === "divide") && hasOp(tree, ADDSUB) && !b.paren) r += t("rOrder");
    if (b.paren && tree !== b) r = t("rParen") + r;
    return r;
  }

  function arithmetic(expr) {
    const tree = convert(M().parse(expr));
    const steps = [];
    let guard = 0;
    while (tree.t !== "c") {
      if (guard++ > 80) fail(t("tooLong"));
      const b = findBest(tree, null);
      const reason = stepReason(b, tree);
      const x = b.args[0], y = b.args[1];
      const v = b.t === "fn" ? fns[b.name](x.v) : b.op === "neg" ? neg(x.v) : ops[b.op](x.v, y.v);
      const keepParen = b.paren;
      for (const k of Object.keys(b)) delete b[k];
      b.t = "c"; b.v = v; if (keepParen) b.paren = true;
      steps.push(["= " + show(tree), reason]);
    }
    return { answer: fmtFull(tree.v), steps, value: tree.v };
  }

  // ---------- prime factorization ----------
  function factorize(n) {
    const steps = [], f = new Map();
    let cur = n;
    for (let p = 2; p * p <= cur; p++) {
      while (cur % p === 0) { steps.push([cur + " ÷ " + p + " = " + cur / p, t("divBy", p)]); f.set(p, (f.get(p) || 0) + 1); cur /= p; }
    }
    if (cur > 1) f.set(cur, (f.get(cur) || 0) + 1);
    if (f.size === 1 && [...f.values()][0] === 1) return { answer: t("isPrime", n), steps: [[String(n), t("isPrime", n)]] };
    if (cur > 1 && steps.length) steps.push([cur + " ÷ " + cur + " = 1", t("divBy", cur)]);
    const out = [...f.entries()].map(([p, e]) => (e === 1 ? String(p) : p + sup(e))).join(" · ");
    steps.push([n + " = " + out, t("primeFact")]);
    return { answer: n + " = " + out, steps };
  }

  // ---------- power laws (monomials) ----------
  function unparen(n) { while (n.type === "ParenthesisNode") n = n.content; return n; }
  function constVal(node) { // exponent / constant as exact value, or null
    try { const tr = convert(node); if (tr.t === "c") return tr.v; return arithmetic(node.toString()).value; } catch (e) { return null; }
  }
  function monoStr(m) {
    const num = [], den = [];
    for (const [b, e] of m.pw) (val(e) > 0 ? num : den).push(powStr(b, val(e) > 0 ? e : neg(e)));
    const c = m.coef; let cs = "";
    const cn = c.exact ? c.n : c.v, cd = c.exact ? c.d : 1;
    const cAbs = c.exact ? String(Math.abs(cn)) : round(Math.abs(cn));
    let top = num.join(" · "); const bot = den.join(" · ");
    if (!top) top = cAbs;
    else if (Math.abs(cn) !== 1) top = cAbs + top;
    if (cn < 0) cs = "−";
    let bottom = bot;
    if (cd !== 1) bottom = bottom ? cd + bottom : String(cd);
    if (!bottom) return cs + top;
    const wrap = s => (s.includes(" ") ? "(" + s + ")" : s);
    return cs + wrap(top) + "/" + wrap(bottom);
  }
  function monoOf(node, steps, numBases) {
    node = unparen(node);
    if (node.type === "ConstantNode") {
      if (typeof node.value !== "number") return null;
      const v = fromNumber(node.value);
      if (isInt(v) && numBases.has(String(v.n))) return { coef: rat(1), pw: new Map([[String(v.n), rat(1)]]) };
      return { coef: v, pw: new Map() };
    }
    if (node.type === "SymbolNode") {
      if (KNOWN.has(node.name)) return null;
      return { coef: rat(1), pw: new Map([[node.name, rat(1)]]) };
    }
    if (node.type !== "OperatorNode") return null;
    if (node.fn === "unaryMinus") { const a = monoOf(node.args[0], steps, numBases); if (a) a.coef = neg(a.coef); return a; }
    if (node.fn === "multiply" || node.fn === "divide") {
      const a = monoOf(node.args[0], steps, numBases), b = monoOf(node.args[1], steps, numBases);
      if (!a || !b) return null;
      const out = { coef: node.fn === "multiply" ? ops.multiply(a.coef, b.coef) : ops.divide(a.coef, b.coef), pw: new Map(a.pw) };
      for (const [base, e] of b.pw) {
        if (out.pw.has(base)) {
          const x = out.pw.get(base), r = node.fn === "multiply" ? ops.add(x, e) : ops.subtract(x, e);
          const opS = node.fn === "multiply" ? " · " : " : ";
          const expr = fmt(x) + (node.fn === "multiply" ? "+" : "−") + paren(e);
          steps.push([powStr(base, x) + opS + powStr(base, e) + " = " + base + sup(expr) + " = " + powStr(base, r), node.fn === "multiply" ? t("rProd") : t("rQuot")]);
          out.pw.set(base, r);
        } else out.pw.set(base, node.fn === "multiply" ? e : neg(e));
      }
      return out;
    }
    if (node.fn === "pow") {
      const e = constVal(node.args[1]);
      if (!e || !e.exact) return null;
      const base = unparen(node.args[0]);
      if (base.type === "SymbolNode" && !KNOWN.has(base.name)) return { coef: rat(1), pw: new Map([[base.name, e]]) };
      if (base.type === "ConstantNode" && typeof base.value === "number" && Number.isInteger(base.value) && base.value > 0)
        return { coef: rat(1), pw: new Map([[String(base.value), e]]) };
      const inner = monoOf(base, steps, numBases);
      if (!inner) return null;
      const before = monoStr(inner);
      const out = { coef: ops.pow(inner.coef, e), pw: new Map() };
      for (const [b, x] of inner.pw) out.pw.set(b, ops.multiply(x, e));
      const single = inner.pw.size === 1 && isInt(inner.coef) && inner.coef.n === 1;
      if (single) {
        const [b, x] = [...inner.pw][0];
        steps.push(["(" + before + ")" + sup(fmt(e)) + " = " + b + "^(" + fmt(x) + "·" + paren(e) + ") = " + powStr(b, ops.multiply(x, e)), t("rPowPow")]);
      } else steps.push(["(" + before + ")" + (isInt(e) ? sup(e.n) : "^(" + fmt(e) + ")") + " = " + monoStr(out), t("rPowProd")]);
      return out;
    }
    return null;
  }
  function powers(expr) {
    const root = M().parse(expr);
    let hasPow = false, hasAdd = false, hasVarDiv = false;
    const numBases = new Set();
    root.traverse(n => {
      if (n.type === "OperatorNode" && n.fn === "pow") {
        hasPow = true; const b = unparen(n.args[0]);
        if (b.type === "ConstantNode" && Number.isInteger(b.value)) numBases.add(String(b.value));
      }
      if (n.type === "OperatorNode" && (n.fn === "add" || n.fn === "subtract")) hasAdd = true;
      if (n.type === "OperatorNode" && n.fn === "divide" && n.args[1].filter(x => x.type === "SymbolNode").length) hasVarDiv = true;
    });
    if (hasAdd || !(hasPow || hasVarDiv)) return null;
    const steps = [];
    const m = monoOf(root, steps, numBases);
    if (!m) return null;
    for (const [b, e] of [...m.pw]) {
      if (val(e) === 0) { steps.push([b + "⁰ = 1", t("rZero")]); m.pw.delete(b); }
    }
    for (const [b, e] of m.pw) if (val(e) < 0) steps.push([powStr(b, e) + " = 1/" + powStr(b, neg(e)), t("rNegExp")]);
    const shown = monoStr(m);
    const allNum = [...m.pw.keys()].every(b => /^\d+$/.test(b));
    if (allNum && m.pw.size) {
      let v = m.coef;
      for (const [b, e] of m.pw) v = ops.multiply(v, ops.pow(rat(Number(b)), e));
      steps.push([shown + " = " + fmt(v), t("rCalc")]);
      return { answer: shown + " = " + fmtFull(v), steps };
    }
    if (!steps.length) return null;
    return { answer: shown, steps };
  }

  // ---------- distributive law ----------
  function topTerms(node, sign, out) {
    node = unparen(node);
    if (node.type === "OperatorNode" && node.fn === "add") { topTerms(node.args[0], sign, out); topTerms(node.args[1], sign, out); }
    else if (node.type === "OperatorNode" && node.fn === "subtract") { topTerms(node.args[0], sign, out); topTerms(node.args[1], -sign, out); }
    else if (node.type === "OperatorNode" && node.fn === "unaryMinus") topTerms(node.args[0], -sign, out);
    else out.push({ node, sign });
  }
  function factorList(node, out) {
    node = unparen(node);
    if (node.type === "OperatorNode" && node.fn === "multiply") { factorList(node.args[0], out); factorList(node.args[1], out); }
    else out.push(node);
  }
  const isSum = n => { n = unparen(n); return n.type === "OperatorNode" && (n.fn === "add" || n.fn === "subtract"); };
  function joinSigned(pieces) {
    return pieces.map((p, i) => {
      let s = p.s, sg = p.sign;
      if (s.startsWith("-")) { sg = -sg; s = s.slice(1).trim(); }
      if (/[+\-]/.test(s.replace(/^\(|\)$/g, ""))) s = "(" + s + ")";
      return i === 0 ? (sg < 0 ? "-" : "") + s : (sg < 0 ? " - " : " + ") + s;
    }).join("");
  }
  function simplifyStr(str) {
    try { return M().rationalize(str).toString(); } catch (e) { return M().simplify(str).toString(); }
  }
  // Returns steps to simplify one expression (expand brackets, then combine like terms)
  function simplifySteps(str, prefix) {
    prefix = prefix || "";
    const terms = [];
    topTerms(M().parse(str), 1, terms);
    let used = false, extended = false, minusFront = false;
    const pieces = [];
    for (const tm of terms) {
      const fs = []; factorList(tm.node, fs);
      const sums = fs.filter(isSum), others = fs.filter(f => !isSum(f));
      if (!sums.length) { pieces.push({ sign: tm.sign, s: simplifyStr(tm.node.toString()) }); continue; }
      used = true; if (sums.length >= 2) extended = true; if (tm.sign < 0) minusFront = true;
      let combos = [{ sign: tm.sign, parts: others.map(o => "(" + o.toString() + ")") }];
      for (const s of sums) {
        const st = []; topTerms(s, 1, st);
        combos = combos.flatMap(c => st.map(x => ({ sign: c.sign * x.sign, parts: c.parts.concat("(" + x.node.toString() + ")") })));
      }
      for (const c of combos) pieces.push({ sign: c.sign, s: M().simplify(c.parts.join("*") || "1").toString() });
    }
    const orig = pretty(str);
    const combined = pretty(simplifyStr(str));
    const steps = [];
    let last = orig;
    if (used) {
      const expanded = pretty(joinSigned(pieces));
      steps.push([orig + " = " + expanded, prefix + (extended ? t("rExtDist") : t("rDist")) + (minusFront ? t("rMinus") : "")]);
      last = expanded;
    }
    const nTerms = x => { const o = []; topTerms(M().parse(x), 1, o); return o.length; };
    let fewer = true;
    if (!used) { try { fewer = nTerms(simplifyStr(str)) < terms.length; } catch (e) { fewer = false; } }
    if (fewer && combined.replace(/\s/g, "") !== last.replace(/\s/g, "")) steps.push([(used ? "= " : orig + " = ") + combined, prefix + t("rCombine")]);
    return { steps, result: combined };
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
      for (const x of [2, -3, 0.5, 7]) if (!close(evalAt(code, v, x), p * x + q)) return null;
      return { p: approxRat(p), q: approxRat(q) };
    } catch (e) { return null; }
  }
  function quadCoef(f) {
    try {
      const c = f(0), f1 = f(1), fm = f(-1);
      const a = (f1 + fm) / 2 - c, b = (f1 - fm) / 2;
      for (const x of [2, -3, 0.5, 5]) if (!close(f(x), a * x * x + b * x + c)) return null;
      return { a: approxRat(a), b: approxRat(b), c: approxRat(c) };
    } catch (e) { return null; }
  }
  function term(k, v) {
    if (isInt(k) && k.n === 1) return v;
    if (isInt(k) && k.n === -1) return "−" + v;
    if (k.exact && k.d !== 1) return "(" + fmt(k) + ")" + v;
    return fmt(k) + v;
  }
  function combo(parts) {
    const out = [];
    for (const [k, v] of parts) {
      if (val(k) === 0) continue;
      if (!out.length) out.push(v ? term(k, v) : fmt(k));
      else out.push((val(k) < 0 ? " − " : " + ") + (v ? term(abs(k), v) : fmt(abs(k))));
    }
    return out.length ? out.join("") : "0";
  }

  function solveLinear(L, R, v, steps, check) {
    const a = ops.subtract(L.p, R.p);
    if (val(a) === 0) {
      const same = val(ops.subtract(L.q, R.q)) === 0;
      steps.push([combo([[L.q, ""]]) + " = " + combo([[R.q, ""]]), same ? t("alwaysEqual") : t("cancel", v)]);
      return { answer: same ? t("everyValue", v) : t("noSolution"), steps };
    }
    let c = R.q;
    if (val(R.p) !== 0) steps.push([combo([[a, v], [L.q, ""]]) + " = " + fmt(c), val(R.p) > 0 ? t("subFrom", iso(term(R.p, v))) : t("addTo", iso(term(abs(R.p), v)))]);
    if (val(L.q) !== 0) {
      c = ops.subtract(c, L.q);
      steps.push([term(a, v) + " = " + fmt(c), val(L.q) > 0 ? t("subFrom", iso(fmt(L.q))) : t("addTo", iso(fmt(abs(L.q))))]);
    }
    const x = ops.divide(c, a);
    if (a.exact && a.d !== 1) {
      const rcp = ops.divide(rat(1), a);
      steps.push([v + " = " + paren(c) + " × " + paren(rcp) + " = " + fmt(x), t("multiply", iso(paren(rcp)))]);
    } else if (!(isInt(a) && a.n === 1)) steps.push([v + " = " + fmt(c) + " ÷ " + paren(a) + " = " + fmt(x), t("divide", iso(paren(a)))]);
    if (check) {
      try { const [lv, rv] = check(val(x)); if (close(lv, rv)) steps.push([v + " = " + fmt(x) + ":   " + round(lv) + " = " + round(rv) + " ✓", t("check")]); } catch (e) { /* skip */ }
    }
    return { answer: iso(v + " = " + fmtFull(x)), steps };
  }

  function solveQuad(Q, v, steps) {
    const { a, b, c } = Q;
    steps.push([combo([[a, v + "²"], [b, v], [c, ""]]) + " = 0", t("oneSide")]);
    steps.push(["a = " + fmt(a) + ",  b = " + fmt(b) + ",  c = " + fmt(c), t("coefs")]);
    const D = ops.subtract(ops.multiply(b, b), ops.multiply(rat(4), ops.multiply(a, c)));
    steps.push(["D = b² − 4ac = " + paren(b) + "² − 4 × " + paren(a) + " × " + paren(c) + " = " + fmt(D), t("disc")]);
    if (val(D) < 0) { steps.push(["D < 0", t("discNeg")]); return { answer: t("noReal"), steps }; }
    const twoA = ops.multiply(rat(2), a), mb = neg(b);
    if (val(D) === 0) {
      const x = ops.divide(mb, twoA);
      steps.push([v + " = −b ÷ 2a = " + fmt(mb) + " ÷ " + paren(twoA) + " = " + fmt(x), t("discZero")]);
      return { answer: iso(v + " = " + fmtFull(x)), steps };
    }
    const sq = fns.sqrt(D);
    steps.push([v + " = (−b ± √D) ÷ 2a = (" + fmt(mb) + " ± √" + fmt(D) + ") ÷ " + paren(twoA) + (sq.exact ? "  ,  √" + fmt(D) + " = " + fmt(sq) : ""), t("quadFormula")]);
    const x1 = ops.divide(ops.add(mb, sq), twoA), x2 = ops.divide(ops.subtract(mb, sq), twoA);
    steps.push([v + "₁ = (" + fmt(mb) + " + " + fmt(sq) + ") ÷ " + paren(twoA) + " = " + fmtShort(x1), ""]);
    steps.push([v + "₂ = (" + fmt(mb) + " − " + fmt(sq) + ") ÷ " + paren(twoA) + " = " + fmtShort(x2), ""]);
    return { answer: iso(v + " = " + fmtShort(x1)) + t("or") + iso(v + " = " + fmtShort(x2)), steps };
  }

  function solveNumeric(f, v, steps) {
    const roots = [];
    const add = r => { if (!roots.some(x => Math.abs(x - r) < 1e-6)) roots.push(r); };
    let px = -100, py = safe(f, px);
    for (let x = -100 + 0.25; x <= 100 && roots.length < 6; x += 0.25) {
      const y = safe(f, x);
      if (y !== null && Math.abs(y) < 1e-12) add(x);
      else if (y !== null && py !== null && py * y < 0) {
        let lo = px, hi = x, flo = py;
        for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2, fm = safe(f, m); if (fm === null) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
        const r = (lo + hi) / 2, fr = safe(f, r);
        if (fr !== null && Math.abs(fr) < 1e-6) add(Math.round(r * 1e8) / 1e8);
      }
      px = x; py = y;
    }
    if (!roots.length) fail(t("noFound"));
    const ans = roots.map(r => v + " " + fmtShort(approxRat(r)).replace(/^(?!≈)/, "= "));
    steps.push([ans.join(" , "), t("numeric", v)]);
    return { answer: ans.map(iso).join(t("or")), steps };
  }
  function safe(f, x) { try { const y = f(x); return typeof y === "number" && isFinite(y) ? y : null; } catch (e) { return null; } }

  function equation(ls, rs) {
    const lhs = M().parse(ls), rhs = M().parse(rs);
    const vars = [...new Set([...symbols(lhs), ...symbols(rhs)])];
    if (vars.length === 0) {
      const a = arithmetic(ls), b = arithmetic(rs);
      const ok = close(val(a.value), val(b.value));
      a.steps.push([fmt(a.value) + (ok ? " = " : " ≠ ") + fmt(b.value), ok ? t("matches", iso(fmt(b.value))) : t("mismatch", iso(fmt(b.value)), iso(fmt(a.value)))]);
      return { answer: a.answer, steps: a.steps };
    }
    if (vars.length > 1) fail(t("multiVars", iso(vars.join(", "))));
    const v = vars[0], cl = lhs.compile(), cr = rhs.compile();
    const steps = [];
    // simplify each side first (brackets, like terms)
    let sl = { steps: [] }, sr = { steps: [] };
    try { sl = simplifySteps(ls, t("left")); } catch (e) { /* leave as is */ }
    try { sr = simplifySteps(rs, t("right")); } catch (e) { /* leave as is */ }
    steps.push(...sl.steps, ...sr.steps);
    if (sl.steps.length || sr.steps.length) steps.push([(sl.steps.length ? sl.result : pretty(ls)) + " = " + (sr.steps.length ? sr.result : pretty(rs)), t("simplified")]);
    const check = x => [evalAt(cl, v, x), evalAt(cr, v, x)];
    const L = linCoef(cl, v), R = linCoef(cr, v);
    if (L && R) return solveLinear(L, R, v, steps, check);
    const f = x => evalAt(cl, v, x) - evalAt(cr, v, x);
    const Q = quadCoef(f);
    if (Q && val(Q.a) === 0) {
      steps.push([combo([[Q.b, v], [Q.c, ""]]) + " = 0", t("x2cancel", v)]);
      return solveLinear({ p: Q.b, q: Q.c }, { p: rat(0), q: rat(0) }, v, steps, check);
    }
    if (Q) return solveQuad(Q, v, steps);
    return solveNumeric(f, v, steps);
  }

  // ---------- algebra ----------
  function algebra(expr) {
    const p = powers(expr);
    if (p) return p;
    const r = simplifySteps(expr);
    if (!r.steps.length) return { answer: pretty(expr), steps: [[pretty(expr), t("already")]] };
    return { answer: r.result, steps: r.steps };
  }

  // ---------- reading the text ----------
  const WORDS_OK = /^(sqrt|sin|cos|tan|abs|pi)$/i;
  function normalize(raw) {
    let s = " " + String(raw) + " ";
    s = s.replace(/[−–—]/g, "-").replace(/[×✕·•∙]/g, "*").replace(/÷/g, "/");
    s = s.replace(/π/g, "pi");
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => "^(" + m.split("").map(c => "0123456789-"["⁰¹²³⁴⁵⁶⁷⁸⁹⁻".indexOf(c)]).join("") + ")");
    s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*of\b/gi, "($1/100)*").replace(/%/g, "/100");
    s = s.replace(/[֐-׿][֐-׿"'״׳]*\s*:?/g, " ");
    s = s.replace(/\b[a-z]{2,}\b\s*:?/gi, w => (WORDS_OK.test(w.replace(/[\s:]/g, "")) ? w : " "));
    s = s.replace(/^\s*(\(?\d{1,2}[.)]|\(?[a-hA-H][.)])\s+/, " ");
    s = s.replace(/^[\s:]+/, "");
    s = s.replace(/:/g, "/");
    s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").replace(/(\d),(\d)/g, "$1.$2");
    s = s.replace(/√\s*\(/g, "sqrt(").replace(/√\s*([0-9.]+|[a-z])/gi, "sqrt($1)");
    s = s.replace(/[?]/g, "").replace(/=\s*$/, "").replace(/[\[{]/g, "(").replace(/[\]}]/g, ")");
    if (!s.includes("=")) s = s.replace(/(\d)\s*[xX]\s*(?=\d)/g, "$1*");
    s = s.replace(/X/g, "x");
    s = s.replace(/(^|[^a-z])([a-z])\s*\(/gi, "$1$2*(");   // x(x-2) means x times (x-2)
    s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, "($1+$2/$3)");
    return s.trim();
  }
  function pretty(s) {
    return String(s).replace(/\s+/g, "")
      .replace(/\^\((-?\d+)\)/g, "^$1")
      .replace(/(\d)\*([a-z(])/gi, "$1$2")
      .replace(/([a-z])\*([a-z(])/gi, "$1$2")
      .replace(/sqrt\(/g, "√(").replace(/\bpi\b/g, "π")
      .replace(/\^(-?\d+)/g, (m, d) => sup(d))
      .replace(/\*/g, " · ").replace(/\//g, "/").replace(/=/g, " = ").replace(/\+/g, " + ")
      .replace(/([\w)²³⁰¹⁴⁵⁶⁷⁸⁹.])-/g, "$1 − ").replace(/-/g, "−");
  }

  function solveOne(raw) {
    const s = normalize(raw);
    if (!/[0-9]/.test(s) && !/[a-z]/i.test(s)) return null;
    const display = pretty(s);
    try {
      const parts = s.split("=");
      if (parts.length > 2) fail(t("multiEq"));
      if (parts.length === 2) {
        if (!parts[0].trim() || !parts[1].trim()) fail(t("emptySide"));
        return Object.assign({ problem: display }, equation(parts[0], parts[1]));
      }
      const fracLit = x => x.replace(/(^|[^\d.\/])(\d+)\/(\d+)(?![\d.\/])/g, "$1frac($2,$3)");
      if (/^\d+$/.test(s) && Number(s) >= 2 && Number(s) <= 1e12) return Object.assign({ problem: display }, factorize(Number(s)));
      const vars = symbols(M().parse(s));
      let r = vars.length ? algebra(s) : powers(s);
      if (!r) r = arithmetic(fracLit(s));
      return { problem: display, answer: r.answer, steps: r.steps };
    } catch (e) {
      return { problem: display, error: e.friendly ? e.message : t("generic") };
    }
  }

  function solve(text, lang) {
    LANG = MSG[lang] ? lang : "en";
    return String(text).split(/\n|;/).map(solveOne).filter(Boolean);
  }

  const api = { solve, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Solver = api;
})(typeof window !== "undefined" ? window : globalThis);
