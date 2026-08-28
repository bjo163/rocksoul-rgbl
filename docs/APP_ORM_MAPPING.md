# App ORM Model Mapping — Corpus → MoonWitness `wx.*` Models

Status: **reference mapping for seed data generation**.

This document maps every `wx.*` ORM model in the MoonWitness application (`packages/moon-witness/src/models/`) to its corpus data source, seed priority, and field mapping.

## Model inventory

The app defines 51 ORM models across 8 domain layers. Models marked 🔴 have zero seed data; 🟡 have partial; ✅ have adequate.

### Layer 1 — Foundation

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.entity` | ✅ | `world-religions-baseline` + all datasets | Seeded via other models |
| `wx.religion` | ✅ | `world-religions-baseline` | Done (12 religions) |

### Layer 2 — Scripture

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.scripture` | 🟡 1 only | `quran-tanzil-uthmani`, `oshb-wlc`, `sblgnt-v1-2`, `dhammapada-sujato`, `bhagavad-gita` | 🔴 CRITICAL |
| `wx.scripture.book` | 🟡 10 surahs | All scripture datasets | 🔴 CRITICAL |
| `wx.scripture.verse` | 🟡 ~600 | All scripture datasets | 🔴 CRITICAL |

### Layer 3 — Tradition (Legacy)

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.tradition` | 🟡 3 headers | `hadith-nawawi-40`, `mishnah-pirkei-avot`, `early-christian-writings`, `quran-tafsir-sample` | 🟡 HIGH |
| `wx.tradition.item` | 🟡 3 items | Same as above | 🟡 HIGH |

### Layer 4 — Tradition (Graph-based)

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.tradition.corpus` | 🔴 0 | Hadith/Mishnah/Patristic datasets | 🟡 MEDIUM |
| `wx.tradition.unit` | 🔴 0 | Same | 🟡 MEDIUM |
| `wx.transmission.chain` | 🔴 0 | Hadith isnad data | 🟢 LATER |
| `wx.transmission.link` | 🔴 0 | Same | 🟢 LATER |

### Layer 5 — Text & Content

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.passage` | 🔴 0 | All scripture/tradition datasets | 🟡 MEDIUM |
| `wx.content` | 🔴 0 | All multilingual text datasets | 🟡 MEDIUM |
| `wx.text.edition` | 🔴 0 | Source/edition metadata from all datasets | 🟡 MEDIUM |

### Layer 6 — Linguistics

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.lexeme` | 🔴 0 | `quran-arabic-lexicon`, `hebrew-biblical-lexicon`, `dhammapada-lexicon` | 🟡 MEDIUM |
| `wx.root` | 🔴 0 | Lexicon datasets | 🟡 MEDIUM |
| `wx.concept` | 🔴 0 | Cross-tradition concept curation | 🟢 LATER |
| `wx.divine.expression` | 🔴 0 | Quran + cross-tradition divine name data | 🟡 MEDIUM |
| `wx.divine.expression.occurrence` | 🔴 0 | Verse-level occurrence mapping | 🟢 LATER |
| `wx.lexical.occurrence` | 🔴 0 | Verse-level lexeme mapping | 🟢 LATER |

### Layer 7 — Figure & Devotion

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.figure` | ✅ 26 | `world-religions-baseline` | 🟡 Expand |
| `wx.figure.role` | ✅ 26 | Same + P13 textual evidence | 🟡 Expand |
| `wx.figure.name` | 🔴 0 | `world-religions-baseline` multilingual labels | 🟡 HIGH |
| `wx.asmaul.husna` | 🟡 20/99 | Quran + scholarly | 🔴 CRITICAL |
| `wx.devotion` | 🟡 2 | `devotional-baseline` | 🟡 HIGH |

### Layer 8 — Provenance & Source

| Model | Seed | Corpus Source | Priority |
|---|---|---|---|
| `wx.source` | 🟡 3 | All corpus dataset manifests | 🟡 HIGH |
| `wx.provenance` | 🟡 3 | All corpus dataset provenance records | 🟡 HIGH |
| `wx.evidence` | 🔴 0 | `world-religions-textual-evidence` | 🟡 MEDIUM |
| `wx.source.artifact` | 🔴 0 | Corpus source artifact metadata | 🟢 LATER |
| `wx.source.manifest` | 🔴 0 | Corpus manifest metadata | 🟢 LATER |
| `wx.source.policy` | 🔴 0 | Corpus rights/policy records | 🟢 LATER |
| `wx.source.snapshot` | 🔴 0 | Corpus ingestion snapshot metadata | 🟢 LATER |

### Remaining Models (Research, Relations, etc.)

| Model | Seed | Priority |
|---|---|---|
| `wx.assertion` | 🔴 0 | 🟢 LATER |
| `wx.relation` | 🔴 0 | 🟢 LATER |
| `wx.relation.type` | ✅ Seeded by `graph-core.ts` | Done |
| `wx.community` | 🔴 0 | 🟢 LATER |
| `wx.bookmark` | 🔴 0 | User-generated |
| `wx.history` | 🔴 0 | Auto-generated |
| `wx.revelation.event` | 🔴 0 | 🟢 LATER |
| `wx.revelation.event.passage` | 🔴 0 | 🟢 LATER |
| `wx.research.hypothesis` | 🔴 0 | 🟢 LATER |
| `wx.research.run` | 🔴 0 | 🟢 LATER |
| `wx.engine.run` | 🔴 0 | Auto-generated |
| `wx.engine.result` | 🔴 0 | Auto-generated |
| `wx.score.result` | 🔴 0 | Auto-generated |
| `wx.legacy.mapping` | 🔴 0 | Migration only |
| `wx.tradition.assessment` | 🔴 0 | 🟢 LATER |
| `wx.tradition.attribution` | 🔴 0 | 🟢 LATER |
| `wx.tradition.reference` | 🔴 0 | 🟢 LATER |
| `wx.entity.alias` | 🔴 0 | 🟢 LATER |
| `wx.entity.identifier` | 🔴 0 | 🟢 LATER |

## Field mapping — critical models

### wx.scripture

```text
Corpus Field              → ORM Field            Notes
──────────────────────────────────────────────────────────
(derived)                 → canonicalCode        QURAN/TAWRAT/ZABUR/INJIL or null
manifest.sources[0]       → name                 e.g. "Al-Qur'an Al-Karim"
(from content)            → originalName         Arabic/Hebrew/Greek original name
(derived)                 → slug                 e.g. "al-quran", "torah"
(fixed)                   → sourceClass          REVELATION or TEXTUAL_WITNESS
(fixed)                   → authorityClass       PRIMARY_SOURCE or TRANSLATION
(from registry)           → religion             e.g. "Islam", "Judaism"
(fixed)                   → type                 canonical / additional / philosophy
(from coverage)           → booksCount           e.g. 114, 39, 27
(from coverage)           → versesCount          e.g. 6236, 23213
(curated)                 → prophet              e.g. "Nabi Muhammad SAW"
(curated)                 → revelationEra        e.g. "610–632 M"
(curated)                 → description          Human-readable description
```

### wx.scripture.verse

```text
Corpus Field              → ORM Field            Notes
──────────────────────────────────────────────────────────
passage text (source lang)→ textOriginal          Arabic/Hebrew/Greek/Pali/Sanskrit
(if available)            → textTransliteration   Transliteration
content EN                → translationEn         English translation
content ID                → translationId         Indonesian translation
(if Quran)                → juz                   Juz number
(if commentary)           → tafsir                Commentary text
(if available)            → audioUrl              Audio reference
```

### wx.tradition.item

```text
Corpus Field              → ORM Field            Notes
──────────────────────────────────────────────────────────
hadith text Arabic        → textOriginal          Arabic matn
transliteration           → textTransliteration   Latin transliteration
translation ID            → translationId         Indonesian translation
translation EN            → translationEn         English translation
hadith number             → number                Report number in collection
grade                     → grade                 SHAHIH/HASAN/DHAIF/MAUDHU
narrator                  → narrator              Narrator chain summary
```
