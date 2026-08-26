# Semantic invariants — v0.1

## Purpose

JSON Schema answers whether a record has the expected structural shape. P1-006 establishes a separate validation layer for rules that depend on relationships between fields, canonical identity semantics, deterministic-ID recipes, or semantic constraints that should not be duplicated across schemas.

The validation stack is therefore:

```text
JSON / JSONL syntax
        ↓
JSON Schema structure
        ↓
semantic record invariants
        ↓
referential integrity / dataset dependencies
        ↓
later profile, provenance, rights, and release invariants
```

A record can be structurally valid and still fail semantic validation.

## Stable finding codes

Semantic and repository validators expose machine-readable `code` values in addition to human-readable messages. Codes allow CI, future Studio tooling, and downstream adapters to distinguish findings without parsing English prose.

P1-006 introduces codes such as:

```text
record-family-id-kind
nonblank-kind
nonblank-assertion-class
nonblank-evidence-relation
nonblank-assessment-result
malformed-deterministic-id
deterministic-id-mismatch
```

Existing repository-integrity findings are also assigned explicit codes as they pass through the validator.

Finding codes describe validator contracts; changing their meaning should be treated as a compatibility concern even if wording changes.

## Fixed record-family ID kinds

Some core records are semantic/container families whose canonical ID kind is fixed:

```text
Assertion   -> mw:assertion:...
Evidence    -> mw:evidence:...
Provenance  -> mw:provenance:...
Assessment  -> mw:assessment:...
```

A structurally valid assertion with an ID such as:

```text
mw:evidence:example:001
```

is semantically invalid because its canonical identity claims a different record family.

Entity and Resource intentionally do **not** use this rule. Their IDs may expose useful semantic kinds:

```text
mw:person:musa
mw:place:jerusalem
mw:work:quran
mw:edition:example
```

without forcing every domain object into `mw:entity:*` or every cultural/information object into `mw:resource:*`.

## Non-blank semantic classification values

Several fields are structurally strings but semantically meaningless when blank or whitespace-only. V0.1 rejects blank values for:

```text
Entity.kind
Resource.kind
Assertion.assertion_class
Evidence.relation
Assessment.result
```

This rule does not yet close those fields into religion-specific or application-specific enums. Vocabulary/profile work may constrain them later. The invariant only prevents empty semantic placeholders from passing validation.

## Deterministic-ID verification

P1-002 defines deterministic v1 IDs for generated Assertions and Evidence.

Whenever an Assertion or Evidence uses the deterministic v1 shape:

```text
mw:<record-type>:v1:sha256:<digest>
```

the validator recomputes the expected ID from the normative semantic identity payload and requires an exact match.

Therefore this is invalid:

```text
ID digest was minted for object A
record payload was later changed to object B
```

without reminting the deterministic ID.

This makes deterministic IDs integrity-bearing rather than decorative strings.

Curated/non-deterministic IDs remain allowed in v0.1. P1-006 does not require every Assertion/Evidence to be hash-addressed; it verifies the recipe only when the record declares deterministic-v1 identity.

A string that looks like `v1:sha256` but does not contain the required full lowercase 64-hex digest is reported as a malformed deterministic ID rather than silently treated as an unrelated curated convention.

## Invariants intentionally deferred

P1-006 does not invent rules before their semantics are stabilized. In particular it does not yet enforce:

- lifecycle/status transitions (P1-007);
- preferred/alternate multilingual label cardinality (P1-008);
- final scope keys/value envelopes (P1-009);
- final literal datatype/language combinations (P1-010);
- assessment method/result vocabulary relationships (P1-011);
- textual hierarchy constraints (P2);
- provenance/rights invariants (P3).

Those tasks should register additional semantic checks in the same layer rather than burying cross-field logic in unrelated schemas or application code.

## Extensions and profiles

The core semantic validator does not recursively interpret arbitrary `extensions` data. A profile owns the semantic rules for fields it introduces.

This keeps the universal core religion-neutral and prevents application-specific assumptions from silently becoming canonical validation law.

## Compatibility

The existing minimal synthetic dataset passes these invariants.

Adding semantic validation is stricter than schema-only validation: records that previously used blank semantic fields, mismatched record-family ID kinds, or stale deterministic hashes will now fail `pnpm validate` / `pnpm check`. This is intentional for v0.x contract stabilization.
