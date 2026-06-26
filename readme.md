<br />
<p align="center">
  <img src="assets/pakpost/logo.png" width="80" alt="Pakpost logo"/>
</p>

<h3 align="center">Pakpost — API Client untuk menguji dan mengeksplorasi API.</h3>

<p align="center">
  <a href="https://github.com/iiibnuadam/pakpost/releases">
    <img src="https://img.shields.io/badge/Download-Latest-brightgreen" alt="Download latest release"/>
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

Installer tersedia untuk **macOS**, **Windows**, dan **Linux** di halaman
[Releases](https://github.com/iiibnuadam/pakpost/releases).

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

## Build dari Source

```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build:web

# 3. Build Electron untuk OS saat ini
npm run build:electron
```

Hasil build ada di `packages/bruno-electron/out/`.

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
