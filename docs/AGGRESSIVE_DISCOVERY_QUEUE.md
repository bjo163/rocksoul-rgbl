# Aggressive Discovery Queue

Status: active on `dev`; expansion-agent handoff for immediate implementation.

## Run 6 inventory gate

- Current repo owner is `bjo163/rocksoul-rgbl` (RGBL/MoonWitness corpus); `dev` is working branch, `main` is release baseline.
- Existing active lanes: Quran/Tanzil, Dhammapada/Sujato, OSHB/WLC, SBLGNT, WEB Classic, Zhuangzi Giles, and Ancient Egyptian Book of the Dead (Budge + Renouf/Naville).
- Baseline inventory remains 90 traditions, 297 works, 618 editions. README is not a duplicate authority; re-check registry, recipes, materialization, quality, language, and Home statistics before every write.
- No long-lived branch: commit directly on `dev`; release promotion remains controlled.

## Lane A — deepen existing works

### A1. Bilara English completion (execute first)

- **Targets:** Digha (DN), Majjhima (MN), Samyutta (SN), Anguttara (AN) Nikayas.
- **Upstream:** `https://github.com/suttacentral/bilara-data`
- **Pin:** exact `published` commit recorded in recipe + manifest; never float on branch head.
- **Paths:** `translation/en/sujato/sutta/dn/**`, `mn/**`, `sn/**`, `an/**`.
- **Rights:** require publication-level CC0 evidence; do not infer rights for Pali roots.
- **Implementation:** enumerate before writing; reject HTML/CAPTCHA/challenge/empty/placeholder payloads; preserve segment ids; deterministic canonical JSONL.
- **Acceptance:** complete file inventory, non-empty count, `language=en`, translation separate from root, SHA-256, reproducible rebuild, `pnpm check`.
- **State:** `READY_FOR_IMPLEMENTATION`.

### A2. Dhammapada Pali root (rights audit only)

- **Target:** `root/pli/ms/sutta/kn/dhp/*_root-pli-ms.json`.
- **Action:** audit exact commit, file list, license text, sample bytes, proposed dataset id; do not materialize until redistribution terms are explicit.
- **State:** `RIGHTS_AUDIT_REQUIRED`.

### A3. Poetic Edda edition matrix

- **Primary:** Project Gutenberg `73533`, Henry Adams Bellows, *The Poetic Edda* (1923).
- **Secondary:** Project Gutenberg `13007`, Lucy Winifred Faraday, *The Edda, Volume 1*.
- **Implementation:** fetch raw plain text only; capture ebook id, title-page evidence, author/translator, year, URL, content type, byte length, SHA-256; fingerprint normalized poem/section bodies against existing Edda data before ingest.
- **Rights:** preserve USA-public-domain scope; do not mark worldwide redistribution safe without jurisdiction review.
- **Acceptance:** at least one distinct edition, stable headings, no challenge body, deterministic parser fixture, edition-level provenance.
- **State:** `READY_FOR_PROBE`.

### A4. Indonesian coverage

- Accept only a named human-authored Indonesian edition with stable artifact, translator/editor identity, explicit redistribution permission or verified public-domain status, and source mapping.
- No machine-translated canonical layer; no floating web scrape.
- **State:** `SEARCH_REQUIRED`; do not invent coverage.

## Lane B — new traditions

### B1. Norse / Germanic — Poetic Edda bounded corpus

- **Pins:** Gutenberg `73533` primary; `13007` secondary.
- **Implementation:** create tradition/work/expression/edition records; parse poem boundaries; keep Old Norse status separate from English translation; never synthesize Old Norse from English.
- **Acceptance:** exact poem inventory, metadata, rights evidence, SHA-256, duplicate result, parser fixture.
- **State:** `READY_FOR_PROBE`.

### B2. Classical Greek — bounded canonical-greekLit slice

- **Upstream:** `https://github.com/PerseusDL/canonical-greekLit`
- **License:** repository documents CC BY-SA 4.0 unless otherwise indicated; retain per-file attribution/share-alike evidence.
- **Implementation:** choose one bounded work family; pin commit; acquire XML/TEI; validate XML, author/work identity, language/script, and edition metadata; keep notes/commentary out of primary text.
- **State:** `READY_FOR_PROBE`.

### B3. Zoroastrian Gathas — audit-first

- **Scope:** Yasna 28-34, 43-51, 53 only.
- **Action:** rights/provenance audit before bundle; source-language and English are separate expressions; reject vague full-Avesta intake.
- **State:** `RIGHTS_AUDIT_REQUIRED`.

### B4. Orphic Hymns — bounded edition

- Select one pre-1928 edition with stable raw artifact and title-page evidence; create new work/edition ids only after duplicate and rights checks. Keep editorial notes non-canonical.
- **State:** `CANDIDATE_PENDING_SOURCE_PIN`.

## Rejected / deferred

- Chinese Text Project source-language lanes: authentication/blocking risk.
- Sefaria translations: non-commercial restrictions.
- Sikh GPL-linked datasets: compatibility/redistribution review incomplete.
- Any floating `latest` ref, rendered HTML input, dead endpoint, placeholder, synthetic text, or machine translation.

## Immediate execution order

1. Probe Bilara DN/MN/SN/AN English from one pinned `published` commit.
2. Produce Dhammapada Pali rights audit.
3. Probe Gutenberg `73533`, then `13007`; run edition-difference fingerprints.
4. Probe bounded Perseus slice from pinned commit.
5. Open Gathas rights audit; do not bundle before clearance.
6. Keep Indonesian lane in `SEARCH_REQUIRED` until a compliant edition is source-pinned.

Every completed item must update registry, recipe, manifest, checksum, language/quality coverage, and Home statistics in the same release cycle.
