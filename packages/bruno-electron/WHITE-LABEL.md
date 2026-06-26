# White-label branding

Build Electron bisa di-rebrand per build tanpa harus ubah kode sumber.
Semua nilai branding dibaca dari environment variable saat build, lalu
disimpan ke `resources/white-label.json` supaya aplikasi hasil build tetap
memakai identitas yang sama saat runtime.

## Cara pakai cepat

```bash
# Contoh di macOS
WHITELABEL_PRODUCT_NAME="MyClient" \
WHITELABEL_APP_ID="com.example.myclient" \
WHITELABEL_PROTOCOL="myclient" \
WHITELABEL_PUBLISHER="Example Inc" \
WHITELABEL_COPYRIGHT_OWNER="Example Inc" \
WHITELABEL_GITHUB_URL="https://github.com/example/myclient/issues" \
  node scripts/build-electron.js
```

Atau simpan di file `.env`, lalu arahkan dengan `DOTENV_PATH`:

```bash
DOTENV_PATH=.env.myclient node scripts/build-electron.js
```

## Environment variable yang tersedia

| Variable | Default | Kegunaan |
|----------|---------|----------|
| `WHITELABEL_PRODUCT_NAME` | `PAKPOS` | Nama aplikasi, judul window, about window, label menu, nama protokol, nama installer |
| `WHITELABEL_APP_ID` | `com.pakpos.app` | macOS bundle ID / Windows ASID |
| `WHITELABEL_PROTOCOL` | `pakpos` | Custom URL scheme, misal `pakpos://` |
| `WHITELABEL_PUBLISHER` | `PAKPOS` | Nama publisher di Windows |
| `WHITELABEL_COPYRIGHT_OWNER` | `PAKPOS` | Baris copyright di installer dan about window |
| `WHITELABEL_GITHUB_URL` | `https://github.com/usebruno/bruno/issues` | Link report error yang muncul di console |
| `WHITELABEL_DESCRIPTION` | deskripsi dari `package.json` | Tagline di about window |
| `WHITELABEL_ICON_MAC` | `resources/icons/mac/icon.icns` | Icon aplikasi macOS |
| `WHITELABEL_ICON_WIN` | `resources/icons/win/icon.ico` | Icon aplikasi Windows |
| `WHITELABEL_ICON_LINUX` | `resources/icons/png` | Folder icon aplikasi Linux |
| `WHITELABEL_ABOUT_ICON` | `src/about/256x256.png` | Icon window/about |

## Mengganti icon

Cara paling mudah: timpa file-file di path default di atas.

Kalau mau tiap brand punya folder sendiri, arahkan lewat env var:

```bash
WHITELABEL_ICON_MAC="/path/to/myclient/icon.icns" \
WHITELABEL_ICON_WIN="/path/to/myclient/icon.ico" \
WHITELABEL_ICON_LINUX="/path/to/myclient/png" \
WHITELABEL_ABOUT_ICON="/path/to/myclient/256x256.png" \
  node scripts/build-electron.js
```

## Runtime config yang dihasilkan

`electron-builder-config.js` akan menulis `resources/white-label.json`
saat proses build berjalan. File ini dibaca saat runtime dan menangani
env var, jadi aplikasi hasil build berdiri sendiri tanpa bergantung pada
environment variable di mesin pengguna.

File `resources/white-label.json` sudah masuk `.gitignore`, jangan di-commit.

## Signing & notarisasi macOS

Agar macOS tidak menampilkan pesan "damaged" atau meminta perintah
`xattr -dr com.apple.quarantine`, aplikasi harus di-sign dan di-notarize.
Build lokal tetap unsigned jika env var di bawah tidak diset.

Variable yang dibutuhkan:

| Variable | Kegunaan |
|----------|----------|
| `APPLE_IDENTITY` | Nama sertifikat, misal `Developer ID Application: Your Name (TEAM_ID)` |
| `APPLE_ID` | Apple ID untuk notarisasi |
| `APPLE_ID_PASSWORD` | App-specific password untuk notarisasi |
| `APPLE_TEAM_ID` | **(recommended)** Team ID untuk notarytool |
| `APPLE_ASC_PROVIDER` | Provider legacy altool (fallback kalau `APPLE_TEAM_ID` kosong) |

Contoh build dengan signing + notarisasi:

```bash
WHITELABEL_PRODUCT_NAME="MyClient" \
WHITELABEL_APP_ID="com.example.myclient" \
APPLE_IDENTITY="Developer ID Application: Example Inc (ABCD123456)" \
APPLE_ID="developer@example.com" \
APPLE_ID_PASSWORD="abcd-efgh-ijkl-mnop" \
APPLE_TEAM_ID="ABCD123456" \
  node scripts/build-electron.js
```

Kalau `APPLE_IDENTITY`, `APPLE_ID`, dan `APPLE_ID_PASSWORD` sudah diset,
`electron-builder-config.js` otomatis mengaktifkan signing dan
`afterSign: 'notarize.js'`. Kalau `APPLE_TEAM_ID` juga diset, notarisasi
menggunakan `notarytool` (metode Apple yang sekarang direkomendasikan).
