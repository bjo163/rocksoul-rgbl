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
- [x] Audit the exact SuttaCentral Pali Dhammapada root edition/source and redistribution rights independently from translation licensing. <!-- mw-todo:P12-004 -->
- [x] Ingest the full Pali Dhammapada as a separate expression only if P12-004 permits bundling; otherwise record it as external/metadata-only. <!-- mw-todo:P12-005 -->
- [ ] Add Pali↔English Dhammapada segment alignment when both representations are legally available, without asserting semantic identity. <!-- mw-todo:P12-006 -->
- [x] Pin an exact Open Scriptures Hebrew Bible/WLC upstream commit and artifact checksums with attribution/license evidence. <!-- mw-todo:P12-007 -->
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
- [x] Add a machine-readable P13 source registry with exact source, revision, rights, retrieval, and checksum metadata. <!-- mw-todo:P13-002 -->
- [x] Pin reproducible Wikidata CC0 discovery snapshots/queries for religions, traditions, denominations, schools, movements, and communities. <!-- mw-todo:P13-003 -->
- [x] Ingest canonical tradition/religion/movement entities without treating a source taxonomy as universal truth. <!-- mw-todo:P13-004 -->
- [x] Add preferred `en` and `id` labels plus native/source-language labels and alternate names/transliterations for high-priority tradition entities. <!-- mw-todo:P13-005 -->
- [x] Preserve Wikidata QIDs and other authority identifiers as external IDs, never as MoonWitness canonical identity. <!-- mw-todo:P13-006 -->
- [x] Represent broader/narrower/related religion classifications as source-attributed assertions with provenance. <!-- mw-todo:P13-007 -->
- [x] Add sourced geography/region associations without making geography an intrinsic definition of a religion. <!-- mw-todo:P13-008 -->
- [x] Pin reproducible Wikidata CC0 discovery snapshots/queries for religious, scriptural, historical, and legendary persons/figures. <!-- mw-todo:P13-009 -->
- [x] Ingest person/figure entities separately from claims about their religious roles, historicity, or identity. <!-- mw-todo:P13-010 -->
- [x] Define extensible data vocabulary concepts for roles such as prophet, messenger, apostle, patriarch, founder, guru, rishi, tirthankara, buddha, bodhisattva, imam, saint, sage, reformer, and related roles without adding core enums. <!-- mw-todo:P13-011 -->
- [x] Implement scoped role assertions (`tradition`/`community`/`source`) so no person is globally hard-coded as prophet/founder/guru/etc. <!-- mw-todo:P13-012 -->
- [x] Add Quran-evidenced named prophet/messenger/scriptural-figure assertions linked to exact P12 Quran passages. <!-- mw-todo:P13-013 -->
- [x] Add Tanakh/Hebrew-Bible-evidenced prophet/patriarch/priest/king/scriptural-figure assertions linked to exact P12 passages. <!-- mw-todo:P13-014 -->
- [x] Add Greek-New-Testament-evidenced apostle/disciple/prophet/scriptural-figure assertions linked to exact P12 passages. <!-- mw-todo:P13-015 -->
- [x] Add Buddhist figure coverage (Buddhas, disciples, teachers, bodhisattvas where source-appropriate) with school/source scope explicit. <!-- mw-todo:P13-016 -->
- [x] Add Hindu-tradition figure coverage (rishis, gurus, acharyas, avatars/deities/figures where source-appropriate) without flattening diverse traditions into one taxonomy. <!-- mw-todo:P13-017 -->
- [x] Add Jain Tirthankara/teacher coverage with tradition/source provenance. <!-- mw-todo:P13-018 -->
- [x] Add Sikh Guru and related figure coverage with Sikh textual/historical source provenance. <!-- mw-todo:P13-019 -->
- [ ] Add Baháʼí, Zoroastrian, Daoist/Confucian/Shinto, indigenous/traditional, ancient/historical, and modern/new-religious-movement figure discovery lanes with source-specific review. <!-- mw-todo:P13-020 -->
- [x] Add preferred `en` and `id` labels, aliases, honorifics, transliterations, and native-language names for high-priority persons/figures. <!-- mw-todo:P13-021 -->
- [x] Add deterministic duplicate/reconciliation reports for same-name, alias, transliteration, and cross-source candidates without automatic merges. <!-- mw-todo:P13-022 -->
- [ ] Add explicit cross-tradition identity/equivalence assertions only when sourced; name similarity must never merge or equate figures. <!-- mw-todo:P13-023 -->
- [ ] Represent historicity/legendary/chronology uncertainty as sourced assertions/assessments rather than hidden entity flags. <!-- mw-todo:P13-024 -->
- [x] Add machine-readable coverage matrices for religion families, movements, person roles, `en`/`id` labels, source provenance, and unresolved gaps. <!-- mw-todo:P13-025 -->
- [x] Add deterministic ingestion/count/checksum/right/provenance tests for P13 datasets and discovery snapshots. <!-- mw-todo:P13-026 -->
- [x] Produce the P13 v0.1 coverage report and pass the no-global-prophet/no-final-taxonomy/no-name-only-identity exit gates. <!-- mw-todo:P13-027 -->

**Exit gate:** P13 provides reproducible open registries of traditions and religious/scriptural persons with `en` + `id` coverage reporting, external identifiers, source-attributed hierarchy/role assertions, exact textual evidence where available, deterministic reconciliation, and no claim that a finite taxonomy is literally “all religions” or that a religious role is universally true.

## P14 — dataset diversity and source expansion

P14 increases diversity of texts, fragments, genres, languages, and communities without treating record count as coverage. Detailed policy and source-lane boundaries are in [`docs/DATASET_DIVERSITY_TARGETS.md`](docs/DATASET_DIVERSITY_TARGETS.md).

- [ ] Define a machine-readable P14 diversity matrix covering tradition/community, genre, source language, `en`/`id`, text scale, rights state, and unresolved gaps. <!-- mw-todo:P14-001 -->
- [ ] Add a source-discovery registry that records candidate source, authority, edition, retrieval method, checksum, rights decision, and bundle/metadata-only disposition. <!-- mw-todo:P14-002 -->
- [ ] Add a reusable complete-work versus bounded-fragment contract; fragments must retain parent work, edition, citation range, completeness statement, rights, and provenance. <!-- mw-todo:P14-003 -->
- [ ] Add deterministic source/rights gates that prohibit bundling a candidate merely because it is downloadable. <!-- mw-todo:P14-004 -->
- [ ] Add genre vocabulary and profiles for scripture, hadith/report, commentary, legal text, ritual/manual, hymn/prayer, biography, chronicle, philosophical text, and oral-tradition metadata. <!-- mw-todo:P14-005 -->
- [ ] Audit and pin openly redistributable Arabic hadith/report source candidates; keep collection, book, chapter, report, matn, and isnad/transmitter layers distinct. <!-- mw-todo:P14-006 -->
- [ ] Ingest the first rights-cleared Arabic hadith/report collection with exact citation hierarchy and source-preserving matn, without using a secondary website as authority by default. <!-- mw-todo:P14-007 -->
- [ ] Add separately sourced human English and Indonesian hadith/report translations only where republication rights, translator, and edition are explicit. <!-- mw-todo:P14-008 -->
- [ ] Model isnad/transmission as source-attributed assertions and chains, never as automatically verified biography or historical fact. <!-- mw-todo:P14-009 -->
- [ ] Audit and ingest a rights-cleared Quran commentary/tafsir lane as commentary linked to Quran passages, never as Quran source text. <!-- mw-todo:P14-010 -->
- [ ] Audit and ingest a rights-cleared Mishnah source lane, preserving tractate/chapter/mishnah citations and Hebrew/Aramaic distinctions. <!-- mw-todo:P14-011 -->
- [ ] Audit Talmud and midrash candidates; support metadata-only or bounded quotation datasets when complete redistribution is not permitted. <!-- mw-todo:P14-012 -->
- [ ] Add Jewish liturgical/prayer and medieval philosophical-text candidate lanes with explicit community, language, and rights scopes. <!-- mw-todo:P14-013 -->
- [ ] Audit and ingest rights-cleared Apostolic Fathers, early Christian creeds, and patristic source-text candidates as editions separate from the New Testament. <!-- mw-todo:P14-014 -->
- [ ] Add Christian liturgical, conciliar, and denominational primary-document lanes with denomination/community scope and non-universal claims. <!-- mw-todo:P14-015 -->
- [ ] Complete the Pali root-text rights decision for DN/MN/SN/AN and ingest only independently permitted source-language material. <!-- mw-todo:P14-016 -->
- [ ] Add Buddhist non-Pali source lanes for Chinese and Tibetan canon metadata, with source-language, edition, and access constraints explicit. <!-- mw-todo:P14-017 -->
- [ ] Audit and ingest rights-cleared Buddhist commentarial, vinaya, and meditation-manual datasets as genres distinct from sutta text. <!-- mw-todo:P14-018 -->
- [ ] Audit and ingest Sanskrit Bhagavad Gita source candidates plus human English and Indonesian translations as separate expressions. <!-- mw-todo:P14-019 -->
- [ ] Add rights-cleared Veda, Upanishad, and Hindu epic source/fragment lanes with recension, language, and translation boundaries explicit. <!-- mw-todo:P14-020 -->
- [ ] Audit Jain Agama and Tattvartha Sutra candidates with Prakrit/Sanskrit/Hindi/English/Indonesian distinctions and sect scope. <!-- mw-todo:P14-021 -->
- [ ] Audit Sikh Guru Granth Sahib source and translation candidates, preserving raga, ang, and hymn citation systems where licensed. <!-- mw-todo:P14-022 -->
- [ ] Audit Baháʼí, Zoroastrian, Daoist, Confucian, and Shinto primary-text candidates with edition, translation, and community scopes. <!-- mw-todo:P14-023 -->
- [ ] Add indigenous, local, oral, and living-tradition discovery lanes under consent-first metadata policy; do not bundle restricted or ceremonial content without explicit permission. <!-- mw-todo:P14-024 -->
- [ ] Add modern religious-movement primary-document lanes with publisher, date, jurisdiction, and redistribution terms recorded. <!-- mw-todo:P14-025 -->
- [ ] Add multilingual transliteration/romanization provenance for source languages where a lossless native-script representation is retained. <!-- mw-todo:P14-026 -->
- [ ] Add citation adapters for non-Bible/non-sutta structures: hadith report, folio/line, hymn/ang/raga, chapter/verse, tractate/mishnah, and fragment selector. <!-- mw-todo:P14-027 -->
- [ ] Add passage-to-P13 evidence extraction contracts so text mentions create review candidates, never automatic person identity or role claims. <!-- mw-todo:P14-028 -->
- [ ] Add diversity-aware sampling and duplicate controls so high-volume traditions do not hide missing source-language, genre, or community coverage. <!-- mw-todo:P14-029 -->
- [ ] Add deterministic ingestion/count/checksum/rights/provenance tests for every P14 dataset and fragment collection. <!-- mw-todo:P14-030 -->
- [ ] Produce the P14 diversity coverage report and pass the no-exhaustiveness/no-unconsented-restricted-content/no-translation-as-source exit gates. <!-- mw-todo:P14-031 -->

**Exit gate:** P14 demonstrates materially broader, rights-safe coverage across traditions, genres, and languages while preserving source/translation/commentary boundaries, fragment completeness, community scope, and provenance.

## P15 — multilingual religious lexicon and concept registry

P15 separates lexical forms from source-scoped meanings and from P13 entities. Policy is documented in [`docs/RELIGIOUS_LEXICON_TARGETS.md`](docs/RELIGIOUS_LEXICON_TARGETS.md).

- [ ] Define separate schemas/contracts for concept, term, sacred name, epithet, title, honorific, definition, and usage evidence. <!-- mw-todo:P15-001 -->
- [ ] Define an anti-equivalence policy: shared translation, spelling, or function never automatically equates concepts across sources or traditions. <!-- mw-todo:P15-002 -->
- [ ] Add a machine-readable P15 source registry and coverage matrix by tradition, semantic domain, language, script, `en`/`id`, and evidence state. <!-- mw-todo:P15-003 -->
- [ ] Add language/script-aware preferred terms, aliases, grammatical metadata, and source-local identifiers without normalizing away meaningful distinctions. <!-- mw-todo:P15-004 -->
- [ ] Add transliteration records with scheme, version, source form, reversibility/lossiness, and provenance. <!-- mw-todo:P15-005 -->
- [ ] Add sourced etymology and historical-form assertions without treating reconstructed derivations as certain facts. <!-- mw-todo:P15-006 -->
- [ ] Add sourced definitions and usage notes scoped to work, passage, tradition, community, period, and language. <!-- mw-todo:P15-007 -->
- [ ] Add broader/narrower/related/contrasted-with/translated-as relations as provenance-bearing assertions rather than universal ontology edges. <!-- mw-todo:P15-008 -->
- [ ] Add contested, polysemous, homographic, obsolete, pejorative, reclaimed, and community-preferred term states with review notes. <!-- mw-todo:P15-009 -->
- [ ] Link sacred names, epithets, and titles to P13 entities only through sourced designation assertions; never merge entity identity from a name match. <!-- mw-todo:P15-010 -->
- [ ] Extract and review Quran/Islamic Arabic terms, divine names, roles, practices, and theological vocabulary from exact P12/P14 evidence. <!-- mw-todo:P15-011 -->
- [ ] Extract and review Hebrew/Aramaic Jewish terms, divine designations, offices, practices, and covenant/legal vocabulary from exact evidence. <!-- mw-todo:P15-012 -->
- [ ] Extract and review Greek/Latin/Syriac Christian terms, titles, offices, sacraments, and doctrinal vocabulary with source/community scope. <!-- mw-todo:P15-013 -->
- [ ] Extract and review Pali/Sanskrit Buddhist terms with school, canon, translation, and commentarial scope explicit. <!-- mw-todo:P15-014 -->
- [ ] Add Sanskrit and regional-language Hindu concept/name coverage without flattening deity, epithet, avatara, philosophical school, or practice distinctions. <!-- mw-todo:P15-015 -->
- [ ] Add Jain, Sikh, Baháʼí, Zoroastrian, Daoist, Confucian, and Shinto term/name lanes with native script and community scope. <!-- mw-todo:P15-016 -->
- [ ] Add rights- and consent-reviewed indigenous/local terminology metadata without publishing restricted names or meanings. <!-- mw-todo:P15-017 -->
- [ ] Add human-published English and Indonesian glosses/definitions as attributed expressions; machine glosses remain derived non-canonical candidates. <!-- mw-todo:P15-018 -->
- [ ] Add passage-level term occurrence and definition evidence linked to P12/P14 content without changing source text. <!-- mw-todo:P15-019 -->
- [ ] Add deterministic duplicate, spelling-variant, transliteration, homograph, and possible-concept-match reports without automatic merges. <!-- mw-todo:P15-020 -->
- [ ] Add terminology review workflow for community-preferred naming, deprecated labels, sensitive language, and disputed translations. <!-- mw-todo:P15-021 -->
- [ ] Add deterministic ingestion/count/checksum/rights/provenance and source-evidence tests for every P15 dataset. <!-- mw-todo:P15-022 -->
- [ ] Produce the P15 multilingual lexicon report and pass no-name-only-identity/no-translation-only-equivalence/no-unsourced-definition gates. <!-- mw-todo:P15-023 -->

**Exit gate:** P15 provides a multilingual, evidence-backed lexicon whose terms, concepts, names, entities, transliterations, and translations remain explicitly distinct and source-scoped.

## P16 — devotional, prayer, liturgy, and practice corpus

P16 expands sourced prayers and lived-practice material while separating text, performance, ritual description, and community claims. Policy is documented in [`docs/DEVOTIONAL_RITUAL_CORPUS_TARGETS.md`](docs/DEVOTIONAL_RITUAL_CORPUS_TARGETS.md).

- [ ] Define schemas/contracts for prayer, blessing, hymn, chant, mantra, creed, liturgy, ritual instruction, observance, and practice description. <!-- mw-todo:P16-001 -->
- [ ] Add a machine-readable P16 source registry and coverage matrix by tradition/community, genre, language, text/performance form, rights, and sensitivity state. <!-- mw-todo:P16-002 -->
- [ ] Require work/edition/citation/completeness/provenance/rights metadata for every complete devotional work and bounded excerpt. <!-- mw-todo:P16-003 -->
- [ ] Separate normative source text, descriptive practice metadata, commentary, performance recording, and participant/community assertions. <!-- mw-todo:P16-004 -->
- [ ] Add sensitivity and access states for public, community-contextual, initiatory, restricted, ceremonial, hazardous, and metadata-only material. <!-- mw-todo:P16-005 -->
- [ ] Audit and ingest rights-cleared Islamic dua, dhikr, salat wording, khutbah, and devotional-text candidates with school/source variation explicit. <!-- mw-todo:P16-006 -->
- [ ] Audit and ingest rights-cleared Jewish prayer, blessing, piyyut, and liturgical-order candidates with rite/community variants explicit. <!-- mw-todo:P16-007 -->
- [ ] Audit and ingest rights-cleared Christian prayers, creeds, hymns, lectionary/liturgy fragments, and denominational variants. <!-- mw-todo:P16-008 -->
- [ ] Audit and ingest rights-cleared Buddhist paritta, sutra chant, aspiration, dedication, liturgy, and meditation-manual excerpts with school scope. <!-- mw-todo:P16-009 -->
- [ ] Audit and ingest rights-cleared Hindu mantra, stotra, puja, vrata, and devotional hymn candidates with deity/sampradaya/source scope. <!-- mw-todo:P16-010 -->
- [ ] Audit and ingest Jain prayer/ritual, Sikh bani/ardas/kirtan, Baháʼí prayer, and Zoroastrian liturgical candidates under exact rights. <!-- mw-todo:P16-011 -->
- [ ] Audit Daoist, Confucian, Shinto, and East Asian ritual/devotional candidates with temple/school/community and language context. <!-- mw-todo:P16-012 -->
- [ ] Add indigenous/local/oral devotional discovery under consent-first policy; restricted performance text remains metadata-only unless explicitly permitted. <!-- mw-todo:P16-013 -->
- [ ] Model ritual/practice participants, roles, actions, sequence, objects, place, time, calendar, and community as sourced contextual assertions. <!-- mw-todo:P16-014 -->
- [ ] Add festival, fast, feast, pilgrimage, lifecycle rite, and observance entities with calendar-system and regional/community variation. <!-- mw-todo:P16-015 -->
- [ ] Add sacred object, symbol, garment, food, instrument, architecture, and material-culture links without assigning one universal meaning. <!-- mw-todo:P16-016 -->
- [ ] Add prayer/mantra/hymn citation adapters for line, stanza, refrain, verse, section, bead/count, service order, and performance segment. <!-- mw-todo:P16-017 -->
- [ ] Add human English and Indonesian translations as separate expressions linked to exact source segments and translator/edition rights. <!-- mw-todo:P16-018 -->
- [ ] Add textual and community variants without synthesizing a single normative prayer or ritual form. <!-- mw-todo:P16-019 -->
- [ ] Add audio/video/IIIF performance evidence with time/region/performer/community metadata and media rights. <!-- mw-todo:P16-020 -->
- [ ] Link P16 terms to P15 concepts and participants/communities to P13 entities through reviewed evidence. <!-- mw-todo:P16-021 -->
- [ ] Add deterministic alignment and gap reports across source, transliteration, `en`, and `id` devotional expressions. <!-- mw-todo:P16-022 -->
- [ ] Add safety and ethics review preventing canonical records from becoming unsourced ritual instructions or exposing restricted content. <!-- mw-todo:P16-023 -->
- [ ] Add deterministic ingestion/count/checksum/rights/provenance/sensitivity tests for every P16 dataset. <!-- mw-todo:P16-024 -->
- [ ] Produce the P16 devotional/practice report and pass no-unscoped-normativity/no-restricted-content/no-performance-as-text gates. <!-- mw-todo:P16-025 -->

**Exit gate:** P16 provides diverse, rights-safe devotional and practice data while preserving textual variants, community scope, performance boundaries, consent, and sensitivity controls.

## P17 — intertextual evidence and research graph

P17 connects P12–P16 through explainable, reviewable evidence rather than opaque similarity. Policy is documented in [`docs/INTERTEXTUAL_EVIDENCE_GRAPH_TARGETS.md`](docs/INTERTEXTUAL_EVIDENCE_GRAPH_TARGETS.md).

- [ ] Define typed contracts for mention, quotation, citation, allusion candidate, commentary target, parallel passage, motif, event, place, role, and transmission evidence. <!-- mw-todo:P17-001 -->
- [ ] Require every graph edge to expose source dataset/version, exact target/selector, method, assertion status, reviewer state, and provenance. <!-- mw-todo:P17-002 -->
- [ ] Define identity/equivalence/dependence guardrails: lexical or embedding similarity can create candidates but never canonical conclusions. <!-- mw-todo:P17-003 -->
- [ ] Add machine-readable graph-source registry and coverage matrix by edge type, tradition pair, language pair, evidence quality, and unresolved candidates. <!-- mw-todo:P17-004 -->
- [ ] Add deterministic mention extraction candidates linking P12/P14/P16 passages to P13 persons, traditions, places, and institutions. <!-- mw-todo:P17-005 -->
- [ ] Add exact quotation and explicit citation links where a source itself identifies the cited work/passage. <!-- mw-todo:P17-006 -->
- [ ] Add reviewed allusion/intertext candidates with confidence and scholarly provenance; never label model similarity as established allusion. <!-- mw-todo:P17-007 -->
- [ ] Add commentary/exegesis links from tafsir, midrash, commentary, scholia, and other interpretation datasets to exact target passages. <!-- mw-todo:P17-008 -->
- [ ] Add same-edition and cross-edition parallel-passage records with versification, boundary, omission, and addition gaps explicit. <!-- mw-todo:P17-009 -->
- [ ] Add narrative/event participation assertions linking persons, places, periods, and passages while preserving source disagreement. <!-- mw-todo:P17-010 -->
- [ ] Add genealogy, lineage, teacher/student, isnad, succession, and transmission links as source-scoped claims with uncertainty. <!-- mw-todo:P17-011 -->
- [ ] Add P15 concept/term occurrence, definition, translation, contrast, and semantic-shift evidence across passages and periods. <!-- mw-todo:P17-012 -->
- [ ] Add P16 prayer/ritual usage and adaptation links to source texts, concepts, communities, observances, and media evidence. <!-- mw-todo:P17-013 -->
- [ ] Add cross-tradition comparison records that state comparison dimensions and sources without asserting theological identity. <!-- mw-todo:P17-014 -->
- [ ] Represent negative, absent, unmatched, uncertain, disputed, superseded, and retracted graph findings explicitly. <!-- mw-todo:P17-015 -->
- [ ] Add claim-level confidence/assessment vocabulary that distinguishes source assertion, curator assessment, and automated candidate score. <!-- mw-todo:P17-016 -->
- [ ] Add graph reconciliation for duplicate edges, contradictory claims, citation aliases, selector drift, and dataset-version changes. <!-- mw-todo:P17-017 -->
- [ ] Add immutable graph snapshots with exact dependency versions and deterministic edge/checksum manifests. <!-- mw-todo:P17-018 -->
- [ ] Add explanation paths from any derived comparison or registry claim back to exact source artifact and passage evidence. <!-- mw-todo:P17-019 -->
- [ ] Add benchmark query fixtures for person→role→passage, term→concept→usage, prayer→source→community, and passage→commentary→citation. <!-- mw-todo:P17-020 -->
- [ ] Add precision-focused review samples for machine-assisted mention/allusion/parallel candidates across scripts and traditions. <!-- mw-todo:P17-021 -->
- [ ] Add deterministic graph validation for dangling references, dependency scope, cycles where prohibited, selector validity, and contradictory lifecycle states. <!-- mw-todo:P17-022 -->
- [ ] Add exportable research graph partitions without embedding generated summaries or model opinions as canonical facts. <!-- mw-todo:P17-023 -->
- [ ] Produce intertextual/reconciliation coverage reports showing both confirmed links and unresolved gaps. <!-- mw-todo:P17-024 -->
- [ ] Produce the P17 v0.1 report and pass no-opaque-edge/no-similarity-as-truth/no-untraceable-claim exit gates. <!-- mw-todo:P17-025 -->

**Exit gate:** P17 supplies a deterministic, explainable evidence graph in which every canonical link can be traced to exact data, method, provenance, and review state, including uncertainty and gaps.

## P10 — advanced profiles (after v0.1 proof)

- [x] Temporal/chronology profile with uncertainty/ranges/calendars. <!-- mw-todo:P10-001 -->
- [x] Geographical/place profile. <!-- mw-todo:P10-002 -->
- [x] Bibliographic profile. <!-- mw-todo:P10-003 -->
- [x] Manuscript/folio/line profile. <!-- mw-todo:P10-004 -->
- [x] IIIF artifact references. <!-- mw-todo:P10-005 -->
- [x] Media/audio/video selectors. <!-- mw-todo:P10-006 -->
- [x] Lineage/genealogy/transmission profile. <!-- mw-todo:P10-007 -->
- [x] Structured textual-variant apparatus. <!-- mw-todo:P10-008 -->
- [x] Scholarly bibliography/citation profile. <!-- mw-todo:P10-009 -->

## P11 — curation and collaboration

- [x] Design curator identity/review model. <!-- mw-todo:P11-001 -->
- [x] Design reconciliation workflow. <!-- mw-todo:P11-002 -->
- [x] Build `apps/studio` only after Git-based curation contracts are stable. <!-- mw-todo:P11-003 -->
- [x] Studio edits must generate reviewable dataset patches/PRs, not hidden database-only truth. <!-- mw-todo:P11-004 -->
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
