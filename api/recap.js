// api/recap.js — proxy CORS untuk Apps Script (deploy di Vercel)
// Frontend nembak ke /api/recap, proxy ini yang nerusin ke Apps Script.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ⬇️ Ganti dengan URL Web App /exec kamu
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOYUQGZ2_Z9Tdx3ZAYd60YXmLzkg-zaxgZzLW-UJHs8sVA1seDnhY-VFuclxboA0AHYw/exec";

  // === MODE DIAGNOSTIK ===  buka di browser: /api/recap?test=1
  if (req.method === "GET") {
    if (req.query && req.query.test) {
      try {
        const u = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getTeam" }),
          redirect: "follow",
        });
        const t = await u.text();
        const trimmed = t.trim();
        return res.status(200).json({
          proxyOK: true,
          appsScriptUrlDiisi: !APPS_SCRIPT_URL.startsWith("PASTE_URL"),
          upstreamStatus: u.status,
          upstreamType: u.headers.get("content-type"),
          looksLikeJSON: trimmed.startsWith("{") || trimmed.startsWith("["),
          snippet: t.slice(0, 400),
        });
      } catch (e) {
        return res.status(200).json({ proxyOK: true, fetchError: String(e) });
      }
    }
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

  // === FORWARD NORMAL ===
  try {
    const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow",
    });
    const text = await upstream.text();
    // Kalau Apps Script balas HTML (mis. halaman login), jangan diteruskan mentah —
    // kasih error yang kebaca biar gampang didiagnosis.
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      return res.status(200).json({
        ok: false,
        error: "Apps Script balas non-JSON (kemungkinan akses deployment belum 'Anyone'). Cek /api/recap?test=1",
      });
    }
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
