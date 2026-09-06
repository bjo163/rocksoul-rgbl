# 🌙 MoonWitness Corpus Engine

> **Universal Scripture & Multi-Religious Knowledge Platform**  
> Multi-Tradition Sacred Scriptures • Fast SQLite/FTS5 Search • Modular Fastify Engine • OpenTelemetry (OTel)

<!-- CORPUS_STATS_START -->
## 📊 Live Corpus Statistics

> Generated automatically from repository configuration and the built SQLite corpus. These numbers are not maintained manually.

| Metric | Actual | Meaning |
|---|---:|---|
| 🌍 Registered traditions | 90 | Entries in the tradition registry |
| 📚 Registered works | 297 | Canonical work registry |
| 📖 Registered editions | 618 | Edition registry |
| 🧾 Indexed text records | 239,871 | Actual materialized contents rows |
| 🧩 Passages | 200,671 | Actual searchable passage units |
| ✅ Materialized works | 35 | Works with real textual records |
| 📦 Materialized editions | 38 / 618 | 6.15% of registered editions |
| 🌐 Content languages | 16 | Distinct languages in materialized content |
| 🙏 Devotional records | 99 | Duas, prayers, attributes, etc. |
| 🔤 Lexicon terms | 29 | Indexed lexicon entries |
| 🗃️ Raw records | 537,068 | Universal raw-record store |
| 💾 SQLite size | 728.18 MB | Generated database size |

_Last generated: 2026-09-06T09:39:23.297Z_
<!-- CORPUS_STATS_END -->

---

## ✨ Features & Highlights

- 📚 **Comprehensive Multi-Tradition Sacred Scriptures** across registered religious and cultural traditions.
- ⚡ **High-Performance Embedded Database**: Native SQLite with **FTS5 Full-Text Search** across the materialized corpus.
- 🚀 **Modular Fastify 5 REST API** with Swagger UI and searchable corpus endpoints.
- 🔭 **OpenTelemetry (OTel) & Prometheus** support for runtime observability.
- 🌐 **Master Upstream Registry**: ingestion from configured official/open upstream sources via `pnpm sync:all`.
- 📦 **Universal TypeScript SDK** and CLI tooling for programmatic corpus access.

---

## ⚡ Quick Start

### 1. Standalone Fastify REST API Server (Port 3000)
```bash
pnpm serve

# Interactive Swagger UI:
# http://localhost:3000/docs
```

#### REST Endpoints:
- `GET /docs` — Swagger UI API Documentation
- `GET /metrics` — Prometheus & OpenTelemetry Metrics
- `GET /v1/health` — System status and record count
- `GET /v1/traditions` — Active traditions
- `GET /v1/works` — Sacred works and scriptures
- `GET /v1/works/:id/passages` — Paginated passages
- `GET /v1/search?q={query}` — FTS5 full-text search
- `GET /v1/devotionals?tradition=islam` — Devotional records
- `GET /v1/compare?theme={theme}` — Cross-tradition comparison

### 2. Upstream Data Ingestion
```bash
pnpm sync:all
pnpm sync:ummah
pnpm upstream:audit
```

### 3. Regenerate Home Statistics
```bash
pnpm build:sqlite
pnpm home:stats
```

The `home:stats` command reads the registry plus the actual SQLite corpus and rewrites only the marked statistics block above.

---

## 📚 Documentation
See [**Central Documentation (`docs/README.md`)](./docs/README.md) for architecture, synchronization policy, ingestion methods, and integration guidance.
