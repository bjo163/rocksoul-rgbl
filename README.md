# MoonWitness Corpus

MoonWitness Corpus is a public, provenance-first and evidence-aware corpus platform for religious texts, traditions, history, and comparative knowledge.

> Status: **v0.1 contract and supply-chain proof / unstable API**. P0–P7 are complete. P8 release infrastructure is implemented. **P12 Foundation Text Corpus expansion is the current execution priority**, while npm publication and P9–P11 feature/integration work are intentionally deferred.

## Architecture

```text
spec/       technology-neutral corpus contract and schemas
datasets/   canonical, versioned knowledge datasets
packages/   reusable SDK, repository, validation and CLI software
apps/       executable products such as the Corpus Explorer
ingestion/  reproducible source-to-corpus recipes
release/    package/version/publication contracts
```

The canonical corpus is intentionally independent from MoonWitness ORM/database internals. MoonWitness consumes released corpus data through a downstream adapter.

## Current implementation state

The authoritative branch is `main`. The implementation through the public Corpus Explorer and deterministic release-bundle pipeline is merged there.

```text
P0  Foundation                         complete
P1  Core contract                      complete
P2  Textual profile                    complete
P3  Provenance / rights                complete
P4  Reproducible ingestion             complete
P5  Two real cross-tradition proofs    complete
P6  Repository / query / build         complete
P7  Public Corpus Explorer             complete
P8  Release infrastructure             complete
    npm registry publication           deferred / license+scope blocked
P12 Foundation Text Corpus expansion   CURRENT PRIORITY
P9  MoonWitness adapter                deferred until data/release baseline is ready
P10 Advanced profiles                  deferred
P11 Curation / collaboration           deferred
```

See [`docs/STATUS.md`](docs/STATUS.md) for the concise current snapshot and [`docs/DATASET_TARGETS.md`](docs/DATASET_TARGETS.md) for the approved source/target plan. `TODO.md` is the canonical executable task state; `docs/ROADMAP.md` preserves the detailed architecture and milestone rationale.

## Core model

The v0.1 core is deliberately small:

- **Entity** — a stable identity for something discussed by the corpus.
- **Resource** — a text, work, edition, artifact, dataset, media object, or other information resource.
- **Assertion** — a contextual claim connecting a subject, predicate, and object/value.
- **Evidence** — a precise support/contradiction/mention target within a resource.
- **Provenance** — where a record came from and how it was produced.
- **Assessment** — an agent/method evaluation of another record; confidence is not global truth.

Religion- or tradition-specific concepts are represented as data and profiles, not hard-coded as universal core fields.

## Technical baseline

- JSON / JSONL canonical serialization
- JSON Schema Draft 2020-12
- stable semantic IDs (`mw:...`), independent from database IDs
- TypeScript tooling on Node.js 20+
- pnpm workspaces + Turborepo
- SHA-256 integrity model
- Git-based review and release history
- deterministic derived corpus and release artifacts

## Roadmap and data/release docs

- [`TODO.md`](TODO.md) — canonical executable checklist and current task state.
- [`docs/STATUS.md`](docs/STATUS.md) — concise implementation/release snapshot.
- [`docs/DATASET_TARGETS.md`](docs/DATASET_TARGETS.md) — current Foundation Text Corpus targets, exact source lanes, rights boundaries, and exit gate.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — detailed milestone rationale and architecture plan.
- [`docs/PACKAGES.md`](docs/PACKAGES.md) — canonical package names, npm scope, and publication gate.
- [`docs/RELEASES.md`](docs/RELEASES.md) — version domains, release artifacts, checksums, and manual release workflow.

The current data-first execution path is:

```text
coverage/completeness inventory
        ↓
verify existing Quran Arabic baseline
        ↓
complete Dhammapada English + legally audit Pali root
        ↓
OSHB/WLC Hebrew + separate morphology
        ↓
SBLGNT v1.2 Greek
        ↓
WEB Classic 2020 English
        ↓
explicit passage alignments
        ↓
SuttaCentral DN/MN/SN/AN English expansion
        ↓
Foundation Text Corpus completeness/rights/reproducibility gate
```

Only after that data baseline is strong do we return to npm publication and the MoonWitness adapter.

## Development

```bash
corepack enable
pnpm install
pnpm check
```

`pnpm check` performs TypeScript checking, tests, corpus/schema validation, deterministic derived builds, and deterministic release-bundle verification.

To inspect release artifacts without publishing anything:

```bash
pnpm build
pnpm release:prepare
```

Generated artifacts under `dist/` are disposable and must be reproducible from canonical inputs.

## Licensing

No repository-wide data or code license has been selected yet. Do not add redistributed source text or binary artifacts unless their licensing/rights status is explicitly recorded. Dataset-specific rights remain first-class and are evaluated independently from the repository code-license question. npm publication remains disabled until a code license and npm-scope authorization are deliberately resolved. See `LICENSES/README.md`.
