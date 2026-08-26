# Repository, query, and derived-build layer

P6 introduces a read/query boundary between canonical dataset packs and applications.

## Package boundaries

- `@moonwitness/corpus-repository` defines the platform-neutral `CorpusRepository` contract, in-memory implementation, dataset dependency resolver, canonical lookup, generic textual-reference lookup, assertion/evidence traversal, scope filtering, and deterministic search semantics.
- `@moonwitness/corpus-node` implements the Node.js filesystem/JSONL repository. Applications do not read `datasets/**` directly.
- `@moonwitness/corpus-build` consumes only `CorpusRepository` and produces disposable aggregate artifacts under `dist/`.

The canonical source of truth remains `spec/` + `datasets/`. `dist/` can always be deleted.

## Dataset loading

The filesystem repository reads `datasets/registry.json`, each registered `manifest.json`, and declared JSONL partitions. It rejects registry/manifest ID mismatch, duplicate canonical record IDs, partition record-type mismatch, empty partition globs, and paths that escape the repository/dataset root.

Dataset dependencies are exact-version dependencies. Resolution is deterministic and topological, and fails on missing versions or cycles.

## Query semantics

Canonical ID lookup uses one global record index. Passage lookup is citation-scheme based rather than scripture-specific: callers provide a reference and may additionally constrain scheme, container, unit, or dataset.

Assertion query filters support subject, predicate, object entity, dataset, and the universal descriptive scope dimensions (`tradition`, `community`, `agent`, `period`, `place`). Scope filters do not imply normative authority.

Assertion/evidence traversal returns the assertion, referenced Evidence records, and each evidence target as distinct records. It never collapses those layers into a single "fact".

## Derived artifacts

`pnpm build` reconstructs:

- `dist/catalog.json` — dataset registry/versions/profile metadata plus deterministic counts;
- `dist/records.jsonl` — globally sorted canonical records for read-only distribution/indexing;
- `dist/search-index.jsonl` — deterministic derived search documents;
- `dist/build-manifest.json` — SHA-256 and byte size for the derived files.

All JSON object keys and record order are deterministic. Build timestamps are deliberately omitted so identical canonical inputs produce identical output bytes.

## SQLite / DuckDB / Parquet

P6 does **not** add SQLite, DuckDB, or Parquet because no current consumer requires them. If added later, they must be projections generated from `CorpusRepository`, live under disposable output such as `dist/`, and never become canonical storage or a prerequisite for validating/consuming dataset packs.

## Rebuild invariant

The supported invariant is:

```sh
rm -rf dist
pnpm build
```

A clean rebuild must reconstruct all derived artifacts without network access and without mutating canonical dataset packs.
