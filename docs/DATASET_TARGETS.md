# Foundation Text Corpus — target and source plan

Status: **current data-first execution plan**.

This document defines the next committed corpus expansion targets. It deliberately separates **approved source lanes** from **conditional/audit-only lanes**. `TODO.md` owns executable task state; this document owns the source rationale and acceptance boundaries for P12.

## Execution policy

Feature work in P9–P11 is deferred while P12 is the active corpus priority. The objective is not to maximize the number of religious titles. The objective is to build a deep, source-pinned, rights-safe, reproducible foundation across several textual traditions and source languages.

A title is not considered “covered” merely because one text file exists. Coverage is measured across:

```text
work / collection
source language
expression / translation
edition
passage completeness
artifact revision + SHA-256
rights / redistribution
recipe + provenance
validation + deterministic checksum
alignment / annotations where applicable
```

Primary text, translation, annotations, canon/community assertions, and commentary must remain separate layers.

## Source lanes

### A0 — Quran baseline: Tanzil Uthmani v1.1

**State:** already bundled and validated; preserve as the Arabic baseline.

- Dataset: `datasets/quran-tanzil-uthmani/`
- Source family: Tanzil Quran Text, Uthmani representation.
- Existing corpus source artifact is pinned and checksummed in the dataset/recipe metadata.
- Coverage: 6,236 ayah.
- Rights boundary: source-preserving redistribution only under the recorded Tanzil terms; do not silently modify the bundled Quran text.

P12 work for this lane is verification/coverage accounting, not a new ingest.

### A1 — Dhammapada English: SuttaCentral Bilara / Bhikkhu Sujato

**State:** approved for expansion.

- Upstream: `suttacentral/bilara-data`.
- Source ref for the existing proof and planned completion baseline: `published@cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6`.
- Path family: `translation/en/sujato/sutta/kn/dhp/*_translation-en-sujato.json`.
- Current corpus proof covers only the first bounded portion; P12 completes the Dhammapada.
- License evidence: Bilara states that translations created in Bilara and supported by SuttaCentral are dedicated to the public domain via CC0.
- License source: `https://github.com/suttacentral/bilara-data/blob/published/LICENSE.md`.

The English translation is its own expression. It must not overwrite or stand in for a Pali root expression.

### A1b — Dhammapada Pali root: SuttaCentral Mahāsaṅgīti source files

**State:** conditional; source identified, bundling rights require a root-text-specific audit.

- Upstream: `suttacentral/bilara-data`.
- Current source family: `root/pli/ms/sutta/kn/dhp/*_root-pli-ms.json`.
- The existing proof source includes files such as `root/pli/ms/sutta/kn/dhp/dhp1-20_root-pli-ms.json`.
- Do **not** infer that these root files are CC0 merely because Bilara translations are CC0.

P12 first records the exact root edition/source and its redistribution terms. If bundling is not clearly allowed, represent it as `external`/metadata-only rather than copying the bytes into canonical data.

### A2 — Hebrew Bible: Open Scriptures Hebrew Bible / Westminster Leningrad Codex

**State:** approved source lane; exact upstream commit will be pinned at acquisition.

- Upstream: `openscriptures/morphhb`.
- Source files: `wlc/` OSIS XML.
- Underlying Westminster Leningrad Codex text: public domain.
- Open Scriptures lemma/morphology contributions: CC BY 4.0.
- Required attribution is recorded in upstream `LICENSE.md`.
- Upstream explicitly warns consumers to avoid NFC normalization of the Hebrew source representation.
- License/source evidence:
  - `https://github.com/openscriptures/morphhb/blob/master/LICENSE.md`
  - `https://github.com/openscriptures/morphhb/blob/master/README.md`

P12 splits this into two corpus products:

1. source-preserving Hebrew textual content;
2. lemma/morphology annotation records linked to source tokens.

Morphology must not be baked into or used to rewrite the source text.

### A3 — Greek New Testament: SBLGNT v1.2

**State:** approved source lane; exact upstream commit/artifact checksum will be pinned at acquisition.

- Upstream: `Faithlife/SBLGNT` (the official repository historically reachable through the LogosBible alias).
- Edition target: SBL Greek New Testament v1.2, dated 2023-07-10 in upstream version history.
- Source files: official repository `data/` artifacts.
- License: CC BY 4.0.
- License/source evidence:
  - `https://github.com/Faithlife/SBLGNT`
  - `https://github.com/Faithlife/SBLGNT/blob/master/LICENSE`

The SBLGNT remains a specific critical edition. It must not be represented as a universal or editionless “Greek New Testament”.

### A4 — English Bible: World English Bible Classic, 2020 stable text, full ecumenical book set

**State:** approved source lane; exact downloadable developer artifact will be pinned and checksummed at acquisition.

- Publisher/source: eBible.org.
- Target: **World English Bible Classic, 2020 stable text edition, full ecumenical book set** (`eng-web`).
- Rights: public domain; the “World English Bible” name is a trademark, so modified text must not be mislabeled as the World English Bible.
- Source evidence:
  - `https://ebible.org/eng-web/`
  - `https://ebible.org/eng-web/copr.htm`

The full ecumenical book set is represented as edition/collection structure. Its book membership/order must not be promoted into one universal definition of “the Bible canon”.

### A5 — Broader SuttaCentral English corpus: Bhikkhu Sujato

**State:** approved translation lane after Dhammapada completion.

- Upstream: `suttacentral/bilara-data`, `published` branch pinned to an exact commit per ingestion batch.
- Translation source: `translation/en/sujato/sutta/`.
- License: Bilara/SuttaCentral-supported translations are CC0.
- Initial collection targets:
  1. Dīgha Nikāya (DN)
  2. Majjhima Nikāya (MN)
  3. Saṁyutta Nikāya (SN)
  4. Aṅguttara Nikāya (AN)

These are translation expressions. Pali root texts remain subject to independent source/rights analysis before bundling.

## Alignment policy

Alignment is a navigation/research relation, not identity and not a theological-equivalence assertion.

P12 may create:

```text
Dhammapada Pali segment ↔ Sujato English segment
WLC Hebrew passage     ↔ WEB English passage
SBLGNT Greek passage   ↔ WEB English passage
```

when the source structures support it. Versification differences, absent passages, split/merged ranges, and edition-specific material must remain explicit rather than being forced into one reference system.

## Current committed P12 order

```text
coverage inventory
      ↓
Quran baseline verification
      ↓
complete Dhammapada English
      ↓
Pali Dhammapada rights audit / conditional ingest
      ↓
OSHB/WLC Hebrew + separate morphology
      ↓
SBLGNT v1.2 Greek
      ↓
WEB Classic 2020 English
      ↓
passage-level alignments
      ↓
SuttaCentral DN/MN/SN/AN English expansion
      ↓
foundation completeness + rights + reproducibility gate
```

## Deferred source-audit lane

The following are important future targets but are **not approved bundle sources yet** and therefore do not enter the committed ingestion queue until a source-specific rights review is complete:

- Sanskrit/Hindu textual corpora;
- Sikh scripture sources;
- Zoroastrian/Avestan corpora;
- Chinese Buddhist corpora;
- Taoist/Confucian classical corpora;
- Quran translations whose redistribution terms vary by translator/publisher.

For these traditions, finding an online text is not enough. We require exact edition/source identity, redistribution terms, artifact revision, and a reproducible acquisition path before adding an ingest issue.

## P12 exit gate

P12 is complete only when:

1. every bundled target has exact artifact revision/checksum and rights evidence;
2. Quran Arabic remains source-preserving and complete;
3. Dhammapada English is complete, with Pali handled according to its separately audited rights;
4. full source-preserving WLC Hebrew and SBLGNT Greek datasets validate;
5. WEB Classic 2020 full ecumenical edition validates as a separate English expression/edition;
6. OSHB morphology is stored as annotation rather than source-text mutation;
7. permitted alignments are explicit and preserve versification/edition differences;
8. DN/MN/SN/AN English expansion is deterministic and source-pinned;
9. every dataset reports completeness/counts/checksums and passes full CI;
10. no bundled P12 content has unresolved redistribution rights.

---

## Seed data mapping — Corpus → App ORM

Each corpus dataset maps to one or more `wx.*` ORM models in the MoonWitness app (`X:\REPO\moonwitness`). See `docs/APP_ORM_MAPPING.md` for the complete 51-model mapping.

### Scripture datasets → `wx.scripture` + `wx.scripture.book` + `wx.scripture.verse`

```text
Corpus Dataset                    Religion        canonicalCode   type
────────────────────────────────────────────────────────────────────────
quran-tanzil-uthmani              Islam           QURAN           canonical
oshb-wlc                         Judaism         TAWRAT          canonical
sblgnt-v1-2                      Christianity    INJIL           canonical
dhammapada-sujato                 Buddhism        (none)          additional
suttacentral-dn-mn-sujato        Buddhism        (none)          additional
suttacentral-sn-an-sujato        Buddhism        (none)          additional
bhagavad-gita                     Hinduism        (none)          philosophy
```

### Translation datasets → `wx.scripture.verse` fields or `wx.content`

```text
Corpus Dataset                    Language   Maps to field
────────────────────────────────────────────────────────────
quranenc-english-rwwad            en         translationEn
quranenc-indonesian-kemenag       id         translationId
web-classic-2020                  en         translationEn
bible-tsi-2021                    id         translationId
dhammapada-indonesian-wikisource  id         translationId
```

### Tradition datasets → `wx.tradition` + `wx.tradition.item`

```text
Corpus Dataset                    Religion        Type
────────────────────────────────────────────────────────
hadith-nawawi-40                  Islam           Hadith
quran-tafsir-sample               Islam           Commentary
mishnah-pirkei-avot               Judaism         Rabbinic
early-christian-writings          Christianity    Patristic
```

### Other mappings

```text
Corpus Dataset                    → App Model(s)
────────────────────────────────────────────────────
world-religions-baseline          → wx.religion, wx.entity, wx.figure
world-religions-textual-evidence  → wx.evidence, wx.assertion
quran-arabic-lexicon              → wx.lexeme, wx.root
devotional-baseline               → wx.devotion
research-graph-baseline           → wx.relation, wx.assertion
```

---

## Expansion targets — Non-Abrahamic source lanes

These are targets identified for multi-religion corpus expansion. Each has a rights-safe source identified but requires a source-specific audit before ingestion. Full details in `datasets/EXPANSION_TARGETS.json`.

### B1 — Tao Te Ching (Daoism)

- Source: ctext.org Chinese Text Project + James Legge English (1891, PD)
- Format: 81 chapters, Classical Chinese + English
- Rights: Public domain (ancient text, PD translation)
- App target: `wx.scripture` (type=philosophy) + books + verses

### B2 — Analects of Confucius (Confucianism)

- Source: ctext.org + James Legge / Arthur Waley PD translations
- Format: 20 books, ~500 passages
- Rights: Public domain
- App target: `wx.scripture` (type=philosophy) + books + verses

### B3 — Yoga Sutras of Patanjali (Hinduism)

- Source: Sacred Texts Archive / GRETIL Sanskrit + pre-1928 PD translations
- Format: 196 sutras, 4 padas
- Rights: Public domain (ancient text, PD translation)
- App target: `wx.scripture` (type=philosophy) + books + verses

### B4 — Gathas / Avesta (Zoroastrianism)

- Source: avesta.org / Sacred Texts Archive
- Format: 17 ha (Yasna 28-34, 43-51, 53), Avestan + English
- Rights: PD ancient text; translations need per-edition audit
- App target: `wx.scripture` (type=additional) + books + verses

### B5 — Hadith Bukhari Arabic (Islam deepening)

- Source: `Jaguar16/open-hadith-data` (CC0), pinned commit
- Format: ~7,563 hadith, Arabic matn only (English excluded per rights)
- Rights: CC0-1.0, already audited in `docs/P14-HADITH-SOURCE-AUDIT.json`
- App target: `wx.tradition` + `wx.tradition.item` + `wx.tradition.corpus` + `wx.tradition.unit`

### B6 — Asmaul Husna 99 Complete

- Source: Quran references + scholarly consensus
- Format: 99 names with Arabic, transliteration, EN, ID, Quran reference, meaning
- Rights: Names are from the Quran (PD)
- App target: `wx.asmaul.husna`

