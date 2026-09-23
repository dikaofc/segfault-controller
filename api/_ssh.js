const { Client } = require('ssh2');

function getCfg() {
  const host = process.env.SF_HOST;
  const secret = process.env.SF_SECRET;
  if (!host || !secret) throw new Error('SF_HOST / SF_SECRET belum diisi di Vercel env');
  return { host, secret };
}

function runRemote(command, timeoutMs = 45000) {
  const { host, secret } = getCfg();
  return new Promise((resolve) => {
    const conn = new Client();
    let out = '';
    let errOut = '';
    let done = false;
    const finish = (ok, code, signal) => {
      if (done) return;
      done = true;
      try { conn.end(); } catch (_) {}
      resolve({ ok, code: code ?? null, signal: signal ?? null, stdout: out.slice(-8000), stderr: errOut.slice(-2000) });
    };
    const timer = setTimeout(() => finish(false, null, 'TIMEOUT'), timeoutMs);
    conn.on('ready', () => {
      conn.exec(command, { env: { SECRET: secret } }, (err, stream) => {
        if (err) { clearTimeout(timer); finish(false, null, 'EXEC_ERROR:' + err.message); return; }
        stream.on('close', (code, signal) => { clearTimeout(timer); finish(code === 0, code, signal); })
          .on('data', (d) => { out += d.toString(); })
          .stderr.on('data', (d) => { errOut += d.toString(); });
      });
    }).on('error', (e) => { clearTimeout(timer); finish(false, null, 'CONN_ERROR:' + e.message); })
      .connect({ host, port: 22, username: 'root', password: 'segfault', readyTimeout: 20000, keepaliveInterval: 10000 });
  });
}

module.exports = { runRemote };
