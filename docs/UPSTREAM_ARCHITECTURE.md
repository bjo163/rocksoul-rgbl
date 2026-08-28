# Universal Upstream Repository & System Architecture

Dokumen ini mendefinisikan arsitektur resmi **Upstream Repository Registry** untuk seluruh 12 tradisi agama besar dunia di dalam `moonwitness-corpus`.

---

## 🏛️ Desain Sistem Terpusat (`config/upstream-registry.json`)

Seluruh sumber data hulu (*upstream sources*) tidak lagi tercecer secara ad-hoc, melainkan didaftarkan secara formal di [`config/upstream-registry.json`](file:///x:/REPO/moonwitness-corpus/config/upstream-registry.json).

```
moonwitness-corpus/
├── config/
│   └── upstream-registry.json     # Registry resmi 12 tradisi dunia, endpoint, auth, dan lisensi
├── ingestion/
│   └── recipes/
│       ├── ummah-api/             # Raw cache & resep Islam (Quran, Hadith, Duas, Asmaul Husna)
│       ├── sefaria/               # Raw cache & resep Tanakh, Mishnah & Talmud
│       ├── suttacentral/          # Raw cache & resep Tipitaka (Pali Canon)
│       ├── sblgnt/                # Raw cache Greek New Testament
│       ├── gretil/                # Raw cache Sanskrit Vedas & Upanishads
│       └── ctext/                 # Raw cache Chinese Classics (Daoism/Confucianism)
└── scripts/
    ├── upstream-manager.ts        # CLI manager (list, audit, sync)
    ├── sync-ummah-upstream.ts     # Dedicated multi-collection streaming seeder untuk UmmahAPI
    └── ingest-ummah-hadiths.ts    # Parser normalizer ke dataset kanonikal
```

---

## 🧭 Daftar Registry 12 Tradisi Dunia

| Tradisi | Bahasa & Aksara | Jenis Upstream | Endpoint / Repository Resmi | Lisensi | Kebutuhan Auth |
|---|---|---|---|---|---|
| **1. Islam** | `ar` (Arab) | REST API & Raw Archive | • `https://ummahapi.com/api`<br>• `https://tanzil.net`<br>• `https://quranenc.com/api` | CC0-1.0 / CC-BY-3.0 | `x-api-key: $UMMAH_API_KEY` |
| **2. Judaism** | `he` (Hebr) | REST API & Git Repo | • `https://www.sefaria.org/api`<br>• `https://github.com/openscriptures/morphhb.git` | CC-BY-SA-3.0 / CC-BY-4.0 | Bebas / Publik |
| **3. Christianity** | `grc` (Grek, Latn) | Git Repo & Archive | • `https://github.com/logos/sblgnt.git`<br>• `https://github.com/PerseusDL/canonical-greekLit` | CC-BY-4.0 / CC-BY-SA-3.0 | Bebas / Publik |
| **4. Hinduism** | `sa` (Deva, Latn) | Raw Archive & Git Repo | • `https://gretil.sub.uni-goettingen.de`<br>• `https://github.com/gita/gita.git` | Public Domain / CC0-1.0 | Bebas / Publik |
| **5. Buddhism** | `pli` (Latn, Deva) | Git Repo (Bilara API) | • `https://github.com/suttacentral/bilara-data.git` | CC0-1.0 | Bebas / Publik |
| **6. Daoism** | `lzh` (Hani) | REST API | • `https://ctext.org/api.pl` | Public Domain | Bebas / Opsional API Key |
| **7. Confucianism** | `lzh` (Hani) | REST API | • `https://ctext.org/api.pl` | Public Domain | Bebas / Opsional API Key |
| **8. Zoroastrianism** | `ae` (Avst, Latn) | Raw Archive | • `http://www.avesta.org` | Public Domain | Bebas / Publik |
| **9. Sikhism** | `pa` (Guru) | Git Repo | • `https://github.com/shabados/database.git` | GPL-3.0 | Bebas / Publik |
| **10. Jainism** | `sa` (Deva) | Raw Archive | • `https://jainlibrary.org` | Public Domain | Bebas / Publik |
| **11. Baháʼí** | `ar` (Arab, Latn) | Raw Archive | • `https://www.bahai.org/library` | Public Domain | Bebas / Publik |
| **12. Shinto** | `ja` (Jpan, Latn) | Raw Archive | • `https://sacred-texts.com/shi` | Public Domain | Bebas / Publik |

---

## 🛠️ Perintah CLI Manajemen Upstream

```bash
# Melihat daftar lengkap seluruh tradisi dan endpoint resminya:
pnpm upstream:list

# Memeriksa konektivitas jaringan dan kesehatan seluruh endpoint:
pnpm upstream:audit

# Menyedot koleksi Hadits & teks suci Islam dari UmmahAPI secara streaming:
pnpm sync:ummah
```
