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
- [x] Stabilize scoped assertion model (`tradition`, `community`, `agent`, `period`, `place`). <!-- mw-todo:P1-009 -->
- [x] Define literal/object value envelope for assertions. <!-- mw-todo:P1-010 -->
- [x] Define assessment target/result/method semantics. <!-- mw-todo:P1-011 -->
- [x] Add invalid fixtures for every invariant. <!-- mw-todo:P1-012 -->
- [x] Write compatibility policy for spec v0.x changes. <!-- mw-todo:P1-013 -->

**Exit gate:** core schemas can be treated as stable enough to build profiles without changing their worldview assumptions.

## P2 — textual profile v0.1

- [x] Add `spec/v0.1/schemas/profiles/textual/`. <!-- mw-todo:P2-001 -->
- [x] Define Work. <!-- mw-todo:P2-002 -->
- [x] Define Expression/recension/translation relationship. <!-- mw-todo:P2-003 -->
- [x] Define Edition. <!-- mw-todo:P2-004 -->
- [x] Define Artifact/digital representation descriptor. <!-- mw-todo:P2-005 -->
- [x] Define arbitrary-depth Passage hierarchy. <!-- mw-todo:P2-006 -->
- [x] Define citation scheme and canonical reference path. <!-- mw-todo:P2-007 -->
- [x] Define Content as language/script-specific text attached to a passage/resource. <!-- mw-todo:P2-008 -->
- [x] Define `derived_from` for translation/transliteration/normalization. <!-- mw-todo:P2-009 -->
- [x] Define Alignment between passages/content segments. <!-- mw-todo:P2-010 -->
- [x] Define Variant/readings without assuming one global base text. <!-- mw-todo:P2-011 -->
- [x] Define source-preserving vs normalized/search representations. <!-- mw-todo:P2-012 -->
- [x] Add Web-Annotation-inspired text quote/position/range selectors. <!-- mw-todo:P2-013 -->
- [x] Add textual profile examples for two structurally different citation schemes. <!-- mw-todo:P2-014 -->
- [x] Extend validator with textual hierarchy/citation invariants. <!-- mw-todo:P2-015 -->

**Exit gate:** a surah/ayah text and a non-Quran chapter/stanza or book/chapter/verse text can use the same profile without core changes.

## P3 — provenance, source, rights, and artifacts

- [x] Define source/resource metadata profile. <!-- mw-todo:P3-001 -->
- [x] Define Agent and Activity representation for ingestion provenance. <!-- mw-todo:P3-002 -->
- [x] Define artifact descriptor: URI, media type, byte size, SHA-256, availability. <!-- mw-todo:P3-003 -->
- [x] Define `bundled`, `external`, `metadata_only`, and `restricted` availability states. <!-- mw-todo:P3-004 -->
- [x] Define SPDX-compatible license expression fields. <!-- mw-todo:P3-005 -->
- [x] Define source-specific `LicenseRef-*` handling. <!-- mw-todo:P3-006 -->
- [x] Add rights validation: bundled content must declare rights/license status. <!-- mw-todo:P3-007 -->
- [x] Define retrieval timestamp separately from deterministic normalized checksums. <!-- mw-todo:P3-008 -->
- [x] Define parser/normalizer/curator provenance chain. <!-- mw-todo:P3-009 -->
- [x] Document policy for public-domain claims vs modern editions/translations. <!-- mw-todo:P3-010 -->

**Exit gate:** every real content record can answer “from which artifact/edition, under what rights, and through what processing path did this record enter the corpus?”

## P4 — ingestion framework

- [x] Define `recipe.schema.json`. <!-- mw-todo:P4-001 -->
- [x] Define source acquisition descriptor. <!-- mw-todo:P4-002 -->
- [x] Implement ingestion recipe registry. <!-- mw-todo:P4-003 -->
- [x] Implement filesystem source connector. <!-- mw-todo:P4-004 -->
- [x] Implement explicit HTTP fetch connector for ingestion jobs only. <!-- mw-todo:P4-005 -->
- [x] Add immutable raw-artifact SHA-256 verification. <!-- mw-todo:P4-006 -->
- [x] Define parser interface. <!-- mw-todo:P4-007 -->
- [x] Define normalizer interface. <!-- mw-todo:P4-008 -->
- [x] Define mapper-to-core/profile interface. <!-- mw-todo:P4-009 -->
- [x] Define recipe-specific validator interface. <!-- mw-todo:P4-010 -->
- [x] Make normalized output byte-for-byte deterministic. <!-- mw-todo:P4-011 -->
- [x] Add curation overlay format instead of silently editing parser output. <!-- mw-todo:P4-012 -->
- [x] Record reconciliation/correction provenance. <!-- mw-todo:P4-013 -->
- [x] Add `corpus ingest <recipe>` CLI command. <!-- mw-todo:P4-014 -->
- [x] Add `corpus checksum` CLI command. <!-- mw-todo:P4-015 -->
- [x] Add idempotency tests. <!-- mw-todo:P4-016 -->
- [x] Ensure network access is not required to consume a released dataset. <!-- mw-todo:P4-017 -->

**Exit gate:** raw source + pinned recipe/parser/normalizer versions can reproduce the same canonical dataset checksum.

## P5 — prove universality with real datasets

- [x] Select first source with verified redistribution rights. <!-- mw-todo:P5-001 -->
- [x] Build first textual dataset recipe and manifest. <!-- mw-todo:P5-002 -->
- [x] Prefer Quran as the first MoonWitness integration dataset if the selected Arabic/translation sources are legally usable. <!-- mw-todo:P5-003 -->
- [x] Select a second open/public-domain source from a substantially different religious tradition and textual structure. <!-- mw-todo:P5-004 -->
- [x] Build second dataset without adding religion-specific fields to core schemas. <!-- mw-todo:P5-005 -->
- [x] Validate both datasets in CI. <!-- mw-todo:P5-006 -->
- [x] Document every source, edition, language, script, rights statement, checksum, and retrieval process. <!-- mw-todo:P5-007 -->
- [x] Add cross-reference fixture between datasets without asserting theological equivalence. <!-- mw-todo:P5-008 -->
- [x] Review vocabulary for hidden Abrahamic/Islam-centric assumptions. <!-- mw-todo:P5-009 -->

**Exit gate:** two structurally and religiously different real datasets validate against the same core + textual profile.

## P6 — repository, build, and query layer

- [x] Expand `CorpusRepository` contract. <!-- mw-todo:P6-001 -->
- [x] Implement in-memory repository for tests. <!-- mw-todo:P6-002 -->
- [x] Implement filesystem/JSONL repository for Node.js. <!-- mw-todo:P6-003 -->
- [x] Implement dataset registry and dependency resolver. <!-- mw-todo:P6-004 -->
- [x] Implement canonical ID lookup. <!-- mw-todo:P6-005 -->
- [x] Implement passage/reference lookup. <!-- mw-todo:P6-006 -->
- [x] Implement assertion/evidence traversal. <!-- mw-todo:P6-007 -->
- [x] Implement scope filters. <!-- mw-todo:P6-008 -->
- [x] Build global derived catalog from dataset packs. <!-- mw-todo:P6-009 -->
- [x] Build deterministic search/index artifacts. <!-- mw-todo:P6-010 -->
- [x] Add generated SQLite/DuckDB/Parquet outputs only as disposable artifacts if useful. <!-- mw-todo:P6-011 -->
- [x] Ensure `rm -rf dist && pnpm build` reconstructs all derived artifacts. <!-- mw-todo:P6-012 -->

**Exit gate:** CLI and applications query corpus through repository interfaces, never through hard-coded dataset paths.

## P7 — public Corpus Explorer web app

- [x] Scaffold `apps/web` with Next.js. <!-- mw-todo:P7-001 -->
- [x] Add dataset registry/catalog page. <!-- mw-todo:P7-002 -->
- [x] Add entity page. <!-- mw-todo:P7-003 -->
- [x] Add resource/work page. <!-- mw-todo:P7-004 -->
- [x] Add passage reader. <!-- mw-todo:P7-005 -->
- [x] Add assertion detail page. <!-- mw-todo:P7-006 -->
- [x] Add evidence/source/provenance drill-down. <!-- mw-todo:P7-007 -->
- [x] Add search page. <!-- mw-todo:P7-008 -->
- [x] Add relation/graph explorer with bounded traversal. <!-- mw-todo:P7-009 -->
- [x] Add comparison view that clearly preserves source/perspective boundaries. <!-- mw-todo:P7-010 -->
- [x] Expose canonical IDs and dataset/spec versions in UI. <!-- mw-todo:P7-011 -->
- [x] Avoid presenting derived similarity as identity or factual equivalence. <!-- mw-todo:P7-012 -->

**Exit gate:** a user can navigate from a claim to exact evidence, source/edition, provenance, and dataset version.

## P8 — public packages and releases

- [x] Finalize package names and npm scope. <!-- mw-todo:P8-001 -->
- [ ] Publish core types/runtime package. <!-- mw-todo:P8-002 -->
- [ ] Publish schema package. <!-- mw-todo:P8-003 -->
- [ ] Publish repository package. <!-- mw-todo:P8-004 -->
- [ ] Publish validator package. <!-- mw-todo:P8-005 -->
- [ ] Publish CLI package. <!-- mw-todo:P8-006 -->
- [x] Add Changesets or equivalent package version workflow. <!-- mw-todo:P8-007 -->
- [x] Separate spec version, package version, dataset version, and aggregate corpus release version. <!-- mw-todo:P8-008 -->
- [x] Generate release checksums. <!-- mw-todo:P8-009 -->
- [x] Generate machine-readable release manifest. <!-- mw-todo:P8-010 -->
- [x] Optionally export JSON-LD and RO-Crate from canonical records. <!-- mw-todo:P8-011 -->

## P12 — foundation text corpus expansion (current priority)

P9–P11 are intentionally deferred while this data-first milestone is active. Exact sources, license evidence, and acceptance boundaries are documented in [`docs/DATASET_TARGETS.md`](docs/DATASET_TARGETS.md), with the required English/Indonesian policy in [`docs/TRANSLATION_TARGETS.md`](docs/TRANSLATION_TARGETS.md).

- [x] Add a machine-readable coverage/completeness matrix for all real datasets. <!-- mw-todo:P12-001 -->
- [x] Re-verify the Quran Tanzil Uthmani baseline: 6,236 ayah, pinned source checksum, rights evidence, and source-preserving text. <!-- mw-todo:P12-002 -->
- [x] Complete the Bhikkhu Sujato English Dhammapada from SuttaCentral Bilara `published@cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6`. <!-- mw-todo:P12-003 -->
- [ ] Audit the exact SuttaCentral Pali Dhammapada root edition/source and redistribution rights independently from translation licensing. <!-- mw-todo:P12-004 -->
- [ ] Ingest the full Pali Dhammapada as a separate expression only if P12-004 permits bundling; otherwise record it as external/metadata-only. <!-- mw-todo:P12-005 -->
- [ ] Add Pali↔English Dhammapada segment alignment when both representations are legally available, without asserting semantic identity. <!-- mw-todo:P12-006 -->
- [ ] Pin an exact Open Scriptures Hebrew Bible/WLC upstream commit and artifact checksums with attribution/license evidence. <!-- mw-todo:P12-007 -->
- [ ] Ingest the full Westminster Leningrad Codex Hebrew text from OSHB `wlc/` as source-preserving content. <!-- mw-todo:P12-008 -->
- [ ] Ingest OSHB lemma/morphology as separate annotation data linked to source tokens, preserving source token IDs. <!-- mw-todo:P12-009 -->
- [ ] Pin the official SBLGNT v1.2 source commit/artifacts and CC BY 4.0 attribution evidence. <!-- mw-todo:P12-010 -->
- [ ] Ingest the full SBL Greek New Testament v1.2 as a specific Greek expression/edition. <!-- mw-todo:P12-011 -->
- [ ] Pin the eBible World English Bible Classic 2020 stable full-ecumenical artifact, checksum, and public-domain/trademark evidence. <!-- mw-todo:P12-012 -->
- [ ] Ingest World English Bible Classic 2020 full ecumenical book set as a separate English expression/edition. <!-- mw-todo:P12-013 -->
- [ ] Represent WEB book-set membership/order as edition/collection metadata rather than one universal Bible canon. <!-- mw-todo:P12-014 -->
- [ ] Add WEB↔OSHB passage alignment for overlapping Hebrew Bible books with versification differences explicit. <!-- mw-todo:P12-015 -->
- [ ] Add WEB↔SBLGNT New Testament passage alignment with edition and verse-boundary differences explicit. <!-- mw-todo:P12-016 -->
- [ ] Expand SuttaCentral CC0 Bhikkhu Sujato English translations to Dīgha Nikāya and Majjhima Nikāya from a pinned `published` commit. <!-- mw-todo:P12-017 -->
- [ ] Expand SuttaCentral CC0 Bhikkhu Sujato English translations to Saṁyutta Nikāya and Aṅguttara Nikāya from a pinned `published` commit. <!-- mw-todo:P12-018 -->
- [ ] Add deterministic completeness/count/checksum tests plus rights/provenance gates for every P12 dataset. <!-- mw-todo:P12-019 -->
- [ ] Produce the Foundation Text Corpus coverage report and pass both the no-unresolved-bundled-rights gate and the required source-language + `en` + `id` translation-coverage gate. <!-- mw-todo:P12-020 -->
- [ ] Enforce source-language + human-published English (`en`) + Indonesian (`id`) minimum coverage for every major P12 work/collection; machine/LLM translation must not satisfy canonical coverage. <!-- mw-todo:P12-021 -->
- [ ] Pin and ingest Quran English translation from QuranEnc / Rowwad Translation Center under exact source-preserving republication terms. <!-- mw-todo:P12-022 -->
- [ ] Pin and ingest Quran Indonesian translation from QuranEnc / Kementerian Agama Republik Indonesia under exact source-preserving republication terms. <!-- mw-todo:P12-023 -->
- [ ] Pin and ingest an open Indonesian Bible expression, starting with TSI Edisi Ketiga (CC BY-SA 4.0), with exact per-book completeness; use AGS only as an explicitly separate supplemental edition where useful. <!-- mw-todo:P12-024 -->
- [ ] Add Indonesian Bible passage alignments to WLC/SBLGNT/WEB where editions overlap, preserving book/verse and versification gaps explicitly. <!-- mw-todo:P12-025 -->
- [ ] Audit and ingest the Indonesian LP2KBI/Bimas Buddha Kemenag Dhammapada if its government/public-domain rights basis is independently verified; otherwise select another openly redistributable human Indonesian translation. <!-- mw-todo:P12-026 -->
- [ ] Audit and ingest human-published Indonesian coverage for DN/MN/SN/AN; keep unavailable passages explicit and never fill canonical gaps with machine translation. <!-- mw-todo:P12-027 -->

**Exit gate:** the foundation corpus has source-pinned Arabic Quran, source-preserving original-language backbones, human-published English (`en`) and Indonesian (`id`) translation coverage for every major P12 work/collection, complete Dhammapada handling, WLC Hebrew, SBLGNT v1.2 Greek, WEB English, explicit permitted alignments, broader DN/MN/SN/AN coverage, deterministic checksums, and no unresolved rights for bundled content. Machine/LLM translations never satisfy the canonical `en`/`id` gate.

## P13 — world religions and religious persons registry (parallel data track)

P13 runs in parallel with P12. It builds an open-ended registry, not a final universal taxonomy. Source/role/reconciliation policy is documented in [`docs/WORLD_REGISTRY_TARGETS.md`](docs/WORLD_REGISTRY_TARGETS.md).

- [x] Define the non-exhaustive religion/tradition taxonomy policy and contextual religious-role assertion policy. <!-- mw-todo:P13-001 -->
- [ ] Add a machine-readable P13 source registry with exact source, revision, rights, retrieval, and checksum metadata. <!-- mw-todo:P13-002 -->
- [ ] Pin reproducible Wikidata CC0 discovery snapshots/queries for religions, traditions, denominations, schools, movements, and communities. <!-- mw-todo:P13-003 -->
- [ ] Ingest canonical tradition/religion/movement entities without treating a source taxonomy as universal truth. <!-- mw-todo:P13-004 -->
- [ ] Add preferred `en` and `id` labels plus native/source-language labels and alternate names/transliterations for high-priority tradition entities. <!-- mw-todo:P13-005 -->
- [ ] Preserve Wikidata QIDs and other authority identifiers as external IDs, never as MoonWitness canonical identity. <!-- mw-todo:P13-006 -->
- [ ] Represent broader/narrower/related religion classifications as source-attributed assertions with provenance. <!-- mw-todo:P13-007 -->
- [ ] Add sourced geography/region associations without making geography an intrinsic definition of a religion. <!-- mw-todo:P13-008 -->
- [ ] Pin reproducible Wikidata CC0 discovery snapshots/queries for religious, scriptural, historical, and legendary persons/figures. <!-- mw-todo:P13-009 -->
- [ ] Ingest person/figure entities separately from claims about their religious roles, historicity, or identity. <!-- mw-todo:P13-010 -->
- [ ] Define extensible data vocabulary concepts for roles such as prophet, messenger, apostle, patriarch, founder, guru, rishi, tirthankara, buddha, bodhisattva, imam, saint, sage, reformer, and related roles without adding core enums. <!-- mw-todo:P13-011 -->
- [ ] Implement scoped role assertions (`tradition`/`community`/`source`) so no person is globally hard-coded as prophet/founder/guru/etc. <!-- mw-todo:P13-012 -->
- [ ] Add Quran-evidenced named prophet/messenger/scriptural-figure assertions linked to exact P12 Quran passages. <!-- mw-todo:P13-013 -->
- [ ] Add Tanakh/Hebrew-Bible-evidenced prophet/patriarch/priest/king/scriptural-figure assertions linked to exact P12 passages. <!-- mw-todo:P13-014 -->
- [ ] Add Greek-New-Testament-evidenced apostle/disciple/prophet/scriptural-figure assertions linked to exact P12 passages. <!-- mw-todo:P13-015 -->
- [ ] Add Buddhist figure coverage (Buddhas, disciples, teachers, bodhisattvas where source-appropriate) with school/source scope explicit. <!-- mw-todo:P13-016 -->
- [ ] Add Hindu-tradition figure coverage (rishis, gurus, acharyas, avatars/deities/figures where source-appropriate) without flattening diverse traditions into one taxonomy. <!-- mw-todo:P13-017 -->
- [ ] Add Jain Tirthankara/teacher coverage with tradition/source provenance. <!-- mw-todo:P13-018 -->
- [ ] Add Sikh Guru and related figure coverage with Sikh textual/historical source provenance. <!-- mw-todo:P13-019 -->
- [ ] Add Baháʼí, Zoroastrian, Daoist/Confucian/Shinto, indigenous/traditional, ancient/historical, and modern/new-religious-movement figure discovery lanes with source-specific review. <!-- mw-todo:P13-020 -->
- [ ] Add preferred `en` and `id` labels, aliases, honorifics, transliterations, and native-language names for high-priority persons/figures. <!-- mw-todo:P13-021 -->
- [ ] Add deterministic duplicate/reconciliation reports for same-name, alias, transliteration, and cross-source candidates without automatic merges. <!-- mw-todo:P13-022 -->
- [ ] Add explicit cross-tradition identity/equivalence assertions only when sourced; name similarity must never merge or equate figures. <!-- mw-todo:P13-023 -->
- [ ] Represent historicity/legendary/chronology uncertainty as sourced assertions/assessments rather than hidden entity flags. <!-- mw-todo:P13-024 -->
- [ ] Add machine-readable coverage matrices for religion families, movements, person roles, `en`/`id` labels, source provenance, and unresolved gaps. <!-- mw-todo:P13-025 -->
- [ ] Add deterministic ingestion/count/checksum/right/provenance tests for P13 datasets and discovery snapshots. <!-- mw-todo:P13-026 -->
- [ ] Produce the P13 v0.1 coverage report and pass the no-global-prophet/no-final-taxonomy/no-name-only-identity exit gates. <!-- mw-todo:P13-027 -->

**Exit gate:** P13 provides reproducible open registries of traditions and religious/scriptural persons with `en` + `id` coverage reporting, external identifiers, source-attributed hierarchy/role assertions, exact textual evidence where available, deterministic reconciliation, and no claim that a finite taxonomy is literally “all religions” or that a religious role is universally true.

## P10 — advanced profiles (after v0.1 proof)

- [x] Temporal/chronology profile with uncertainty/ranges/calendars. <!-- mw-todo:P10-001 -->
- [x] Geographical/place profile. <!-- mw-todo:P10-002 -->
- [x] Bibliographic profile. <!-- mw-todo:P10-003 -->
- [x] Manuscript/folio/line profile. <!-- mw-todo:P10-004 -->
- [x] IIIF artifact references. <!-- mw-todo:P10-005 -->
- [x] Media/audio/video selectors. <!-- mw-todo:P10-006 -->
- [ ] Lineage/genealogy/transmission profile. <!-- mw-todo:P10-007 -->
- [ ] Structured textual-variant apparatus. <!-- mw-todo:P10-008 -->
- [ ] Scholarly bibliography/citation profile. <!-- mw-todo:P10-009 -->

## P11 — curation and collaboration

- [x] Design curator identity/review model. <!-- mw-todo:P11-001 -->
- [x] Design reconciliation workflow. <!-- mw-todo:P11-002 -->
- [ ] Build `apps/studio` only after Git-based curation contracts are stable. <!-- mw-todo:P11-003 -->
- [ ] Studio edits must generate reviewable dataset patches/PRs, not hidden database-only truth. <!-- mw-todo:P11-004 -->
- [x] Add source/rights review workflow. <!-- mw-todo:P11-005 -->
- [x] Add assertion/evidence review workflow. <!-- mw-todo:P11-006 -->
- [x] Add duplicate/entity reconciliation workflow. <!-- mw-todo:P11-007 -->
- [x] Add contributor documentation and dataset authoring guide. <!-- mw-todo:P11-008 -->

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
