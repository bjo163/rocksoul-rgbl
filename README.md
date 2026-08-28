# 🌙 MoonWitness Corpus Engine

> **Universal Scripture & Multi-Religious Knowledge Platform**  
> 537,512+ Indexed Records • Multi-Tradition Sacred Scriptures • Sub-Millisecond FTS5 Search (< 1ms) • Modular Fastify Engine • OpenTelemetry (OTel)

---

## ✨ Features & Highlights

- 📚 **Comprehensive Multi-Tradition Sacred Scriptures**:
  - **Islam**: Al-Qur'an (Uthmani + Multilingual), Kutubus Sittah (Bukhari, Muslim, Nawawi 40, Qudsi), 99 Asmaul Husna, 126 Authentic Duas (*Hisnul Muslim*).
  - **Judaism**: Tanakh (WLC Hebrew), Mishnah Pirkei Avot, Biblical Hebrew Lexicon.
  - **Christianity**: Greek New Testament (SBLGNT), Indonesian TSI, Early Christian Writings (Didache, Apostles' Creed).
  - **Hinduism**: Bhagavad Gita (18 Chapters), Yoga Sutras of Patanjali (4 Padas), Principal Upanishads (Isha, Kena, Katha, Mandukya), Sanskrit Lexicon.
  - **Buddhism**: Tipitaka (Dhammapada, Dīgha Nikāya, Majjhima Nikāya, Samyutta Nikāya, Aṅguttara Nikāya), Pali Lexicon.
  - **Daoism**: Tao Te Ching (Laozi 81 Chapters), Zhuangzi.
  - **Confucianism**: Analects of Confucius (20 Books).
  - **Zoroastrianism**: Gathas of Zarathustra (Yasna 28-53).
  - **Sikhism**: Japji Sahib (Mool Mantar, Salok, 38 Pauris).
  - **Jainism**: Tattvartha Sutra (Acharya Umaswati).
  - **Baháʼí**: The Hidden Words (Kalimát-i-Maknúnih).
  - **Shinto**: Kojiki Sacred Chronicles (Kojiki 712 CE).
- ⚡ **High-Performance Embedded Database**: Native SQLite database (`dist/corpus.sqlite`, 654 MB) with **FTS5 Full-Text Search** across Arabic, Sanskrit, Classical Chinese, Greek, Hebrew, Japanese, Indonesian, and English.
- 🚀 **Modular Fastify 5 REST API**: Booting instan (< 20ms) dengan **Swagger UI** di `http://localhost:3000/docs`.
- 🔭 **Full OpenTelemetry (OTel) & Prometheus**: W3C `traceparent` context propagation, `x-trace-id`, dan metrik Prometheus di `GET /metrics`.
- 🌐 **Master Upstream Registry**: Ingestion otomatis dari sumber resmi hulu (`config/upstream-registry.json`) via `pnpm sync:all`.
- 📦 **Universal TypeScript SDK (`@moonwitness/sdk`)**: Ergonomic, fully-typed API client.
- 💻 **Zero-Config CLI**: Pembaca kitab suci paralel dan pencarian FTS5 langsung dari terminal.

---

## ⚡ Quick Start

### 1. Standalone Fastify REST API Server (Port 3000)
```bash
# Menjalankan server Fastify
pnpm serve

# Mode developer dengan auto-reload
pnpm api:dev

# Interactive Swagger UI Documentation:
# 👉 Open: http://localhost:3000/docs
```

#### REST Endpoints:
- `GET /docs` — Swagger UI API Documentation
- `GET /metrics` — Prometheus & OpenTelemetry Metrics
- `GET /v1/health` — System status, memory RSS, and record count
- `GET /v1/traditions` — Dynamic list of active world religious traditions
- `GET /v1/works` — List all sacred works & scriptures
- `GET /v1/works/:id/passages` — Paginated verses with parallel translations
- `GET /v1/search?q={query}` — High-speed FTS5 full-text search
- `GET /v1/devotionals?tradition=islam` — Duas, Asmaul Husna, Mantras, Prayers
- `GET /v1/compare?theme={theme}` — Cross-tradition wisdom parallel search

---

### 2. Terminal Scripture Reader (CLI)
```bash
# Baca Bhagavad Gita 2:47 (Sanskrit + English + Indonesian)
pnpm cli read bhagavad-gita 2:47

# Baca Hadits Arba'in Nawawi #1 (Arab + Indonesia + Inggris)
pnpm cli read hadith-nawawi 1

# Baca Shinto Kojiki 1:1 (Jepang + Inggris + Indonesia)
pnpm cli read kojiki 1:1

# Baca Tao Te Ching Bab 1
pnpm cli read tao-te-ching 1

# Pencarian teks penuh cepat lintas 537.000+ ayat
pnpm cli search "keadilan"
```

---

### 3. Upstream Data Ingestion Pipeline
```bash
# Sinkronisasi live seluruh 12 tradisi dari repositori & API resmi hulu:
pnpm sync:all

# Sinkronisasi Islam (Hadits, Doa, Al-Qur'an):
pnpm sync:ummah

# Audit latensi & konektivitas API hulu:
pnpm upstream:audit
```

---

## 📚 Dokumentasi Lengkap
Lihat [**Dokumentasi Terpusat (`docs/README.md`)**](./docs/README.md) untuk panduan arsitektur, kebijakan sinkronisasi, dan integrasi aplikasi.
