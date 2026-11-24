// ---------- Pro: practice questions made up by topic (study mode) ----------
// A study file often lists topics, not exercises ("חוקי חזקות", "חוק הפילוג המורחב"…). This finds the topics in
// its text and makes new questions for each, with a checker for the student's answer and the solution steps.
// Pure: the solver, math.js and normalize are passed in, so the tests can run it in node.
(function (root) {
  "use strict";
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = n => String(n).split("").map(d => SUP[d]).join("");
  const sg = (n, first) => n < 0 ? (first ? "−" : " − ") + Math.abs(n) : (first ? "" : " + ") + n;
  const lin = (a, b, v = "x") => (a === 1 ? "" : a === -1 ? "−" : a) + v + (b ? sg(b) : "");
  const H = /[֐-׿]/;

  function numOf(env, s){
    const mixed = String(s).trim().replace(/[−–]/g, "-").match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) return (mixed[1] ? -1 : 1) * (+mixed[2] + mixed[3] / mixed[4]);
    try { const v = env.math.evaluate(env.normalize(String(s).replace(/[−–]/g, "-").replace(/:/g, "/").replace(/[°\s]/g, "").replace(/^[a-zA-Z]\s*=/, ""))); return typeof v === "number" ? v : NaN; } catch (e) { return NaN; }
  }
  const near = (a, b) => isFinite(a) && isFinite(b) && Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };

  // what a question is: shown text, the answer shown after, a checker, and the steps
  function viaSolver(env, ask, shown, check){
    let r; try { r = env.solve(ask, env.lang); } catch (e) { r = null; }
    if (!r || r.length !== 1 || r[0].error) return null;
    return { problem: shown, answer: r[0].answer, result: Object.assign({}, r[0], { problem: shown }), check: check || (v => env.sameAnswer(r[0].answer, v)) };
  }
  const word = (env, text, answer, value, steps) => ({ problem: text, answer: String(answer), result: { problem: text, answer: String(answer), steps }, check: v => near(numOf(env, v), value) });
  const T = (env, en, he) => env.lang === "he" ? he : en;

  const TOPICS = [
    { id: "powers", en: "Power laws", he: "חוקי חזקות", re: /חזק|מעריך|\bpowers?\b|exponent/i, make(env){
      const a = R(2, 5), m = R(2, 5), n = R(2, 4);
      const [ask, shown, val] = pickOne([
        [a + sup(m) + " · " + a + sup(n), a + sup(m) + " · " + a + sup(n), Math.pow(a, m + n)],
        [a + "^" + (m + n) + " : " + a + "^" + n, a + sup(m + n) + " : " + a + sup(n), Math.pow(a, m)],
        ["(" + a + sup(2) + ")" + sup(n), "(" + a + sup(2) + ")" + sup(n), Math.pow(a, 2 * n)],
        [a + "^0 · " + a + sup(m), a + "⁰ · " + a + sup(m), Math.pow(a, m)],
      ]);
      return viaSolver(env, ask, shown, v => near(numOf(env, v), val));
    } },
    { id: "primes", en: "Prime factorization", he: "פירוק לגורמים ראשוניים", re: /ראשוני|prime/i, make(env){
      let n = 1; const ps = [2, 2, 2, 3, 3, 5, 5, 7, 11]; const k = R(3, 5);
      for (let i = 0; i < k; i++) n *= pickOne(ps); if (n < 20 || n > 2000) n = pickOne([60, 72, 84, 90, 120, 180, 210, 252, 360, 420]);
      const q = viaSolver(env, "פרק לגורמים ראשוניים " + n, T(env, "Prime factorization of " + n, "פרקו לגורמים ראשוניים: " + n), v => {
        const parts = String(v).replace(/\s/g, "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => "^" + [...m].map(c => SUP.indexOf(c)).join("")).split(/[·*×x.]/);
        if (!parts.length || parts.some(p => !/^\d+(\^\d+)?$/.test(p))) return false;
        let prod = 1; for (const p of parts) { const [b, e] = p.split("^").map(Number); if (!isPrime(b)) return false; prod *= Math.pow(b, e || 1); }
        return prod === n;
      });
      return q;
    } },
    { id: "factor", en: "Factoring", he: "פירוק לגורמים", re: /פירוק\s+לגורמים(?!\s*ראשוני)|פרקו\s+לגורמים(?!\s*ראשוני)|גורם\s+משותף|טרינום|נוסחאות\s+הכפל|\bfactor(ing|ise|ize)?\b(?!.*prime)/i, make(env){
      const kind = R(0, 3); let ex;
      if (kind === 0) { const p = R(1, 6) * pickOne([1, -1]), q = R(1, 7) * pickOne([1, -1]); if (p + q === 0) return null; ex = "x^2" + (p + q === 1 ? " + x" : p + q === -1 ? " - x" : (p + q > 0 ? " + " : " - ") + Math.abs(p + q) + "x") + (p * q > 0 ? " + " : " - ") + Math.abs(p * q); }
      else if (kind === 1) { const a = R(2, 9); ex = "x^2 - " + a * a; }
      else if (kind === 2) { const k = R(2, 6), a = R(1, 7); ex = k + "x^2 + " + k * a + "x"; }
      else { const a = R(1, 6); ex = "x^2 + " + 2 * a + "x + " + a * a; }
      const shown = ex.replace(/\^2/g, "²");
      return viaSolver(env, "פרק לגורמים " + ex, T(env, "Factor: " + shown, "פרקו לגורמים: " + shown), v => /\(/.test(v) && env.sameExpr(ex, String(v).replace(/[−–]/g, "-")) === true);
    } },
    { id: "distrib", en: "Distributive law", he: "חוק הפילוג", re: /פילוג|כפל\s+מקוצר|הכפל\s+המקוצר|distributive|expand/i, make(env){
      const a = R(1, 3), b = R(1, 7) * pickOne([1, -1]), c = R(1, 2), d = R(1, 7) * pickOne([1, -1]);
      const ex = "(" + lin(a, b) + ")(" + lin(c, d) + ")";
      return viaSolver(env, ex.replace(/−/g, "-"), T(env, "Expand: ", "פתחו סוגריים: ") + ex, v => !/\(/.test(v) && env.sameExpr(ex.replace(/−/g, "-"), String(v).replace(/[−–]/g, "-")) === true);
    } },
    { id: "linear", en: "Linear equations", he: "משוואות", re: /משווא(?!ה\s*ריבועית)|equation/i, make(env){
      const x = R(-6, 9), a = R(2, 7), b = R(-12, 12), c = R(1, 4) * pickOne([1, -1]);
      if (a === c) return null;
      const ask = pickOne([lin(a, b) + " = " + (a * x + b), lin(a, b) + " = " + lin(c, a * x + b - c * x)]);
      return viaSolver(env, ask.replace(/−/g, "-"), ask);
    } },
    { id: "quadratic", en: "Quadratic equations", he: "משוואה ריבועית", re: /ריבועית|נוסחת\s+השורשים|quadratic/i, make(env){
      const p = R(-6, 6), q = R(-6, 6); if (p === q) return null;
      const s = -(p + q), t = p * q;
      const ask = "x² " + (s ? (s > 0 ? "+ " : "− ") + (Math.abs(s) === 1 ? "" : Math.abs(s)) + "x " : "") + (t ? (t > 0 ? "+ " : "− ") + Math.abs(t) + " " : "") + "= 0";
      return viaSolver(env, ask.replace(/−/g, "-"), ask);
    } },
    { id: "ineq", en: "Inequalities", he: "אי-שוויונים", re: /אי[\s־-]?שוויון|inequalit/i, make(env){
      const x = R(-5, 8), a = R(2, 6), b = R(-10, 10), op = pickOne([">", "<", "≥", "≤"]);
      const ask = lin(a, b) + " " + op + " " + (a * x + b);
      return viaSolver(env, ask.replace(/−/g, "-").replace("≥", ">=").replace("≤", "<="), ask);
    } },
    { id: "fractions", en: "Fractions", he: "שברים", re: /שבר|fraction/i, make(env){
      const b = R(2, 9), d = R(2, 9), a = R(1, b - 1), c = R(1, d - 1), op = pickOne(["+", "−", "·", ":"]);
      const ask = a + "/" + b + " " + op + " " + c + "/" + d;
      const val = op === "+" ? a / b + c / d : op === "−" ? a / b - c / d : op === "·" ? a * c / (b * d) : a * d / (b * c);
      return viaSolver(env, ask.replace("−", "-").replace("·", "*").replace(":", "/"), ask, v => near(numOf(env, v), val));
    } },
    { id: "percent", en: "Percent", he: "אחוזים", re: /אחוז|percent|%/i, make(env){
      const p = pickOne([5, 10, 15, 20, 25, 30, 40, 50, 75]), n = pickOne([20, 40, 60, 80, 120, 200, 240, 300, 400]);
      return viaSolver(env, p + "% of " + n, T(env, p + "% of " + n, p + "% מתוך " + n), v => near(numOf(env, v), p * n / 100));
    } },
    { id: "roots", en: "Square roots", he: "שורשים", re: /שורש(?!ים\s+של\s+משוואה)|square\s+root|√/i, make(env){
      const a = R(2, 15); return viaSolver(env, "√" + a * a, "√" + a * a, v => near(numOf(env, v), a));
    } },
    { id: "isosceles", en: "Isosceles triangle", he: "משולש שווה שוקיים", re: /שווה[\s־-]?שוקיים|isosceles/i, make(env){
      if (Math.random() < .5) {
        const top = R(2, 16) * 10, base = (180 - top) / 2;
        return word(env, T(env, "In an isosceles triangle the apex angle is " + top + "°. What is each base angle?", "במשולש שווה שוקיים זווית הראש היא " + top + "°. מה גודל כל אחת מזוויות הבסיס?"), base + "°", base,
          [["180° − " + top + "° = " + (180 - top) + "°", T(env, "The angles of a triangle add up to 180°", "סכום הזוויות במשולש הוא 180°")], [(180 - top) + "° : 2 = " + base + "°", T(env, "The base angles are equal", "זוויות הבסיס שוות")]]);
      }
      const base = R(3, 8) * 10, top = 180 - 2 * base;
      return word(env, T(env, "In an isosceles triangle each base angle is " + base + "°. What is the apex angle?", "במשולש שווה שוקיים כל זווית בסיס היא " + base + "°. מה גודל זווית הראש?"), top + "°", top,
        [["2 · " + base + "° = " + 2 * base + "°", T(env, "The two base angles are equal", "שתי זוויות הבסיס שוות")], ["180° − " + 2 * base + "° = " + top + "°", T(env, "The angles of a triangle add up to 180°", "סכום הזוויות במשולש הוא 180°")]]);
    } },
    { id: "angles", en: "Angles in a triangle", he: "זוויות במשולש", re: /סכום\s+(ה)?זוויות|זוויות\s+במשולש|angle\s+sum|angles\s+of\s+a\s+triangle/i, make(env){
      const a = R(3, 9) * 10, b = R(2, 15 - a / 10) * 10, c = 180 - a - b; if (c <= 0) return null;
      return word(env, T(env, "Two angles of a triangle are " + a + "° and " + b + "°. What is the third angle?", "שתי זוויות במשולש הן " + a + "° ו-" + b + "°. מה גודל הזווית השלישית?"), c + "°", c,
        [["180° − " + a + "° − " + b + "° = " + c + "°", T(env, "The angles of a triangle add up to 180°", "סכום הזוויות במשולש הוא 180°")]]);
    } },
    { id: "pythag", en: "Pythagoras", he: "משפט פיתגורס", re: /פיתגורס|pythagor/i, make(env){
      const k = R(1, 4), [a, b, c] = pickOne([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]).map(v => v * k);
      return word(env, T(env, "A right triangle has legs " + a + " and " + b + ". How long is the hypotenuse?", "במשולש ישר זווית הניצבים הם " + a + " ו-" + b + ". מה אורך היתר?"), c, c,
        [[a + "² + " + b + "² = " + (a * a) + " + " + (b * b) + " = " + c * c, T(env, "Pythagoras: a² + b² = c²", "משפט פיתגורס: a² + b² = c²")], ["c = √" + c * c + " = " + c, T(env, "Take the square root", "מוציאים שורש")]]);
    } },
    { id: "area", en: "Area and perimeter", he: "שטח והיקף", re: /שטח|היקף|area|perimeter/i, make(env){
      const a = R(3, 15), b = R(2, 12);
      if (Math.random() < .5) return word(env, T(env, "A rectangle is " + a + " by " + b + ". What is its area?", "מלבן שאורכו " + a + " ורוחבו " + b + ". מה השטח שלו?"), a * b, a * b, [[a + " · " + b + " = " + a * b, T(env, "Area of a rectangle = length × width", "שטח מלבן = אורך × רוחב")]]);
      const h = R(2, 10) * 2; return word(env, T(env, "A triangle has base " + a + " and height " + h + ". What is its area?", "משולש שהבסיס שלו " + a + " והגובה " + h + ". מה השטח שלו?"), a * h / 2, a * h / 2, [[a + " · " + h + " : 2 = " + a * h / 2, T(env, "Area of a triangle = base × height ÷ 2", "שטח משולש = בסיס × גובה : 2")]]);
    } },
    { id: "trapezoid", en: "Trapezoid", he: "טרפז", re: /טרפז|trapezoid/i, make(env){
      const k = R(0, 2);
      if (k === 0) { const a = R(4, 14) * 10 % 170 || 70; const A = Math.min(a, 160);
        return word(env, T(env, "In trapezoid ABCD (AB ∥ CD), ∢A = " + A + "°. What is ∢D?", "בטרפז ABCD (AB ∥ CD) זווית A היא " + A + "°. מה גודל זווית D?"), (180 - A) + "°", 180 - A,
          [["∢D = 180° − " + A + "° = " + (180 - A) + "°", T(env, "The two angles at each leg of a trapezoid add up to 180°", "סכום הזוויות ליד כל שוק בטרפז הוא 180°")]]); }
      if (k === 1) { const A = R(5, 8) * 10; const C = 180 - A;
        return word(env, T(env, "In isosceles trapezoid ABCD (AB ∥ CD), ∢A = " + A + "°. What is ∢C?", "בטרפז שווה שוקיים ABCD (AB ∥ CD) זווית A היא " + A + "°. מה גודל זווית C?"), C + "°", C,
          [["∢B = ∢A = " + A + "°", T(env, "In an isosceles trapezoid the angles at each base are equal", "בטרפז שווה שוקיים הזוויות ליד כל בסיס שוות")], ["∢C = 180° − " + A + "° = " + C + "°", T(env, "The angles at a leg add up to 180°", "סכום הזוויות ליד שוק הוא 180°")]]); }
      const a = R(4, 14), b = R(2, a - 1), h = R(1, 6) * 2, S = (a + b) * h / 2;
      return word(env, T(env, "A trapezoid has bases " + a + " and " + b + " and height " + h + ". What is its area?", "בטרפז הבסיסים הם " + a + " ו-" + b + " והגובה " + h + ". מה השטח שלו?"), S, S,
        [["(" + a + " + " + b + ") · " + h + " : 2 = " + S, T(env, "Area of a trapezoid = half the sum of the bases × the height", "שטח טרפז = מחצית המכפלה של סכום הבסיסים בגובה")]]);
    } },
    { id: "coord", en: "Coordinate system", he: "מערכת צירים", re: /מערכת\s+צירים|במערכת\s+הצירים|צירים|coordinate/i, make(env){
      const y1 = R(-2, 2), h = R(2, 5), x1 = R(-3, 1), a = R(4, 8), b = R(1, a - 1), off = R(0, a - b), S = (a + b) * h / 2;
      const P = [[x1, y1], [x1 + a, y1], [x1 + off + b, y1 + h], [x1 + off, y1 + h]].map(([x, y], i) => "ABCD"[i] + "(" + x + "," + y + ")").join(" ");
      return word(env, T(env, "Trapezoid " + P + ". What is its area?", "הטרפז " + P + ". מה השטח שלו?"), S, S,
        [["AB = " + a + " ,  CD = " + b, T(env, "The bases are horizontal: count along the x axis", "הבסיסים אופקיים: סופרים לאורך ציר x")], [T(env, "height", "גובה") + " = " + h, T(env, "The difference in y between the bases", "ההפרש ב-y בין הבסיסים")], ["(" + a + " + " + b + ") · " + h + " : 2 = " + S, T(env, "Area of a trapezoid", "שטח טרפז")]]);
    } },
    { id: "slope", en: "Linear functions", he: "פונקציה קווית", re: /פונקציה\s+קווית|שיפוע|slope|linear\s+function/i, make(env){
      const m = R(-4, 5) || 2, x1 = R(-3, 3), y1 = R(-5, 5), x2 = x1 + R(1, 4), y2 = y1 + m * (x2 - x1);
      return word(env, T(env, "What is the slope of the line through (" + x1 + ", " + y1 + ") and (" + x2 + ", " + y2 + ")?", "מה השיפוע של הישר שעובר דרך הנקודות (" + x1 + ", " + y1 + ") ו-(" + x2 + ", " + y2 + ")?"), m, m,
        [["m = (" + y2 + " − " + (y1 < 0 ? "(" + y1 + ")" : y1) + ") / (" + x2 + " − " + (x1 < 0 ? "(" + x1 + ")" : x1) + ") = " + (y2 - y1) + " / " + (x2 - x1) + " = " + m, T(env, "Slope = change in y ÷ change in x", "שיפוע = השינוי ב-y חלקי השינוי ב-x")]]);
    } },
    { id: "sequences", en: "Sequences", he: "סדרות", re: /סדר(ה|ות)\s+(חשבונית|הנדסית)|סדרות|sequence/i, make(env){
      const a1 = R(-5, 10), d = R(2, 7) * pickOne([1, -1]), n = R(8, 20), an = a1 + (n - 1) * d;
      return word(env, T(env, "An arithmetic sequence starts " + a1 + ", " + (a1 + d) + ", " + (a1 + 2 * d) + ", … What is term number " + n + "?", "סדרה חשבונית מתחילה " + a1 + ", " + (a1 + d) + ", " + (a1 + 2 * d) + ", … מה האיבר ה-" + n + "?"), an, an,
        [["d = " + (a1 + d) + " − " + (a1 < 0 ? "(" + a1 + ")" : a1) + " = " + d, T(env, "The difference between terms", "ההפרש בין האיברים")], ["a" + n + " = " + a1 + " + (" + n + " − 1) · " + (d < 0 ? "(" + d + ")" : d) + " = " + an, "aₙ = a₁ + (n − 1)·d"]]);
    } },
    { id: "mean", en: "Mean (average)", he: "ממוצע", re: /ממוצע|mean|average/i, make(env){
      const k = R(4, 6), m = R(5, 20), xs = Array.from({ length: k }, () => m + R(-6, 6)); const s = xs.reduce((a, b) => a + b, 0); xs[k - 1] += (m * k - s); if (xs[k - 1] < 0) return null;
      return word(env, T(env, "What is the mean of " + xs.join(", ") + "?", "מה הממוצע של " + xs.join(", ") + "?"), m, m, [[xs.join(" + ") + " = " + m * k, T(env, "Add them up", "מחברים את כל המספרים")], [m * k + " : " + k + " = " + m, T(env, "Divide by how many there are", "מחלקים בכמות המספרים")]]);
    } },
  ];
  // a hint in the answer box that shows the kind of answer, not the answer
  const PH = { powers: "256", primes: "2³ · 3 · 5", factor: "(x + 1)(x − 2)", distrib: "x² + 3x + 2", linear: "x = 4", quadratic: "x = 1 , x = 2", ineq: "x > 3",
    fractions: "5/6", trapezoid: "110", coord: "18", percent: "12", roots: "7", isosceles: "50", angles: "60", pythag: "10", area: "24", slope: "2", sequences: "35", mean: "8" };
  const DEFAULT = ["linear", "powers", "distrib", "factor", "fractions", "percent"];

  function detect(text){
    const t = String(text || "");
    return TOPICS.filter(x => x.re.test(t)).map(x => x.id);
  }
  // `count` new questions, taking turns between the topics
  function make(ids, env, count = 10){
    const list = (ids && ids.length ? ids : DEFAULT).map(id => TOPICS.find(x => x.id === id)).filter(Boolean);
    const out = [], seen = new Set();
    for (let tries = 0; out.length < count && tries < count * 12; tries++) {
      const tp = list[tries % list.length];
      let q = null; try { q = tp.make(env); } catch (e) { q = null; }
      if (!q || seen.has(q.problem)) continue;
      seen.add(q.problem); q.topic = tp.id; q.rtl = H.test(q.problem); q.ph = PH[tp.id] || ""; out.push(q);
    }
    return out;
  }
  const api = { TOPICS: TOPICS.map(({ id, en, he }) => ({ id, en, he })), DEFAULT, detect, make };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Topics = api;
})(typeof window !== "undefined" ? window : globalThis);
