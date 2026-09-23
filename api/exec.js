const { runRemote } = require('./_ssh');

// POST /api/exec  { token, command }
// Full root ke instance segfault. Token wajib = CONTROLLER_TOKEN di Vercel env.
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const want = process.env.CONTROLLER_TOKEN;
  if (!want) { res.status(500).json({ error: 'CONTROLLER_TOKEN belum diisi' }); return; }
  if (body.token !== want) { res.status(401).json({ error: 'token salah' }); return; }

  const command = String(body.command || '').slice(0, 4000).trim();
  if (!command) { res.status(400).json({ error: 'command kosong' }); return; }

  const r = await runRemote(`bash -lc ${JSON.stringify(command)}`, 50000);
  res.status(200).json({ ts: new Date().toISOString(), command: command.slice(0, 200), ...r });
};
