# segfault-controller (Vercel)

Controller web + keepalive cron untuk instance segfault. Gratis, tanpa mesin always-on.

## Cara deploy (5 menit)

1. Push folder ini ke repo GitHub baru.
2. Vercel → Add New Project → import repo → Deploy (tanpa setting khusus).
3. Vercel → Settings → Environment Variables, isi:
   - `SF_HOST` = `lsd.segfault.net`
   - `SF_SECRET` = isi `echo $SF_SEC` dari instance
   - `CONTROLLER_TOKEN` = password bebas untuk UI (mis. random 24 char)
   - `CRON_SECRET` = random 24 char (tempel juga ke `vercel.json`? tidak — isi di Vercel Cron protection, atau kosongkan untuk tanpa auth)
4. Redeploy setelah isi env. Buka `https://<app>.vercel.app`, masukkan `CONTROLLER_TOKEN`, jalankan perintah.

## Cara kerja

- `GET /api/keepalive` — dipanggil Vercel Cron 1x/hari (`vercel.json`). Login SSH singkat:
  sentuh `/sec/.keepalive` (reset timer idle 36 jam) + pastikan anchor `tmux keep` + picu
  `up.sh quiet` detached. Sengaja tidak menunggu 9Router supaya <10s (limit function Hobby).
- `POST /api/exec {token, command}` — full root ke instance via `ssh2` (password `segfault` + env `SECRET`).
- `public/index.html` — UI tombol: jalankan perintah, pulihkan stack, cek log, tes keepalive.

## Batas jujur

- Vercel Hobby: cron 1x/hari, function timeout 60s. Cukup untuk ambang 36 jam,
  tapi BUKAN sesi permanen — kalau instance di-recycle infra, ia hidup lagi saat cron/exec berikutnya masuk (data `/sec` aman, `up.sh` memulihkan proses).
- Jangan isi `SF_SECRET` / `CONTROLLER_TOKEN` di kode — hanya di Vercel env.
- Kalau mau sesi 24/7 beneran, tetap butuh mesin always-on (`../segfault/LOKAL-setup.sh`) atau GitHub Actions (`../segfault/github-actions/`).
