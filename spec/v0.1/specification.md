# MoonWitness Corpus Specification v0.1

Status: **Draft / unstable**

## Scope

The specification defines a technology-neutral interchange and preservation model for evidence-aware religious and historical knowledge datasets.

It does **not** define a theological truth hierarchy, engine ranking policy, database schema, embedding strategy, or AI answer policy.

## Canonical layers

1. **Entity** — identity anchor.
2. **Resource** — informational/cultural object.
3. **Assertion** — contextual claim.
4. **Evidence** — precise support, contradiction, mention, quotation, or contextual target.
5. **Provenance** — source/derivation lineage.
6. **Assessment** — an explicitly attributed evaluation.

Domain structures such as textual passages, manuscripts, chronology, geography, or lineage belong to versioned profiles built on top of this core.

## Serialization

Canonical authoring formats are UTF-8 JSON and JSONL validated using JSON Schema Draft 2020-12.

## Boundary rule

Canonical data must remain usable without MoonWitness, PostgreSQL, `@moon/orm`, a vector database, or an AI provider.
