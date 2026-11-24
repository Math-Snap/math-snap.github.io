// ---------- shapes in a coordinate system (מערכת צירים) ----------
// "A(1,1) B(7,1) C(5,4) D(3,4)": the length of every side (horizontal and vertical by counting, slanted ones with
// Pythagoras), which sides are parallel (same slope), what the shape is (trapezoid, isosceles / right trapezoid,
// parallelogram, rectangle, rhombus, square; right / isosceles triangle), its area and perimeter, and a drawing.
(function (root) {
  "use strict";
  const PT = /(?<![A-Za-z])([A-HK-NP-Z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  function points(s){
    const out = [], seen = new Set();
    for (const m of String(s).replace(/[−–]/g, "-").matchAll(PT)) if (!seen.has(m[1])) { seen.add(m[1]); out.push({ n: m[1], x: +m[2], y: +m[3] }); }
    return out;
  }
  // "AD: y = 3x − 11". A photo of a Hebrew line can read it backwards ("y = 3x - 11 … AD"), so the side's name
  // may come just before or just after the equation; a known point that is (or isn't) on the line decides.
  const EQ = /\by\s*=\s*([-−–]?\s*\d*(?:\.\d+)?(?:\/\d+)?)\s*x\s*(?:([+\-−–])\s*(\d+(?:\.\d+)?(?:\/\d+)?))?/g;
  const SIDE = /(?<![A-Za-z])([A-HK-NP-Z])([A-HK-NP-Z])(?![A-Za-z(])/g;
  const num = t => { t = String(t).replace(/[−–\s]/g, m => /\s/.test(m) ? "" : "-"); if (t === "" || t === "+") return 1; if (t === "-") return -1; if (t.includes("/")) { const [a, b] = t.split("/"); return (a === "-" ? -1 : a === "" ? 1 : +a) / +b; } return +t; };
  function lines(s, pts){
    s = String(s).replace(/[−–]/g, "-"); const out = {}, byN = {}; (pts || points(s)).forEach(p => byN[p.n] = p);
    for (const m of s.matchAll(EQ)) {
      const L = { m: num(m[1]), b: m[3] ? (m[2] === "-" ? -1 : 1) * num(m[3]) : 0 };
      const before = [...s.slice(Math.max(0, m.index - 40), m.index).replace(/[^=]*=/, "").matchAll(SIDE)].map(x => ({ k: x[1] + x[2], d: 0 })).slice(-1);
      const after = [...s.slice(m.index + m[0].length, m.index + m[0].length + 20).split("=")[0].matchAll(SIDE)].map(x => ({ k: x[1] + x[2], d: 1 }));
      const score = c => [...c.k].reduce((a, n) => a + (byN[n] ? (Math.abs(L.m * byN[n].x + L.b - byN[n].y) < 1e-9 ? 2 : -5) : 0), 0) - c.d * 0.5;
      // only sides made of the shape's own letters (a photo also reads stray letters like "NN")
      const own = new Set(Object.keys(byN).concat([...(s.match(/(?<![A-Za-z])[A-HK-NP-Z]{3,4}(?![A-Za-z(])/) || [""])[0]]));
      const best = before.concat(after).filter(c => !out[c.k] && (own.size < 2 || [...c.k].every(n => own.has(n)))).sort((x, y) => score(y) - score(x))[0];
      if (best && score(best) > -5) out[best.k] = L;
    }
    return out;
  }
  // "AB ∥ CD" (a photo may read ∥ as || or ll or 11)
  function pars(s){
    const out = [];
    for (const m of String(s).matchAll(/(?<![A-Za-z])([A-HK-NP-Z]{2})\s*(?:∥|\|\||[|Il1]{2}|\/\/|parallel to|מקביל(?:ה)?\s*ל-?)\s*([A-HK-NP-Z]{2})(?![A-Za-z])/g)) out.push([m[1], m[2]]);
    return out;
  }
  const detect = s => { const n = points(s).length; return n >= 3 || (n >= 2 && Object.keys(lines(s)).length > 0); };

  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const N = v => { const r = Math.round(v * 1000) / 1000; return (Object.is(r, -0) ? 0 : r).toString().replace("-", "−"); };
  const P = v => (v < 0 ? "(" + N(v) + ")" : N(v));
  // √n as k√m (n an integer), with its value
  function root2(n){
    if (Math.abs(n - Math.round(n)) > 1e-9) return { s: "√" + N(n), v: Math.sqrt(n) };
    n = Math.round(n); const r = Math.round(Math.sqrt(n)); if (r * r === n) return { s: N(r), v: r, exact: true };
    let k = 1, m = n; for (let i = Math.floor(Math.sqrt(n)); i > 1; i--) if (n % (i * i) === 0) { k = i; m = n / (i * i); break; }
    return { s: (k > 1 ? k : "") + "√" + m, v: Math.sqrt(n) };
  }
  const approx = r => r.exact ? r.s : r.s + " ≈ " + N(Math.round(r.v * 100) / 100);
  function slopeStr(dx, dy){
    if (dx === 0) return null; if (dy === 0) return "0";
    if (Number.isInteger(dx) && Number.isInteger(dy)) { const g = gcd(dx, dy), s = Math.sign(dx) * Math.sign(dy); const a = Math.abs(dy) / g, b = Math.abs(dx) / g; return (s < 0 ? "−" : "") + (b === 1 ? a : a + "/" + b); }
    return N(dy / dx);
  }

  // a number as a fraction when it is one (½, 3/4), else a decimal
  const VUL = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘" };
  function F(v){
    if (Math.abs(v - Math.round(v)) < 1e-9) return N(Math.round(v));
    for (let d = 2; d <= 60; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) { const a = Math.abs(n) + "/" + d; return (n < 0 ? "−" : "") + (VUL[a] || a); } }
    return N(v);
  }
  const K = v => { const f = F(v); return /\d\/\d/.test(f) ? "(" + f + ")" : f; };   // a coefficient before x
  const eqStr = L => L.vert ? "x = " + F(L.c) : "y = " + (L.m === 0 ? F(L.b) : (L.m === 1 ? "" : L.m === -1 ? "−" : K(L.m)) + "x" + (L.b ? (L.b < 0 ? " − " : " + ") + F(Math.abs(L.b)) : ""));
  const onL = (L, p) => L.vert ? Math.abs(p.x - L.c) < 1e-9 : Math.abs(L.m * p.x + L.b - p.y) < 1e-9;

  // Find what the shape is missing: the slopes of known sides, the equation of a side parallel to a known one
  // through a known vertex, and a missing vertex where two of its sides' lines meet.
  function findMissing(text, pts, W){
    const L = lines(text, pts), PR = pars(text), byN = {}; pts.forEach(p => byN[p.n] = p);
    const nameM = String(text).match(/(?<![A-Za-z])([A-HK-NP-Z]{3,4})(?![A-Za-z(])/);
    const letters = new Set(pts.map(p => p.n)); Object.keys(L).forEach(k => [...k].forEach(c => letters.add(c))); PR.flat().forEach(k => [...k].forEach(c => letters.add(c)));
    const order = nameM && pts.every(p => nameM[1].includes(p.n)) ? [...nameM[1]] : [...letters].sort();
    const missing = order.filter(c => !byN[c]);
    if (!missing.length || (!Object.keys(L).length && !PR.length && !/מקבילית|parallelogram/i.test(text))) return null;
    const steps = [], answer = [], known = {}, drawn = [];
    const key = (a, b) => [a, b].sort().join("");
    for (const [k, v] of Object.entries(L)) { known[key(k[0], k[1])] = v; drawn.push(v);
      for (const c of k) if (byN[c]) steps.push([c + "(" + F(byN[c].x) + ", " + F(byN[c].y) + "):  " + F(v.m) + " · " + P(byN[c].x) + (v.b ? (v.b < 0 ? " − " : " + ") + F(Math.abs(v.b)) : "") + " = " + F(v.m * byN[c].x + v.b) + (onL(v, byN[c]) ? " ✓" : " ✗"), W("Put " + c + " into the equation of " + k + ": it is on the line", "מציבים את " + c + " במשוואת " + k + ": הנקודה על הישר")]); }
    const tag = t => steps.forEach(st => { if (st.length < 3) st.push(t); });
    tag(W("Checking the givens", "בדיקת הנתונים"));
    const slopeOf = (a, b) => { const A = byN[a], B = byN[b]; return A && B ? (B.x === A.x ? null : (B.y - A.y) / (B.x - A.x)) : undefined; };
    // the slope of every side named in a parallel, when both its ends are known
    const slopes = {};
    for (const pr of PR) for (const sd of pr) { const m = slopeOf(sd[0], sd[1]); if (m !== undefined && !(sd in slopes)) { slopes[sd] = m; const A = byN[sd[0]], B = byN[sd[1]];
      steps.push([m === null ? sd + " " + W("is vertical", "אנכי") : "m" + sd + " = (" + F(B.y) + " − " + P(A.y) + ") / (" + F(B.x) + " − " + P(A.x) + ") = " + F(B.y - A.y) + "/" + F(B.x - A.x) + (F(m) === F(B.y - A.y) + "/" + F(B.x - A.x) ? "" : " = " + F(m)), W("Slope = the change in y divided by the change in x", "שיפוע = השינוי ב-y חלקי השינוי ב-x")]);
      answer.push(m === null ? sd + " " + W("vertical", "אנכי") : W("slope of ", "שיפוע ") + sd + " = " + F(m)); tag(W("The slope of ", "שיפוע ") + sd); } }
    // a side parallel to a known one, through one known vertex: y − y₁ = m(x − x₁)
    for (const [s1, s2] of PR) for (const [a, b] of [[s1, s2], [s2, s1]]) {
      if (!(a in slopes) || known[key(b[0], b[1])]) continue;
      const q = byN[b[0]] || byN[b[1]]; if (!q) continue;
      const m = slopes[a], Ln = m === null ? { vert: true, c: q.x } : { m, b: q.y - m * q.x };
      known[key(b[0], b[1])] = Ln; drawn.push(Ln);
      steps.push([m === null ? "x = " + F(q.x) : "y − " + P(q.y) + " = " + K(m) + "(x − " + P(q.x) + ")  →  " + eqStr(Ln), W(b + " ∥ " + a + ": the same slope, through " + q.n, b + " ∥ " + a + ": אותו שיפוע, ועובר דרך " + q.n)]);
      answer.push(b + ": " + eqStr(Ln)); tag(W("The equation of ", "משוואת ") + b);
    }
    // a missing vertex: where two of its sides' lines meet
    for (const v of missing) {
      const through = Object.entries(known).filter(([k]) => k.includes(v)).map(([, l]) => l);
      if (through.length < 2) continue;
      const [l1, l2] = through; let x, y;
      if (l1.vert && l2.vert) continue;
      if (l1.vert || l2.vert) { const vl = l1.vert ? l1 : l2, o = l1.vert ? l2 : l1; x = vl.c; y = o.m * x + o.b; steps.push(["x = " + F(x) + "  →  y = " + F(o.m) + " · " + P(x) + (o.b ? (o.b < 0 ? " − " : " + ") + F(Math.abs(o.b)) : "") + " = " + F(y), W("Put x into the other line", "מציבים את x בישר השני")]); }
      else {
        if (Math.abs(l1.m - l2.m) < 1e-12) continue;
        x = (l2.b - l1.b) / (l1.m - l2.m); y = l1.m * x + l1.b;
        steps.push([eqStr(l1).slice(4) + " = " + eqStr(l2).slice(4), W(v + " is on both lines: equal the two equations", v + " נמצאת על שני הישרים: משווים בין המשוואות")]);
        steps.push([K(l1.m - l2.m) + "x = " + F(l2.b - l1.b) + "  →  x = " + F(x), W("Move x to one side and the numbers to the other", "מעבירים את ה-x לצד אחד ואת המספרים לצד השני")]);
        steps.push(["y = " + K(l1.m) + " · " + (x < 0 ? "(" + F(x) + ")" : F(x)) + (l1.b ? (l1.b < 0 ? " − " : " + ") + F(Math.abs(l1.b)) : "") + " = " + F(y), W("Put x into one of the equations", "מציבים את x באחת המשוואות")]);
      }
      byN[v] = { n: v, x, y }; answer.push(v + "(" + F(x) + ", " + F(y) + ")"); tag(W("The coordinates of ", "שיעורי הקודקוד ") + v);
    }
    // a parallelogram with three vertices: the fourth by the diagonals' midpoint
    if (/מקבילית|parallelogram/i.test(text) && order.length === 4) {
      const v = order.find(c => !byN[c]);
      if (v && order.filter(c => byN[c]).length === 3) { const i = order.indexOf(v), O = byN[order[(i + 2) % 4]], A1 = byN[order[(i + 1) % 4]], A2 = byN[order[(i + 3) % 4]];
        const x = A1.x + A2.x - O.x, y = A1.y + A2.y - O.y; byN[v] = { n: v, x, y };
        steps.push([v + " = " + A1.n + " + " + A2.n + " − " + O.n + " = (" + F(A1.x) + " + " + P(A2.x) + " − " + P(O.x) + ", " + F(A1.y) + " + " + P(A2.y) + " − " + P(O.y) + ") = (" + F(x) + ", " + F(y) + ")", W("In a parallelogram the diagonals bisect each other", "במקבילית האלכסונים חוצים זה את זה")]);
        answer.push(v + "(" + F(x) + ", " + F(y) + ")"); tag(W("The coordinates of ", "שיעורי הקודקוד ") + v); }
    }
    const all = order.every(c => byN[c]);
    if (all) return { done: true, pts: order.map(c => byN[c]), steps, answer, lines: drawn };
    if (!steps.length) return null;
    return { done: false, partial: { problem: pts.map(p => p.n + "(" + F(p.x) + ", " + F(p.y) + ")").join("  "), answer: answer.join(" ,  ") || W("Need one more given", "חסר עוד נתון"), steps, coord: svg(order.filter(c => byN[c]).map(c => byN[c]), drawn, order), kind: "", area: null, perimeter: null } };
  }

  function solve(text, lang){
    const he = lang === "he", W = (en, h) => he ? h : en;
    let pts = points(text);
    const found = findMissing(text, pts, W);
    if (found) { if (!found.done) return found.partial; pts = found.pts; }
    if (pts.length < 3) return null;
    const use = pts.slice(0, 4), name = use.map(p => p.n).join(""), steps = found ? found.steps.slice() : [];
    const seg = (A, B) => {
      const dx = B.x - A.x, dy = B.y - A.y, nm = A.n + B.n;
      if (dy === 0) return { nm, dx, dy, len: Math.abs(dx), ls: N(Math.abs(dx)), kind: "h", step: [nm + " = |" + N(B.x) + " − " + P(A.x) + "| = " + N(Math.abs(dx)), W(nm + " is horizontal (same y): count along the x axis", nm + " אופקי (אותו y): סופרים לאורך ציר x")] };
      if (dx === 0) return { nm, dx, dy, len: Math.abs(dy), ls: N(Math.abs(dy)), kind: "v", step: [nm + " = |" + N(B.y) + " − " + P(A.y) + "| = " + N(Math.abs(dy)), W(nm + " is vertical (same x): count along the y axis", nm + " אנכי (אותו x): סופרים לאורך ציר y")] };
      const r = root2(dx * dx + dy * dy);
      return { nm, dx, dy, len: r.v, ls: r.s, kind: "s", step: [nm + " = √(" + N(Math.abs(dx)) + "² + " + N(Math.abs(dy)) + "²) = √" + N(dx * dx + dy * dy) + (r.s === "√" + N(dx * dx + dy * dy) ? (r.exact ? "" : " ≈ " + N(Math.round(r.v * 100) / 100)) : " = " + approx(r)), W("Pythagoras: horizontal difference " + N(Math.abs(dx)) + ", vertical difference " + N(Math.abs(dy)), "פיתגורס: הפרש אופקי " + N(Math.abs(dx)) + ", הפרש אנכי " + N(Math.abs(dy)))] };
    };
    const par = (s, t) => Math.abs(s.dy * t.dx - t.dy * s.dx) < 1e-9;
    const perp = (s, t) => Math.abs(s.dx * t.dx + s.dy * t.dy) < 1e-9;
    const sameLen = (s, t) => Math.abs(s.len - t.len) < 1e-9;
    const slopeLine = s => { const k = slopeStr(s.dx, s.dy); return k == null ? W(s.nm + " is vertical", s.nm + " אנכי") : W("slope of " + s.nm, "שיפוע " + s.nm) + " = " + P(s.dy) + "/" + P(s.dx) + (P(s.dy) + "/" + P(s.dx) === k ? "" : " = " + k); };
    const parWhy = (s, t) => s.kind === "h" && t.kind === "h" ? W("Both are horizontal, so they are parallel", "שניהם אופקיים, ולכן מקבילים") : s.kind === "v" && t.kind === "v" ? W("Both are vertical, so they are parallel", "שניהם אנכיים, ולכן מקבילים") : W("Same slope, so they are parallel", "אותו שיפוע, ולכן מקבילים");
    // the area of any polygon (the shoelace formula), used when no side is horizontal or vertical
    const shoe = ps => Math.abs(ps.reduce((a, p, i) => { const q = ps[(i + 1) % ps.length]; return a + p.x * q.y - q.x * p.y; }, 0)) / 2;
    let kind = "", answer = [], area = null, per = null;

    if (use.length === 3) {
      const [A, B, C] = use, s = [seg(A, B), seg(B, C), seg(C, A)];
      steps.push([W("The sides", "אורכי הצלעות"), W("Horizontal and vertical sides by counting, slanted ones with Pythagoras", "צלע אופקית או אנכית סופרים, צלע אלכסונית בעזרת פיתגורס")]);
      s.forEach(x => steps.push(x.step));
      const right = [[0, 1, B], [1, 2, C], [2, 0, A]].find(([i, j]) => perp(s[i], s[j]));
      const eqs = [[0, 1], [1, 2], [2, 0]].filter(([i, j]) => sameLen(s[i], s[j]));
      if (right) { kind = W("right triangle", "משולש ישר זווית"); steps.push(["∢" + right[2].n + " = 90°", s[right[0]].kind !== "s" && s[right[1]].kind !== "s" ? W(s[right[0]].nm + " and " + s[right[1]].nm + " are horizontal and vertical", s[right[0]].nm + " ו-" + s[right[1]].nm + " אופקי ואנכי, ולכן מאונכים") : W("The slopes multiply to −1, so the sides are perpendicular", "מכפלת השיפועים היא 1−, ולכן הצלעות מאונכות")]); }
      if (eqs.length === 3) kind = W("equilateral triangle", "משולש שווה צלעות");
      else if (eqs.length) kind = (right ? W("isosceles right triangle", "משולש ישר זווית ושווה שוקיים") : W("isosceles triangle", "משולש שווה שוקיים"));
      if (eqs.length && eqs.length < 3) steps.push([s[eqs[0][0]].nm + " = " + s[eqs[0][1]].nm + " = " + s[eqs[0][0]].ls, W("Two equal sides: an isosceles triangle", "שתי צלעות שוות: משולש שווה שוקיים")]);
      if (!kind) kind = W("triangle", "משולש");
      // area: a horizontal or vertical side as the base, the height by counting
      const b = s.findIndex(x => x.kind !== "s");
      if (b >= 0) {
        const bs = s[b], top = use[(b + 2) % 3], base0 = use[b], h = bs.kind === "h" ? Math.abs(top.y - base0.y) : Math.abs(top.x - base0.x);
        area = bs.len * h / 2;
        steps.push([W("height", "גובה") + " = |" + (bs.kind === "h" ? N(top.y) + " − " + P(base0.y) : N(top.x) + " − " + P(base0.x)) + "| = " + N(h), W("From " + top.n + " straight to the line of " + bs.nm + " (count the squares)", "מ-" + top.n + " ישר אל הקו של " + bs.nm + " (סופרים משבצות)")]);
        steps.push([W("Area", "שטח") + " = " + N(bs.len) + " · " + N(h) + " : 2 = " + N(area), W("Area of a triangle = base × height ÷ 2", "שטח משולש = בסיס × גובה : 2")]);
      } else { area = shoe(use); steps.push([W("Area", "שטח") + " = " + N(area), W("No side is horizontal or vertical: the shoelace formula ½|Σ(x₁y₂ − x₂y₁)|", "אין צלע אופקית או אנכית: נוסחת השרוך ½|Σ(x₁y₂ − x₂y₁)|")]); }
      per = s.reduce((a, x) => a + x.len, 0);
      steps.push([W("Perimeter", "היקף") + " = " + s.map(x => x.ls).join(" + ") + (s.every(x => Number.isInteger(Math.round(x.len * 1e6) / 1e6)) ? " = " + N(per) : " ≈ " + N(Math.round(per * 100) / 100)), W("Add up the sides", "מחברים את כל הצלעות")]);
    } else {
      const [A, B, C, D] = use, s = [seg(A, B), seg(B, C), seg(C, D), seg(D, A)];
      steps.push([W("The sides", "אורכי הצלעות"), W("Horizontal and vertical sides by counting, slanted ones with Pythagoras", "צלע אופקית או אנכית סופרים, צלע אלכסונית בעזרת פיתגורס")]);
      s.forEach(x => steps.push(x.step));
      const p1 = par(s[0], s[2]), p2 = par(s[1], s[3]);
      // which sides are parallel (the slopes, unless both are horizontal or vertical)
      for (const [i, j, p] of [[0, 2, p1], [1, 3, p2]]) {
        if (!(s[i].kind !== "s" && s[i].kind === s[j].kind)) { steps.push([slopeLine(s[i]), W("Slope = change in y ÷ change in x", "שיפוע = השינוי ב-y חלקי השינוי ב-x")]); steps.push([slopeLine(s[j]), p ? W("The same slope as " + s[i].nm, "אותו שיפוע כמו " + s[i].nm) : W("A different slope from " + s[i].nm, "שיפוע שונה מ-" + s[i].nm)]); }
        steps.push([s[i].nm + (p ? " ∥ " : " ∦ ") + s[j].nm, p ? parWhy(s[i], s[j]) : W("Not parallel", "לא מקבילים")]);
      }
      if (p1 && p2) {
        const r = perp(s[0], s[1]), q = sameLen(s[0], s[1]);
        kind = r && q ? W("square", "ריבוע") : r ? W("rectangle", "מלבן") : q ? W("rhombus", "מעוין") : W("parallelogram", "מקבילית");
        steps.push([name + " " + W("is a parallelogram", "מקבילית"), W("Both pairs of opposite sides are parallel", "שני זוגות של צלעות נגדיות מקבילות")]);
        if (r) steps.push(["∢" + B.n + " = 90°", W(s[0].nm + " ⊥ " + s[1].nm + ": a parallelogram with a right angle is a rectangle", s[0].nm + " ⊥ " + s[1].nm + ": מקבילית עם זווית ישרה היא מלבן")]);
        if (q) steps.push([s[0].nm + " = " + s[1].nm, W("Two adjacent sides are equal: " + (r ? "a square" : "a rhombus"), "שתי צלעות סמוכות שוות: " + (r ? "ריבוע" : "מעוין"))]);
        const b = s.findIndex(x => x.kind !== "s");
        if (b >= 0) { const bs = s[b], o = use[(b + 2) % 4], h = bs.kind === "h" ? Math.abs(o.y - use[b].y) : Math.abs(o.x - use[b].x); area = bs.len * h;
          steps.push([W("Area", "שטח") + " = " + N(bs.len) + " · " + N(h) + " = " + N(area), W("Area of a parallelogram = side × the height to it", "שטח מקבילית = צלע × הגובה אליה")]); }
        else { area = shoe(use); steps.push([W("Area", "שטח") + " = " + N(area), W("The shoelace formula ½|Σ(x₁y₂ − x₂y₁)|", "נוסחת השרוך ½|Σ(x₁y₂ − x₂y₁)|")]); }
      } else if (p1 || p2) {
        const [bi, bj, li, lj] = p1 ? [0, 2, 1, 3] : [1, 3, 0, 2], b1 = s[bi], b2 = s[bj], l1 = s[li], l2 = s[lj];
        kind = W("trapezoid", "טרפז");
        steps.push([name + " " + W("is a trapezoid", "טרפז") + " (" + b1.nm + " ∥ " + b2.nm + ")", W("Exactly one pair of opposite sides is parallel", "זוג אחד בלבד של צלעות נגדיות מקבילות")]);
        const right = perp(b1, l1) || perp(b1, l2), iso = sameLen(l1, l2);
        if (iso) { kind = W("isosceles trapezoid", "טרפז שווה שוקיים"); steps.push([l1.nm + " = " + l2.nm + " = " + l1.ls, W("The legs are equal: an isosceles trapezoid", "השוקיים שוות: טרפז שווה שוקיים")]); }
        else steps.push([l1.nm + " ≠ " + l2.nm, W("The legs are not equal: not an isosceles trapezoid", "השוקיים לא שוות: הטרפז לא שווה שוקיים")]);
        if (right) { kind = W("right trapezoid", "טרפז ישר זווית"); const l = perp(b1, l1) ? l1 : l2; steps.push([l.nm + " ⊥ " + b1.nm, W("A leg is perpendicular to the bases: a right trapezoid", "שוק מאונכת לבסיסים: טרפז ישר זווית")]); }
        if (b1.kind !== "s") {
          const P1 = use[bi], O = use[(bi + 2) % 4], h = b1.kind === "h" ? Math.abs(O.y - P1.y) : Math.abs(O.x - P1.x); area = (b1.len + b2.len) * h / 2;
          steps.push([W("height", "גובה") + " = |" + (b1.kind === "h" ? N(O.y) + " − " + P(P1.y) : N(O.x) + " − " + P(P1.x)) + "| = " + N(h), W("The distance between the parallel bases (count the squares)", "המרחק בין הבסיסים המקבילים (סופרים משבצות)")]);
          steps.push([W("Area", "שטח") + " = (" + N(b1.len) + " + " + N(b2.len) + ") · " + N(h) + " : 2 = " + N(area), W("Area of a trapezoid = half the sum of the bases × the height", "שטח טרפז = מחצית המכפלה של סכום הבסיסים בגובה")]);
        } else { area = shoe(use); steps.push([W("Area", "שטח") + " = " + N(area), W("The bases are slanted: the shoelace formula ½|Σ(x₁y₂ − x₂y₁)|", "הבסיסים אלכסוניים: נוסחת השרוך ½|Σ(x₁y₂ − x₂y₁)|")]); }
      } else {
        kind = W("quadrilateral (no parallel sides)", "מרובע (בלי צלעות מקבילות)");
        steps.push([name + " " + W("is not a trapezoid or a parallelogram", "אינו טרפז ואינו מקבילית"), W("No pair of opposite sides is parallel", "אין אף זוג של צלעות נגדיות מקבילות")]);
        area = shoe(use); steps.push([W("Area", "שטח") + " = " + N(area), W("The shoelace formula ½|Σ(x₁y₂ − x₂y₁)|", "נוסחת השרוך ½|Σ(x₁y₂ − x₂y₁)|")]);
      }
      per = s.reduce((a, x) => a + x.len, 0);
      steps.push([W("Perimeter", "היקף") + " = " + s.map(x => x.ls).join(" + ") + (s.every(x => Number.isInteger(Math.round(x.len * 1e6) / 1e6)) ? " = " + N(per) : " ≈ " + N(Math.round(per * 100) / 100)), W("Add up the sides", "מחברים את כל הצלעות")]);
    }
    // stages, for the claim-and-reason view: the sides, what the shape is, its area, its perimeter
    { const sidesT = W("The sides", "אורכי הצלעות");
      steps.forEach(st => { if (st.length >= 3) return; const c = st[0];
        st.push(c === sidesT || /^[A-Z]{2} = (\||√)/.test(c) ? sidesT : /^(Area|שטח|height|גובה)/.test(c) ? W("Area", "שטח") : /^(Perimeter|היקף)/.test(c) ? W("Perimeter", "היקף") : W("What the shape is", use.length === 3 ? "סוג המשולש" : "סוג המרובע")); }); }
    // Hebrew words next to math: keep each piece of math left-to-right
    const iso = t => /[\u0590-\u05FF]/.test(t) ? t.split(" ,  ").map(part => part.replace(/[A-Za-z0-9(|√−+=·:≈∥∦⊥°²/.\-][^\u0590-\u05FF]*[A-Za-z0-9)|°²]/g, m => "\u2066" + m + "\u2069")).join(" ,  ") : t;
    steps.forEach(st => { st[0] = iso(st[0]); });
    answer = (found ? found.answer : []).concat([name + " " + kind, W("area", "שטח") + " " + N(area), W("perimeter", "היקף") + " " + (Number.isInteger(Math.round(per * 1000) / 1000) ? N(per) : "≈ " + N(Math.round(per * 100) / 100))]);
    return { problem: use.map(p => p.n + "(" + N(p.x) + ", " + N(p.y) + ")").join("  "), answer: iso(answer.join(" ,  ")), steps, coord: svg(use, found ? found.lines : null), kind, area, perimeter: per };
  }

  // the drawing: a grid with the axes, the shape and its points
  function svg(ps, lns, order){
    const xs = ps.map(p => p.x).concat(0), ys = ps.map(p => p.y).concat(0);
    const x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + 1;
    const u = Math.max(14, Math.min(34, 320 / Math.max(x1 - x0, y1 - y0))), W = (x1 - x0) * u, H = (y1 - y0) * u;
    const X = x => (x - x0) * u, Y = y => (y1 - y) * u, step = (x1 - x0) > 16 || (y1 - y0) > 16 ? 2 : 1;
    let g = "";
    for (let x = x0; x <= x1; x++) g += `<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${H}" stroke="var(--line,#E1E6EF)" stroke-width="1"/>`;
    for (let y = y0; y <= y1; y++) g += `<line x1="0" y1="${Y(y)}" x2="${W}" y2="${Y(y)}" stroke="var(--line,#E1E6EF)" stroke-width="1"/>`;
    g += `<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" stroke="var(--muted,#5E6A84)" stroke-width="1.6"/><line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${H}" stroke="var(--muted,#5E6A84)" stroke-width="1.6"/>`;
    g += `<text x="${W - 4}" y="${Y(0) - 5}" text-anchor="end" font-size="12" fill="var(--muted,#5E6A84)">x</text><text x="${X(0) + 5}" y="12" font-size="12" fill="var(--muted,#5E6A84)">y</text>`;
    for (let x = x0 + 1; x < x1; x++) if (x && x % step === 0) g += `<text x="${X(x)}" y="${Y(0) + 13}" text-anchor="middle" font-size="10" fill="var(--muted,#5E6A84)">${x}</text>`;
    for (let y = y0 + 1; y < y1; y++) if (y && y % step === 0) g += `<text x="${X(0) - 4}" y="${Y(y) + 3.5}" text-anchor="end" font-size="10" fill="var(--muted,#5E6A84)">${y}</text>`;
    (lns || []).forEach(l => { const a = l.vert ? [l.c, y0] : [x0, l.m * x0 + l.b], b = l.vert ? [l.c, y1] : [x1, l.m * x1 + l.b];
      g += `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="var(--muted,#5E6A84)" stroke-width="1.4" stroke-dasharray="5 4" clip-path="url(#cbox)"/>`; });
    g = `<defs><clipPath id="cbox"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>` + g;
    if (order && order.length > ps.length) { const at = {}; ps.forEach(p => at[p.n] = p);
      order.forEach((c, i) => { const q = order[(i + 1) % order.length]; if (at[c] && at[q]) g += `<line x1="${X(at[c].x)}" y1="${Y(at[c].y)}" x2="${X(at[q].x)}" y2="${Y(at[q].y)}" stroke="var(--pen,#3346E0)" stroke-width="2.4" stroke-linecap="round"/>`; });
    } else g += `<polygon points="${ps.map(p => X(p.x) + "," + Y(p.y)).join(" ")}" fill="var(--pen-soft,#ECEFFE)" fill-opacity=".85" stroke="var(--pen,#3346E0)" stroke-width="2.4" stroke-linejoin="round"/>`;
    const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length, cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    ps.forEach(p => { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, lx = X(p.x) + dx / d * 24, ly = Y(p.y) - dy / d * 18;
      g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.6" fill="var(--pen,#3346E0)"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink,#131A2C)" stroke="var(--surface,#fff)" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${p.n}(${N(p.x)},${N(p.y)})</text>`; });
    return `<svg viewBox="-28 -8 ${W + 56} ${H + 22}" style="width:100%;max-width:420px;direction:ltr" role="img" aria-label="${ps.map(p => p.n).join("")}">${g}</svg>`;
  }
  const api = { detect, points, lines, pars, solve };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Coord = api;
})(typeof window !== "undefined" ? window : globalThis);
