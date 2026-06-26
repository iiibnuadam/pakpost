# Auto Update Pakpost

Fitur auto-update sudah terpasang. Dokumen ini menjelaskan cara setup
feed update secara **gratis** dan batasan per platform.

## Cara kerja singkat

Aplikasi memakai `electron-updater`. Saat startup, app akan cek versi
dari feed update. Kalau ada versi baru, muncul notifikasi di UI. User
klik **Download**, lalu setelah selesai klik **Restart** untuk install
versi baru tanpa download manual.

## 1. Feed update gratis pakai GitHub Releases (paling mudah)

Syarat:
- Repo GitHub **public** (gratis).
- Akun GitHub + Personal Access Token (`GH_TOKEN`) dengan scope `repo`.

### Build + publish dari lokal

```bash
npm run build:web

UPDATE_PROVIDER=github \
UPDATE_OWNER=iiibnuadam \
UPDATE_REPO=pakpost \
GH_TOKEN=ghp_xxxxxxxx \
PUBLISH=always \
  npm run build:electron
```

Script `build:electron` akan otomatis menyesuaikan OS yang dipakai dan
mengupload installer + `latest-mac.yml` / `latest.yml` / `latest-linux.yml`
ke GitHub Releases.

### Build + publish otomatis via GitHub Actions

File `.github/workflows/release.yml` sudah disediakan di repo. Workflow ini
berjalan setiap kali kamu push tag `v*`.

Langkahnya:
1. Push tag, misalnya `v2.0.1`.
2. Workflow akan build untuk macOS, Windows, dan Linux secara paralel.
3. Installer dan file `latest-*.yml` akan otomatis upload ke GitHub Releases.

> Pastikan secret `GH_TOKEN` sudah diset di repo baru.

## 2. Feed update gratis pakai static hosting (generic provider)

Kalau tidak mau pakai GitHub Releases API, bisa pakai static hosting
seperti **GitHub Pages**, **Cloudflare Pages**, atau **Surge.sh** (gratis).

Build tanpa publish:

```bash
UPDATE_PROVIDER=generic \
UPDATE_URL="https://updates.pakpost.app" \
  node scripts/build-electron.js
```

Setelah build, upload isi folder `packages/bruno-electron/out/` ke server:

```
https://updates.pakpost.app/
├── latest-mac.yml
├── latest.yml
├── latest-linux.yml
├── Pakpost_2.0.1_x64_mac.dmg
├── Pakpost_2.0.1_x64_mac.zip
├── Pakpost_2.0.1_x64_win.exe
└── Pakpost_2.0.1_x64_linux.AppImage
```

`latest-*.yml` berisi hash dan URL asset. Electron-updater akan membaca
file itu untuk tahu apakah ada versi baru.

## Environment variable yang dibutuhkan saat build

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `UPDATE_PROVIDER` | `github` / `generic` | Jenis feed update |
| `UPDATE_OWNER` | `iiibnuadam` | Owner GitHub (untuk github) |
| `UPDATE_REPO` | `pakpost` | Nama repo GitHub (untuk github) |
| `UPDATE_CHANNEL` | `latest` | Channel release |
| `UPDATE_URL` | `https://updates.pakpost.app` | URL server (untuk generic) |
| `GH_TOKEN` | `ghp_xxx` | Token publish ke GitHub Releases |

## macOS Gatekeeper helper

Karena Pakpost belum signed/notarized, app yang di-download bisa terkena
Gatekeeper quarantine dan muncul pesan "damaged". Sudah ada bantuan UI:

- Saat startup, kalau app terdeteksi quarantine, akan muncul dialog
  **"Hapus Quarantine"**. Klik itu akan menjalankan:
  ```bash
  xattr -dr com.apple.quarantine /Applications/Pakpost.app
  ```
- User juga bisa memilih menu **Help → Remove Gatekeeper Quarantine** kapan saja.

> Catatan: helper ini membuka app yang sudah terinstall. Untuk auto-update
> Mac yang seamless tetap butuh Apple Developer Program.

## Pindah dari fork ke repo sendiri?

Karena kamu fork dari repo `bruno`, sebaiknya **buat repo baru** untuk Pakpost
supaya:
- Release artifact tidak tercampur dengan upstream Bruno.
- Auto-update feed menunjuk ke release-mu sendiri.
- Branding & issue tracker independen.

Langkahnya:
1. Buat repo kosong `iiibnuadam/pakpost` di GitHub.
2. Di lokal, ubah remote origin:
   ```bash
   git remote rename origin upstream
   git remote add origin https://github.com/iiibnuadam/pakpost.git
   git push -u origin main
   ```
3. Update `homepage` dan `repository` di `packages/bruno-electron/package.json`.
4. Set `UPDATE_OWNER=iiibnuadam` dan `UPDATE_REPO=pakpost` saat build.

Kalau masih mau mengikuti update upstream Bruno, bisa sesekali merge dari
remote `upstream`.

## Batasan per platform (perlu diketahui)

### macOS
- **Auto-update hanya berjalan lancar kalau app di-sign dan di-notarize.**
- Signing + notarisasi memerlukan **Apple Developer Program** (berbayar ~$99/tahun).
- Kalau tidak signed/notarized, user tetap akan menemukan pesan "damaged"
  atau harus menjalankan `xattr -dr com.apple.quarantine`.
- Jadi untuk Mac, tidak ada solusi auto-update yang benar-benar gratis
  tanpa mengorbankan pengalaman user.
- Sebagai alternatif gratis, app sudah punya **Gatekeeper helper UI** di atas.

### Windows
- Code signing certificate berbayar, tapi **bukan wajib** untuk auto-update.
- App unsigned bisa auto-update, tapi Windows Defender / SmartScreen akan
  menampilkan peringatan.
- Untuk distribusi internal/kecil, ini cukup.

### Linux
- Target `AppImage` support auto-update tanpa signing.
- Target `deb` dan `rpm` **tidak support** auto-update via electron-updater.

## Langkah pertama yang direkomendasikan (gratis total)

1. Buat repo public `iiibnuadam/pakpost` di GitHub.
2. Build untuk Windows + Linux AppImage dengan `UPDATE_PROVIDER=github`.
3. Publish ke GitHub Releases.
4. Versi aplikasi yang sudah di-install oleh user akan otomatis cek update
   dari GitHub Releases saat startup.
5. Untuk Mac, sementara arahkan user menjalankan `xattr -dr com.apple.quarantine`
   atau beli Apple Developer Program kalau sudah serius.
