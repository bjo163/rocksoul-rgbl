# ADR-0006: Universal Upstream System Registry and Ingestion Recipes

## Status
Accepted

## Context
Across world religious traditions (Islam, Judaism, Christianity, Hinduism, Buddhism, Daoism, Confucianism, Zoroastrianism, Sikhism, Jainism, Bahá'í, Shinto), text acquisition previously lacked a central index of authoritative upstream endpoints, licenses, and raw source archives.

## Decision
1. Establish a single authoritative registry file at `config/upstream-registry.json` tracking official REST APIs, Git remotes, open-data feeds, and licensing terms.
2. Require every dataset to have an associated ingestion recipe in `ingestion/recipes/<name>/` with raw source files pinned by SHA-256 and byte size in `source/`.
3. Provide master automated synchronization tools: `pnpm sync:all`, `pnpm sync:ummah`, `scripts/sync-sefaria.ts`, `scripts/sync-suttacentral.ts`, and `scripts/sync-ctext.ts`.

## Consequences
- 100% of corpus records are reproducible and verifiable from official hulu sources.
- No manual code-embedded strings; all datasets are ingested through declarative recipes.
