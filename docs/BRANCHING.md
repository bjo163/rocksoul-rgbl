# Branching Contract

This repository uses exactly two canonical remote branches:

```text
main  ← stable / release
dev   ← all development
```

## Rules

- All implementation, research data, schemas, docs, CI and maintenance work lands in `dev`.
- `main` is stable/release only.
- Release promotion is `dev → main`.
- Do not create persistent remote `feature/*`, `fix/*`, `hotfix/*`, `release/*`, `chore/*`, `experiment/*`, `agent/*`, or `phase*` branches.
- Temporary local branches are allowed but must not become canonical remote branches.
- Emergency fixes are made on `dev`, verified, then promoted to `main`.
- Release automation may create tags/releases, never additional branches.
- The branch-policy workflow deletes noncanonical remote branches.

If an older document or inherited workflow describes another branching model, this file wins.
