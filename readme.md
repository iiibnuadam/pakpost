<br />
<p align="center">
  <img src="assets/images/logo.png" width="80" alt="Pakpost logo"/>
</p>

<h3 align="center">Pakpost — API Client untuk menguji dan mengeksplorasi API.</h3>

<p align="center">
  <a href="https://iiibnuadam.github.io/pakpost/">
    <img src="https://img.shields.io/badge/Download-Landing%20Page-brightgreen" alt="Download landing page"/>
  </a>
  <a href="https://github.com/iiibnuadam/pakpost/releases">
    <img src="https://img.shields.io/badge/Download-GitHub%20Releases-blue" alt="Download latest release"/>
  </a>
  <a href="https://github.com/iiibnuadam/pakpost/actions/workflows/release.yml">
    <img src="https://github.com/iiibnuadam/pakpost/actions/workflows/release.yml/badge.svg" alt="Release workflow"/>
  </a>
</p>

**Pakpost** adalah API client desktop yang dibangun di atas [Bruno](https://www.usebruno.com/).
Semua koleksi API disimpan langsung di filesystem-mu dalam format teks polos,
jadi mudah dikelola dengan Git atau version control lainnya.

> Pakpost masih dalam tahap pengembangan aktif. Fitur dan tampilan akan terus
> diperbarui.

## Download

Installer tersedia untuk **macOS**, **Windows**, dan **Linux** di landing page:

👉 **[pakpost.app](https://iiibnuadam.github.io/pakpost/)**

Landing page akan otomatis mendeteksi sistem operasi kamu dan menampilkan
download yang paling sesuai. Atau pilih file sesuai platform di halaman
[Releases](https://github.com/iiibnuadam/pakpost/releases):

Pilih file sesuai platform:

| Platform            | File installer                         |
| ------------------- | -------------------------------------- |
| macOS Intel         | `Pakpost_<version>_x64_mac.dmg`        |
| macOS Apple Silicon | `Pakpost_<version>_arm64_mac.dmg`      |
| Windows             | `Pakpost_<version>_x64_win.exe`        |
| Linux AppImage      | `Pakpost_<version>_x64_linux.AppImage` |

## Auto Update

> **Auto-update saat ini dinonaktifkan.** Karena Pakpost belum memiliki code
> signing untuk macOS dan Windows, fitur auto-update dimatikan sementara.
>
> Untuk mendapatkan versi terbaru, download ulang installer dari halaman
> [Releases](https://github.com/iiibnuadam/pakpost/releases).
>
> Auto-update akan diaktifkan kembali setelah Apple Developer ID dan
> Windows code signing certificate tersedia.

## Build dari Source (Runbook)

> **Mau rilis?** Lihat [RELEASE.md](RELEASE.md) — runbook lengkap tagging, CI release,
> signing macOS, auto-update, rollback, dan troubleshooting.

### Prasyarat

- **Node.js v22.12.0** — sesuai `.nvmrc`, pakai `nvm use` supaya otomatis.
- **npm** (bundled dengan Node).
- **Git**.
- macOS: **Xcode Command Line Tools** (`xcode-select --install`) — diperlukan
  untuk compile native deps (`node-pty`).

### Setup pertama kali

```bash
git clone https://github.com/iiibnuadam/pakpost.git
cd pakpost

nvm use              # Node v22.12.0
npm install          # install semua workspace
npm run setup        # deps platform (node-pty utk arm64 + x64)
```

### Development (tanpa build)

```bash
npm run dev          # jalanin web + electron sekaligus
# atau:
npm run dev:web      # web app saja
npm run dev:electron # electron saja (perlu web yang sudah jalan)
# hot reload saat ngoding:
npm run dev:watch
```

### Build production

Urutannya selalu: **build web dulu, baru electron** — script electron
menyalin hasil `packages/bruno-app/dist` ke dalam app.

#### macOS — semua varian (satu perintah)

```bash
npm run build:web
npm run build:electron:mac
```

Hasilnya di `packages/bruno-electron/out/` — **4 varian sekaligus**
(dmg + zip, masing-masing arm64 + x64):

| File | Untuk |
|---|---|
| `Pakpost_1.0.2_arm64_mac.dmg` | Apple Silicon (M1/M2/M3/M4) |
| `Pakpost_1.0.2_x64_mac.dmg` | Intel Mac |
| `Pakpost_1.0.2_arm64_mac.zip` | auto-update feed (arm64) |
| `Pakpost_1.0.2_x64_mac.zip` | auto-update feed (x64) |

> Versi di nama file mengikuti `version` di `packages/bruno-electron/package.json`.
> Varian "universal" (single binary) tidak dikonfigurasi — build default membuat
> dmg terpisah per arsitektur.

#### OS lain

```bash
npm run build:electron         # auto-detect OS (di Mac = mac)
npm run build:electron:win     # NSIS installer x64 + arm64 — bisa dari Mac
npm run build:electron:win-mac # Windows + macOS sekaligus
npm run build:electron:linux   # AppImage x64 + arm64
npm run build:electron:deb     # Debian/Ubuntu
npm run build:electron:rpm     # Fedora/RHEL
npm run build:electron:snap    # Snapcraft
```

> ⚠️ Target **Linux tidak bisa di-build native di macOS** — perlu mesin Linux
> atau Docker. Untuk release lintas platform, pakai GitHub Actions
> (lihat bagian publish di bawah).

#### Signing & notarisasi (opsional)

Kalau env berikut diset, build otomatis sign + notarize pakai identitas Apple:

```bash
export APPLE_IDENTITY="Developer ID Application: Nama Kamu (TEAMID)"
export APPLE_ID="email@apple.com"
export APPLE_ID_PASSWORD="app-specific-password"
npm run build:electron:mac
```

Tanpa env itu, hasil build **unsigned** — lihat [Catatan macOS](#catatan-macos)
untuk cara buka aplikasinya.

### Test sebelum build

```bash
npm run lint
npm test --workspace=packages/bruno-electron
```

### Build dari nol (kalau ada yang aneh)

```bash
rm -rf node_modules packages/*/node_modules \
       packages/bruno-app/dist \
       packages/bruno-electron/out packages/bruno-electron/web
npm install && npm run setup
npm run build:web
npm run build:electron:mac
```

### Build & publish release ke GitHub

#### Otomatis via GitHub Actions (direkomendasikan)

1. Update versi di `packages/bruno-electron/package.json`.
2. Commit dan push perubahan.
3. Buat tag dan push:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Workflow `.github/workflows/release.yml` akan otomatis build untuk macOS,
Windows, dan Linux, lalu mengupload installer ke GitHub Releases.

#### Manual dari lokal

Pastikan `GH_TOKEN` sudah diset sebagai environment variable, lalu:

```bash
npm run build:web

UPDATE_PROVIDER=github \
UPDATE_OWNER=iiibnuadam \
UPDATE_REPO=pakpost \
GH_TOKEN=ghp_xxx \
PUBLISH=always \
  npm run build:electron
```

> `PUBLISH=always` diperlukan agar `electron-builder` mengupload hasil build
> ke GitHub Releases. Tanpa env ini, build hanya menghasilkan file installer
> di lokal tanpa publish.

## Catatan macOS

Karena Pakpost belum di-sign dan di-notarize oleh Apple, macOS bisa
menandai aplikasi sebagai **damaged** atau memblokir pembukaan.

Solusinya:

- Saat pertama kali buka, akan muncul dialog **"Hapus Quarantine"**. Klik
  tombol tersebut supaya Pakpost bisa berjalan normal.
- Atau jalankan manual di Terminal:
  ```bash
  xattr -dr com.apple.quarantine /Applications/Pakpost.app
  ```
- Untuk pengalaman tanpa peringatan Gatekeeper, diperlukan Apple Developer
  Program (berbayar) untuk signing + notarisasi.

## Fitur Utama

- 🖥️ **Cross-platform** — macOS, Windows, Linux.
- 📝 **Collections di filesystem** — semua request disimpan sebagai file teks,
  mudah dikerjakan dengan Git.
- 🔒 **Offline-first** — data tetap di perangkatmu.
- 🧪 **API testing** — support request, environments, asserts, dan collection runner.

## Lisensi

Pakpost didistribusikan di bawah lisensi yang sama dengan Bruno.
Lihat file [license.md](license.md) untuk detail lengkap.
