/* Math Snap: geometry problems with several shapes and named points, like the ones in the bagrut.
   "Triangle ABC is isosceles and right-angled, D and E are on AB and AC, triangle ADE is isosceles.
    Find angle ABC. Prove that BCED is an isosceles trapezoid."
   The problem is read into points, shapes and facts. A small drawing is built from the shapes (only to know
   which rays are the same ray, which points are on one line and on which side of a line a point lies), and
   then theorems are applied until the goals are reached. Every fact remembers why it is true, so the
   answer comes out as a two-column proof: claim and reason. */
(function (root) {
  "use strict";
  const EPS = 1e-6;
  const R = v => { const r = Math.round(v * 10000) / 10000; return String(Object.is(r, -0) ? 0 : r); };
  const LET = "[A-H]";
  const sortSeg = s => s[0] < s[1] ? s : s[1] + s[0];

  // ---------- reading the problem ----------
  function clean(s){
    return String(s || "").replace(/[∢∠]/g, " זווית ").replace(/Δ/g, " משולש ").replace(/∥/g, " מקביל ל-")
      .replace(/[“”"']/g, "").replace(/ו-\s*(?=[A-Ha-h])/g, " ").replace(/(?<![A-Za-z])([a-h]{1,4})(?![A-Za-z])/g, m => m.toUpperCase());
  }
  const isGoalLine = l => /(?<![א-ת])(?:הוכיחו?|להוכיח|חשבו?|מצאו?|כמה|מהי|מהו)(?![א-ת])|צ"ל|צ״ל|\bprove\b|\bshow that\b|\bfind\b|\bcalculate\b/i.test(l);

  function parse(givens, ask){
    const P = { tris: [], quads: [], on: [], par: [], segEq: [], angVal: [], angEq: [], bis: [], heights: [], medians: [], goals: [], notes: [] };
    const all = clean(givens).split(/\n|[.;]\s|,(?=\s*(?:ה?נקוד|ה?משולש|triangle|point))/).map(s => s.trim()).filter(Boolean);
    const goalLines = clean(ask).split(/\n|[.;]\s/).map(s => s.trim()).filter(Boolean);
    const givenLines = [];
    for (const l of all) (isGoalLine(l) && !/נתון/.test(l) ? goalLines : givenLines).push(l);
    for (const l of givenLines) readGiven(l, P);
    for (const l of goalLines) { if (/נתון|given/i.test(l)) readGiven(l, P); readGoal(l, P); }
    return P;
  }
  function readGiven(l, P){
    // triangles with their kind
    for (const m of l.matchAll(new RegExp("(?:משולש|triangle)(?![א-ת])[^A-Z\\n]{0,40}?(" + LET + "{3})(?!" + LET + ")", "gi"))) {
      const name = m[1];
      const iso = /שוו(?:ה|י)[\s-]*שוקיים|isosceles/i.test(l), right = /ישר[\s-]*ה?זווית|right[\s-]*(?:angled|angle|triangle)/i.test(l), equi = /שוו(?:ה|י)[\s-]*צלעות|equilateral/i.test(l);
      const eq = l.match(new RegExp("\\(\\s*(" + LET + "{2})\\s*=\\s*(" + LET + "{2})\\s*\\)")), apexM = l.match(new RegExp("(?:זווית\\s+ה?ראש|vertex\\s+angle)\\s*(" + LET + ")(?!" + LET + ")"));
      let apex = name[0];
      if (eq) { const c = [...eq[1]].find(ch => eq[2].includes(ch)); if (c && name.includes(c)) apex = c; }
      else if (apexM && name.includes(apexM[1])) apex = apexM[1];
      const a90 = l.match(new RegExp("(?:זווית|angle)\\s*(" + LET + "{1,3})\\s*(?:=|שווה|is)?\\s*90")), rightAt = a90 ? (a90[1].length === 3 ? a90[1][1] : a90[1]) : iso ? apex : name[1];
      P.tris.push({ name, iso, right, equi, apex, rightAt, assumedRight: right && !a90 && !iso });
    }
    for (const m of l.matchAll(new RegExp("(?:מרובע|טרפז|מקבילית|מלבן|ריבוע|quadrilateral|trapezoid|parallelogram|rectangle|square)\\s+(" + LET + "{4})", "gi"))) {
      const w = m[0].toLowerCase(), q = { name: m[1], kind: /טרפז|trapez/.test(w) ? "trap" : /מקבילית|parallelogram/.test(w) ? "para" : /מלבן|rectangle/.test(w) ? "rect" : /ריבוע|square/.test(w) ? "square" : "quad" };
      P.quads.push(q);
    }
    // points on sides: "D and E are on AB and AC respectively", "D on BC", "D is the midpoint of BC"
    for (const onM of l.matchAll(new RegExp("((?:" + LET + "(?!" + LET + ")\\s*(?:,|ו|and)?\\s*)+?)\\s*(?:is|are|lies?|lie)?\\s*(?:נמצא(?:ת|ות|ים)?\\s*)?(?:על|on)\\s*(?:ה?צלע(?:ות)?|ה?קטע|the\\s+sides?|sides?|segment)?\\s*((?:" + LET + "{2}(?!" + LET + ")\\s*(?:,|ו|and)?\\s*)+)", "g"))) {
      const pts = onM[1].match(new RegExp(LET + "(?!" + LET + ")", "g")) || [], segs = onM[2].match(new RegExp(LET + "{2}", "g")) || [];
      pts.forEach((p, i) => { const s = segs[Math.min(i, segs.length - 1)]; if (s && !s.includes(p) && !P.on.some(o => o[0] === p)) P.on.push([p, s[0], s[1]]); });
    }
    const mid = l.match(new RegExp("(" + LET + ")(?!" + LET + ")\\s*(?:היא\\s+|הוא\\s+|is\\s+(?:the\\s+)?)?(?:נקודת\\s+)?(?:אמצע|midpoint\\s+of)\\s*(?:ה?צלע|the\\s+side)?\\s*(" + LET + "{2})"));
    if (mid) { P.on.push([mid[1], mid[2][0], mid[2][1]]); P.segEq.push([mid[2][0] + mid[1], mid[1] + mid[2][1], "mid"]); }
    for (const m of l.matchAll(new RegExp("(" + LET + "{2})\\s*(?:is\\s+|are\\s+)?(?:מקביל(?:ה|ים|ות)?\\s*ל-?|parallel\\s+to|\\|\\|)\\s*(" + LET + "{2})", "gi"))) P.par.push([m[1], m[2]]);
    for (const m of l.matchAll(new RegExp("(?<![A-Z])(" + LET + "{2})\\s*(?:=|שווה\\s*ל-?|שווה|equals?)\\s*(" + LET + "{2})(?![A-Z0-9])", "g"))) P.segEq.push([m[1], m[2], "given"]);
    for (const m of l.matchAll(new RegExp("(?:זווית|angle)\\s*(" + LET + "{1,3})\\s*(?:=|שווה\\s*ל-?|שווה|is|equals?)?\\s*(\\d+(?:\\.\\d+)?)", "gi"))) P.angVal.push([m[1], parseFloat(m[2])]);
    for (const m of l.matchAll(new RegExp("(?:זווית|angle)\\s*(" + LET + "{1,3})\\s*(?:=|שווה\\s*ל-?|שווה|equals?)\\s*(?:זווית|angle)\\s*(" + LET + "{1,3})", "gi"))) P.angEq.push([m[1], m[2]]);
    for (const m of l.matchAll(new RegExp("(" + LET + "{2})\\s+(?:הוא\\s+|היא\\s+|is\\s+(?:the\\s+|an?\\s+)?)?(חוצ(?:ה|ת)\\s+(?:את\\s+)?(?:ה)?זווית|bisects?|גובה|height|altitude|תיכון|median)", "gi"))) {
      const w = m[2]; (/חוצ|bisect/.test(w) ? P.bis : /גובה|height|altitude/.test(w) ? P.heights : P.medians).push(m[1]);
    }
  }
  function readGoal(l, P){
    const prove = /הוכיח|להוכיח|צ"ל|צ״ל|prove|show/i.test(l);
    const trap = l.match(new RegExp("(" + LET + "{4})\\s*(?:הוא|היא|is\\s+(?:an?\\s+)?)?\\s*(טרפז\\s+שווה[\\s-]*שוקיים|isosceles\\s+trapezoid|טרפז|trapezoid|מקבילית|parallelogram|מלבן|rectangle|מעוין|rhombus|ריבוע|square)")) || l.match(new RegExp("(טרפז\\s+שווה[\\s-]*שוקיים|isosceles\\s+trapezoid|טרפז|trapezoid|מקבילית|parallelogram)\\s+(" + LET + "{4})"));
    if (prove && trap) { const [nm, w] = /^[A-H]{4}$/.test(trap[1]) ? [trap[1], trap[2]] : [trap[2], trap[1]]; P.goals.push({ kind: /שווה|isosceles/.test(w) ? "isoTrap" : /טרפז|trapez/.test(w) ? "trap" : "para", name: nm }); return; }
    const tri = l.match(new RegExp("(?:משולש|triangle)\\s+(" + LET + "{3})[^A-Z]*?(שוו(?:ה|י)[\\s-]*שוקיים|isosceles|שוו(?:ה|י)[\\s-]*צלעות|equilateral|ישר[\\s-]*ה?זווית|right)"));
    if (prove && tri) { P.goals.push({ kind: /שוקיים|isosceles/.test(tri[2]) ? "isoTri" : /צלעות|equilateral/.test(tri[2]) ? "equiTri" : "rightTri", name: tri[1] }); return; }
    const par = l.match(new RegExp("(" + LET + "{2})\\s*(?:מקביל(?:ה|ים|ות)?\\s*ל-?|parallel\\s+to|\\|\\|)\\s*(" + LET + "{2})"));
    if (prove && par) { P.goals.push({ kind: "par", a: par[1], b: par[2] }); return; }
    const aeq = l.match(new RegExp("(?:זווית|angle)\\s*(" + LET + "{1,3})\\s*(?:=|שווה\\s*ל-?|שווה|equals?)\\s*(?:זווית|angle)\\s*(" + LET + "{1,3})"));
    if (prove && aeq) { P.goals.push({ kind: "angEq", a: aeq[1], b: aeq[2] }); return; }
    const seq = l.match(new RegExp("(?<![A-Z])(" + LET + "{2})\\s*(?:=|שווה\\s*ל-?|שווה|equals?)\\s*(" + LET + "{2})(?![A-Z0-9])"));
    if (prove && seq) { P.goals.push({ kind: "segEq", a: seq[1], b: seq[2] }); return; }
    for (const m of l.matchAll(new RegExp("(?:זווית|angle)\\s*(" + LET + "{1,3})(?![A-Z])", "gi"))) P.goals.push({ kind: "angle", name: m[1] });
  }

  // ---------- the drawing: coordinates that respect the shapes ----------
  function layout(P){
    const X = {};
    const place = (k, x, y) => { if (!X[k]) X[k] = [x, y]; };
    const angleOf = (tri, v) => { const a = P.angVal.find(([n]) => n.length === 1 ? n === v : n[1] === v && tri.name.includes(n[0]) && tri.name.includes(n[2])); return a ? a[1] : null; };
    const t0 = P.tris[0], q0 = P.quads[0];
    if (q0) {
      const [a, b, c, d] = q0.name, k = q0.kind;
      place(a, 0, 0); place(b, 6, 0);
      if (k === "rect") { place(c, 6, 3.3); place(d, 0, 3.3); } else if (k === "square") { place(c, 6, 6); place(d, 0, 6); }
      else if (k === "para") { place(c, 7.6, 3.2); place(d, 1.6, 3.2); } else { place(c, 4.4, 3.2); place(d, 1.3, 3.2); }
    }
    if (t0) {
      const [p, q, r] = t0.name;
      if (t0.equi) { place(p, 0, 0); place(q, 6, 0); place(r, 3, 5.196); }
      else if (t0.iso) {
        const ap = t0.apex, base = [...t0.name].filter(ch => ch !== ap), vA = t0.right && t0.rightAt === ap ? 90 : (angleOf(t0, ap) ?? (angleOf(t0, base[0]) != null ? 180 - 2 * angleOf(t0, base[0]) : 52));
        const h = 5, w = h * Math.tan(vA / 2 * Math.PI / 180);
        place(ap, 0, h); place(base[0], -w, 0); place(base[1], w, 0);
      } else {
        const ra = t0.right ? t0.rightAt : null;
        if (ra) { const o = [...t0.name].filter(ch => ch !== ra); place(ra, 0, 0); place(o[0], 6, 0); place(o[1], 0, 3.4); }
        else {
          let A = angleOf(t0, p), B = angleOf(t0, q), C = angleOf(t0, r);
          if (A == null && B != null && C != null) A = 180 - B - C; if (B == null && A != null && C != null) B = 180 - A - C;
          if (A == null) A = B != null && B >= 70 ? 42 : 58; if (B == null) B = A >= 70 ? 42 : 55;
          place(p, 0, 0); place(q, 6, 0);
          const tA = Math.tan(A * Math.PI / 180), tB = Math.tan(B * Math.PI / 180), x = 6 * tB / (tA + tB);
          place(r, x, x * tA);
        }
      }
    }
    // points on segments: generic positions, so nothing coincides by accident
    const T = [0.42, 0.58, 0.36, 0.64, 0.47];
    for (let pass = 0; pass < 3; pass++) P.on.forEach(([d, a, b], i) => {
      if (X[d] || !X[a] || !X[b]) return;
      const t = P.segEq.some(([u, v, why]) => why === "mid" && (sortSeg(u) === sortSeg(a + d) || sortSeg(v) === sortSeg(a + d))) ? 0.5 : T[i % T.length];
      place(d, X[a][0] + (X[b][0] - X[a][0]) * t, X[a][1] + (X[b][1] - X[a][1]) * t);
    });
    // any other triangle or quadrilateral vertex that is still missing
    for (const t of P.tris) { const miss = [...t.name].filter(ch => !X[ch]), have = [...t.name].filter(ch => X[ch]);
      if (miss.length === 1 && have.length === 2) { const [a, b] = have.map(k => X[k]); place(miss[0], (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.6, (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.6); } }
    let n = 0; for (const t of P.tris.concat(P.quads)) for (const ch of t.name) if (!X[ch]) place(ch, 7 + n * 1.3, 4 + (n++ % 2) * 1.7);
    return X;
  }

  // ---------- the engine ----------
  function solve(givens, ask, lang){
    const he = lang === "he", W = (en, h) => (he ? h : en);
    const P = parse(givens, ask), X = layout(P);
    const pts = Object.keys(X);
    if (pts.length < 3) return { ok: false };
    // rays, lines and angle keys from the drawing
    const dir = (a, b) => { const dx = X[b][0] - X[a][0], dy = X[b][1] - X[a][1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
    const F4 = v => (Math.round(v * 1e4) / 1e4 + 0).toFixed(4);
    const rayKey = (a, b) => { const d = dir(a, b); return a + ":" + F4(d[0]) + "," + F4(d[1]); };
    const sameRay = (a, b, c) => rayKey(a, b) === rayKey(a, c);
    const opposite = (a, b, c) => { const d1 = dir(a, b), d2 = dir(a, c); return Math.abs(d1[0] + d2[0]) < 1e-3 && Math.abs(d1[1] + d2[1]) < 1e-3; };
    const collinear = (a, b, c) => Math.abs((X[b][0] - X[a][0]) * (X[c][1] - X[a][1]) - (X[b][1] - X[a][1]) * (X[c][0] - X[a][0])) < 1e-6;
    const lineKey = (a, b) => { const d = dir(a, b); const s = d[0] < -1e-9 || (Math.abs(d[0]) < 1e-9 && d[1] < 0) ? -1 : 1; const nx = -d[1] * s, ny = d[0] * s; const c = nx * X[a][0] + ny * X[a][1]; return F4(nx) + "," + F4(ny) + "," + F4(c); };
    const lines = {};   // lineKey -> points on it
    for (const a of pts) for (const b of pts) if (a < b) { const k = lineKey(a, b); lines[k] = lines[k] || new Set(); lines[k].add(a); lines[k].add(b); }
    const onLine = (p, k) => lines[k].has(p);
    const sideOf = (k, p) => { const [nx, ny, c] = k.split(",").map(Number); const v = nx * X[p][0] + ny * X[p][1] - c; return Math.abs(v) < 1e-6 ? 0 : v > 0 ? 1 : -1; };
    const angKey = (v, a, b) => { const r = [rayKey(v, a), rayKey(v, b)].sort(); return v + "|" + r[0] + "|" + r[1]; };
    const measure = (v, a, b) => { const d1 = dir(v, a), d2 = dir(v, b); return Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1]))) * 180 / Math.PI; };
    // names for angles: the farthest point on each ray, unless the context gives letters
    const far = (v, a) => { let best = a, bd = 0; for (const p of pts) if (p !== v && sameRay(v, a, p)) { const d = Math.hypot(X[p][0] - X[v][0], X[p][1] - X[v][1]); if (d > bd) { bd = d; best = p; } } return best; };
    const angName = (v, a, b) => "∢" + far(v, a) + v + far(v, b);
    const keyName = {};   // angle key -> a nice name
    const AK = (v, a, b, nm) => { if (!X[v] || !X[a] || !X[b] || v === a || v === b) return null; const k = angKey(v, a, b); if (!keyName[k]) keyName[k] = nm || angName(v, a, b); return k; };

    // facts
    const facts = []; let changed = true;
    const add = (kind, data, claim, reason, deps) => { const f = { id: facts.length, kind, ...data, claim, reason, deps: (deps || []).filter(x => x != null) }; facts.push(f); changed = true; return f; };
    const angVal = {}, angEq = {}, segEq = {}, par = {};
    const setVal = (k, v, claim, reason, deps) => { if (!k || angVal[k]) return angVal[k]; const f = add("angVal", { key: k, v }, claim, reason, deps); angVal[k] = f; return f; };
    const link = (store, a, b, f) => { (store[a] = store[a] || {})[b] = f; (store[b] = store[b] || {})[a] = f; };
    const eqPath = (store, a, b) => {   // the facts that join a to b (BFS), null if not joined
      if (!a || !b) return null; if (a === b) return []; const prev = { [a]: null }, q = [a];
      while (q.length) { const x = q.shift(); for (const y in store[x] || {}) if (!(y in prev)) { prev[y] = x; if (y === b) { const out = []; let c = b; while (prev[c] !== null) { out.push(store[prev[c]][c]); c = prev[c]; } return out; } q.push(y); } }
      return null;
    };
    const setAngEq = (k1, k2, claim, reason, deps) => { if (!k1 || !k2 || k1 === k2 || eqPath(angEq, k1, k2) || (angVal[k1] && angVal[k2])) return null; const f = add("angEq", { a: k1, b: k2 }, claim, reason, deps); link(angEq, k1, k2, f); return f; };
    const segK = s => sortSeg(s);
    const setSegEq = (s1, s2, claim, reason, deps) => { if (![...s1 + s2].every(c => X[c])) return null; s1 = segK(s1); s2 = segK(s2); if (s1 === s2 || eqPath(segEq, s1, s2)) return null; const f = add("segEq", { a: s1, b: s2 }, claim, reason, deps); link(segEq, s1, s2, f); return f; };
    const segEqual = (s1, s2) => { s1 = segK(s1); s2 = segK(s2); return s1 === s2 ? [] : eqPath(segEq, s1, s2); };
    const setPar = (l1, l2, claim, reason, deps) => { if (!l1 || !l2 || l1 === l2 || eqPath(par, l1, l2)) return null; const f = add("par", { a: l1, b: l2 }, claim, reason, deps); link(par, l1, l2, f); return f; };
    const lineName = {}; const LN = (a, b) => { if (!X[a] || !X[b] || a === b) return null; const k = lineKey(a, b); if (!lineName[k]) lineName[k] = a + b; return k; };
    const segName = s => s;
    // which segments are drawn: sides of the shapes (and the parts into which points split them), and segments named in the text
    const drawn = new Set();
    const addSeg = (a, b) => { if (a !== b && X[a] && X[b]) drawn.add(sortSeg(a + b)); };
    for (const t of P.tris.concat(P.quads)) for (let i = 0; i < t.name.length; i++) addSeg(t.name[i], t.name[(i + 1) % t.name.length]);
    for (const m of clean(givens + " " + ask).matchAll(/(?<![A-Z])([A-H]{2})(?![A-Z])/g)) addSeg(m[1][0], m[1][1]);
    for (const [a, b] of P.par) { addSeg(a[0], a[1]); addSeg(b[0], b[1]); }
    for (const s of P.bis.concat(P.heights, P.medians)) addSeg(s[0], s[1]);
    for (const [d, a, b] of P.on) if (X[d] && X[a] && X[b]) { addSeg(a, d); addSeg(d, b); }
    for (const k of [...drawn]) for (const p of pts) if (!k.includes(p) && collinear(k[0], k[1], p)) { addSeg(k[0], p); addSeg(k[1], p); }
    const tris = P.tris.map(t => t.name);
    for (const a of pts) for (const b of pts) for (const c of pts) if (a < b && b < c && !collinear(a, b, c) && drawn.has(a + b) && drawn.has(b + c) && drawn.has(a + c) && !tris.some(t => [...t].sort().join("") === a + b + c)) tris.push(a + b + c);
    const GV = W("Given", "נתון");

    // ----- the givens -----
    const resolveAng = nm => {   // "B" means the angle of the first triangle (or quadrilateral) at B
      if (nm.length === 3) return AK(nm[1], nm[0], nm[2], "∢" + nm);
      if (nm.length === 2) return null;
      for (const t of P.tris) if (t.name.includes(nm)) { const o = [...t.name].filter(c => c !== nm); return AK(nm, o[0], o[1], "∢" + nm); }
      for (const q of P.quads) { const i = q.name.indexOf(nm); if (i >= 0) return AK(nm, q.name[(i + 3) % 4], q.name[(i + 1) % 4], "∢" + nm); }
      return null;
    };
    for (const t of P.tris) {
      const [a, b, c] = t.name, o = [...t.name].filter(ch => ch !== t.apex);
      if (t.iso) setSegEq(t.apex + o[0], t.apex + o[1], t.apex + o[0] + " = " + t.apex + o[1], W("Given: Δ" + t.name + " is isosceles", "נתון: Δ" + t.name + " שווה שוקיים"), []);
      if (t.equi) { setSegEq(a + b, b + c, a + b + " = " + b + c, W("Given: Δ" + t.name + " is equilateral", "נתון: Δ" + t.name + " שווה צלעות"), []); setSegEq(b + c, a + c, b + c + " = " + a + c, W("Given: Δ" + t.name + " is equilateral", "נתון: Δ" + t.name + " שווה צלעות"), []); }
      if (t.right) { const oo = [...t.name].filter(ch => ch !== t.rightAt), k = AK(t.rightAt, oo[0], oo[1], "∢" + oo[0] + t.rightAt + oo[1]);
        setVal(k, 90, keyName[k] + " = 90°", t.iso && t.rightAt === t.apex ? W("Δ" + t.name + " is right-angled and isosceles, so the right angle is the vertex angle, between the two equal legs", "Δ" + t.name + " ישר-זווית ושווה שוקיים, ולכן הזווית הישרה היא זווית הראש, בין שתי השוקיים השוות")
          : t.assumedRight ? W("Given: a right triangle (the right angle is taken at " + t.rightAt + "; say if it is at another vertex)", "נתון: משולש ישר-זווית (הזווית הישרה נלקחה בקודקוד " + t.rightAt + "; אם היא בקודקוד אחר, ציינו זאת)") : GV, []); }
    }
    for (const q of P.quads) {
      const [a, b, c, d] = q.name;
      if (q.kind === "para" || q.kind === "rect" || q.kind === "square") { setPar(LN(a, b), LN(d, c), a + b + " ∥ " + d + c, W("Given: " + q.name + " is a parallelogram", "נתון: " + q.name + " מקבילית"), []); setPar(LN(a, d), LN(b, c), a + d + " ∥ " + b + c, W("Given: " + q.name + " is a parallelogram", "נתון: " + q.name + " מקבילית"), []); }
      if (q.kind === "rect" || q.kind === "square") for (let i = 0; i < 4; i++) { const v = q.name[i], k = AK(v, q.name[(i + 3) % 4], q.name[(i + 1) % 4], "∢" + v); setVal(k, 90, keyName[k] + " = 90°", W("Given: all the angles of a rectangle are 90°", "נתון: במלבן כל הזוויות 90°"), []); }
      if (q.kind === "square") { setSegEq(a + b, b + c, a + b + " = " + b + c, W("Given: a square", "נתון: ריבוע"), []); setSegEq(b + c, c + d, b + c + " = " + c + d, W("Given: a square", "נתון: ריבוע"), []); setSegEq(c + d, d + a, c + d + " = " + d + a, W("Given: a square", "נתון: ריבוע"), []); }
    }
    for (const [a, b] of P.par) setPar(LN(a[0], a[1]), LN(b[0], b[1]), a + " ∥ " + b, GV, []);
    for (const [a, b, why] of P.segEq) setSegEq(a, b, a + " = " + b, why === "mid" ? W("Given: a midpoint", "נתון: נקודת אמצע") : GV, []);
    for (const [nm, v] of P.angVal) { const k = resolveAng(nm); if (k && !angVal[k]) setVal(k, v, keyName[k] + " = " + R(v) + "°", GV, []); }
    for (const [n1, n2] of P.angEq) { const k1 = resolveAng(n1), k2 = resolveAng(n2); if (k1 && k2) setAngEq(k1, k2, keyName[k1] + " = " + keyName[k2], GV, []); }
    const between = [];   // [d, a, b]: d is between a and b
    for (const [d, a, b] of P.on) if (X[d] && X[a] && X[b] && collinear(a, b, d) && opposite(d, a, b)) between.push([d, a, b]);
    for (const s of P.bis) { const v = s[0], d = s[1], t = P.tris.find(t => t.name.includes(v) && between.some(([dd, a, b]) => dd === d && t.name.includes(a) && t.name.includes(b)));
      if (t) { const o = [...t.name].filter(c => c !== v); setAngEq(AK(v, o[0], d), AK(v, d, o[1]), "∢" + o[0] + v + d + " = ∢" + d + v + o[1], W("Given: " + s + " bisects the angle", "נתון: " + s + " חוצה זווית"), []); } }
    for (const s of P.heights) { const v = s[0], d = s[1], bt = between.find(([dd, a, b]) => dd === d && !collinear(v, a, b)); if (bt) { const k = AK(d, v, bt[1]); setVal(k, 90, keyName[k] + " = 90°", W("Given: " + s + " is a height", "נתון: " + s + " גובה"), []); } }
    for (const s of P.medians) { const d = s[1], bt = between.find(([dd]) => dd === d); if (bt) setSegEq(bt[1] + d, d + bt[2], bt[1] + d + " = " + d + bt[2], W("Given: " + s + " is a median", "נתון: " + s + " תיכון"), []); }

    // ----- theorems, applied until nothing new appears -----
    const R_SUM = W("The angles of a triangle add up to 180°", "סכום הזוויות במשולש 180°");
    const R_BASE = W("In an isosceles triangle, the base angles are equal", "במשולש שווה שוקיים זוויות הבסיס שוות");
    const R_CONV = W("If two angles of a triangle are equal, the sides opposite them are equal (the triangle is isosceles)", "אם במשולש שתי זוויות שוות, הצלעות שמולן שוות (המשולש שווה שוקיים)");
    const vOf = k => (angVal[k] ? angVal[k].v : null);
    const eqClass = k => { const seen = new Set([k]), q = [k]; while (q.length) { const x = q.shift(); for (const y in angEq[x] || {}) if (!seen.has(y)) { seen.add(y); q.push(y); } } return [...seen]; };
    const triAngles = t => { const [a, b, c] = t; return { [a]: AK(a, b, c), [b]: AK(b, a, c), [c]: AK(c, a, b) }; };
    // triangles we know about: the declared ones, plus any three points that are joined by the declared sides
    let guard = 0;
    while (changed && guard++ < 40) {
      changed = false;
      // equal angles carry their values
      for (const k in angVal) for (const k2 of eqClass(k)) if (!angVal[k2]) { const path = eqPath(angEq, k, k2); const f = setVal(k2, angVal[k].v, keyName[k2] + " = " + keyName[k] + " = " + R(angVal[k].v) + "°", path.length === 1 ? path[0].reason : W("Equal angles", "זוויות שוות"), [angVal[k], ...path]); if (f && angVal[k].claim.includes(keyName[k2] + " =")) f.quiet = true; }
      for (const t of tris) {
        const A = triAngles(t), ks = Object.keys(A);
        // two angles known: the third
        const known = ks.filter(v => vOf(A[v]) != null), unk = ks.filter(v => vOf(A[v]) == null);
        if (known.length === 2 && unk.length === 1) { const v = unk[0], s = known.reduce((z, x) => z + vOf(A[x]), 0);
          setVal(A[v], 180 - s, keyName[A[v]] + " = 180° − " + known.map(x => keyName[A[x]]).join(" − ") + " = 180 − " + known.map(x => R(vOf(A[x]))).join(" − ") + " = " + R(180 - s) + "°", R_SUM, known.map(x => angVal[A[x]])); }
        // one angle known and the other two equal
        if (known.length === 1 && unk.length === 2) { const p = eqPath(angEq, A[unk[0]], A[unk[1]]); if (p) { const v = (180 - vOf(A[known[0]])) / 2;
          setVal(A[unk[0]], v, keyName[A[unk[0]]] + " = " + keyName[A[unk[1]]] + " = (180° − " + keyName[A[known[0]]] + ") ÷ 2 = (180 − " + R(vOf(A[known[0]])) + ") ÷ 2 = " + R(v) + "°", R_SUM + (he ? " ושתי הזוויות שוות" : " and the two angles are equal"), [angVal[A[known[0]]], ...p]); } }
        // isosceles: equal sides <-> equal base angles
        for (const apex of ks) { const [p, q] = ks.filter(x => x !== apex);
          const se = segEqual(apex + p, apex + q);
          if (se) setAngEq(A[p], A[q], keyName[A[p]] + " = " + keyName[A[q]], R_BASE + " (" + apex + p + " = " + apex + q + ")", se);
          const ae = eqPath(angEq, A[p], A[q]) || (vOf(A[p]) != null && vOf(A[p]) === vOf(A[q]) ? [angVal[A[p]], angVal[A[q]]] : null);
          if (ae) setSegEq(apex + p, apex + q, apex + p + " = " + apex + q, R_CONV + " (" + keyName[A[p]] + " = " + keyName[A[q]] + ")", ae);
        }
      }
      // a ray inside an angle: the two parts add up to the whole
      for (const v of pts) for (const a of pts) for (const b of pts) {
        if (a === v || b === v || a >= b || collinear(v, a, b)) continue;
        const whole = AK(v, a, b), wv = measure(v, a, b);
        for (const d of pts) {
          if (d === v || d === a || d === b || sameRay(v, d, a) || sameRay(v, d, b)) continue;
          if (Math.abs(measure(v, a, d) + measure(v, d, b) - wv) > 1e-6) continue;   // d is not inside the angle
          const k1 = AK(v, a, d), k2 = AK(v, d, b), n1 = keyName[k1], n2 = keyName[k2], nw = keyName[whole];
          const SUM = W("The angle is the sum of its two parts (" + n1 + " + " + n2 + " = " + nw + ")", "הזווית היא סכום שני חלקיה (" + n1 + " + " + n2 + " = " + nw + ")");
          if (vOf(k1) != null && vOf(k2) != null && vOf(whole) == null) setVal(whole, vOf(k1) + vOf(k2), nw + " = " + n1 + " + " + n2 + " = " + R(vOf(k1)) + " + " + R(vOf(k2)) + " = " + R(vOf(k1) + vOf(k2)) + "°", SUM, [angVal[k1], angVal[k2]]);
          else if (vOf(whole) != null && vOf(k1) != null && vOf(k2) == null) setVal(k2, vOf(whole) - vOf(k1), n2 + " = " + nw + " − " + n1 + " = " + R(vOf(whole)) + " − " + R(vOf(k1)) + " = " + R(vOf(whole) - vOf(k1)) + "°", SUM, [angVal[whole], angVal[k1]]);
          else if (vOf(whole) != null && vOf(k2) != null && vOf(k1) == null) setVal(k1, vOf(whole) - vOf(k2), n1 + " = " + nw + " − " + n2 + " = " + R(vOf(whole)) + " − " + R(vOf(k2)) + " = " + R(vOf(whole) - vOf(k2)) + "°", SUM, [angVal[whole], angVal[k2]]);
          else if (vOf(whole) != null && vOf(k1) == null && vOf(k2) == null) { const pth = eqPath(angEq, k1, k2); if (pth) setVal(k1, vOf(whole) / 2, n1 + " = " + n2 + " = " + nw + " ÷ 2 = " + R(vOf(whole)) + " ÷ 2 = " + R(vOf(whole) / 2) + "°", W("The two equal parts of the angle", "שני החלקים השווים של הזווית"), [angVal[whole], ...pth]); }
        }
      }
      // angles on a straight line and vertical angles
      for (const [d, a, b] of between) for (const e of pts) {
        if (e === d || collinear(a, b, e)) continue;
        const k1 = AK(d, a, e), k2 = AK(d, b, e);
        if (vOf(k1) != null && vOf(k2) == null) setVal(k2, 180 - vOf(k1), keyName[k2] + " = 180° − " + keyName[k1] + " = 180 − " + R(vOf(k1)) + " = " + R(180 - vOf(k1)) + "°", W("Adjacent angles on a straight line add up to 180°", "זוויות צמודות משלימות ל-180°"), [angVal[k1]]);
        for (const f of pts) if (f !== d && f !== e && !collinear(a, b, f) && opposite(d, e, f)) setAngEq(AK(d, a, e), AK(d, b, f), keyName[AK(d, a, e)] + " = " + keyName[AK(d, b, f)], W("Vertical angles are equal", "זוויות קודקודיות שוות"), []);
      }
      // parallel lines <-> corresponding / alternate / co-interior angles
      const LK = Object.keys(lines).filter(k => lines[k].size >= 2);
      for (const l1 of LK) for (const l2 of LK) {
        if (l1 >= l2) continue;
        const isPar = eqPath(par, l1, l2);
        for (const p of lines[l1]) for (const q of lines[l2]) {
          if (p === q || onLine(p, l2) || onLine(q, l1)) continue;
          const t = lineKey(p, q); if (t === l1 || t === l2) continue;
          for (const x of lines[t]) for (const y of lines[t]) {
            if (x === p || y === q) continue;
            const dSame = dir(p, x)[0] * dir(q, y)[0] + dir(p, x)[1] * dir(q, y)[1] > 0;
            for (const e of lines[l1]) for (const c of lines[l2]) {
              if (e === p || c === q) continue;
              const sSame = sideOf(t, e) === sideOf(t, c);
              const k1 = AK(p, x, e), k2 = AK(q, y, c), n1 = keyName[k1], n2 = keyName[k2];
              const nmL = lineName[l1] || [...lines[l1]].slice(0, 2).join(""), nmM = lineName[l2] || [...lines[l2]].slice(0, 2).join("");
              if (dSame === sSame) {   // equal angles
                const which = dSame ? W("corresponding angles", "זוויות מתאימות") : W("alternate angles", "זוויות מתחלפות");
                if (isPar) { const why = W("Between parallel lines (" + nmL + " ∥ " + nmM + "), " + which + " are equal", "בין ישרים מקבילים (" + nmL + " ∥ " + nmM + ") " + which + " שוות");
                  let done = false; for (const [ka, kb] of [[k1, k2], [k2, k1]]) if (vOf(ka) != null && vOf(kb) == null) { setVal(kb, vOf(ka), keyName[kb] + " = " + keyName[ka] + " = " + R(vOf(ka)) + "°", why, [angVal[ka], ...isPar]); done = true; }
                  if (!done) setAngEq(k1, k2, n1 + " = " + n2, why, isPar); }
                else { const ae = eqPath(angEq, k1, k2) || (vOf(k1) != null && vOf(k1) === vOf(k2) ? [angVal[k1], angVal[k2]] : null);
                  if (ae) setPar(l1, l2, nmL + " ∥ " + nmM, W("If " + which + " are equal, the lines are parallel (" + n1 + " = " + n2 + ")", "אם " + which + " שוות, הישרים מקבילים (" + n1 + " = " + n2 + ")"), ae); }
              } else {   // angles that add up to 180°
                if (isPar) { for (const [ka, kb] of [[k1, k2], [k2, k1]]) if (vOf(ka) != null && vOf(kb) == null) setVal(kb, 180 - vOf(ka), keyName[kb] + " = 180° − " + keyName[ka] + " = 180 − " + R(vOf(ka)) + " = " + R(180 - vOf(ka)) + "°", W("Between parallel lines (" + nmL + " ∥ " + nmM + "), co-interior angles add up to 180°", "בין ישרים מקבילים (" + nmL + " ∥ " + nmM + ") זוויות חד-צדדיות משלימות ל-180°"), [angVal[ka], ...isPar]); }
                else if (vOf(k1) != null && vOf(k2) != null && Math.abs(vOf(k1) + vOf(k2) - 180) < EPS) setPar(l1, l2, nmL + " ∥ " + nmM, W("If co-interior angles add up to 180°, the lines are parallel (" + n1 + " + " + n2 + " = 180°)", "אם זוויות חד-צדדיות משלימות ל-180°, הישרים מקבילים (" + n1 + " + " + n2 + " = 180°)"), [angVal[k1], angVal[k2]]);
              }
            }
          }
        }
      }
      // equal wholes and equal parts: AB = AC and AD = AE (D on AB, E on AC) give DB = EC
      for (const [d, a, b] of between) for (const [e, a2, b2] of between) {
        if (d === e) continue;
        for (const [p1, p2] of [[a, b], [b, a]]) for (const [q1, q2] of [[a2, b2], [b2, a2]]) {
          const whole = segEqual(p1 + p2, q1 + q2); if (!whole) continue;
          const part = segEqual(p1 + d, q1 + e);
          if (part) setSegEq(d + p2, e + q2, d + p2 + " = " + e + q2, W("Equal segments minus equal segments: " + p1 + p2 + " − " + p1 + d + " = " + q1 + q2 + " − " + q1 + e, "הפרש של קטעים שווים: " + p1 + p2 + " − " + p1 + d + " = " + q1 + q2 + " − " + q1 + e), [...whole, ...part]);
        }
      }
      // isosceles triangle: the median to the base is also the height and the angle bisector (and back)
      for (const t of tris) for (const apex of t) { const [p, q] = [...t].filter(x => x !== apex), se = segEqual(apex + p, apex + q); if (!se) continue;
        for (const [d, a, b] of between) { if (!((a === p && b === q) || (a === q && b === p))) continue;
          const med = segEqual(p + d, d + q), kH = AK(d, apex, p), bis = eqPath(angEq, AK(apex, p, d), AK(apex, d, q));
          if (med) { setVal(kH, 90, keyName[kH] + " = 90°", W("In an isosceles triangle, the median to the base is also the height", "במשולש שווה שוקיים התיכון לבסיס הוא גם גובה"), [...se, ...med]);
            setAngEq(AK(apex, p, d), AK(apex, d, q), keyName[AK(apex, p, d)] + " = " + keyName[AK(apex, d, q)], W("In an isosceles triangle, the median to the base also bisects the vertex angle", "במשולש שווה שוקיים התיכון לבסיס הוא גם חוצה זווית הראש"), [...se, ...med]); }
          else if (vOf(kH) === 90) setSegEq(p + d, d + q, p + d + " = " + d + q, W("In an isosceles triangle, the height to the base is also the median", "במשולש שווה שוקיים הגובה לבסיס הוא גם תיכון"), [...se, angVal[kH]]);
          else if (bis) setSegEq(p + d, d + q, p + d + " = " + d + q, W("In an isosceles triangle, the bisector of the vertex angle is also the median to the base", "במשולש שווה שוקיים חוצה זווית הראש הוא גם תיכון לבסיס"), [...se, ...bis]);
        } }
    }

    // ----- the goals -----
    const results = [];
    const notPar = (l1, l2) => { for (const p of lines[l1]) if (lines[l2].has(p)) return p; return null; };
    const crosses = (a, b, c, d) => { const o = (p, q, r) => Math.sign((X[q][0] - X[p][0]) * (X[r][1] - X[p][1]) - (X[q][1] - X[p][1]) * (X[r][0] - X[p][0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); };
    const simpleOrder = nm => { for (const o of [nm, nm[0] + nm[1] + nm[3] + nm[2], nm[0] + nm[2] + nm[1] + nm[3]]) if (!crosses(o[0], o[1], o[2], o[3]) && !crosses(o[1], o[2], o[3], o[0])) return o; return nm; };
    const quadKind = given => {   // what can be proven about the quadrilateral (its vertices taken in the order that makes a real quadrilateral)
      const nm = simpleOrder(given);
      const [a, b, c, d] = nm, L1 = [LN(a, b), LN(c, d)], L2 = [LN(b, c), LN(d, a)];
      const p1 = eqPath(par, L1[0], L1[1]), p2 = eqPath(par, L2[0], L2[1]);
      const out = { deps: [], claims: [] };
      if (p1 && p2) { out.kind = "para"; out.deps.push(...p1, ...p2); return out; }
      const pair = p1 ? { par: p1, bases: [a + b, c + d], legs: [b + c, d + a], other: L2 } : p2 ? { par: p2, bases: [b + c, d + a], legs: [c + d, a + b], other: L1 } : null;
      if (!pair) return out;
      const meet = notPar(pair.other[0], pair.other[1]);
      if (!meet && pair.other[0].split(",").slice(0, 2).join() === pair.other[1].split(",").slice(0, 2).join()) return out;   // the legs are parallel too
      out.kind = "trap"; out.deps.push(...pair.par);
      const why = meet ? W(pair.legs[0] + " and " + pair.legs[1] + " meet at " + meet + ", so they are not parallel", pair.legs[0] + " ו-" + pair.legs[1] + " נפגשות בנקודה " + meet + ", ולכן אינן מקבילות") : W(pair.legs[0] + " and " + pair.legs[1] + " are not parallel (extended, they meet)", pair.legs[0] + " ו-" + pair.legs[1] + " אינן מקבילות (בהמשכן הן נפגשות)");
      out.claims.push([given + " " + W("is a trapezoid", "טרפז") + " (" + pair.bases[0] + " ∥ " + pair.bases[1] + ")", W("A quadrilateral with exactly one pair of parallel sides is a trapezoid: " + why, "מרובע שבו זוג אחד בלבד של צלעות מקבילות הוא טרפז: " + why)]);
      const legs = segEqual(pair.legs[0], pair.legs[1]);
      if (legs) { out.kind = "isoTrap"; out.deps.push(...legs); out.claims.push([given + " " + W("is an isosceles trapezoid", "טרפז שווה שוקיים"), W("A trapezoid whose legs are equal (" + pair.legs[0] + " = " + pair.legs[1] + ") is an isosceles trapezoid", "טרפז ששוקיו שוות (" + pair.legs[0] + " = " + pair.legs[1] + ") הוא טרפז שווה שוקיים")]); return out; }
      const [b1, b2] = pair.bases, u = b1[0], v = b1[1], uo = nm[(nm.indexOf(u) + 3) % 4] === v ? nm[(nm.indexOf(u) + 1) % 4] : nm[(nm.indexOf(u) + 3) % 4], vo = nm[(nm.indexOf(v) + 3) % 4] === u ? nm[(nm.indexOf(v) + 1) % 4] : nm[(nm.indexOf(v) + 3) % 4];
      const kA = AK(u, v, uo), kB = AK(v, u, vo), ang = eqPath(angEq, kA, kB) || (vOf(kA) != null && vOf(kA) === vOf(kB) ? [angVal[kA], angVal[kB]] : null);
      if (ang) { out.kind = "isoTrap"; out.deps.push(...ang); out.claims.push([given + " " + W("is an isosceles trapezoid", "טרפז שווה שוקיים"), W("A trapezoid whose base angles are equal (" + keyName[kA] + " = " + keyName[kB] + ") is an isosceles trapezoid", "טרפז שזוויות הבסיס שלו שוות (" + keyName[kA] + " = " + keyName[kB] + ") הוא טרפז שווה שוקיים")]); }
      return out;
    };
    for (const g of P.goals) {
      const r = { goal: g, ok: false, deps: [], claims: [] };
      if (g.kind === "angle") { const k = resolveAng(g.name); if (k && angVal[k]) { r.ok = true; r.deps = [angVal[k]]; r.answer = keyName[k] + " = " + R(angVal[k].v) + "°"; r.title = W("The angle", "הזווית"); } else r.answer = W("I couldn't find ∢" + g.name + " from these givens", "לא הצלחתי למצוא את ∢" + g.name + " מהנתונים האלה"); }
      else if (g.kind === "par") { const p = eqPath(par, LN(g.a[0], g.a[1]), LN(g.b[0], g.b[1])); if (p) { r.ok = true; r.deps = p; } r.answer = g.a + " ∥ " + g.b; r.title = W("To prove", "צריך להוכיח"); }
      else if (g.kind === "segEq") { const p = segEqual(g.a, g.b); if (p) { r.ok = true; r.deps = p; } r.answer = g.a + " = " + g.b; r.title = W("To prove", "צריך להוכיח"); }
      else if (g.kind === "angEq") { const k1 = resolveAng(g.a), k2 = resolveAng(g.b), p = k1 && k2 ? (eqPath(angEq, k1, k2) || (vOf(k1) != null && vOf(k1) === vOf(k2) ? [angVal[k1], angVal[k2]] : null)) : null; if (p) { r.ok = true; r.deps = p; } r.answer = "∢" + g.a + " = ∢" + g.b; r.title = W("To prove", "צריך להוכיח"); }
      else if (g.kind === "isoTri" || g.kind === "equiTri") { const [a, b, c] = g.name, pairs = [[a + b, a + c], [b + a, b + c], [c + a, c + b]].map(([s, t]) => [s, t, segEqual(s, t)]).filter(x => x[2]);
        if ((g.kind === "isoTri" && pairs.length) || pairs.length >= 2) { r.ok = true; pairs.forEach(x => r.deps.push(...x[2])); r.claims.push(["Δ" + g.name + " " + (g.kind === "isoTri" ? W("is isosceles", "שווה שוקיים") : W("is equilateral", "שווה צלעות")), W("A triangle with two equal sides is isosceles (" + pairs[0][0] + " = " + pairs[0][1] + ")", "משולש בעל שתי צלעות שוות הוא שווה שוקיים (" + pairs[0][0] + " = " + pairs[0][1] + ")")]); }
        r.answer = "Δ" + g.name + " " + (g.kind === "isoTri" ? W("is isosceles", "שווה שוקיים") : W("is equilateral", "שווה צלעות")); r.title = W("To prove", "צריך להוכיח"); }
      else if (g.kind === "rightTri") { const [a, b, c] = g.name, A = triAngles(g.name), v = Object.keys(A).find(k => vOf(A[k]) === 90); if (v) { r.ok = true; r.deps = [angVal[A[v]]]; } r.answer = "Δ" + g.name + " " + W("is right-angled", "ישר-זווית"); r.title = W("To prove", "צריך להוכיח"); }
      else if (g.kind === "trap" || g.kind === "isoTrap" || g.kind === "para") { const q = quadKind(g.name);
        const want = g.kind, got = q.kind; const ok = got === want || (want === "trap" && got === "isoTrap");
        if (ok) { r.ok = true; r.deps = q.deps; r.claims = q.claims; }
        r.answer = g.name + " " + (want === "isoTrap" ? W("is an isosceles trapezoid", "טרפז שווה שוקיים") : want === "trap" ? W("is a trapezoid", "טרפז") : W("is a parallelogram", "מקבילית")); r.title = W("To prove", "צריך להוכיח"); }
      results.push(r);
    }
    if (root.PROOF_DEBUG) facts.forEach(f => console.log("  F", f.kind, f.claim, "|", f.reason));
    if (!results.length) return { ok: false, why: W("I didn't find what to find or prove", "לא מצאתי מה צריך למצוא או להוכיח") };
    if (!results.some(r => r.ok)) return { ok: false, why: results[0].answer };

    // ----- the proof: every fact the goals rest on, in the order it was found -----
    const used = new Set(); const walk = f => { if (used.has(f.id)) return; f.deps.forEach(walk); used.add(f.id); };
    results.filter(r => r.ok).forEach(r => r.deps.forEach(walk));
    const rows = [...used].map(id => facts[id]).filter(f => !f.quiet).map(f => [f.claim, f.reason]);
    for (const r of results.filter(r => r.ok)) for (const c of r.claims) rows.push(c);
    const answer = results.map(r => (r.ok ? "✓ " : "✗ ") + r.answer).join("\n");
    return { ok: true, rows, title: results.length > 1 ? W("Answers", "התשובות") : results[0].title, answer, svg: drawSVG(P, X, between), goals: results.map(r => ({ ok: r.ok, text: r.answer })) };
  }

  // ---------- the drawing ----------
  function drawSVG(P, X, between){
    const pts = Object.keys(X); if (!pts.length) return "";
    const xs = pts.map(k => X[k][0]), ys = pts.map(k => X[k][1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const Wd = 280, Hd = 190, m = 28, s = Math.min((Wd - 2 * m) / Math.max(maxX - minX, 1e-6), (Hd - 2 * m) / Math.max(maxY - minY, 1e-6));
    const ox = (Wd - s * (maxX - minX)) / 2, oy = (Hd - s * (maxY - minY)) / 2;
    const T = k => [Math.round((ox + (X[k][0] - minX) * s) * 10) / 10, Math.round((Hd - oy - (X[k][1] - minY) * s) * 10) / 10];
    const main = P.quads[0] || P.tris[0]; let out = `<svg viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="${(main || { name: "" }).name}">`;
    const segs = new Set();
    if (main) { out += `<polygon points="${[...main.name].map(k => T(k).join(",")).join(" ")}" style="fill:var(--pen-soft);stroke:var(--pen);stroke-width:2.5;stroke-linejoin:round"/>`; for (let i = 0; i < main.name.length; i++) segs.add(sortSeg(main.name[i] + main.name[(i + 1) % main.name.length])); }
    const line = (a, b, dash) => { const k = sortSeg(a + b); if (segs.has(k)) return; segs.add(k); const p = T(a), q = T(b); out += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" style="stroke:var(--pen);stroke-width:${dash ? 1.5 : 2};${dash ? "stroke-dasharray:5 4" : ""}"/>`; };
    for (const t of P.tris.concat(P.quads)) for (let i = 0; i < t.name.length; i++) { const a = t.name[i], b = t.name[(i + 1) % t.name.length]; if (!between.some(([d, p, q]) => (p === a && q === b) || (p === b && q === a) || [a, b].includes(d) && [a, b].some(z => z === p || z === q) && false)) line(a, b, false); }
    for (const [a, b] of P.par) { line(a[0], a[1], false); line(b[0], b[1], false); }
    for (const s2 of P.bis.concat(P.heights, P.medians)) line(s2[0], s2[1], true);
    const cx = pts.reduce((z, k) => z + T(k)[0], 0) / pts.length, cy = pts.reduce((z, k) => z + T(k)[1], 0) / pts.length;
    for (const k of pts) { const p = T(k), dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1; out += `<text x="${Math.round(p[0] + dx / L * 13)}" y="${Math.round(p[1] + dy / L * 13 + 5)}" text-anchor="middle" style="fill:var(--ink);font:700 15px var(--sans)">${k}</text>`; }
    return out + "</svg>";
  }

  // does this look like a problem for this engine (several shapes, named points on sides, something to prove)?
  function applies(givens, ask){
    const t = clean(givens + "\n" + ask);
    const letters = new Set(t.match(/(?<![A-Z])[A-H](?![A-Z])|[A-H]{2,4}/g)?.join("").split("") || []);
    const onSide = new RegExp("[A-H](?![A-H])[^.\\n]{0,30}(?:נמצא|על\\s+(?:ה?צלע|ה?קטע)|\\bon\\s+(?:the\\s+)?(?:side|segment)|אמצע|midpoint)").test(t);
    const twoShapes = (t.match(/משולש|triangle|מרובע|טרפז|מקבילית|quadrilateral|trapezoid|parallelogram/gi) || []).length >= 2;
    const proveSomething = /הוכיח|להוכיח|prove|show that/i.test(t) && /[A-H]{2,4}/.test(t);
    const special = /חוצ(?:ה|ת)\s+(?:את\s+)?(?:ה)?זווית|bisect|תיכון|median|גובה\s+(?:ל|ב)|altitude/i.test(t) && /[A-H]{2}/.test(t);
    return onSide || twoShapes || proveSomething || special || letters.size > 4;
  }

  const api = { solve, applies, parse };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Proof = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
