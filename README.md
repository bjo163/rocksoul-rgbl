# MoonWitness Corpus

MoonWitness Corpus is a public, provenance-first and evidence-aware corpus platform for religious texts, traditions, history, and comparative knowledge.

> Status: **v0.1 contract and supply-chain proof / unstable API**. P0–P7 are complete. P8 release infrastructure is implemented, while actual npm publication remains intentionally blocked until repository-wide code licensing and npm-scope authorization are resolved.

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
    npm registry publication           blocked by license/scope authorization
P9  MoonWitness adapter                next after a pinned public release exists
```

See [`docs/STATUS.md`](docs/STATUS.md) for the concise current snapshot. `TODO.md` is the canonical executable task state; `docs/ROADMAP.md` preserves the detailed architecture and milestone rationale.

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

## Roadmap and release docs

- [`TODO.md`](TODO.md) — canonical executable checklist and current task state.
- [`docs/STATUS.md`](docs/STATUS.md) — concise implementation/release snapshot.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — detailed milestone rationale and architecture plan.
- [`docs/PACKAGES.md`](docs/PACKAGES.md) — canonical package names, npm scope, and publication gate.
- [`docs/RELEASES.md`](docs/RELEASES.md) — version domains, release artifacts, checksums, and manual release workflow.

The remaining release path before P9 is intentionally narrow:

```text
select repository-wide code license
        ↓
confirm publish authority for @moonwitness npm scope
        ↓
create pinned corpus/package release
        ↓
publish + verify from a clean external consumer
        ↓
MoonWitness downstream adapter (P9)
```

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

No repository-wide data or code license has been selected yet. Do not add redistributed source text or binary artifacts unless their licensing/rights status is explicitly recorded. npm publication remains disabled until a code license and npm-scope authorization are deliberately resolved. See `LICENSES/README.md`.
