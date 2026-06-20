// api/stock.js — Vercel serverless proxy to JSONBin.
// The JSONBin key NEVER reaches the browser; it lives in Vercel env vars.
//
// Required env vars (set in Vercel dashboard or .env for local `vercel dev`):
//   JSONBIN_MASTER_KEY   your JSONBin X-Master-Key (or a bin-scoped Access Key)
//   JSONBIN_BIN_ID       the bin id that holds the inventory document
//
// Browser calls:
//   GET  /api/stock   -> returns the inventory JSON
//   PUT  /api/stock   -> overwrites the inventory JSON (body = full document)

const BASE = "https://api.jsonbin.io/v3/b";

export default async function handler(req, res) {
  const key = process.env.JSONBIN_MASTER_KEY;
  const binId = process.env.JSONBIN_BIN_ID;

  if (!key || !binId) {
    res.status(500).json({ error: "Server not configured: set JSONBIN_MASTER_KEY and JSONBIN_BIN_ID." });
    return;
  }

  try {
    if (req.method === "GET") {
      const r = await fetch(`${BASE}/${binId}/latest`, {
        headers: { "X-Master-Key": key }
      });
      if (!r.ok) throw new Error(`JSONBin GET ${r.status}`);
      const json = await r.json();
      res.status(200).json(json && json.record ? json.record : json);
      return;
    }

    if (req.method === "PUT") {
      // req.body is auto-parsed by Vercel when Content-Type is application/json.
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      const r = await fetch(`${BASE}/${binId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": key },
        body
      });
      if (!r.ok) throw new Error(`JSONBin PUT ${r.status}`);
      res.status(200).json({ ok: true, updatedAt: new Date().toISOString() });
      return;
    }

    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
