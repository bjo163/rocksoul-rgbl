# MoonWitness Corpus

MoonWitness Corpus is a public, provenance-first and evidence-aware corpus platform for religious texts, traditions, history, and comparative knowledge.

This repository is intended to provide:

- a stable, technology-neutral corpus specification;
- versioned canonical datasets with explicit provenance and licensing;
- reusable TypeScript packages for validation, loading, querying, and tooling;
- applications for exploring and curating corpus data;
- a clean upstream data source that MoonWitness can consume through an adapter.

> Status: early v0.1 bootstrap. The specification and core schemas are not yet stable.

## Core principles

1. Canonical corpus data is independent from MoonWitness ORM/database internals.
2. Assertions are contextual claims, not unqualified global facts.
3. Evidence, source, provenance, and assessment are separate concepts.
4. Stable semantic identifiers are independent from database IDs.
5. Religion- or tradition-specific concepts are data/profile extensions, not hard-coded core schema assumptions.
6. Engine policy, embeddings, search indexes, and AI-derived projections are downstream concerns, not canonical corpus truth.

## Repository model

```text
spec/       corpus contract and schemas
datasets/   canonical datasets
packages/   reusable software
apps/       executable products
ingestion/  reproducible source-to-corpus recipes
```

The initial implementation will use JSON/JSONL, JSON Schema 2020-12, TypeScript, pnpm, Turborepo, SHA-256 integrity checks, and Git-based versioning.
