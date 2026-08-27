# Contributing

MoonWitness Corpus treats data changes as reviewable scholarly/software artifacts.

## Rules for v0.1

1. Do not add a domain-specific field to the core schema when the concept can be represented as an entity, assertion, vocabulary term, or profile extension.
2. Do not use database IDs as canonical identifiers.
3. Do not add redistributed source text without explicit provenance and rights/license metadata.
4. Do not convert uncertainty, disagreement, or community-specific positions into unqualified booleans.
5. Machine-derived records must retain derivation/provenance and must not silently replace source-preserving records.
6. Generated indexes, embeddings, database projections, and build artifacts are not canonical source data.

Run `pnpm check` before opening a pull request.

See [`docs/CURATION_WORKFLOWS.md`](docs/CURATION_WORKFLOWS.md) for the curator/reviewer roles, source and rights review, evidence review, reconciliation policy, and dataset authoring checklist.
