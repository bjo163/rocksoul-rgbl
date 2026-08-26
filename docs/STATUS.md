# MoonWitness Corpus — Current Status

Snapshot date: 2026-08-27.

This file is a concise implementation/release snapshot. `TODO.md` remains the canonical executable task state, while `docs/ROADMAP.md` preserves the detailed architecture and milestone rationale. `docs/DATASET_TARGETS.md` defines the current data-first source/target plan.

## Authoritative state

- `main` is the authoritative implementation branch.
- There are no open pull requests at this snapshot.
- P0–P7 implementation and the P8 release infrastructure are merged.
- Full CI remains green after introducing the P12 roadmap/source plan.
- Historical feature/bootstrap branches are non-authoritative; consumers and downstream work must pin `main`/release commits, not those branch refs.

## Current operational priority

The project is now deliberately in **data-first mode**.

```text
P12 — Foundation Text Corpus expansion
```

P9–P11 feature/integration work is deferred while P12 is active. P8 npm publication remains blocked by repository code-license/npm-scope authorization, but that blocker does not prevent source-specific dataset expansion because dataset rights are tracked independently.

## Milestone state

```text
P0  Foundation                         complete
P1  Core contract stabilization        complete
P2  Textual profile v0.1               complete
P3  Provenance / source / rights        complete
P4  Reproducible ingestion framework   complete
P5  Two real dataset proofs             complete
P6  Repository / query / build          complete
P7  Public Corpus Explorer              complete
P8  Package/release infrastructure      complete
    npm publication tasks               blocked/deferred
P12 Foundation Text Corpus expansion   ACTIVE / current priority
P9  MoonWitness integration             deferred
P10 Advanced profiles                   deferred
P11 Curation / collaboration            deferred
```

P8 publication tasks intentionally remain open:

```text
P8-002  publish core
P8-003  publish schema
P8-004  publish repository
P8-005  publish validator
P8-006  publish CLI
```

They are not considered complete until packages are actually published and installable from the selected registry.

## P12 approved source lanes

The committed Foundation Text Corpus target set is:

```text
Quran Arabic baseline
  source: existing Tanzil Uthmani v1.1 dataset

Dhammapada English
  source: SuttaCentral Bilara / Bhikkhu Sujato
  baseline ref: published@cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6
  translation rights: CC0

Dhammapada Pali root
  source family identified in SuttaCentral Bilara
  bundling: conditional on root-edition-specific rights audit

Hebrew Bible
  source: Open Scriptures Hebrew Bible / Westminster Leningrad Codex
  text: public domain WLC
  lemma/morphology: CC BY 4.0

Greek New Testament
  source: official SBLGNT v1.2 repository
  license: CC BY 4.0

English Bible
  source: eBible.org World English Bible Classic
  target: 2020 stable text, full ecumenical book set
  rights: public domain, trademark naming caveat

Broader Buddhist English corpus
  source: SuttaCentral Bilara Bhikkhu Sujato translations
  first expansion: DN, MN, SN, AN
  translation rights: CC0
```

See `docs/DATASET_TARGETS.md` for exact paths, source boundaries, alignment policy, and acceptance criteria.

## Verified implementation baseline

The release/CI baseline already verifies:

- 108 automated tests passing;
- 12,841 canonical records validating before P12 expansion;
- 7 registered datasets before P12 expansion;
- deterministic derived corpus build;
- deterministic release bundle across two independent builds;
- 7 npm tarballs prepared in the release bundle;
- npm publication dry-run resolving the expected package artifacts;
- production Corpus Explorer build and runtime smoke test passing.

Current real-data proofs include:

- full Tanzil Uthmani Quran dataset with 6,236 ayah and pinned source checksum/rights metadata;
- SuttaCentral/Bilara Dhammapada 1–20 proof with source-preserving provenance and explicit translation rights metadata.

These datasets remain descriptive corpus inputs. Their presence does not create universal theological identity, equivalence, canon, or authority claims.

## Release boundary

Four version domains remain independent:

```text
spec version
package version
dataset version
aggregate corpus release version
```

Generated release/build output under `dist/` is disposable and reproducible; it is not canonical authoring state.

## Dataset expansion rules

For P12 and later data work:

1. identify exact source/edition before ingestion;
2. pin source revision/artifact and SHA-256;
3. capture source-specific rights evidence before bundling;
4. preserve source text separately from translations/annotations;
5. treat morphology/lemma data as annotations, not source-text mutation;
6. treat canon/book-set membership as edition/community context, not universal truth;
7. treat alignment as navigational/research linkage, not identity/equivalence;
8. reject or externalize content whose redistribution rights remain unresolved;
9. require deterministic recipe/checksum validation before closing the dataset task.

## Next execution sequence

```text
P12-001 coverage matrix
      ↓
P12-002 Quran baseline verification
      ↓
P12-003..006 complete Dhammapada + Pali rights/alignment
      ↓
P12-007..009 OSHB/WLC Hebrew + morphology
      ↓
P12-010..011 SBLGNT v1.2
      ↓
P12-012..016 WEB Classic + alignments
      ↓
P12-017..018 SuttaCentral DN/MN/SN/AN English
      ↓
P12-019..020 completeness / checksum / rights exit gate
      ↓
revisit npm publication and P9
```

The project should not expand to additional source ecosystems merely because text is easy to scrape. Sanskrit/Hindu, Sikh, Avestan/Zoroastrian, Chinese Buddhist, Taoist/Confucian, and Quran-translation candidates remain audit-only until an exact rights-safe source is approved.
