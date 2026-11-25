// Math Snap smart reading: a Cloudflare Worker.
// POST /read  { image: <base64 jpeg>, mime, kind: "solve" | "geo", lang }  with  Authorization: Bearer <Firebase ID token>
// → { text }   The AI key stays here, as a secret (GEMINI_API_KEY); the app never has it.
// Settings (Cloudflare → the worker → Settings → Variables):
//   GEMINI_API_KEY  (secret)  the key from Google AI Studio
//   MODEL           optional  the Gemini model to use (default below; change it when Google retires it)
//   DAILY_LIMIT     optional  photos per account per day (default 40)
//   READS           optional  a KV namespace binding, needed for the daily limit
const PROJECT = "math-snap-529bc";
const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_BYTES = 4 * 1024 * 1024;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS } });

// ---------- the sign-in token (Firebase ID token, RS256) ----------
let keys = null, keysUntil = 0;
async function googleKeys() {
  if (keys && Date.now() < keysUntil) return keys;
  const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  const j = await r.json();
  keys = j.keys || []; keysUntil = Date.now() + 3600 * 1000;
  return keys;
}
const b64url = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
async function verify(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const head = JSON.parse(new TextDecoder().decode(b64url(parts[0])));
  const body = JSON.parse(new TextDecoder().decode(b64url(parts[1])));
  if (head.alg !== "RS256") return null;
  const jwk = (await googleKeys()).find(k => k.kid === head.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  const now = Math.floor(Date.now() / 1000);
  if (!ok || body.aud !== PROJECT || body.iss !== "https://securetoken.google.com/" + PROJECT || !body.sub || body.exp < now || body.iat > now + 300) return null;
  return body.sub;
}

// ---------- what we ask the AI ----------
function prompt(kind, lang) {
  const base = [
    "You read photos of school math, physics and chemistry exercises for a homework app. The text may be handwritten, printed or from a book, in Hebrew or English.",
    "Copy out the exercise exactly as written. Do NOT solve it, do not explain, do not add anything.",
    "Write maths as plain text: powers with ² ³ or ^ (x^5), fractions as a/b with brackets when needed ((x+1)/2), roots as √( ), multiplication as · only when written, points as A(1,2).",
    "Keep Hebrew words in Hebrew, in reading order. Put each equation or exercise on its own line. Keep numbering like א. ב. 1. 2.",
    "Use ∥ for parallel, ⊥ for perpendicular, ∠ for angles, △ for triangles, ° for degrees.",
    "If the photo has no maths at all, reply with an empty answer.",
  ];
  if (kind === "geo") base.push(
    "This is a geometry exercise. After the text, add one line per fact that appears ONLY in the drawing (not in the text), in Hebrew, like: \"AB ∥ CD\", \"∠A = 110°\", \"AB = 5\", \"AD ⊥ BC\", \"E אמצע AB\". Only facts that are clearly marked in the drawing.");
  return base.join("\n");
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/read") return json({ error: "not_found" }, 404);
    if (!env.GEMINI_API_KEY) return json({ error: "not_set_up" }, 503);
    // who is asking
    const auth = req.headers.get("Authorization") || "";
    let uid = null;
    try { uid = await verify(auth.replace(/^Bearer\s+/i, "")); } catch (e) { uid = null; }
    if (!uid) return json({ error: "signin" }, 401);
    // how many today
    const limit = +(env.DAILY_LIMIT || 40);
    const day = new Date().toISOString().slice(0, 10), kkey = uid + ":" + day;
    if (env.READS) {
      const used = +(await env.READS.get(kkey) || 0);
      if (used >= limit) return json({ error: "limit" }, 429);
      await env.READS.put(kkey, String(used + 1), { expirationTtl: 60 * 60 * 30 });
    }
    // the photo
    let body;
    try { body = await req.json(); } catch (e) { return json({ error: "bad" }, 400); }
    const image = String(body.image || ""), mime = /^image\/(jpeg|png|webp)$/.test(body.mime) ? body.mime : "image/jpeg";
    if (!image || image.length * 0.75 > MAX_BYTES || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) return json({ error: "bad_image" }, 400);
    const model = env.MODEL || DEFAULT_MODEL;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt(body.kind === "geo" ? "geo" : "solve", body.lang) }, { inline_data: { mime_type: mime, data: image } }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 1200 },
      }),
    });
    if (!r.ok) return json({ error: "ai", status: r.status }, 502);
    const j = await r.json();
    const text = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || "").join("").trim();
    return json({ text });
  },
};
