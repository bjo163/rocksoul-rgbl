# Public package contract

The canonical npm namespace for MoonWitness Corpus tooling is **`@moonwitness`**. Package names
deliberately keep the `corpus-` prefix so they remain unambiguous beside any future MoonWitness
engine packages.

## P8 target packages

| Package | Purpose |
| --- | --- |
| `@moonwitness/corpus-core` | Core record types, canonical IDs, deterministic-ID helpers, and runtime utilities |
| `@moonwitness/corpus-schema` | Spec constants plus packaged JSON Schema 2020-12 files |
| `@moonwitness/corpus-repository` | Repository/query interfaces and in-memory implementation |
| `@moonwitness/corpus-validator` | Schema, semantic, referential-integrity, source-rights, and profile validation |
| `@moonwitness/corpus-cli` | CLI for validate/checksum/ingest/get/search/passage operations |

The CLI also requires two public support packages:
`@moonwitness/corpus-node` and `@moonwitness/corpus-ingestion`.

Workspace `package.json` files remain optimized for monorepo development and can point at TypeScript
source. `pnpm release:prepare` creates isolated publication staging directories under
`dist/release/staging/`, compiles JavaScript plus declarations, rewrites `workspace:` dependencies
to exact package versions, and packs npm tarballs into `dist/release/packages/`.

`@moonwitness/corpus-schema` additionally ships the canonical `spec/v0.1/` tree inside its tarball;
JSON Schema remains the source of truth.

## Publication gate

Repository tooling can build and inspect publication tarballs today, but **npm publication is
intentionally disabled** in `release/package-contract.json` until both of these external/legal
conditions are satisfied:

1. a repository-wide code license is deliberately selected; and
2. publish permission for the `@moonwitness` npm scope is confirmed.

No license is inferred or silently selected by P8. When those conditions are resolved, enable the
gate in a reviewed PR and use the manual release workflow.
