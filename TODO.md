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

- [x] Bootstrap pnpm + Turborepo monorepo.
- [x] Separate `spec/`, `datasets/`, `packages/`, `apps/`, and `ingestion/`.
- [x] Define six core record families: Entity, Resource, Assertion, Evidence, Provenance, Assessment.
- [x] Add JSON Schema Draft 2020-12 baseline.
- [x] Add synthetic minimal dataset fixture.
- [x] Add manifest/JSONL/duplicate-ID validator.
- [x] Add CI for typecheck + corpus validation.
- [x] Record initial architecture decisions as ADRs.

## P1 — stabilize the core contract

- [ ] Define canonical ID grammar and namespace rules.
- [ ] Define deterministic IDs for generated records such as assertions/evidence.
- [ ] Define external identifier vs alias vs canonical ID semantics.
- [ ] Define cross-dataset reference syntax and dependency resolution.
- [ ] Add referential-integrity validation for all entity/resource/evidence references.
- [ ] Add semantic invariants beyond JSON Schema.
- [ ] Define record lifecycle fields only where genuinely universal.
- [ ] Stabilize multilingual label model (`language`, `script`, preferred/alternate labels).
- [ ] Stabilize scoped assertion model (`tradition`, `community`, `agent`, `period`, `place`).
- [ ] Define literal/object value envelope for assertions.
- [ ] Define assessment target/result/method semantics.
- [ ] Add invalid fixtures for every invariant.
- [ ] Write compatibility policy for spec v0.x changes.

**Exit gate:** core schemas can be treated as stable enough to build profiles without changing their worldview assumptions.

## P2 — textual profile v0.1

- [ ] Add `spec/v0.1/schemas/profiles/textual/`.
- [ ] Define Work.
- [ ] Define Expression/recension/translation relationship.
- [ ] Define Edition.
- [ ] Define Artifact/digital representation descriptor.
- [ ] Define arbitrary-depth Passage hierarchy.
- [ ] Define citation scheme and canonical reference path.
- [ ] Define Content as language/script-specific text attached to a passage/resource.
- [ ] Define `derived_from` for translation/transliteration/normalization.
- [ ] Define Alignment between passages/content segments.
- [ ] Define Variant/readings without assuming one global base text.
- [ ] Define source-preserving vs normalized/search representations.
- [ ] Add Web-Annotation-inspired text quote/position/range selectors.
- [ ] Add textual profile examples for two structurally different citation schemes.
- [ ] Extend validator with textual hierarchy/citation invariants.

**Exit gate:** a surah/ayah text and a non-Quran chapter/stanza or book/chapter/verse text can use the same profile without core changes.

## P3 — provenance, source, rights, and artifacts

- [ ] Define source/resource metadata profile.
- [ ] Define Agent and Activity representation for ingestion provenance.
- [ ] Define artifact descriptor: URI, media type, byte size, SHA-256, availability.
- [ ] Define `bundled`, `external`, `metadata_only`, and `restricted` availability states.
- [ ] Define SPDX-compatible license expression fields.
- [ ] Define source-specific `LicenseRef-*` handling.
- [ ] Add rights validation: bundled content must declare rights/license status.
- [ ] Define retrieval timestamp separately from deterministic normalized checksums.
- [ ] Define parser/normalizer/curator provenance chain.
- [ ] Document policy for public-domain claims vs modern editions/translations.

**Exit gate:** every real content record can answer “from which artifact/edition, under what rights, and through what processing path did this record enter the corpus?”

## P4 — ingestion framework

- [ ] Define `recipe.schema.json`.
- [ ] Define source acquisition descriptor.
- [ ] Implement ingestion recipe registry.
- [ ] Implement filesystem source connector.
- [ ] Implement explicit HTTP fetch connector for ingestion jobs only.
- [ ] Add immutable raw-artifact SHA-256 verification.
- [ ] Define parser interface.
- [ ] Define normalizer interface.
- [ ] Define mapper-to-core/profile interface.
- [ ] Define recipe-specific validator interface.
- [ ] Make normalized output byte-for-byte deterministic.
- [ ] Add curation overlay format instead of silently editing parser output.
- [ ] Record reconciliation/correction provenance.
- [ ] Add `corpus ingest <recipe>` CLI command.
- [ ] Add `corpus checksum` CLI command.
- [ ] Add idempotency tests.
- [ ] Ensure network access is not required to consume a released dataset.

**Exit gate:** raw source + pinned recipe/parser/normalizer versions can reproduce the same canonical dataset checksum.

## P5 — prove universality with real datasets

- [ ] Select first source with verified redistribution rights.
- [ ] Build first textual dataset recipe and manifest.
- [ ] Prefer Quran as the first MoonWitness integration dataset if the selected Arabic/translation sources are legally usable.
- [ ] Select a second open/public-domain source from a substantially different religious tradition and textual structure.
- [ ] Build second dataset without adding religion-specific fields to core schemas.
- [ ] Validate both datasets in CI.
- [ ] Document every source, edition, language, script, rights statement, checksum, and retrieval process.
- [ ] Add cross-reference fixture between datasets without asserting theological equivalence.
- [ ] Review vocabulary for hidden Abrahamic/Islam-centric assumptions.

**Exit gate:** two structurally and religiously different real datasets validate against the same core + textual profile.

## P6 — repository, build, and query layer

- [ ] Expand `CorpusRepository` contract.
- [ ] Implement in-memory repository for tests.
- [ ] Implement filesystem/JSONL repository for Node.js.
- [ ] Implement dataset registry and dependency resolver.
- [ ] Implement canonical ID lookup.
- [ ] Implement passage/reference lookup.
- [ ] Implement assertion/evidence traversal.
- [ ] Implement scope filters.
- [ ] Build global derived catalog from dataset packs.
- [ ] Build deterministic search/index artifacts.
- [ ] Add generated SQLite/DuckDB/Parquet outputs only as disposable artifacts if useful.
- [ ] Ensure `rm -rf dist && pnpm build` reconstructs all derived artifacts.

**Exit gate:** CLI and applications query corpus through repository interfaces, never through hard-coded dataset paths.

## P7 — public Corpus Explorer web app

- [ ] Scaffold `apps/web` with Next.js.
- [ ] Add dataset registry/catalog page.
- [ ] Add entity page.
- [ ] Add resource/work page.
- [ ] Add passage reader.
- [ ] Add assertion detail page.
- [ ] Add evidence/source/provenance drill-down.
- [ ] Add search page.
- [ ] Add relation/graph explorer with bounded traversal.
- [ ] Add comparison view that clearly preserves source/perspective boundaries.
- [ ] Expose canonical IDs and dataset/spec versions in UI.
- [ ] Avoid presenting derived similarity as identity or factual equivalence.

**Exit gate:** a user can navigate from a claim to exact evidence, source/edition, provenance, and dataset version.

## P8 — public packages and releases

- [ ] Finalize package names and npm scope.
- [ ] Publish core types/runtime package.
- [ ] Publish schema package.
- [ ] Publish repository package.
- [ ] Publish validator package.
- [ ] Publish CLI package.
- [ ] Add Changesets or equivalent package version workflow.
- [ ] Separate spec version, package version, dataset version, and aggregate corpus release version.
- [ ] Generate release checksums.
- [ ] Generate machine-readable release manifest.
- [ ] Optionally export JSON-LD and RO-Crate from canonical records.

## P9 — MoonWitness integration

This work belongs primarily in the `moonwitness` repository, not in canonical corpus core.

- [ ] Create MoonWitness-side corpus adapter package.
- [ ] Pin a released `moonwitness-corpus` package/dataset version.
- [ ] Map canonical Entity → `wx.entity` using semantic canonical key.
- [ ] Map labels/identifiers to entity aliases/identifiers.
- [ ] Map Assertion → `wx.assertion`.
- [ ] Map Resource/source metadata → `wx.source`.
- [ ] Map Provenance → `wx.provenance`.
- [ ] Map textual Passage/Content to generalized MoonWitness passage/content models.
- [ ] Import dataset manifest into source-manifest/runtime audit layer.
- [ ] Keep `wx.source.policy` and normative engine weighting outside corpus imports.
- [ ] Make import transactional and idempotent.
- [ ] Add cross-repo fixture/contract tests.
- [ ] Replace live-source production seeding with pinned corpus release ingestion.

**Exit gate:** a clean MoonWitness database can be rebuilt deterministically from a pinned corpus release without calling upstream religious-text APIs at runtime.

## P10 — advanced profiles (after v0.1 proof)

- [ ] Temporal/chronology profile with uncertainty/ranges/calendars.
- [ ] Geographical/place profile.
- [ ] Bibliographic profile.
- [ ] Manuscript/folio/line profile.
- [ ] IIIF artifact references.
- [ ] Media/audio/video selectors.
- [ ] Lineage/genealogy/transmission profile.
- [ ] Structured textual-variant apparatus.
- [ ] Scholarly bibliography/citation profile.

## P11 — curation and collaboration

- [ ] Design curator identity/review model.
- [ ] Design reconciliation workflow.
- [ ] Build `apps/studio` only after Git-based curation contracts are stable.
- [ ] Studio edits must generate reviewable dataset patches/PRs, not hidden database-only truth.
- [ ] Add source/rights review workflow.
- [ ] Add assertion/evidence review workflow.
- [ ] Add duplicate/entity reconciliation workflow.
- [ ] Add contributor documentation and dataset authoring guide.

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
