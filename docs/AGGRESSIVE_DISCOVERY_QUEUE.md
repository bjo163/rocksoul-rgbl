# Aggressive Discovery Queue

Status: active on `dev`; this is the expansion-agent handoff for immediate implementation.

## Inventory gate

Latest checked state on `dev`:

- 90 registered traditions, 297 works, 618 editions.
- README statistics are stale relative to the latest materialization wave; do not use README alone as a duplicate test.
- Existing active source lanes include Quran/Tanzil, Dhammapada/Sujato, OSHB/WLC, SBLGNT, WEB Classic, and the newly materialized Zhuangzi Giles plus Ancient Egyptian Book of the Dead editions (Budge and Renouf/Naville).
- Existing recipes and dataset ids must be checked before each acquisition; no candidate below is a duplicate of the three newly materialized works.

## Lane A — deepen existing works

### A1. Complete SuttaCentral English collections (highest value)

- **Targets:** Dīgha Nikāya (DN), Majjhima Nikāya (MN), Saṁyutta Nikāya (SN), Aṅguttara Nikāya (AN).
- **Upstream:** `https://github.com/suttacentral/bilara-data`
- **Ref policy:** pin the exact `published` commit used by the ingestion run; do not float on branch head.
- **Path family:** `translation/en/sujato/sutta/dn/**`, `mn/**`, `sn/**`, `an/**`.
- **Rights:** Bilara/SuttaCentral-supported translations are CC0 per upstream LICENSE; copy the license evidence into the dataset license bundle.
- **Implementation:** add one recipe per nikāya or one deterministic collection recipe with stable unit ids; preserve source segment ids; reject HTML/challenge responses; require complete file enumeration before writing canonical JSONL.
- **Acceptance:** source file count, non-empty segment count, language=`en`, translation expression separate from any Pali root, SHA-256 manifest, deterministic rebuild, full `pnpm check`.
- **Why now:** highest record yield from an already approved, reproducible source family and directly deepens the Buddhism lane without inventing new tradition metadata.

### A2. Dhammapada source-language root audit and conditional ingest

- **Target:** Mahāsaṅgīti Pali root files.
- **Upstream:** `https://github.com/suttacentral/bilara-data`
- **Path family:** `root/pli/ms/sutta/kn/dhp/*_root-pli-ms.json`.
- **Gate:** do not bundle until the exact root-text redistribution terms are documented; if unresolved, store external metadata only.
- **Implementation:** produce an audit artifact containing exact commit, file list, license text, and a byte-preserving sample; only then enable canonical ingest.
- **Acceptance:** no inferred CC0 from the translation license; source language=`pli`; no machine translation; explicit relation to the existing English expression.

### A3. Edition matrix for the existing Ancient Egyptian Book of the Dead

- **Targets:** additional legitimate editions only where they are not byte-identical to the current Budge/Renouf datasets.
- **Preferred source family:** Project Gutenberg plain-text artifacts with stable ebook ids; use the raw text endpoint, not rendered HTML.
- **Implementation:** first run a duplicate fingerprint scan over title/edition/year/translator and normalized passage hashes; ingest only a distinct edition with full provenance and rights evidence.
- **Acceptance:** edition-level identity, chapter inventory, translator/year metadata, source SHA-256, and a hard failure for HTML/challenge pages.
- **Why now:** this expands edition coverage for an already active tradition and improves comparative scholarship without creating a new registry tradition.

## Lane B — new traditions with immediate, rights-safe entry points

### B1. Norse & Germanic — Poetic Edda, Bellows translation (priority 1)

- **Work:** `Poetic Edda` (Old Norse source text + English translation as separate expressions).
- **Source:** Project Gutenberg plain text ebook for Henry Adams Bellows translation; resolve and pin the exact ebook id at acquisition time.
- **Rights gate:** verify jurisdictional redistribution status for the exact translation artifact before bundling; if only US public-domain evidence is available, retain metadata-only until policy is satisfied.
- **Implementation:** acquire raw text, parse poem boundaries from stable headings, preserve Old Norse and English as separate layers, emit a manifest and checksum.
- **Acceptance:** no modern paraphrase, no machine translation, exact poem count, edition/translator/year metadata, reproducible parser test.

### B2. Classical Greco-Roman — Orphic Hymns / Hermetic corpus (priority 2)

- **Work family:** a bounded, edition-specific corpus rather than an undefined “Greek religion” bucket.
- **Source:** Project Gutenberg or Internet Sacred Texts plain-text scans of a pre-1928 English edition; source artifact must be pinned and independently checksum-verified.
- **Implementation:** start with one bounded work (e.g. Orphic Hymns) and one edition; create a new work id, expression id, and edition id; keep commentary/notes out of primary text records.
- **Acceptance:** edition-specific title page evidence, stable section inventory, license/rights record, parser rejects HTML and placeholders.

### B3. Zoroastrianism — Gāthās bounded collection (priority 3, audit-first)

- **Work:** Yasna 28–34, 43–51, 53 only; do not ingest a vague “Avesta”.
- **Source candidates:** Avesta.org / Sacred Texts Archive for a bounded public-domain text plus a separately audited translation.
- **Implementation:** first create a source audit issue/artifact; ingest Avestan/source-language only if byte-level redistribution is permitted; otherwise keep external provenance and add only an approved translation edition.
- **Acceptance:** exact ha inventory, edition identity, translation rights evidence, no conflation of Avestan and English records.

## Rejected / deferred this run

- Chinese Text Project source-language lanes: authentication/blocking risk remains; not ready for immediate deterministic acquisition.
- Sikh scripture from GPL-linked datasets: compatibility and redistribution review still required.
- Sefaria translations: non-commercial clauses make them unsuitable for default bundled canonical data.
- Any candidate without an exact artifact, rights evidence, and reproducible raw endpoint.

## Immediate execution order

1. Complete DN/MN/SN/AN English from pinned Bilara commit.
2. Run Dhammapada Pali rights audit; ingest only if cleared.
3. Run Book of the Dead edition-difference scan; add only distinct, rights-safe editions.
4. Prepare Poetic Edda bounded acquisition and rights packet.
5. Prepare bounded Orphic Hymns acquisition and parser fixture.
6. Open Gāthās audit artifact; do not bundle until rights gate passes.

Every completed item must update the corresponding registry, recipe, dataset manifest, checksum file, coverage report, and home statistics in the same release cycle.
