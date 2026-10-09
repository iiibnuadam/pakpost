# Release Runbook — Pakpost

Runbook lengkap merilis Pakpost ke GitHub Releases. Rilis **tag-driven**: cukup push
tag `v*` dan CI yang build + publish untuk macOS, Windows, dan Linux.

---

## 1. Cara kerja (gambar besar)

```
push tag v1.0.3
   │
   ▼
.github/workflows/release.yml  (trigger: tags 'v*')
   │
   ├── macos-latest   ─┐
   ├── windows-latest  ├─ npm ci → build packages → build:web → build:electron
   └── ubuntu-latest  ─┘        (PUBLISH=always → upload ke GitHub Releases)
   │
   ▼
GitHub Release "Pakpost v1.0.3" berisi dmg/zip (mac x64+arm64),
installer Windows, dan paket Linux + feed auto-update (latest.yml)
```

- **Versi rilis diambil dari `packages/bruno-electron/package.json`** (`version`).
  Tag git **harus** diawali `v` + angka versi yang sama, mis. `v1.0.3`.
- Publish memakai `electron-builder --publish always` dengan
  `UPDATE_PROVIDER=github`, jadi aset ter-upload ke repo `iiibnuadam/pakpost`
  dan auto-update client mengambil dari situ.

---

## 2. Prasyarat (sekali saja)

| Prasyarat | Status / cara set |
|---|---|
| Secret `GH_TOKEN` di repo | GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**. Isi dengan Personal Access Token (classic) yang punya scope `repo` (atau fine-grained: Contents read/write + Actions). Workflow gagal 403 di langkah publish kalau ini belum ada/tidak valid. |
| Node sesuai `.nvmrc` (v22.12.0) | Workflow pakai `node-version-file: .nvmrc` — tidak perlu setup manual. |
| Apple Developer ID (opsional, untuk sign macOS) | Secret `APPLE_IDENTITY`, `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID`, lalu uncomment blok `# APPLE_*` di `release.yml`. Tanpa ini build macOS tetap jalan tapi **unsigned** (user harus klik kanan → Open saat pertama kali). |
| Dependabot | Sudah dinonaktifkan (tidak memengaruhi release, hanya mencegah PR spam). |

---

## 3. Pre-release checklist

Jalankan dari root repo, di branch `main`, working tree bersih:

```bash
nvm use                          # Node v22.12.0
npm ci                           # install bersih persis kayak CI

# 3.1 Test & lint
npm run test --workspace=packages/bruno-electron
npm run lint

# 3.2 Smoke test manual (wajib untuk rilis berfitur baru)
npm run dev
# - buka AI Chat, kirim pesan, cek session/history
# - tab Git: credential indicator, pull/push, conflict + AI resolve
# - Preferences > AI > CLI agent: ganti provider
npm run build:web                # pastikan renderer production build lolos

# 3.3 Update changelog
#    Isi tanggal + daftar perubahan di CHANGELOG.md pada baris "## [Unreleased]"

# 3.4 Bump versi (SATU-SATUNYA file yang diubah untuk versi)
#    Edit packages/bruno-electron/package.json → "version": "1.0.3"

git add -A
git commit -m "chore(release): v1.0.3"
git push origin main
```

> Auto-update hanya terkirim ke user kalau nomor versi **naik** dari rilis
> sebelumnya. Lupa bump = client tidak akan update.

---

## 4. Rilis (tag & push)

```bash
git tag -a v1.0.3 -m "Pakpost v1.0.3"
git push origin v1.0.3
```

Lalu pantau: **Actions tab** di GitHub → workflow "Release Electron App" jalan
3 job paralel (±15–30 menit tergantung runner). Cek hasil:

```bash
gh release view v1.0.3            # kalau pakai gh CLI
# atau buka https://github.com/iiibnuadam/pakpost/releases
```

Yang harus ada di release:
- `Pakpost_1.0.3_arm64_mac.dmg` / `.zip`, `Pakpost_1.0.3_x64_mac.dmg` / `.zip`
- installer Windows (`Pakpost_1.0.3_x64_win.exe` + `.yml` feed)
- paket Linux (AppImage/deb/rpm, tergantung target di `electron-builder-config.js`)
- `latest.yml` / `latest-mac.yml` / `latest-linux.yml` — **wajib ada**, ini feed auto-update.

Kalau satu OS gagal: fix → **re-run failed jobs** di Actions. Tag yang sama bisa
dipakai ulang (electron-builder akan menambah aset ke release yang sudah ada).

---

## 5. Rilis manual tanpa CI (darurat)

Kalau GitHub Actions sedang down atau perlu rilis cepat dari mesin sendiri:

```bash
# macOS (semua variant arm64+x64):
npm run build:web && npm run build:electron:mac
# Windows (bisa dari mac):
npm run build:electron:win
# Linux (WAJIB dari mesin Linux / Docker, tidak bisa dari mac):
npm run build:electron:linux   # atau deb / rpm
```

Artifak di `packages/bruno-electron/out/`. Upload ke GitHub Releases lewat web UI
(jangan lupa `latest*.yml` untuk auto-update), atau publish otomatis:

```bash
cd packages/bruno-electron
export GH_TOKEN=<PAT repo scope>
export PUBLISH=always UPDATE_PROVIDER=github UPDATE_OWNER=iiibnuadam \
       UPDATE_REPO=pakpost UPDATE_CHANNEL=latest
npm run dist:mac      # per-OS, sesuai mesin yang dipakai
```

---

## 6. Signing & notarisasi macOS

1. Punya Apple Developer Program aktif + **Developer ID Application** certificate.
2. Buat app-specific password: appleid.apple.com → Security → App-specific passwords.
3. Isi secret `APPLE_IDENTITY` (mis. `Developer ID Application: Nama (TEAMID)`),
   `APPLE_ID` (email), `APPLE_ID_PASSWORD` (app-specific password), `APPLE_TEAM_ID`.
4. Uncomment blok `# APPLE_*` di `.github/workflows/release.yml`, commit, **tag patch
   baru** (signing tidak bisa diterapkan ke rilis lama — artifact sudah terlanjur unsigned).

Hasil: user tidak lagi melihat "Pakpost cannot be opened" dari Gatekeeper, dan
app ter-notarize saat pertama dibuka.

---

## 7. Post-release

1. **Test update**: install rilis sebelumnya (atau `npm run dev` pakai versi lama),
   jalankan — app harus menawarkan update ke versi baru (menu auto-update /
   restart prompt, tergantung implementasi updater di app).
2. **Test clean install**: unduh dmg/exe dari halaman release, install di mesin
   bersih, smoke test fitur utama.
3. Update `CHANGELOG.md`: ganti `## [Unreleased]` menjadi
   `## [1.0.3] - 2026-10-09` dan buat section `[Unreleased]` kosong baru.
4. (Opsional) Tulis release notes manusiawi di halaman GitHub Release — body
   release dibuat otomatis oleh electron-builder, biasanya cuma daftar commit.

---

## 8. Rollback / hotfix

- **Rollback total**: hapus release + hapus tag (`git push origin :refs/tags/v1.0.3`),
  lalu tag ulang versi sebelumnya bila perlu. Client yang sudah update tidak akan
  kembali otomatis — user harus install manual versi lama.
- **Hotfix**: commit fix di main → bump patch (`1.0.4`) → tag `v1.0.4` → push.
  Jangan pernah re-tag angka yang sudah pernah dirilis dengan isi berbeda
  (feed auto-update akan kacau karena `latest.yml` di-cache).

---

## 9. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Job publish gagal 403/404 | `GH_TOKEN` belum diisi, expired, atau scope kurang. Cek repo Settings → Secrets; pastikan token bisa push ke repo ini. |
| Release terbuat tapi kosong/tanpa `latest.yml` | Lihat log job; biasanya `PUBLISH` tidak terbawa. Jangan pernah hapus `latest*.yml` dari aset release. |
| macOS dmg tidak ada arm64 & x64 | Config `electron-builder-config.js` target mac harus `arch: ['x64','arm64']` — jangan diubah ke arch tunggal kecuali sengaja. |
| "Version X is not new" / aset tidak ter-upload | Nomor versi di `package.json` tidak naik. Bump + tag baru. |
| App mac hasil release "damaged" | Build unsigned dan di-download via browser. Solusi benar: pasang signing (bagian 6). Workaround user: `xattr -dr com.apple.quarantine /Applications/Pakpost.app`. |
| Windows build gagal di CI | Cek log; sering karena resource limits. Re-run job. Build Windows stabil juga bisa dilakukan dari mac (`npm run build:electron:win`). |
| Tag sudah di-push tapi CI tidak jalan | Nama tag harus persis `v1.2.3` (awalan `v`). Cek Actions → enable workflow kalau repo baru dipindahkan. |
