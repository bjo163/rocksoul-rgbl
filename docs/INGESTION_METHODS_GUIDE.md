# 🔄 Panduan Lengkap Metode Ingestion: Upstream Registry vs Ingestion Recipe

Dokumen ini menjelaskan secara rinci dua metode utama penyerapan dan pemrosesan data kitab suci di **MoonWitness Corpus Engine**:
1. **Metode Penarikan Hulu (*Upstream Ingestion / Sync*)**
2. **Metode Resep Pemrosesan Kanonik (*Recipe Materialization / Ingestion*)**

---

## 🏛️ Arsitektur Pipeline Data Dua-Tahap

```
[Sumber Resmi Hulu] (REST API, Git Remote, Raw Archive)
         │
         ▼  (Metode 1: Upstream Sync via config/upstream-registry.json)
[ingestion/recipes/<name>/source/*.json|xml]  <-- Raw Source Files (Immutable Cache)
         │
         ▼  (Metode 2: Recipe Ingestion via recipe.json & recipe.ts)
[datasets/<tradition>/data/core/*.jsonl]       <-- Canonical Corpus Records (Spec v0.1/v0.2)
         │
         ▼  (Indexing & FTS5 Build)
[dist/corpus.sqlite]                           <-- High-Performance Search Database
```

---

## 🌐 1. Metode 1: Penarikan Hulu (*Upstream Registry & Sync*)

Metode ini bertugas **menghubungkan repositori lokal ke sumber asli di internet** (REST API, Git remotes, open-data archive) dan menyimpan payload mentah (*raw untouched data*) ke dalam folder `source/` pada masing-masing resep.

### 📋 Registry Konfigurasi: [`config/upstream-registry.json`](../config/upstream-registry.json)
File ini adalah peta otoritatif seluruh endpoint dunia:
- **Islam**: UmmahAPI (`https://ummahapi.com/api`), Tanzil Uthmani Quran
- **Judaism**: Sefaria REST API (`https://www.sefaria.org/api`), Open Scriptures Hebrew Bible (OSHB)
- **Buddhism**: SuttaCentral Bilara API (`https://suttacentral.net/api`)
- **Chinese Classics**: Chinese Text Project API (`https://ctext.org/api.pl`)
- **Hinduism, Christianity, Sikhism, Jainism, Zoroastrianism, Bahá'í, Shinto**: GRETIL, SBLGNT, ShabadOS, Sacred Texts Archive.

### 🛠️ Cara Eksekusi Manual via Upstream Sync:

#### A. Sinkronisasi Otomatis Seluruh Tradisi:
```bash
# Menjalankan seeder hulu untuk seluruh 12 tradisi secara paralel:
pnpm sync:all
```

#### B. Sinkronisasi Parsial per Tradisi:
```bash
# 1. Islam (UmmahAPI: 36k Hadits, Duas, Asmaul Husna, Quran):
pnpm sync:ummah

# 2. Judaism (Sefaria API: Tanakh, Pirkei Avot, Genesis, Exodus, Psalms):
npx tsx scripts/sync-sefaria.ts

# 3. Buddhism (SuttaCentral Bilara API: Tipitaka & Nikayas):
npx tsx scripts/sync-suttacentral.ts

# 4. Chinese Classics (CText API: Tao Te Ching, Analects Confucius, Zhuangzi):
npx tsx scripts/sync-ctext.ts

# 5. Hindu, Sikh, Jain, Bahá'í, Shinto (Vedas, Japji, Tattvartha, Gathas, Kojiki):
pnpm fetch:upstream
```

#### C. Audit Latensi & Konektivitas Endpoint Hulu:
```bash
pnpm upstream:audit
```

---

## 🍳 2. Metode 2: Pemrosesan Kanonik via Resep (*Ingestion Recipe*)

Setelah file mentah berada di `ingestion/recipes/<name>/source/`, **Metode Resep** bertugas mem-parsing, menormalkan (*normalize*), memetakan (*map*), dan memvalidasi rekaman menjadi format standar kanonik JSONL MoonWitness (`mw:passage:*`, `mw:content:*`, `mw:work:*`, `mw:provenance:*`).

### 📦 Struktur Standar Sebuah Resep (`ingestion/recipes/<name>/`):
1. **`recipe.json`**: Deklarasi metadata resep, path file sumber mentah, SHA-256 checksum, dan output target.
2. **`source/`**: File data mentah hasil unduhan dari hulu.
3. **`recipe.ts`**: Modul TypeScript murni yang memproses file mentah menjadi dataset JSONL kanonik.

### 🛠️ Cara Eksekusi Manual via Recipe:

#### A. Melalui CLI Ingest:
```bash
# Ingest resep spesifik:
pnpm cli ingest ingestion/recipes/quran-tanzil-uthmani
pnpm cli ingest ingestion/recipes/dhammapada-sujato
pnpm cli ingest ingestion/recipes/oshb-wlc
```

#### B. Menjalankan Modul Resep Langsung:
```bash
# Contoh: Materialisasi Shinto Kojiki dari file mentahnya:
npx tsx ingestion/recipes/shinto-kojiki/recipe.ts

# Contoh: Materialisasi Hadits Arba'in Nawawi:
npx tsx scripts/materialize-hadith-nawawi.ts

# Contoh: Materialisasi Sahih Muslim:
npx tsx scripts/materialize-hadith-muslim.ts
```

---

## 📊 3. Perbandingan Kedua Metode

| Dimensi | Metode 1: Upstream Sync | Metode 2: Recipe Ingestion |
|---|---|---|
| **Fokus Tugas** | Mengambil data mentah dari internet/API | Mengolah data mentah menjadi data kanonik JSONL |
| **Ketergantungan Jaringan** | Butuh koneksi internet (atau fallback cache) | 100% Offline & Deterministic |
| **Input Data** | URL API, HTTP Header, Token Auth | File mentah di `source/*.json|xml` |
| **Output Data** | File mentah di `ingestion/recipes/.../source/` | File kanonik di `datasets/.../data/core/*.jsonl` |
| **Verifikasi** | HTTP Status & Payload format | SHA-256 checksum, JSON Schema, & Invariant Validator |

---

## 🔄 4. Siklus Lengkap dari Hulu ke Database

Untuk menyerap data baru secara menyeluruh dari awal hingga siap kueri di API:

```bash
# Langkah 1: Tarik data mentah dari API hulu
pnpm sync:all

# Langkah 2: Bangun dataset kanonik & basis data SQLite
pnpm build:sqlite

# Langkah 3: Validasi integritas semantik korpus
pnpm validate

# Langkah 4: Jalankan API engine untuk verifikasi
pnpm serve
```
