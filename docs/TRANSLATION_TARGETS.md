# Foundation Text Corpus — translation targets

Status: **required P12 coverage policy**.

This document defines the minimum translation coverage for the Foundation Text Corpus. Source-language texts remain primary textual expressions. Translations are separate expressions/editions with their own artifacts, provenance, rights, and completeness.

## Minimum language policy

Every major P12 work/collection must expose, at minimum:

```text
source language expression
English translation expression (`en`)
Indonesian translation expression (`id`)
```

A work is not considered translation-complete merely because an English translation exists.

Machine translation, LLM output, or ad-hoc project translations do **not** satisfy the canonical `en`/`id` requirement. Canonical translation coverage must come from a human-published or institutionally published source with exact edition/revision identity, provenance, and redistribution rights.

If an otherwise important translation cannot legally be bundled, it may be represented as `external`, `metadata_only`, or `restricted`, but that does not silently count as bundled translation coverage. The coverage matrix must show the gap explicitly.

## Quran

### Source language

- Arabic: existing Tanzil Uthmani v1.1 baseline.

### English target

- Source family: QuranEnc.
- Preferred initial expression: **English Translation — Rowwad Translation Center**.
- QuranEnc allows translation content to be downloaded and re-published subject to source-specific terms, including no content modification, clear publisher/QuranEnc attribution, version identification, preservation of transcript information, and version updates.
- Exact translation key, version, downloadable artifact, retrieval date, byte size, SHA-256, and terms snapshot must be pinned before bundling.

### Indonesian target

- Source family: QuranEnc.
- Preferred initial expression: **Terjemahan Berbahasa Indonesia — Kementerian Agama Republik Indonesia**.
- Current QuranEnc catalog identifies this Indonesian translation and provides downloadable/API representations under the same republication policy.
- Exact translation key/version and rights evidence must be pinned. Content is source-preserving/verbatim; corrections must never be silently applied to the publisher's translation.

Source evidence:

- https://quranenc.com/en/
- https://quranenc.com/en/browse/english_rwwad
- https://quranenc.com/id/browse/indonesian_affairs

The Arabic Quran and its translations are separate expressions. A translation is not represented as the Quran's Arabic text and does not replace the Arabic source representation.

## Dhammapada

### Source language

- Pali Mahāsaṅgīti-family source handling remains subject to the root-text-specific rights audit in P12.

### English target

- Bhikkhu Sujato, *Sayings of the Dhamma*.
- SuttaCentral Bilara published source.
- CC0.

### Indonesian target

Primary candidate for rights verification:

- *Kitab Suci Dhammapada*, Indonesian translation by LP2KBI under Bimas Buddha / Kementerian Agama, 2011.
- Government-hosted source is referenced from the Wikimedia Commons file record.
- Wikimedia Commons currently classifies the file as public domain in Indonesia under its Indonesian-government rationale.

This public-domain classification is useful evidence but is **not by itself sufficient for MoonWitness bundling**. P12 must independently record the exact government artifact and the legal/rights basis before copying the translation into canonical dataset content. If that audit fails, an alternative openly licensed Indonesian Dhammapada must be selected.

Source evidence:

- https://commons.wikimedia.org/wiki/File:Kitab_Suci_Dhammapada.pdf

## Bible / Hebrew Bible / New Testament

### Source-language backbones

- Hebrew: OSHB / Westminster Leningrad Codex.
- Greek NT: SBLGNT v1.2.

### English target

- World English Bible Classic 2020 stable text, full ecumenical book set.
- Public-domain text with edition/name boundaries recorded explicitly.

### Indonesian target

Primary open candidate:

- **Alkitab Terjemahan Sederhana Indonesia, Edisi Ketiga (TSI)**.
- Publisher/contributors: Yayasan Alkitab BahasaKita (Albata) and Pioneer Bible Translators International.
- eBible source files dated 2025-05-03.
- License: CC BY-SA 4.0.
- Exact available-book coverage must be treated as data; it must not be described as a full WEB-equivalent canon if books are absent.

Supplemental candidate:

- **Alkitab Gratis untuk Semua (AGS)**, Free Bible Ministry / Jonathan Gallagher.
- CC BY-SA.
- Useful especially where its current book coverage complements Indonesian New Testament coverage, but edition/book completeness must be pinned rather than assumed.

Source evidence:

- https://ebible.org/ind/
- https://ebible.org/find/details.php?id=ind
- https://ebible.org/indags/
- https://www.open.bible/bibles/alkitab-gratis-untuk-semua

Indonesian Bible coverage is measured per book/passage and edition. We do not fabricate translations for missing books merely to make the percentage read 100%.

## Broader SuttaCentral collections

### English target

- Bhikkhu Sujato published translations for DN, MN, SN, and AN, pinned to an exact `published` commit.
- CC0 according to Bilara/SuttaCentral publication metadata.

### Indonesian target

Indonesian is a required target, but the existing Bilara `translation/id/` tree does not currently mirror the Sujato DN/MN/SN/AN English coverage one-for-one at the P5/P12 baseline commit. Therefore:

1. audit published Indonesian SuttaCentral/Bilara translation projects and their publication metadata;
2. ingest only exact human translations with explicit rights;
3. record collection/passage gaps in the coverage matrix;
4. identify an additional open Indonesian source when Bilara lacks a required collection;
5. never substitute machine translation as canonical corpus content.

## Alignment policy

Where exact source structures permit, P12 should support:

```text
Arabic Quran ↔ Quran EN ↔ Quran ID
Pali Dhammapada ↔ Dhammapada EN ↔ Dhammapada ID
WLC Hebrew ↔ WEB EN ↔ Indonesian Bible
SBLGNT Greek ↔ WEB EN ↔ Indonesian Bible
```

Alignment records correspondence under an edition/method. They do not assert linguistic identity, doctrinal equivalence, or that a translation is uniquely authoritative.

## Translation completeness gate

P12 cannot be called translation-complete until the coverage report can answer, for every major work/collection:

- which source-language expression is present;
- which English expression/edition is present;
- which Indonesian expression/edition is present;
- exact passage/book coverage for each language;
- source artifact revision and SHA-256;
- redistribution status and license/terms evidence;
- ingestion recipe/provenance;
- alignment coverage and known reference/versification differences.

The target is therefore **at least `en` + `id`**, not English-only coverage.