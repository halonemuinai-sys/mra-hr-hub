# Deploy HR HUB dengan Docker (Proxmox)

Panduan untuk tim IT: menjalankan HR HUB di server Proxmox (VM atau LXC yang sudah ada Docker), seperti Helpdesk MRA.

## Isi paket

| Container | Fungsi | Port di dalam |
|---|---|---|
| `hrhub-nginx` | Pintu masuk satu-satunya. `/api/...` → backend, lainnya → frontend | 80 (dibuka ke host lewat `HTTP_PORT`) |
| `hrhub-web` | Frontend Next.js: portal karier (`/`) dan CMS (`/admin`) | 3006 |
| `hrhub-api` | Backend Express + Prisma | 5006 |

- **Database tetap di Supabase.** Tidak ada container database. Koneksinya diatur lewat `DATABASE_URL` dan `DIRECT_URL`.
- **File CV pelamar** disimpan di volume Docker `hrhub-uploads`. Volume ini permanen, tetap ada meskipun container di-rebuild. Sertakan volume ini dalam backup.
- Frontend memanggil backend lewat alamat yang sama (`/api`), jadi **tidak perlu setting CORS atau alamat backend terpisah**.

## 1. Persiapan server (sekali saja)

Gunakan Ubuntu 22.04/24.04 (VM atau LXC dengan *nesting* aktif). Install Docker dan Git:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # logout lalu login lagi
sudo apt install -y git
```

## 2. Ambil kode dan isi konfigurasi

```bash
sudo mkdir -p /opt/hrhub && sudo chown $USER:$USER /opt/hrhub
git clone https://github.com/halonemuinai-sys/mra-hr-hub.git /opt/hrhub
cd /opt/hrhub
cp .env.docker.example .env
nano .env
```

Isi minimal di `.env`:

| Variabel | Isi |
|---|---|
| `HTTP_PORT` | Port yang dibuka di server. `80`, atau `8080` jika port 80 sudah dipakai (misalnya oleh Helpdesk). |
| `DATABASE_URL`, `DIRECT_URL` | Koneksi Supabase (pooler 6543 dan direct 5432). |
| `JWT_SECRET` | Nilai acak **baru**, minimal 32 karakter. Buat dengan `openssl rand -hex 48`. |
| `PORTAL_URL` | Alamat yang dibuka pengguna, misalnya `https://hrhub.mragroup.co.id`. Dipakai untuk link di email. |
| `MAIL_MODE` + `SMTP_*` | Akun SMTP yang sama dengan Helpdesk. `MAIL_MODE=smtp` supaya email benar-benar terkirim. |

`.env` berisi rahasia dan **tidak pernah masuk ke git**.

## 3. Jalankan

```bash
cd /opt/hrhub
docker compose up -d --build
docker compose ps        # ketiganya harus "running"; hrhub-api "healthy"
```

Build pertama memakan waktu sekitar 3–6 menit. Setelah itu buka:
- Portal karier: `http://<ip-server>:<HTTP_PORT>/`
- CMS: `http://<ip-server>:<HTTP_PORT>/admin/login`
- Cek backend: `http://<ip-server>:<HTTP_PORT>/api/health`

## 4. Update ke versi terbaru

```bash
cd /opt/hrhub
bash deploy-docker.sh
```

Script ini menjalankan `git pull`, membangun ulang image, lalu me-restart container. File CV di volume tidak hilang.

## 5. Domain dan HTTPS

Arahkan domain (misalnya `hrhub.mragroup.co.id`) ke server. Lalu pilih salah satu:
- Jika sudah ada reverse proxy di Proxmox (Nginx Proxy Manager, Traefik, atau Nginx host), arahkan domain ke `http://<ip-server>:<HTTP_PORT>` dan aktifkan SSL di sana.
- Jika belum ada, pasang Nginx Proxy Manager atau Certbot di depan `HTTP_PORT`.

Setelah itu ubah `PORTAL_URL` ke alamat `https://` yang baru, lalu jalankan `docker compose up -d` lagi.

## Perintah yang sering dipakai

```bash
docker compose logs -f backend        # log backend (lihat error)
docker compose logs -f nginx          # log akses
docker compose restart backend        # restart backend saja
docker compose down                   # matikan semua (volume CV tetap aman)
docker compose exec backend node scripts/sendTestMail.js   # cek login SMTP

# Backup file CV
docker run --rm -v hrhub_hrhub-uploads:/data -v $PWD:/backup alpine tar czf /backup/hrhub-cv-$(date +%F).tar.gz -C /data .
```

Nama volume diawali nama folder project (`hrhub_`). Cek dengan `docker volume ls`.

## Sebelum dipakai sungguhan

- **Ganti password akun demo** (`Password123!`) atau nonaktifkan akunnya, lalu buat akun Super Admin pribadi.
- **Bersihkan data contoh** jika database production sama dengan database uji coba:
  ```bash
  docker compose exec backend node scripts/seedPipelineSamples.js --clean
  docker compose exec backend node scripts/seedJobSamples.js --clean
  ```
- Pastikan `MAIL_MODE=smtp`, lalu kirim satu email tes ke alamat sendiri: `docker compose exec backend node scripts/sendTestMail.js alamat@kamu.com`.
