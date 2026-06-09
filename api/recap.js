// api/recap.js — proxy CORS untuk Apps Script (deploy di Vercel)
// Frontend nembak ke /api/recap, proxy ini yang nerusin ke Apps Script.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

  // ⬇️ Ganti dengan URL Web App /exec kamu
  const APPS_SCRIPT_URL = "PASTE_URL_WEB_APP_DISINI";

  try {
    const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow",
    });
    const text = await upstream.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
