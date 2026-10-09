# Changelog

## [Unreleased] — AI CLI Agent, AI Chat & Git Improvements

Semua fitur AI di bawah ini **tanpa API key** — jalan lewat CLI agent yang sudah
login di mesin (Claude Code / Kimi / Antigravity / custom), dikonfigurasi di
**Preferences > AI > CLI agent**.

### Added

- **AI Chat panel** (sidebar kanan, toggle ikon tongkat sihir di title bar):
  - Chat umum via CLI agent dengan streaming jawaban, tombol Stop, dan panel
    yang bisa di-resize.
  - **Session per workspace**: banyak sesi chat, judul otomatis dari pesan
    pertama, dropdown pindah sesi, tombol New/Delete, dan **Clear all history**
    (konfirmasi 2 klik, menghapus seluruh chat workspace itu dari UI + disk).
  - **History persist ke disk** — chat tidak hilang saat app ditutup
    (`ai-chat-history.json`, 30 sesi / 200 pesan per workspace).
  - Markdown rapi untuk jawaban: heading kompak, code block wrap + scroll,
    **tombol Copy di tiap code block**, list bullet/penomoran tampil benar,
    tabel, blockquote, link.
- **AI Git conflict resolver** (tab Git > kolom AI di file conflicted):
  - Fase 1: analisis konflik → modal saran berisi ringkasan ours/theirs,
    rekomendasi (ours/theirs/both/merged), alasan, dan risiko.
  - Fase 2: AI merge → hasil dibuka di conflict editor dengan label
    "AI-generated resolution" untuk direview sebelum disimpan.
- **Fix with AI untuk error git**: banner error permanen di tab Git (pull,
  push, fetch, dsb) dengan tombol *Fix with AI* — membuka AI Chat dengan sesi
  baru berjudul `Fix: <error>` berisi diagnostik lengkap (error, branch,
  ahead/behind, jumlah perubahan); jawaban tersimpan dan bisa dibuka kapan pun.
- **AI Assist tanpa API key**: tombol "Generate with AI" (generate
  Tests/Pre-request/Post-response/Docs) otomatis memakai CLI agent ketika
  API-key AI mati — API key tetap dipakai (jika ada) sebagai prioritas utama.
- **Persistensi settings Git per workspace**: kredensial + toggle
  autoCommit/autoPush/autoPull/autoPullInterval tersimpan ke disk
  (`git-workspace-settings.json`) — **token terenkripsi** (AES-256,
  machine-key, pola sama seperti penyimpanan OAuth2/API keys). Tidak hilang
  lagi saat restart app.
- **Indikator kredensial Git** di tab Git: titik hijau "Credentials set" /
  kuning "Fix credentials" / abu "Set credentials" dengan tooltip.
- **Runbook build** di README: dev, build macOS all-variant, signing,
  notarisasi, Windows, Linux, publish.

### Changed

- **Terminal** default cwd mengikuti workspace yang aktif (bukan home user).
- **Preferences > AI**: tab "Git conflicts" menjadi **"CLI agent"** — satu
  konfigurasi untuk AI Chat + conflict resolver + AI Assist.
- Input chat: textarea minimal 4 baris, bisa di-resize manual (drag pojok),
  tombol kirim di tengah vertikal.
- `pull.ff=only` tidak dipaksa lagi; repo lama yang terset `only` di-unset
  agar strategi merge bisa jalan.
- README: seksi build dari source diganti runbook lengkap (Bahasa Indonesia).

### Fixed

- **Kredensial git "tidak kesimpen"** — akar masalah di app: settings git
  workspace hanya disimpan di memory (Redux) dan hilang tiap restart. Sekarang
  persist terenkripsi ke disk. (Di sisi mesin, pastikan git punya credential
  helper, mis. `git config --global credential.helper osxkeychain`.)
- **Discard changes no-op / file masih muncul di Changes**: file baru yang
  sudah di-stage kini di-`git rm`, file ter-tracked di-`checkout HEAD --`,
  untracked dihapus dari disk; plus update Redux optimis + penjaga response
  polling basi, supaya baris hilang instan dan tidak muncul lagi.
- **Merge/pull fast-forward**: referensi `origin/origin/main` dobel pada cek
  status pull; deteksi konflik both-added (AA); setelah merge konflik, status
  langsung refresh tanpa harus reload.
- **Resolve "both"** pada konflik tanpa stage 3 sekarang menolak dengan pesan
  jelas alih-alih menghasilkan file kosong.
- Format jawaban AI di chat (double-spacing, heading besar, code block
  keluar bubble) — renderer markdown khusus chat.

### Notes / Known limitations

- Antigravity CLI belum terverifikasi (tidak tersedia saat development) —
  fallback plain text otomatis bila output bukan stream-json.
- Autocomplete editor tetap membutuhkan API key (latensi inline tidak cocok
  untuk spawn CLI); fitur CLI sepenuhnya opsional tanpa API key.
- Belum diuji runtime menyeluruh di dalam app Electron; seluruh logika
  inti (parser stream, spawn, enkripsi, round-trip sesi) terverifikasi via
  unit test, build production, dan skrip e2e terhadap CLI sungguhan.
