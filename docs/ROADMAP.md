# MoonWitness Corpus — Implementation Roadmap

Status: working roadmap for the v0.x development line.

The short checkbox list lives in [`../TODO.md`](../TODO.md). This document explains **why the order matters, what each phase must produce, what is intentionally deferred, and how the public corpus repository eventually connects to MoonWitness**.

---

## 1. Target architecture

MoonWitness Corpus is intended to become five things without collapsing them into one layer:

```text
                           PUBLIC SOURCE ECOSYSTEM
                                   │
                                   ▼
                             ingestion recipes
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         moonwitness-corpus                          │
│                                                                     │
│  spec/        universal contracts                                   │
│  datasets/    canonical versioned data                              │
│  packages/    reusable software                                     │
│  apps/        explorer / future studio                              │
│  ingestion/   reproducible source-to-corpus transformations         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                       released/pinned contract
                               │
               ┌───────────────┴────────────────┐
               ▼                                ▼
       public consumers                     MoonWitness
       researchers/tools                 downstream adapter
                                                │
                                                ▼
                                           @moon/orm
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          ▼                     ▼                     ▼
                      PostgreSQL             search                graph/AI
```

### Stable boundary

The most important architectural boundary is:

```text
CANONICAL CORPUS                         DOWNSTREAM RUNTIME
────────────────                         ──────────────────
source descriptions                      database IDs
canonical text/resources                 ORM fields
assertions                               engine policy
exact evidence                           ranking
provenance                               embeddings
rights                                   vector indexes
stable semantic IDs                      caches
versioned datasets                       AI summaries
```

A runtime artifact must be rebuildable from released corpus inputs. It must not become the only surviving copy of canonical knowledge.

---

## 2. Development principles

These rules should be treated as architecture constraints rather than preferences.

### 2.1 Core remains universal

The core must not contain closed universal enums such as:

```text
PROPHET | IMAM | SAINT | RABBI | BODHISATTVA | ...
```

Those are concepts/roles represented in data and scoped assertions.

The universal core remains centered on:

```text
Entity
Resource
Assertion
Evidence
Provenance
Assessment
```

Profiles may add structural records for a domain such as text, manuscript, geography, or chronology.

### 2.2 Structural metadata is not automatically a world claim

Examples of structural metadata:

```text
passage parent
sequence number
language
script
artifact checksum
edition identifier
```

Examples of claims that generally require assertion/evidence semantics:

```text
person X has religious role Y
person X is parent of person Y
historical event X occurred at place Y
community X treated work Y as canonical
```

Do not convert every database relationship into an assertion, and do not hide contestable world claims as plain structural fields.

### 2.3 Corpus policy and engine policy are separate

The corpus may record that a community/source regards a work as authoritative. The corpus must not globally assign a normative rank that every consumer is required to adopt.

MoonWitness may define engine profiles such as a normative religious mode, historical-critical mode, comparative mode, or other policy. Those policies belong downstream.

### 2.4 Missing is not false

Absence of an assertion means the corpus does not currently contain that assertion. It is not a negative fact.

Systems consuming the corpus must distinguish at least conceptually:

```text
unknown
not recorded
not applicable
explicitly denied
contested
```

### 2.5 Generated data is never silently promoted

Machine extraction, embeddings, similarity, LLM summaries, entity candidates, and generated links must be identifiable as derived output with provenance if they are stored at all.

Similarity must never directly create strict identity.

---

## 3. Critical path

The project should follow this dependency order:

```text
M0 Foundation
     │
     ▼
M1 Core contract stabilization
     │
     ▼
M2 Textual profile
     │
     ├───────────────┐
     ▼               ▼
M3 Provenance/rights M4 Ingestion framework
     │               │
     └───────┬───────┘
             ▼
M5 Two real dataset proofs
             │
             ▼
M6 Repository/query/build layer
             │
      ┌──────┴─────────┐
      ▼                ▼
M7 Public web       M8 Packages/releases
                       │
                       ▼
                 M9 MoonWitness adapter
                       │
                       ▼
              M10 advanced profiles
                       │
                       ▼
                  M11 Studio
```

The web application can begin visually earlier, but its real data access layer should wait for the repository/query contracts to stabilize.

---

# Milestone 0 — Foundation

**Status:** substantially complete.

### Purpose

Create a clean public monorepo and prove the basic serialization/validation loop.

### Delivered

- pnpm workspace and Turborepo baseline;
- separation of `spec/`, `datasets/`, `packages/`, `apps/`, and `ingestion/`;
- six core record families;
- JSON Schema Draft 2020-12 schemas;
- synthetic fixture;
- dataset manifest and partitions;
- JSONL/schema/duplicate-ID validation;
- CI;
- architecture decision records.

### Gate

```bash
pnpm check
```

must pass on the repository from a clean checkout.

---

# Milestone 1 — Stabilize core contract

**Priority:** highest next step.

This phase should happen before adding real religious datasets. Otherwise real data will force ad-hoc schema decisions that become hard to undo.

## Step 1.1 — Canonical identifier grammar

Define the grammar and lifecycle of IDs.

Recommended conceptual forms:

```text
mw:person:musa
mw:place:jerusalem
mw:concept:prophet
mw:work:quran
mw:passage:quran:2:255
mw:source:example-edition
```

Generated/anonymous records may use deterministic content-derived IDs where appropriate.

### Decide

- allowed characters;
- namespace ownership;
- whether IDs are case-sensitive;
- whether slugs may ever be renamed;
- deterministic hashing rules;
- how deprecated IDs redirect to replacements;
- internal ID vs public Web URI relationship.

### Required output

```text
spec/v0.1/identifiers.md
packages/core/src/identifiers/*
validator ID checks
valid + invalid fixtures
```

### Acceptance

The same logical record imported twice must resolve to the same canonical identity without depending on a database-generated integer.

---

## Step 1.2 — Alias and external identifier model

Keep three things separate:

```text
canonical ID
human label / alias
external identifier
```

Example:

```text
canonical: mw:person:...
label:     localized human-readable name
external:  identifier from a catalog/source namespace
```

Two similar external identifiers or aliases must not automatically prove identity.

---

## Step 1.3 — Cross-dataset references

Define how dataset A may refer to a record owned by dataset B.

Requirements:

- explicit dataset dependency declaration;
- deterministic dependency resolution;
- no hidden dependence on repository directory traversal;
- validator catches dangling references;
- optional dependencies distinguished from required dependencies.

This is required before historical/entity datasets can safely reference textual datasets.

---

## Step 1.4 — Assertion object model

Stabilize:

```text
subject
predicate
object entity OR literal value
scope
assertion class
evidence
provenance
```

`scope` must be capable of expressing contextual viewpoints without requiring all fields:

```text
tradition
community
agent
period
place
```

Do not assume that every assertion has a single religion field.

---

## Step 1.5 — Assessment semantics

An assessment is an evaluation of another record, not a replacement for that record.

It should be able to represent:

```text
target
assessor
method
result
confidence if the method produces one
rationale/evidence
provenance
```

This makes confidence contextual instead of universal.

---

## Step 1.6 — Semantic validator

JSON Schema answers “is this shaped correctly?” It cannot enforce all corpus invariants.

Add semantic checks for:

- dangling references;
- duplicate IDs;
- invalid self-reference where forbidden;
- dependency violations;
- assertion object envelope constraints;
- invalid evidence targets;
- invalid scope references;
- deterministic ID mismatch where applicable.

### M1 exit criteria

Do not move to real datasets until:

1. ID grammar is documented;
2. references resolve predictably;
3. assertions and assessments are stable;
4. invalid fixtures prove the validator rejects known failure modes.

---

# Milestone 2 — Textual profile v0.1

This is the first major profile because scripture, commentary, prayers, philosophical works, letters, oral-transmission records, hymns, and many other religious resources ultimately need robust text representation.

## Step 2.1 — Work

Represents an abstract intellectual/textual work rather than one downloaded file.

Examples can include a canonical text, commentary, treatise, prayer collection, hymn collection, or other work without baking those religious categories into core.

## Step 2.2 — Expression

Represents a language/redaction/recension/translation-level realization of a work.

Needs to support relationships such as:

```text
translation_of
recension_of
revision_of
derived_from
```

without claiming all traditions conceptualize texts identically.

## Step 2.3 — Edition

Represents a defined published/editorial edition.

Potential metadata:

```text
edition label
publisher/editor
publication date
source identifiers
rights
revision
```

## Step 2.4 — Artifact

Represents a retrievable digital/physical representation or descriptor.

At minimum:

```text
media type
size when known
SHA-256 when bytes are pinned
locations
availability
rights
```

The Git repository does not have to contain the binary itself.

## Step 2.5 — Passage hierarchy

Do not hard-code `book/chapter/verse` or `surah/ayah` as the universal shape.

Support arbitrary-depth paths such as:

```text
surah → ayah
book → chapter → verse
chapter → stanza
volume → discourse → paragraph
tractate → section
folio → side → line
```

A passage should preserve:

```text
parent
sequence
local reference segment
canonical reference
citation scheme
```

## Step 2.6 — Content

Actual language/script-specific textual content should be separate from Passage structure.

This permits:

```text
source text
translation A
translation B
transliteration
normalized representation
search representation
```

without adding one database column per language.

## Step 2.7 — Citation scheme

A citation path must be machine-readable, not only a display string.

Conceptually:

```json
{
  "path": [
    { "type": "chapter", "value": "3" },
    { "type": "verse", "value": "16" }
  ],
  "display": "3:16"
}
```

Different works may define different path segment types.

## Step 2.8 — Alignment

Support non-identity links between textual segments, for example translation alignment or parallel passage alignment.

Alignment must not imply theological equivalence or exact semantic identity unless explicitly asserted and supported.

## Step 2.9 — Variant apparatus

Design minimal support for multiple readings/witnesses without choosing one universal string as the only truth.

This can remain minimal in v0.1 but the schema must leave room for it.

### M2 exit criteria

Create synthetic fixtures demonstrating at least two distinct citation structures. The same core/profile should represent both without religion-specific schema changes.

---

# Milestone 3 — Provenance, rights, sources, artifacts

Real corpus data is not ready until its lineage and rights are known.

## Step 3.1 — Source identity

Capture what the source actually is:

```text
publisher/institution
dataset/edition name
revision
canonical URL or catalog identifier
language/script
technical availability
```

Do not store downstream normative policy here.

## Step 3.2 — Provenance chain

A normalized record should be traceable through something conceptually equivalent to:

```text
source artifact
     ↓
fetch/acquisition activity
     ↓
parser
     ↓
normalizer
     ↓
curation activity if any
     ↓
canonical record
```

Preserve versions of processing software.

## Step 3.3 — Rights model

A repository being public does not mean all source content is redistributable.

At minimum support:

```text
bundled
external
metadata_only
restricted
```

Use machine-readable SPDX-style expressions where applicable and source-specific `LicenseRef-*` when necessary.

## Step 3.4 — Artifact integrity

Use SHA-256 for pinned byte artifacts.

Timestamps or operational metadata must not accidentally change deterministic normalized checksums.

### M3 exit criteria

For every bundled real-text record we can answer:

> What exact source/edition/artifact did it come from, what rights permit this use, and what processing produced this representation?

---

# Milestone 4 — Reproducible ingestion framework

Ingestion should be explicit tooling, not production runtime magic.

## Step 4.1 — Recipe contract

Each source-specific recipe owns its parsing details.

Proposed layout:

```text
ingestion/
└── recipes/
    └── <recipe-id>/
        ├── README.md
        ├── recipe.json
        ├── fetch.ts
        ├── parse.ts
        ├── normalize.ts
        ├── map.ts
        ├── validate.ts
        └── fixtures/
```

Do not create one parser containing large `if (source === ...)` chains.

## Step 4.2 — Acquisition

Explicit ingestion commands may access upstream sources. Released corpus consumers should not need to.

## Step 4.3 — Raw verification

When bytes are pinned:

```text
fetch
 ↓
raw artifact
 ↓ SHA-256 verify
parse
```

Unexpected bytes must fail before normalization.

## Step 4.4 — Deterministic normalization

The law should be:

```text
same raw artifact
+ same parser version
+ same normalization version
= byte-for-byte equivalent normalized canonical output
```

## Step 4.5 — Curation overlays

Human corrections/reconciliation should be reviewable records or patches, not unexplained manual edits to generated output.

Track:

```text
operation
original/source value
target/corrected value
reason
curator
evidence/provenance
date/revision
```

## Step 4.6 — CLI

Eventually support commands conceptually like:

```bash
corpus validate
corpus inspect <id>
corpus ingest <recipe>
corpus checksum
corpus build
corpus export
```

### M4 exit criteria

A pinned source recipe can reproduce a validated dataset release and demonstrate idempotency.

---

# Milestone 5 — Two real dataset proofs

Do not call the universal model proven after only one tradition.

## Dataset A

A first textual dataset should be useful to MoonWitness. Quran is a natural candidate, but only a source/edition/translation with confirmed rights may be bundled.

Tasks:

1. choose exact source and edition;
2. record language/script;
3. audit redistribution rights;
4. pin source revision/artifact checksum;
5. write ingestion recipe;
6. normalize passages/content;
7. validate counts/references;
8. release dataset version.

## Dataset B

Choose a source from a substantially different tradition **and** textual organization. Prefer open/public-domain data to minimize licensing ambiguity.

The purpose is not broad content coverage yet. The purpose is to stress the model.

### Universality test

The second dataset must not cause us to add fields like:

```text
is_prophet
hadith_number
quran_surah
bible_book
```

to universal core records.

If tradition-specific structure is genuinely needed, it belongs in a profile or vocabulary.

### M5 exit criteria

Both datasets validate with the same core contracts, and the design review finds no hidden tradition-specific assumptions in core.

---

# Milestone 6 — Repository, query, and derived build layer

Applications must not read `datasets/**` with hard-coded paths.

## Repository abstraction

Target contract family:

```text
CorpusRepository
├── getEntity
├── getResource
├── getAssertion
├── getEvidence
├── getPassage
├── listDatasets
├── resolveReference
└── query/search
```

Implementations may include:

```text
MemoryCorpusRepository      tests
FileSystemCorpusRepository  CLI/local development
GeneratedCorpusRepository   static artifacts
HttpCorpusRepository        browser/API client
MoonOrmCorpusRepository     downstream MoonWitness repository
```

The last implementation belongs in the MoonWitness adapter, not this core repository.

## Derived build artifacts

Potential outputs:

```text
dist/catalog/
dist/search/
dist/sqlite/
dist/parquet/
dist/jsonld/
dist/checksums/
```

All must be disposable:

```bash
rm -rf dist
pnpm build
```

must reconstruct them from canonical inputs.

### M6 exit criteria

CLI/tests/web access data through repository/query contracts rather than filesystem knowledge.

---

# Milestone 7 — Public Corpus Explorer

`apps/web` becomes a product for inspecting the corpus, not the canonical storage layer.

## Phase 7A — basic explorer

Routes should eventually cover:

```text
/
/datasets
/datasets/[id]
/entities/[...id]
/resources/[...id]
/texts/[work]/[[...reference]]
/assertions/[...id]
/evidence/[...id]
/sources/[...id]
/search
```

## Phase 7B — evidence navigation

The key UX is:

```text
claim/assertion
      ↓
exact evidence
      ↓
passage/content
      ↓
edition/source
      ↓
provenance
      ↓
dataset release/spec version
```

That trace is more important than decorative graph visualizations.

## Phase 7C — comparison

Comparison UI must preserve:

- source boundaries;
- tradition/community/agent scope;
- edition differences;
- evidence relation type;
- uncertainty/disagreement.

It must not flatten “similar passages” into “same claim”.

## Phase 7D — graph

Graph traversal should be bounded and explain edge semantics. Strict identity should be visibly distinct from related/parallel/close-match relations.

### M7 exit criteria

A public user can trace a displayed assertion to exact evidence and provenance without needing database knowledge.

---

# Milestone 8 — Packages and release discipline

The repository should be consumable as software without forcing datasets into `node_modules`.

## Package families

Likely public package surface:

```text
@moonwitness/corpus
@moonwitness/corpus-core
@moonwitness/corpus-schema
@moonwitness/corpus-repository
@moonwitness/corpus-validator
@moonwitness/corpus-cli
```

Additional packages such as Node/browser/react helpers should be created only when duplication justifies them.

## Four version dimensions

Do not collapse these versions:

```text
spec version      contract compatibility
package version   software implementation
 dataset version  content changes
corpus release    aggregate/pinned release set
```

A CLI bugfix should not force a dataset version change. A dataset correction should not require a new schema version unless the contract changed.

## Dataset distribution

Large datasets should not automatically become npm packages.

Use combinations of:

- checked-in JSONL where reasonable;
- GitHub Releases;
- object storage;
- institution-hosted artifacts;
- integrity hashes and manifests.

### M8 exit criteria

External consumers can install the SDK independently and resolve a specific dataset release by manifest/version.

---

# Milestone 9 — MoonWitness adapter

This phase happens primarily in the `moonwitness` repository.

Recommended package:

```text
moonwitness/
└── packages/
    └── moon-witness-corpus-adapter/
```

## Mapping responsibilities

```text
Corpus Entity            → wx.entity
labels                    → wx.entity.alias
identifiers               → wx.entity.identifier
Assertion                 → wx.assertion
source/resource metadata  → wx.source
Provenance                → wx.provenance
textual Passage           → generalized passage model
Content                   → wx.content
Dataset manifest          → runtime source-manifest/audit model
Assessment                → appropriate assessment/Mizan projection
```

## Explicit non-mapping

Corpus data must not directly define:

```text
wx.source.policy normative ranking
AI answer policy
embedding model
retrieval ranking
runtime confidence cache
```

Those are consumer policies.

## Import properties

Import must be:

```text
pinned
transactional
idempotent
replayable
auditable
```

The corpus semantic ID maps to application canonical keys; database integer IDs remain internal.

### M9 exit criteria

A clean MoonWitness installation can rebuild the relevant domain state from a pinned corpus release without live calls to upstream religious-text APIs.

---

# Milestone 10 — Advanced profiles

Only add these after the textual/core model survives real data.

## Temporal

Support:

```text
exact
approximate
uncertain
range
before/after
original calendar expression
normalized conversion
```

## Geographical

Places, historical names, coordinates when justified, external gazetteer identifiers, and assertion-based historical associations.

## Manuscript

Support manuscript/shelfmark/folio/surface/line and external IIIF references where available.

## Media

Image region, audio/video time ranges, and external artifact descriptors.

## Lineage

Genealogy, teaching lineages, transmission chains, ordered relationships, and source-scoped assertions.

## Bibliographic

Structured scholarly citations and publication metadata.

### M10 exit criteria

Each profile has its own fixtures and does not enlarge universal core merely for convenience.

---

# Milestone 11 — Corpus Studio and contributor workflows

Do not build Studio as a database admin panel.

The desired workflow is:

```text
curator action
     ↓
validated corpus patch
     ↓
Git branch / PR
     ↓
review
     ↓
canonical merge
```

Potential capabilities:

- entity reconciliation;
- source registration;
- rights review;
- evidence annotation;
- assertion review;
- duplicate resolution;
- textual correction overlays;
- dataset authoring;
- preview validator output.

The canonical audit trail remains Git + provenance records.

---

## 4. Immediate execution order

If one developer is working sequentially, use this order for the next implementation cycle:

1. Write `spec/v0.1/identifiers.md`.
2. Implement canonical ID parser/formatter/tests.
3. Define dataset dependency/reference rules.
4. Extend validator for dangling/cross-dataset references.
5. Stabilize Assertion object/literal/scope semantics.
6. Stabilize Assessment semantics.
7. Add comprehensive invalid core fixtures.
8. Create textual profile directory and profile manifest/contract.
9. Implement Work + Expression schemas.
10. Implement Edition + Artifact schemas.
11. Implement Passage + Citation schemas.
12. Implement Content schema.
13. Implement Alignment + minimal Variant schemas.
14. Add two structurally different synthetic textual fixtures.
15. Extend validator for passage hierarchy/citation rules.
16. Finalize source/provenance/rights fields required for real content.
17. Define ingestion recipe schema and interfaces.
18. Build first source-specific ingestion recipe.
19. Select and build second tradition dataset.
20. Run a schema-universality review before declaring v0.1 profile stable.

Only after these steps should major effort move into public search/graph UI or MoonWitness ORM integration.

---

## 5. Suggested GitHub issue breakdown

When converting this roadmap into issues, keep issues small enough to review independently.

Suggested prefixes:

```text
SPEC      contract/schema changes
VALIDATE  validation/invariants
INGEST    acquisition/parsing/normalization
DATA      dataset work
SDK       packages/repository/query
WEB       public explorer
RELEASE   packaging/versioning
DOCS      documentation/governance
INTEGRATE MoonWitness downstream integration
```

Examples:

```text
SPEC: Define canonical identifier grammar
VALIDATE: Resolve cross-dataset references
SPEC: Add textual Work and Expression records
SPEC: Add arbitrary-depth Passage citation model
INGEST: Define recipe manifest contract
DATA: Audit redistribution rights for first Quran source
DATA: Add second non-Abrahamic textual proof dataset
SDK: Implement FileSystemCorpusRepository
WEB: Add assertion → evidence provenance view
INTEGRATE: Map corpus canonical IDs to wx.entity
```

---

## 6. What not to build yet

These are intentionally deferred until the canonical contracts are proven:

- production vector database;
- embeddings checked into canonical datasets;
- universal AI summaries;
- generic `trust_score` on sources;
- a giant ontology of every religious role;
- full RDF/OWL authoring workflow;
- database-first canonical storage;
- large binary artifact mirroring without rights/storage policy;
- curation Studio that bypasses Git review;
- complex graph visualization before evidence navigation works;
- production MoonWitness imports before dataset releases are pinned and reproducible.

---

## 7. v0.1 readiness definition

The v0.1 corpus specification/profile should not be called ready until all of the following are true:

- core ID/reference semantics are documented and validated;
- core records remain tradition-neutral;
- textual profile represents at least two substantially different textual structures;
- evidence can target exact textual fragments;
- provenance traces real records to exact source artifacts/editions;
- bundled real content has explicit rights metadata;
- at least two real datasets from different traditions pass validation;
- ingestion for those datasets is deterministic or clearly documents non-reproducible external limitations;
- derived search/database artifacts can be deleted and rebuilt;
- no application database ID appears as canonical identity;
- MoonWitness engine policy remains outside canonical corpus truth;
- CI rejects known structural, referential, provenance, and licensing failures.

At that point, v0.1 is not “finished religious knowledge.” It is a stable **contract and supply chain** on which much larger religious and historical corpora can safely grow.
