// ---------- Pro: practice problems and checking a student's own work ----------
// Pure functions (no page access), shared by the app and the tests.
(function (root) {
  "use strict";
  const clean = s => String(s).replace(/[⁦-⁩]/g, "").replace(/[−–]/g, "-").replace(/ /g, " ");
  const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

  // numbers in an answer, as values: "17/12", "-2.5", "3"
  function numsOf(s){
    const t = clean(s).replace(/[⁰-⁹¹²³]/g, c => "^" + SUP[c]);
    const out = [];
    for (const m of t.matchAll(/(-?\s*\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/g)) {
      const a = parseFloat(m[1].replace(/\s+/g, "")), b = m[2] ? parseFloat(m[2]) : 1;
      if (b) out.push(a / b);
    }
    return out;
  }
  const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  const sameSet = (A, B) => {
    const a = [...A].sort((x, y) => x - y), b = [...B].sort((x, y) => x - y);
    const ua = a.filter((x, i) => !i || !near(x, a[i - 1])), ub = b.filter((x, i) => !i || !near(x, b[i - 1]));
    return ua.length === ub.length && ua.every((x, i) => near(x, ub[i]));
  };

  // An answer as something to compare: pairs "x = 3", relations "x > 2", or just numbers.
  // Returns null when the answer can't be checked by numbers (an expression, words, roots, π…).
  function key(ans){
    let t = clean(ans).replace(/\s+/g, " ").trim();
    t = t.replace(/<=/g, "≤").replace(/>=/g, "≥");
    // drop the extra forms the solver adds: "≈ 3.8" and the mixed number "= 3 4/5"
    t = t.replace(/\s*≈\s*-?\s*\d+(?:\.\d+)?/g, "").replace(/=\s*-?\s*\d+\s+\d+\s*\/\s*\d+/g, "");
    // "2⁸ = 256" or "(10·9·8) ÷ 3! = 120": a plain number answer is the last part
    if (!/[a-zA-Z]\s*[₀-₉]*\s*[=<>≤≥]|[=<>≤≥]\s*[a-zA-Z]/.test(t) && t.includes("=")) t = t.split("=").pop().trim();
    if (!t || /√|π|∞|\be\b|log|ln|sin|cos|tan|\bi\b/.test(t)) return null;
    const pairs = {}, rel = [];
    // "x = 3", "y = -2", "x₁ = 4", "a = 1/2"
    const rest = t.replace(/\b([a-zA-Z])\s*[₀-₉]*\s*(=|<|>|≤|≥)\s*(-?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)/g, (m, v, op, n) => {
      const val = numsOf(n)[0];
      if (op === "=") (pairs[v] = pairs[v] || []).push(val); else rel.push(v + op + val);
      return " ";
    }).replace(/(-?\s*\d+(?:\.\d+)?)\s*(<|>|≤|≥)\s*([a-zA-Z])/g, (m, n, op, v) => {
      const flip = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[op];
      rel.push(v + flip + numsOf(n)[0]); return " ";
    });
    const leftover = rest.replace(/\b(or|and|או|וגם|ו)\b|[,;:()]|או|\s/g, "");
    const loose = numsOf(rest);
    // anything other than numbers left → not a number answer
    if (/[a-zA-Zא-ת]/.test(leftover.replace(/\d|\.|\/|-/g, ""))) return null;
    if (!Object.keys(pairs).length && !rel.length && !loose.length) return null;
    return { pairs, rel: rel.sort(), loose };
  }
  function sameAnswer(a, b){
    const A = typeof a === "string" ? key(a) : a, B = typeof b === "string" ? key(b) : b;
    if (!A || !B) return false;
    const vars = new Set([...Object.keys(A.pairs), ...Object.keys(B.pairs)]);
    // a bare number counts as the value of the only variable ("3" for "x = 3")
    const pa = { ...A.pairs }, pb = { ...B.pairs };
    if (vars.size === 1) { const v = [...vars][0]; if (A.loose.length && !pa[v]) pa[v] = A.loose; if (B.loose.length && !pb[v]) pb[v] = B.loose; }
    for (const v of vars) if (!pa[v] || !pb[v] || !sameSet(pa[v], pb[v])) return false;
    if (A.rel.length || B.rel.length) {
      if (A.rel.length !== B.rel.length) return false;
      const norm = r => r.replace(/(-?\d+(?:\.\d+)?(?:e-?\d+)?)$/, n => String(Math.round(parseFloat(n) * 1e6) / 1e6));
      if (!A.rel.every((r, i) => norm(r) === norm(B.rel[i]))) return false;
    }
    if (!vars.size && !A.rel.length) return sameSet(A.loose, B.loose);
    return true;
  }

  // ---------- practice: the same kind of problem with new numbers ----------
  function rnd(n){ return Math.floor(Math.random() * n); }
  function mutate(src){
    // numbers that are not exponents, not right after a letter (log2, x1) and not part of ^(...)
    let changed = 0;
    const out = src.replace(/(\^\s*\(?\s*-?\d+(?:\.\d+)?\)?)|([A-Za-z_]\d+)|(\d+(?:\.\d+)?)/g, (m, pow, glued, num, off, all) => {
      if (pow || glued) return m;
      if (/[²³⁴⁵⁶⁷⁸⁹¹⁰]/.test(all[off - 1] || "")) return m;
      const v = parseFloat(num);
      if (v === 0 || v === 1) return m;
      if (num.includes(".")) { changed++; return String(Math.max(0.5, Math.round((v + (rnd(9) - 4) * 0.5) * 10) / 10)); }
      if (v > 360) return m;
      let w = v;
      for (let k = 0; k < 6 && w === v; k++) w = Math.max(2, v + rnd(11) - 5);
      if (w !== v) changed++;
      return String(w);
    });
    return changed ? out : null;
  }
  // strict: whole numbers only. Otherwise simple fractions and short decimals are fine too
  const nice = (ans, strict) => {
    const k = key(ans); if (!k) return false;
    const all = [...Object.values(k.pairs).flat(), ...k.loose, ...k.rel.map(r => parseFloat(r.replace(/^.[<>≤≥]/, "")))];
    return all.length > 0 && all.every(x => isFinite(x) && Math.abs(x) < 1e4 && (Number.isInteger(x) || (!strict && Number.isInteger(Math.round(x * 1e6) / 1e6 * 20))));
  };
  // up to `count` problems like `src`, each { problem, answer, result }
  function practice(solve, src, lang, count = 5){
    let base; try { base = solve(src, lang); } catch (e) { return []; }
    if (!base.length || base.length > 1 || base[0].error || !key(base[0].answer)) return [];
    const seen = new Set([src.replace(/\s+/g, "")]), out = [];
    const whole = nice(base[0].answer, true); // whole-number answers stay whole; fraction problems keep fractions
    for (let tries = 0; tries < 120 && out.length < count; tries++) {
      const p = mutate(src); if (!p) break;
      const k = p.replace(/\s+/g, ""); if (seen.has(k)) continue; seen.add(k);
      let r; try { r = solve(p, lang); } catch (e) { continue; }
      if (r.length !== 1 || r[0].error || !nice(r[0].answer, whole && tries < 80) || (!whole && nice(r[0].answer, true) && tries < 60)) continue;
      out.push({ problem: p, answer: r[0].answer, result: r[0] });
    }
    return out;
  }
  const canPractice = (solve, src, lang) => { try { const r = solve(src, lang); return r.length === 1 && !r[0].error && !!key(r[0].answer); } catch (e) { return false; } };

  // ---------- checking a student's own work, line by line ----------
  // Each line is an equation/inequality (compared by its solutions) or an expression (compared by value).
  function evalAt(math, normalize, expr, scope){
    try { const v = math.evaluate(normalize(expr), scope); return typeof v === "number" ? v : (v && typeof v.re === "number" && Math.abs(v.im) < 1e-9 ? v.re : NaN); } catch (e) { return NaN; }
  }
  function sameExpr(math, normalize, a, b){
    const vars = [...new Set((a + " " + b).match(/(?<![a-z])[a-z](?![a-z])/gi) || [])].filter(v => v !== "e");
    let tested = 0;
    for (let t = 0; t < 8; t++) {
      const scope = {}; vars.forEach(v => scope[v] = 0.7 + Math.random() * 2.3 + t * 0.37);
      const x = evalAt(math, normalize, a, scope), y = evalAt(math, normalize, b, scope);
      if (!isFinite(x) || !isFinite(y)) continue;
      tested++;
      if (Math.abs(x - y) > 1e-6 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
    }
    return tested > 0 ? true : null;
  }
  function checkWork(solve, math, normalize, text, lang){
    const lines = String(text).split("\n").map(s => s.trim()).filter(Boolean);
    const rows = [];
    let firstEq = null, prevEq = null, prevExpr = null, firstExpr = null, firstBad = -1;
    lines.forEach((line, i) => {
      let L = line.replace(/^[⇐⇒→]+\s*/, "");
      const isRel = /[=<>≤≥]/.test(L.replace(/^=/, ""));
      if (L.startsWith("=")) L = L.slice(1).trim();
      if (isRel) {
        let r; try { r = solve(L, lang); } catch (e) { r = null; }
        const k = r && r.length === 1 && !r[0].error ? key(r[0].answer) : null;
        if (!k) { rows.push({ line, status: "unknown" }); return; }
        if (!firstEq) { firstEq = { k, answer: r[0].answer }; prevEq = firstEq; rows.push({ line, status: "start", answer: r[0].answer }); return; }
        // the same solutions as the first line = still right. After a mistake, a line that follows
        // correctly from the line before it is not marked again (only the step where it went wrong is)
        const ok = sameAnswer(firstEq.k, k), follows = sameAnswer(prevEq.k, k);
        const status = ok ? "ok" : firstBad >= 0 && follows ? "after" : "bad";
        rows.push({ line, status, answer: r[0].answer, expected: prevEq.answer, correct: firstEq.answer });
        if (status === "bad" && firstBad < 0) firstBad = rows.length - 1;
        prevEq = { k, answer: r[0].answer };
        prevExpr = null;
      } else {
        if (prevExpr == null) { prevExpr = firstExpr = L; rows.push({ line, status: "start" }); return; }
        const same = sameExpr(math, normalize, firstExpr, L);
        if (same === null) { rows.push({ line, status: "unknown" }); return; }
        const status = same ? "ok" : firstBad >= 0 && sameExpr(math, normalize, prevExpr, L) ? "after" : "bad";
        rows.push({ line, status });
        if (status === "bad" && firstBad < 0) firstBad = rows.length - 1;
        prevExpr = L;
      }
    });
    const final = firstEq && prevEq ? sameAnswer(firstEq.k, prevEq.k) : null;
    return { rows, firstBad, final, correct: firstEq ? firstEq.answer : null };
  }

  const api = { key, sameAnswer, mutate, practice, canPractice, checkWork, sameExpr, numsOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.ProCore = api;
})(typeof window !== "undefined" ? window : globalThis);
