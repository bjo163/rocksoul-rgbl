# MoonWitness Corpus — TODO

This file is the short, executable task list for the current development cycle.

For rationale, dependencies, acceptance criteria, and later phases, see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Working rules

- Canonical data lives in `datasets/`; generated indexes and databases are disposable.
- `spec/` defines the contract; packages implement it but do not redefine it.
- Core schema must remain tradition-neutral.
- Religious/tradition-specific roles and concepts are data, not hard-coded universal enums.
- Assertions are contextual claims, not unqualified global facts.
- Evidence, source/resource, provenance, and assessment remain separate.
- MoonWitness engine policy is downstream and must not become canonical corpus truth.
- Real text may only be bundled after source and redistribution rights are explicitly verified.

---

## P0 — v0.1 foundation

- [x] Bootstrap pnpm + Turborepo monorepo. <!-- mw-todo:P0-001 -->
- [x] Separate `spec/`, `datasets/`, `packages/`, `apps/`, and `ingestion/`. <!-- mw-todo:P0-002 -->
- [x] Define six core record families: Entity, Resource, Assertion, Evidence, Provenance, Assessment. <!-- mw-todo:P0-003 -->
- [x] Add JSON Schema Draft 2020-12 baseline. <!-- mw-todo:P0-004 -->
- [x] Add synthetic minimal dataset fixture. <!-- mw-todo:P0-005 -->
- [x] Add manifest/JSONL/duplicate-ID validator. <!-- mw-todo:P0-006 -->
- [x] Add CI for typecheck + corpus validation. <!-- mw-todo:P0-007 -->
- [x] Record initial architecture decisions as ADRs. <!-- mw-todo:P0-008 -->

## P1 — stabilize the core contract

- [x] Define canonical ID grammar and namespace rules. <!-- mw-todo:P1-001 -->
- [x] Define deterministic IDs for generated records such as assertions/evidence. <!-- mw-todo:P1-002 -->
- [x] Define external identifier vs alias vs canonical ID semantics. <!-- mw-todo:P1-003 -->
- [x] Define cross-dataset reference syntax and dependency resolution. <!-- mw-todo:P1-004 -->
- [x] Add referential-integrity validation for all entity/resource/evidence references. <!-- mw-todo:P1-005 -->
- [x] Add semantic invariants beyond JSON Schema. <!-- mw-todo:P1-006 -->
- [x] Define record lifecycle fields only where genuinely universal. <!-- mw-todo:P1-007 -->
- [x] Stabilize multilingual label model (`language`, `script`, preferred/alternate labels). <!-- mw-todo:P1-008 -->
- [ ] Stabilize scoped assertion model (`tradition`, `community`, `agent`, `period`, `place`). <!-- mw-todo:P1-009 -->
- [ ] Define literal/object value envelope for assertions. <!-- mw-todo:P1-010 -->
- [ ] Define assessment target/result/method semantics. <!-- mw-todo:P1-011 -->
- [ ] Add invalid fixtures for every invariant. <!-- mw-todo:P1-012 -->
- [ ] Write compatibility policy for spec v0.x changes. <!-- mw-todo:P1-013 -->

**Exit gate:** core schemas can be treated as stable enough to build profiles without changing their worldview assumptions.

## P2 — textual profile v0.1

- [ ] Add `spec/v0.1/schemas/profiles/textual/`. <!-- mw-todo:P2-001 -->
- [ ] Define Work. <!-- mw-todo:P2-002 -->
- [ ] Define Expression/recension/translation relationship. <!-- mw-todo:P2-003 -->
- [ ] Define Edition. <!-- mw-todo:P2-004 -->
- [ ] Define Artifact/digital representation descriptor. <!-- mw-todo:P2-005 -->
- [ ] Define arbitrary-depth Passage hierarchy. <!-- mw-todo:P2-006 -->
- [ ] Define citation scheme and canonical reference path. <!-- mw-todo:P2-007 -->
- [ ] Define Content as language/script-specific text attached to a passage/resource. <!-- mw-todo:P2-008 -->
- [ ] Define `derived_from` for translation/transliteration/normalization. <!-- mw-todo:P2-009 -->
- [ ] Define Alignment between passages/content segments. <!-- mw-todo:P2-010 -->
- [ ] Define Variant/readings without assuming one global base text. <!-- mw-todo:P2-011 -->
- [ ] Define source-preserving vs normalized/search representations. <!-- mw-todo:P2-012 -->
- [ ] Add Web-Annotation-inspired text quote/position/range selectors. <!-- mw-todo:P2-013 -->
- [ ] Add textual profile examples for two structurally different citation schemes. <!-- mw-todo:P2-014 -->
- [ ] Extend validator with textual hierarchy/citation invariants. <!-- mw-todo:P2-015 -->

**Exit gate:** a surah/ayah text and a non-Quran chapter/stanza or book/chapter/verse text can use the same profile without core changes.

## P3 — provenance, source, rights, and artifacts

- [ ] Define source/resource metadata profile. <!-- mw-todo:P3-001 -->
- [ ] Define Agent and Activity representation for ingestion provenance. <!-- mw-todo:P3-002 -->
- [ ] Define artifact descriptor: URI, media type, byte size, SHA-256, availability. <!-- mw-todo:P3-003 -->
- [ ] Define `bundled`, `external`, `metadata_only`, and `restricted` availability states. <!-- mw-todo:P3-004 -->
- [ ] Define SPDX-compatible license expression fields. <!-- mw-todo:P3-005 -->
- [ ] Define source-specific `LicenseRef-*` handling. <!-- mw-todo:P3-006 -->
- [ ] Add rights validation: bundled content must declare rights/license status. <!-- mw-todo:P3-007 -->
- [ ] Define retrieval timestamp separately from deterministic normalized checksums. <!-- mw-todo:P3-008 -->
- [ ] Define parser/normalizer/curator provenance chain. <!-- mw-todo:P3-009 -->
- [ ] Document policy for public-domain claims vs modern editions/translations. <!-- mw-todo:P3-010 -->

**Exit gate:** every real content record can answer “from which artifact/edition, under what rights, and through what processing path did this record enter the corpus?”

## P4 — ingestion framework

- [ ] Define `recipe.schema.json`. <!-- mw-todo:P4-001 -->
- [ ] Define source acquisition descriptor. <!-- mw-todo:P4-002 -->
- [ ] Implement ingestion recipe registry. <!-- mw-todo:P4-003 -->
- [ ] Implement filesystem source connector. <!-- mw-todo:P4-004 -->
- [ ] Implement explicit HTTP fetch connector for ingestion jobs only. <!-- mw-todo:P4-005 -->
- [ ] Add immutable raw-artifact SHA-256 verification. <!-- mw-todo:P4-006 -->
- [ ] Define parser interface. <!-- mw-todo:P4-007 -->
- [ ] Define normalizer interface. <!-- mw-todo:P4-008 -->
- [ ] Define mapper-to-core/profile interface. <!-- mw-todo:P4-009 -->
- [ ] Define recipe-specific validator interface. <!-- mw-todo:P4-010 -->
- [ ] Make normalized output byte-for-byte deterministic. <!-- mw-todo:P4-011 -->
- [ ] Add curation overlay format instead of silently editing parser output. <!-- mw-todo:P4-012 -->
- [ ] Record reconciliation/correction provenance. <!-- mw-todo:P4-013 -->
- [ ] Add `corpus ingest <recipe>` CLI command. <!-- mw-todo:P4-014 -->
- [ ] Add `corpus checksum` CLI command. <!-- mw-todo:P4-015 -->
- [ ] Add idempotency tests. <!-- mw-todo:P4-016 -->
- [ ] Ensure network access is not required to consume a released dataset. <!-- mw-todo:P4-017 -->

**Exit gate:** raw source + pinned recipe/parser/normalizer versions can reproduce the same canonical dataset checksum.

## P5 — prove universality with real datasets

- [ ] Select first source with verified redistribution rights. <!-- mw-todo:P5-001 -->
- [ ] Build first textual dataset recipe and manifest. <!-- mw-todo:P5-002 -->
- [ ] Prefer Quran as the first MoonWitness integration dataset if the selected Arabic/translation sources are legally usable. <!-- mw-todo:P5-003 -->
- [ ] Select a second open/public-domain source from a substantially different religious tradition and textual structure. <!-- mw-todo:P5-004 -->
- [ ] Build second dataset without adding religion-specific fields to core schemas. <!-- mw-todo:P5-005 -->
- [ ] Validate both datasets in CI. <!-- mw-todo:P5-006 -->
- [ ] Document every source, edition, language, script, rights statement, checksum, and retrieval process. <!-- mw-todo:P5-007 -->
- [ ] Add cross-reference fixture between datasets without asserting theological equivalence. <!-- mw-todo:P5-008 -->
- [ ] Review vocabulary for hidden Abrahamic/Islam-centric assumptions. <!-- mw-todo:P5-009 -->

**Exit gate:** two structurally and religiously different real datasets validate against the same core + textual profile.

## P6 — repository, build, and query layer

- [ ] Expand `CorpusRepository` contract. <!-- mw-todo:P6-001 -->
- [ ] Implement in-memory repository for tests. <!-- mw-todo:P6-002 -->
- [ ] Implement filesystem/JSONL repository for Node.js. <!-- mw-todo:P6-003 -->
- [ ] Implement dataset registry and dependency resolver. <!-- mw-todo:P6-004 -->
- [ ] Implement canonical ID lookup. <!-- mw-todo:P6-005 -->
- [ ] Implement passage/reference lookup. <!-- mw-todo:P6-006 -->
- [ ] Implement assertion/evidence traversal. <!-- mw-todo:P6-007 -->
- [ ] Implement scope filters. <!-- mw-todo:P6-008 -->
- [ ] Build global derived catalog from dataset packs. <!-- mw-todo:P6-009 -->
- [ ] Build deterministic search/index artifacts. <!-- mw-todo:P6-010 -->
- [ ] Add generated SQLite/DuckDB/Parquet outputs only as disposable artifacts if useful. <!-- mw-todo:P6-011 -->
- [ ] Ensure `rm -rf dist && pnpm build` reconstructs all derived artifacts. <!-- mw-todo:P6-012 -->

**Exit gate:** CLI and applications query corpus through repository interfaces, never through hard-coded dataset paths.

## P7 — public Corpus Explorer web app

- [ ] Scaffold `apps/web` with Next.js. <!-- mw-todo:P7-001 -->
- [ ] Add dataset registry/catalog page. <!-- mw-todo:P7-002 -->
- [ ] Add entity page. <!-- mw-todo:P7-003 -->
- [ ] Add resource/work page. <!-- mw-todo:P7-004 -->
- [ ] Add passage reader. <!-- mw-todo:P7-005 -->
- [ ] Add assertion detail page. <!-- mw-todo:P7-006 -->
- [ ] Add evidence/source/provenance drill-down. <!-- mw-todo:P7-007 -->
- [ ] Add search page. <!-- mw-todo:P7-008 -->
- [ ] Add relation/graph explorer with bounded traversal. <!-- mw-todo:P7-009 -->
- [ ] Add comparison view that clearly preserves source/perspective boundaries. <!-- mw-todo:P7-010 -->
- [ ] Expose canonical IDs and dataset/spec versions in UI. <!-- mw-todo:P7-011 -->
- [ ] Avoid presenting derived similarity as identity or factual equivalence. <!-- mw-todo:P7-012 -->

**Exit gate:** a user can navigate from a claim to exact evidence, source/edition, provenance, and dataset version.

## P8 — public packages and releases

- [ ] Finalize package names and npm scope. <!-- mw-todo:P8-001 -->
- [ ] Publish core types/runtime package. <!-- mw-todo:P8-002 -->
- [ ] Publish schema package. <!-- mw-todo:P8-003 -->
- [ ] Publish repository package. <!-- mw-todo:P8-004 -->
- [ ] Publish validator package. <!-- mw-todo:P8-005 -->
- [ ] Publish CLI package. <!-- mw-todo:P8-006 -->
- [ ] Add Changesets or equivalent package version workflow. <!-- mw-todo:P8-007 -->
- [ ] Separate spec version, package version, dataset version, and aggregate corpus release version. <!-- mw-todo:P8-008 -->
- [ ] Generate release checksums. <!-- mw-todo:P8-009 -->
- [ ] Generate machine-readable release manifest. <!-- mw-todo:P8-010 -->
- [ ] Optionally export JSON-LD and RO-Crate from canonical records. <!-- mw-todo:P8-011 -->

## P9 — MoonWitness integration

This work belongs primarily in the `moonwitness` repository, not in canonical corpus core.

- [ ] Create MoonWitness-side corpus adapter package. <!-- mw-todo:P9-001 -->
- [ ] Pin a released `moonwitness-corpus` package/dataset version. <!-- mw-todo:P9-002 -->
- [ ] Map canonical Entity → `wx.entity` using semantic canonical key. <!-- mw-todo:P9-003 -->
- [ ] Map labels/identifiers to entity aliases/identifiers. <!-- mw-todo:P9-004 -->
- [ ] Map Assertion → `wx.assertion`. <!-- mw-todo:P9-005 -->
- [ ] Map Resource/source metadata → `wx.source`. <!-- mw-todo:P9-006 -->
- [ ] Map Provenance → `wx.provenance`. <!-- mw-todo:P9-007 -->
- [ ] Map textual Passage/Content to generalized MoonWitness passage/content models. <!-- mw-todo:P9-008 -->
- [ ] Import dataset manifest into source-manifest/runtime audit layer. <!-- mw-todo:P9-009 -->
- [ ] Keep `wx.source.policy` and normative engine weighting outside corpus imports. <!-- mw-todo:P9-010 -->
- [ ] Make import transactional and idempotent. <!-- mw-todo:P9-011 -->
- [ ] Add cross-repo fixture/contract tests. <!-- mw-todo:P9-012 -->
- [ ] Replace live-source production seeding with pinned corpus release ingestion. <!-- mw-todo:P9-013 -->

**Exit gate:** a clean MoonWitness database can be rebuilt deterministically from a pinned corpus release without calling upstream religious-text APIs at runtime.

## P10 — advanced profiles (after v0.1 proof)

- [ ] Temporal/chronology profile with uncertainty/ranges/calendars. <!-- mw-todo:P10-001 -->
- [ ] Geographical/place profile. <!-- mw-todo:P10-002 -->
- [ ] Bibliographic profile. <!-- mw-todo:P10-003 -->
- [ ] Manuscript/folio/line profile. <!-- mw-todo:P10-004 -->
- [ ] IIIF artifact references. <!-- mw-todo:P10-005 -->
- [ ] Media/audio/video selectors. <!-- mw-todo:P10-006 -->
- [ ] Lineage/genealogy/transmission profile. <!-- mw-todo:P10-007 -->
- [ ] Structured textual-variant apparatus. <!-- mw-todo:P10-008 -->
- [ ] Scholarly bibliography/citation profile. <!-- mw-todo:P10-009 -->

## P11 — curation and collaboration

- [ ] Design curator identity/review model. <!-- mw-todo:P11-001 -->
- [ ] Design reconciliation workflow. <!-- mw-todo:P11-002 -->
- [ ] Build `apps/studio` only after Git-based curation contracts are stable. <!-- mw-todo:P11-003 -->
- [ ] Studio edits must generate reviewable dataset patches/PRs, not hidden database-only truth. <!-- mw-todo:P11-004 -->
- [ ] Add source/rights review workflow. <!-- mw-todo:P11-005 -->
- [ ] Add assertion/evidence review workflow. <!-- mw-todo:P11-006 -->
- [ ] Add duplicate/entity reconciliation workflow. <!-- mw-todo:P11-007 -->
- [ ] Add contributor documentation and dataset authoring guide. <!-- mw-todo:P11-008 -->

---

## Definition of done for a real dataset

A dataset is not considered ready merely because the text parses. It must:

- [ ] have a stable dataset ID and version;
- [ ] declare the spec/profile versions it uses;
- [ ] declare partitions and record counts/checksums where applicable;
- [ ] pass structural and semantic validation;
- [ ] contain no unresolved duplicate canonical IDs;
- [ ] resolve required cross-record references;
- [ ] identify its exact source/edition/artifact;
- [ ] record provenance for acquisition and normalization;
- [ ] have explicit rights/licensing/availability metadata;
- [ ] be reproducible from a pinned ingestion recipe when source access permits;
- [ ] avoid converting tradition-specific belief into unscoped global fact;
- [ ] keep generated AI/search/vector data outside canonical source records unless explicitly represented as derived, provenance-tagged output.
