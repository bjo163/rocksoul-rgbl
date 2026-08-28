# Upstream Sync & Immutability Policy

## 1. Filosofi Teks Kitab Suci: Mengapa Teks Kanonik Bersifat Immutable (Tetap)?

Teks kanonik primer (Quran, Alkitab Ibrani/Yunani, Dhammapada Pali, Bhagavad Gita Sanskerta, Hadis Klasik, Tao Te Ching, Analects) adalah teks sejarah yang telah berusia ratusan hingga ribuan tahun.

> [!IMPORTANT]
> **Teks sumber asli (root source text) TIDAK BOLEH di-sync otomatis secara dinamis saat runtime aplikasi.**

Alasan teknis & metodologis:
1. **Integritas Kriptografis (Deterministic Checksum):** Setiap dataset di MoonWitness Corpus memiliki hash SHA-256 (`CHECKSUMS.sha256`) yang diverifikasi dalam CI/CD. Sync dinamis yang mengubah karakter harakat/titik koma akan merusak reproducible builds.
2. **Offline-First & zero latency:** Aplikasi `moonwitness` harus bisa berjalan 100% secara lokal/offline tanpa bergantung pada API eksternal yang bisa down, diblokir, atau diubah skemanya.
3. **Kredibilitas Akademis & Teologis:** Teks suci yang berubah-ubah secara runtime membahayakan kepercayaan pengguna. Perubahan edisi harus melalui proses audit kuratorial resmi.

---

## 2. Kapan Script Update / Sync Dibutuhkan?

Sync atau re-materialisasi hanya dijalankan pada **development time** di repositori `moonwitness-corpus` melalui script materialisasi (`scripts/materialize-*.ts`) dalam skenario:

| Kategori Data | Karakteristik | Mekanisme Update |
|---|---|---|
| **Teks Kanonik Asli** (Al-Quran, WLC, SBLGNT, Tipitaka, Gita) | **Immutable** (Tetap selamanya) | Pinned SHA-256 snapshot. Tidak perlu sync rutin. |
| **Terjemahan Baru** (Bahasa Indonesia Kemenag edisi baru, terjemahan modern) | **Semi-Static** (Update per tahun/dekade) | Dijalankan via `scripts/materialize-*.ts` saat ada rilis resmi. |
| **Catatan Kaki, Tafsir & Leksikon** (Akar kata, kamus gramatikal, morfem) | **Evolving** (Bertambah seiring riset) | Ingestion berkala via CLI script. |
| **Doa & Adhkar Tematik** | **Curated** | Ingestion via API snapshot berversi. |

---

## 3. Pipeline Sync & Export: Corpus → MoonWitness App

Untuk menjaga aplikasi `moonwitness` (`X:\REPO\moonwitness`) tetap sinkron dengan corpus tanpa overhead runtime:

```
[Upstream Repos / APIs] (Tanzil, SuttaCentral, UmmahAPI, ctext)
         │
         ▼  (Development-time: scripts/materialize-*.ts)
[MoonWitness Corpus JSONL] (Deterministic Source of Truth)
         │
         ▼  (CLI Command: pnpm export:app-seeds)
[MoonWitness App Static Seed Bundle] (X:\REPO\moonwitness\server\seeds\*.json)
         │
         ▼  (App Bootstrap: demo-data.ts / db:seed)
[PostgreSQL / SQLite Database] (wx.* ORM Tables)
```

---

## 4. Perintah CLI yang Tersedia

- `pnpm export:app-seeds` — Mengekspor seluruh dataset aktif di corpus menjadi bundle JSON terstruktur untuk aplikasi `moonwitness`.
- `pnpm materialize:all` — Menjalankan kembali seluruh script materialisasi deterministik dari staging source.
- `pnpm validate` — Memvalidasi seluruh skema, relasi ID, dan SHA-256 checksum.
