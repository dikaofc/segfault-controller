const { runRemote } = require('./_ssh');

// Vercel Cron 1x/hari (limit Hobby). Tugas: reset timer idle 36 jam + picu up.sh detached.
// Sengaja cepat (<10s): tidak menunggu 9Router, cukup sentuh /sec/.keepalive + trigger async.
module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET only' }); return; }

  // Kunci cron opsional: kalau CRON_SECRET diisi, wajib cocok.
  const want = process.env.CRON_SECRET;
  if (want) {
    const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (got !== want) { res.status(401).json({ error: 'unauthorized' }); return; }
  }

  const cmd = [
    'mkdir -p /sec && date -Is >> /sec/.keepalive',
    'command -v tmux >/dev/null 2>&1 && (tmux has-session -t keep 2>/dev/null || tmux new-session -d -s keep \'while :; do sleep 3600; done\') || true',
    '(setsid /sec/root/segfault/up.sh quiet >> /sec/root/.hermes/gateway-logs/up-trigger.log 2>&1 < /dev/null &) 2>/dev/null || true',
    'tail -1 /sec/.keepalive 2>/dev/null; echo KEEPALIVE_OK'
  ].join(' && ');

  const r = await runRemote(cmd, 40000);
  res.status(r.ok ? 200 : 500).json({ ts: new Date().toISOString(), ...r });
};
