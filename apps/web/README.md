# MoonWitness Corpus Explorer

Public Next.js App Router consumer for the canonical MoonWitness corpus.

## Data boundary

The web app never imports `datasets/**` files directly. Server Components open the corpus through `FileSystemCorpusRepository`, and all record lookup, search, citation lookup, dataset filtering, and assertion traversal use the repository contract from P6.

`spec/` and `datasets/` remain canonical. `.next/` and any web output are replaceable generated software artifacts.

## Routes

- `/datasets` — registry/catalog and dataset-version detail
- `/entity/:id` — entity detail with incoming/outgoing assertions
- `/resource/:id` — generic resource/work detail
- `/passage/:id` — textual passage reader with content representations
- `/assertion/:id` — claim, scope, evidence, provenance/source drill-down, assessments
- `/evidence/:id` — exact evidence target and selector
- `/provenance/:id` — source and derivation/acquisition activities
- `/search` — repository-backed corpus search
- `/graph/:id` — bounded relation traversal (depth 1–3, capped nodes/edges)
- `/compare` — side-by-side comparison that never infers identity/equivalence

All record pages expose canonical IDs plus their dataset and spec versions.

## Local development

From the repository root:

```sh
pnpm install
pnpm --filter @moonwitness/corpus-web dev
```

The server locates `datasets/registry.json` from the monorepo root. Set `MOONWITNESS_CORPUS_ROOT` explicitly when running from a non-standard working directory.
