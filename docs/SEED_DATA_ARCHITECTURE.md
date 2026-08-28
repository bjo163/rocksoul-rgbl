# Seed Data Architecture — Corpus → MoonWitness App

Status: **proposed architecture for P12+ seed pathway**.

This document defines how `moonwitness-corpus` datasets serve as the canonical seed data source for the MoonWitness application's demo/install workflow.

## Design principles

1. **Corpus is the source of truth.** All religious text data originates from provenance-audited, rights-verified, checksummed corpus datasets. The app never invents canonical text data.
2. **No runtime API dependency.** Seed data must work offline. The current `api.quran.com` fetch pattern in `demo-data.ts` is replaced by static corpus-derived bundles.
3. **Idempotent seed.** Running the seed multiple times produces the same database state. Existing records are matched by `stableKey`/`canonicalKey`/`slug` and updated, not duplicated.
4. **ORM-aware mapping.** Corpus JSONL records map to specific `wx.*` ORM models through documented field mappings.

## Architecture

```text
moonwitness-corpus (canonical JSONL datasets)
        │
        ├── pnpm build
        │       ↓
        ├── dist/seed-bundle/          ← generated JSON seed bundles
        │       ├── religions.json
        │       ├── scriptures.json
        │       ├── scripture-books.json
        │       ├── scripture-verses.json
        │       ├── traditions.json
        │       ├── tradition-items.json
        │       ├── figures.json
        │       ├── figure-roles.json
        │       ├── asmaul-husna.json
        │       ├── devotions.json
        │       ├── sources.json
        │       ├── provenance.json
        │       └── manifest.json       ← version, checksums, record counts
        │
        └── published as npm package or git submodule
                │
                ↓
moonwitness (app)
        │
        └── packages/moon-witness/src/seed/
                ├── graph-core.ts        ← existing: relation types + 3 religions
                ├── corpus-import.ts     ← NEW: reads seed bundle → ORM spawn
                └── demo-data.ts         ← legacy: refactored to use corpus bundle
```

## Seed bundle format

Each bundle file is a JSON array of records pre-mapped to ORM field names:

```jsonc
// dist/seed-bundle/scriptures.json
[
  {
    "canonicalCode": "QURAN",
    "name": "Al-Qur'an Al-Karim",
    "originalName": "القرآن الكريم",
    "slug": "al-quran",
    "sourceClass": "REVELATION",
    "authorityClass": "PRIMARY_SOURCE",
    "religion": "Islam",
    "type": "canonical",
    "booksCount": 114,
    "versesCount": 6236,
    "prophet": "Nabi Muhammad SAW",
    "revelationEra": "610–632 M",
    "description": "..."
  },
  {
    "canonicalCode": "TAWRAT",
    "name": "Torah / Hebrew Bible",
    "originalName": "תורה",
    "slug": "torah",
    // ...
  }
]
```

## Corpus dataset → ORM model mapping summary

```text
Corpus Dataset                    → App ORM Model(s)
─────────────────────────────────────────────────────────
quran-tanzil-uthmani              → wx.scripture (QURAN)
                                    wx.scripture.book (114 surahs)
                                    wx.scripture.verse (6,236 ayahs)
quranenc-english-rwwad            → wx.scripture.verse.translationEn
quranenc-indonesian-kemenag       → wx.scripture.verse.translationId
oshb-wlc                         → wx.scripture (TAWRAT)
                                    wx.scripture.book (39 books)
                                    wx.scripture.verse (23,213 verses)
sblgnt-v1-2                      → wx.scripture (INJIL)
                                    wx.scripture.book (27 books)
                                    wx.scripture.verse (7,941 verses)
web-classic-2020                  → wx.scripture.verse.translationEn
bible-tsi-2021                    → wx.scripture.verse.translationId
dhammapada-sujato                 → wx.scripture (additional)
                                    wx.scripture.book (26 chapters)
                                    wx.scripture.verse (423 stanzas)
bhagavad-gita                     → wx.scripture (philosophy)
                                    wx.scripture.book (18 chapters)
                                    wx.scripture.verse (~700 shlokas)
hadith-nawawi-40                  → wx.tradition + wx.tradition.item
quran-tafsir-sample               → wx.tradition (COMMENTARY) + items
mishnah-pirkei-avot               → wx.tradition (RABBINIC) + items
early-christian-writings          → wx.tradition (PATRISTIC) + items
world-religions-baseline          → wx.religion + wx.entity + wx.figure
quran-arabic-lexicon              → wx.lexeme + wx.root + wx.concept
devotional-baseline               → wx.devotion
```

## Scripture type mapping

The `wx.scripture` model enforces a constraint: `canonicalCode` must be one of `QURAN`, `TAWRAT`, `ZABUR`, `INJIL` for `type: 'canonical'` + `sourceClass: 'REVELATION'`. All non-Abrahamic scriptures use different types:

```text
Scripture               canonicalCode    type           sourceClass
────────────────────────────────────────────────────────────────────
Al-Quran               QURAN            canonical      REVELATION
Torah / Hebrew Bible   TAWRAT           canonical      REVELATION
Psalms                 ZABUR            canonical      REVELATION
Gospel / New Testament INJIL            canonical      REVELATION
Dhammapada             (none)           additional     TEXTUAL_WITNESS
Bhagavad Gita          (none)           philosophy     TEXTUAL_WITNESS
Tao Te Ching           (none)           philosophy     TEXTUAL_WITNESS
Analects               (none)           philosophy     TEXTUAL_WITNESS
Yoga Sutras            (none)           philosophy     TEXTUAL_WITNESS
Guru Granth Sahib      (none)           additional     TEXTUAL_WITNESS
Gathas/Avesta          (none)           additional     TEXTUAL_WITNESS
```

## Seed execution order

Dependencies dictate the seed order:

```text
1. wx.entity           (no FK dependencies)
2. wx.religion          (depends on wx.entity)
3. wx.source            (depends on wx.entity)
4. wx.provenance        (depends on wx.source, wx.entity)
5. wx.scripture         (depends on wx.entity)
6. wx.scripture.book    (depends on wx.scripture)
7. wx.scripture.verse   (depends on wx.scripture, wx.scripture.book)
8. wx.figure            (depends on wx.entity, wx.provenance)
9. wx.figure.role       (depends on wx.figure, wx.religion, wx.provenance)
10. wx.tradition        (depends on wx.scripture)
11. wx.tradition.item   (depends on wx.tradition)
12. wx.asmaul.husna     (no FK dependencies)
13. wx.devotion         (depends on wx.scripture)
14. wx.text.edition     (depends on wx.entity, wx.scripture, wx.source)
15. wx.passage          (depends on wx.entity, wx.scripture)
16. wx.content          (depends on wx.passage, wx.text.edition, wx.source)
17. wx.lexeme           (depends on wx.entity, wx.source)
18. wx.concept          (depends on wx.entity, wx.source)
```

## Volume targets for demo install

The recommended demo install seeds a medium-volume dataset:

```text
Model                   Target Count    Source
──────────────────────────────────────────────────
wx.religion             12              world-religions-baseline
wx.scripture            5-8             Quran + Bible + Dhammapada + Gita + ...
wx.scripture.book       200+            All books/surahs/chapters
wx.scripture.verse      50,000+         Full Quran + sampled others
wx.tradition            6+              Bukhari + Muslim + Nawawi + Mishnah + ...
wx.tradition.item       200+            40 Nawawi + samples from others
wx.figure               26+             Cross-tradition figures
wx.asmaul.husna         99              Complete
wx.devotion             30+             Multi-tradition prayers
wx.source               10+             Per corpus dataset
wx.provenance           10+             Per corpus dataset
```
