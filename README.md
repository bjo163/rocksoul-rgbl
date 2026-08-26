# MoonWitness Corpus

MoonWitness Corpus is a public, provenance-first and evidence-aware corpus platform for religious texts, traditions, history, and comparative knowledge.

> Status: **v0.1 foundation / unstable**. Core contracts may still change before the first stable corpus release.

## Architecture

```text
spec/       technology-neutral corpus contract and schemas
datasets/   canonical, versioned knowledge datasets
packages/   reusable SDK, repository, validation and CLI software
apps/       executable products such as the future corpus explorer
ingestion/  reproducible source-to-corpus recipes
```

The canonical corpus is intentionally independent from MoonWitness ORM/database internals. MoonWitness consumes released corpus data through a downstream adapter.

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

## Roadmap

Development is intentionally staged so that real datasets, the public web explorer, package releases, and MoonWitness ORM integration do not outrun the canonical corpus contract.

- [`TODO.md`](TODO.md) — short executable checklist for the current development cycle.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — detailed milestones, dependencies, acceptance criteria, integration path, and v0.1 readiness definition.

The immediate critical path is:

```text
core contract
    ↓
textual profile
    ↓
provenance + rights + ingestion
    ↓
two real cross-tradition dataset proofs
    ↓
repository/query layer
    ↓
web explorer + package releases
    ↓
MoonWitness downstream adapter
```

## Development

```bash
corepack enable
pnpm install
pnpm check
```

`pnpm check` currently performs TypeScript checking and corpus/schema validation.

## Licensing

No repository-wide data license has been selected yet. Do not add redistributed source text or binary artifacts unless their licensing/rights status is explicitly recorded. See `LICENSES/README.md`.
