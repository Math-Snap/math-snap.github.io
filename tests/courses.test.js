// The Learn content: every course and lesson is complete, practice is answerable, and every drawing exists.
const fs = require("fs"), path = require("path");
const C = require("../app/src/main/assets/courses.js");
const Topics = require("../app/src/main/assets/topics.js");
const learn = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/learn.js"), "utf8");
const figs = new Set([...learn.slice(learn.indexOf("const FIGS = {")).matchAll(/^    (\w+)\(/gm)].map(m => m[1]));
const topics = new Set(Topics.TOPICS.map(t => t.id));
let bad = 0; const fail = (...a) => { bad++; console.error("FAIL", ...a); };
const ids = new Set();
if (C.COURSES.length < 10) fail("too few courses");
for (const co of C.COURSES) {
  if (!co.he || !co.en || !co.icon || !/^#[0-9A-F]{6}$/i.test(co.color) || !co.blurb) fail("course fields", co.id);
  if (!C.SUBJECTS.some(s => s.id === co.subject)) fail("subject", co.id);
  if (!co.lessons.length) fail("no lessons", co.id);
  for (const l of co.lessons) {
    const at = co.id + "/" + l.id;
    if (ids.has(l.id)) fail("duplicate id", at); ids.add(l.id);
    if (!l.he || !l.en || !(l.min > 0)) fail("lesson fields", at);
    if (!Array.isArray(l.video) || l.video.length < 2) fail("video needs 2+ scenes", at);
    for (const sc of l.video || []) {
      if (!sc.cap) fail("scene without a caption", at);
      if (sc.fig && !figs.has(sc.fig.type)) fail("unknown drawing", sc.fig.type, at);
      if (!sc.fig && !(sc.show || []).length) fail("empty scene", at);
    }
    if (!l.idea || !l.idea.length) fail("no idea", at);
    for (const p of [].concat(l.idea, co.blurb)) if ((p.match(/`/g) || []).length % 2) fail("unclosed ` in", at);
    const ex = l.example || {};
    if (!ex.q || !ex.a || !(ex.steps || []).length) fail("example", at);
    for (const st of ex.steps || []) if (!Array.isArray(st) || !st[0]) fail("example step", at);
    const m = l.mistake || {};
    if (!m.wrong || !m.right || !m.why) fail("mistake", at);
    const pr = l.practice || {};
    if (pr.topic && !topics.has(pr.topic)) fail("unknown practice topic", pr.topic, at);
    if (!pr.topic && (pr.items || []).length < 2) fail("practice needs a topic or 2+ questions", at);
    for (const it of pr.items || []) {
      if (!it.q || !it.a || !Array.isArray(it.v) || !it.v.length || !(it.steps || []).length) fail("practice item", at, it.q);
      // a plain number answer must match its accepted value
      const plain = String(it.a).replace(/[−–]/g, "-").replace(/°$/, "");
      if (/^-?\d+(\.\d+)?$/.test(plain) && typeof it.v[0] === "number" && Math.abs(+plain - it.v[0]) > 1e-9) fail("answer ≠ value", at, it.a, it.v[0]);
    }
  }
}
if (C.all().length < 40) fail("too few lessons", C.all().length);
if (bad) { console.error(bad + " problems"); process.exit(1); }
console.log("ok courses: " + C.COURSES.length + " courses, " + C.all().length + " lessons, " + figs.size + " drawings");
