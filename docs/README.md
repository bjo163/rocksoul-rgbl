# 📚 MoonWitness Corpus Architecture & Documentation Hub

Pusat dokumentasi arsitektur, spesifikasi teknis, pedoman upstream ingestion, dan panduan integrasi sistem korpus kitab suci dunia **MoonWitness**.

---

## 🗺️ Index & Navigation

### 1. 🌐 Upstream Ingestion & Data Architecture
- [**Upstream Architecture & Policy**](./UPSTREAM_ARCHITECTURE.md) — Arsitektur streaming pagination, checksum pinning, dan registry hulu.
- [**Upstream System Registry**](../config/upstream-registry.json) — Registry resmi URL endpoint, git remotes, dan lisensi 12 tradisi dunia.
- [**Dataset Target & Coverage**](./DATASET_TARGETS.md) — Matriks target kitab suci, hadits, tafsir, dan korpus filosofis.
- [**Sync & Upstream Policy**](./SYNC_AND_UPSTREAM_POLICY.md) — Kebijakan sinkronisasi berkala dan integritas byte-deterministic.
- [**Seed Data Architecture**](./SEED_DATA_ARCHITECTURE.md) — Struktur data seed dan normalisasi multilingual.

### 2. ⚡ Fastify Engine & OpenTelemetry (OTel)
- [**Modular Fastify 5 Microservice**](../apps/api/README.md) — Spesifikasi REST API, Swagger UI `/docs`, dan sub-millisecond FTS5 search.
- [**OpenTelemetry & Prometheus Telemetry**](../apps/api/src/plugins/telemetry.ts) — Distributed tracing W3C context propagation dan metrik `/metrics`.
- [**Application Integration Guide**](./APP_INTEGRATION_ADVICE.md) — Panduan integrasi client/downstream apps dengan `@moonwitness/sdk`.
- [**ORM & Repository Mapping**](./APP_ORM_MAPPING.md) — SQLite schema mapping, indexing table, dan query patterns.

### 3. 📖 World Religious Traditions & Scripture Baselines
| Tradisi | Kitab Suci Utama | Sumber Upstream | Recipe Path |
|---|---|---|---|
| **Islam** | Al-Qur'an, Kutubus Sittah (Bukhari, Muslim, Nawawi 40, Qudsi), Duas, Asmaul Husna | UmmahAPI / Tanzil | `ingestion/recipes/ummah-api/` |
| **Judaism** | Tanakh (WLC), Mishnah (Pirkei Avot), Psalms | Sefaria REST API / OSHB | `ingestion/recipes/sefaria/` |
| **Christianity** | Greek NT (SBLGNT), Indonesian TSI, Early Christian Writings | SBLGNT / ECW | `ingestion/recipes/sblgnt-v1-2/` |
| **Hinduism** | Bhagavad Gita, Yoga Sutras, Principal Upanishads | GRETIL / Sacred Texts | `ingestion/recipes/principal-upanishads/` |
| **Buddhism** | Tipitaka (Dhammapada, Dīgha, Majjhima, Samyutta, Aṅguttara Nikāya) | SuttaCentral Bilara API | `ingestion/recipes/suttacentral/` |
| **Daoism** | Tao Te Ching (Laozi 81 Bab), Zhuangzi | Chinese Text Project API | `ingestion/recipes/ctext/` |
| **Confucianism** | Analects of Confucius (20 Buku) | Chinese Text Project API | `ingestion/recipes/ctext/` |
| **Zoroastrianism** | Gathas of Zarathustra (Yasna 28-53) | Avesta Digital Archive | `ingestion/recipes/zoroastrianism-gathas/` |
| **Sikhism** | Japji Sahib (Sri Guru Granth Sahib) | ShabadOS Open Heritage | `ingestion/recipes/sikhism-japji-sahib/` |
| **Jainism** | Tattvartha Sutra (Acharya Umaswati) | Jain Heritage Data | `ingestion/recipes/jainism-tattvartha-sutra/` |
| **Baháʼí** | The Hidden Words (Kalimát-i-Maknúnih) | Baháʼí Open Data | `ingestion/recipes/bahai-hidden-words/` |
| **Shinto** | Kojiki Sacred Chronicles (Kojiki 712 CE) | Sacred Texts Archive | `ingestion/recipes/shinto-kojiki/` |

### 4. 🧠 Semantics, Lexicons & Intertextual Graph
- [**Lexicon Coverage & Bridges**](./P15-COVERAGE-REPORT.md) — Kamus bahasa suci: Arab, Ibrani, Yunani Koine, Sanskerta, Pali.
- [**Intertextual Evidence Graph**](./INTERTEXTUAL_EVIDENCE_GRAPH_TARGETS.md) — Relasi paralel dan alignment antar tradisi.
- [**Terminology Review Workflow**](./P15-TERMINOLOGY-REVIEW-WORKFLOW.json) — Tata kelola istilah, desensitisasi, dan tinjauan penerjemahan.

---

## 🛠️ CLI Task Index

```bash
# Sinkronisasi hulu
pnpm sync:all          # Sinkronisasi live seluruh 12 tradisi
pnpm sync:ummah        # Sinkronisasi Islam (Hadits, Doa, Quran)
pnpm upstream:audit    # Audit konektivitas & latensi API hulu

# Menjalankan Fastify Engine
pnpm serve             # Menjalankan Fastify REST API di port 3000
pnpm api:dev           # Mode developer dengan auto-reload

# Validasi & Pengujian
pnpm check             # Full verification gate (Test + Validate + Build + Release)
pnpm test              # 146+ unit tests
pnpm validate          # Validasi semantik 537k+ records
pnpm build:sqlite      # Rebuild embedded database dist/corpus.sqlite
```
