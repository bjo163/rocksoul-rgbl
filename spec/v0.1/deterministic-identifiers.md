# Deterministic generated identifiers — v0.1

## Purpose

This document defines the P1-002 deterministic identifier recipe for generated canonical records. It builds on the universal canonical-ID grammar in [`identifiers.md`](identifiers.md) without changing that grammar.

The v1 recipe has two goals:

1. the same semantic generated record rebuilt from the same identity payload receives the same canonical ID; and
2. metadata enrichment, import order, dataset packaging, database state, or timestamps do not accidentally remint semantic identity.

The first normative record recipes are **Assertion** and **Evidence**. Future generated record families may use the same hashing primitive only after defining their own normative identity payload.

## Identifier shape

A deterministic v1 ID is:

```text
mw:<kind>:v1:sha256:<digest>
```

where `<digest>` is the complete 64-character lowercase hexadecimal SHA-256 digest.

Examples:

```text
mw:assertion:v1:sha256:5b8d516a62168363cbd70ec3fce5db1cb37ecd8d07e50e102a2c00eb24337034
mw:evidence:v1:sha256:72538a91352d690ff28786aff990359ae2846947367abd3a631e81b3e6a46752
```

The digest is **not truncated** in v1. Dataset IDs, source-local identifiers, timestamps, random UUIDs, database sequences, file paths, and import-order counters MUST NOT be used as salt.

`v1` versions the identity recipe, not the corpus record. `sha256` identifies the digest algorithm. A future incompatible change to identity-payload semantics or canonical serialization MUST use a new recipe version instead of silently changing the meaning of existing `v1` IDs.

## Deterministic canonical JSON v1

The digest input is UTF-8 bytes of the deterministic canonical JSON string produced from the record family's identity payload.

The v1 serializer follows these rules:

- `null`, booleans, finite JSON numbers, and strings use their JSON representation;
- object keys are sorted lexicographically before serialization;
- array order is preserved exactly;
- no insignificant whitespace is emitted;
- strings are hashed exactly as supplied; the serializer does not transliterate, case-fold, trim, or Unicode-normalize semantic values;
- `undefined`, bigint, symbols, functions, non-finite numbers, sparse arrays, non-plain objects, and cyclic structures are rejected;
- object properties with unsupported values are rejected rather than silently omitted;
- JSON number behavior follows ECMAScript `JSON.stringify` for finite numbers, so `-0` serializes as `0` as it does in JSON.

This is deliberately a narrow JSON identity contract. It does not perform identity reconciliation or domain normalization. Later semantic work may constrain literal/scope values more strongly; changing the bytes that define identity requires a recipe-version decision.

## Assertion identity recipe v1

The assertion identity payload contains exactly:

```json
{
  "record_type": "assertion",
  "subject": "...",
  "predicate": "...",
  "object": { "...": "..." },
  "assertion_class": "...",
  "scope": { "...": "..." }
}
```

`scope` is omitted when absent or empty.

The following fields are **not** part of assertion semantic identity in v1:

```text
id
evidence
provenance
extensions
```

Rationale: the claim `subject + predicate + object + assertion_class + scope` should retain one identity while additional supporting evidence, provenance detail, review metadata, or application extensions accumulate. Evidence enrichment therefore does not force references to the assertion to change.

Changing any included semantic field remints the deterministic assertion ID.

The assertion object envelope is hashed structurally. Entity objects hash their canonical entity reference. Literal objects hash the literal `value` plus `datatype` and/or `language` when those optional fields are present. P1-010 may further constrain literal semantics; any incompatible identity normalization must not silently alter the v1 recipe.

### Assertion golden vector

Identity payload:

```json
{
  "record_type": "assertion",
  "subject": "mw:person:musa",
  "predicate": "mw:predicate:has-role",
  "object": { "entity": "mw:concept:prophet" },
  "assertion_class": "explicit_source",
  "scope": { "tradition": "mw:tradition:islam" }
}
```

Canonical JSON:

```text
{"assertion_class":"explicit_source","object":{"entity":"mw:concept:prophet"},"predicate":"mw:predicate:has-role","record_type":"assertion","scope":{"tradition":"mw:tradition:islam"},"subject":"mw:person:musa"}
```

SHA-256:

```text
5b8d516a62168363cbd70ec3fce5db1cb37ecd8d07e50e102a2c00eb24337034
```

Canonical ID:

```text
mw:assertion:v1:sha256:5b8d516a62168363cbd70ec3fce5db1cb37ecd8d07e50e102a2c00eb24337034
```

## Evidence identity recipe v1

The evidence identity payload contains exactly:

```json
{
  "record_type": "evidence",
  "target": "...",
  "relation": "...",
  "selector": { "...": "..." }
}
```

`selector` is omitted when absent.

The following fields are **not** part of evidence pointer identity in v1:

```text
id
provenance
extensions
```

Rationale: Evidence identifies a particular relation to a target/selected fragment. Import/parser provenance can become richer without changing the pointer itself. If artifact/edition distinctions matter, they must already be represented by the canonical `target` and selector rather than hidden inside a mutable ingestion timestamp.

Changing the target, relation, or selector remints the deterministic evidence ID.

### Evidence golden vector

Identity payload:

```json
{
  "record_type": "evidence",
  "target": "mw:resource:example",
  "relation": "supports",
  "selector": {
    "type": "text_quote",
    "exact": "example"
  }
}
```

Canonical JSON:

```text
{"record_type":"evidence","relation":"supports","selector":{"exact":"example","type":"text_quote"},"target":"mw:resource:example"}
```

SHA-256:

```text
72538a91352d690ff28786aff990359ae2846947367abd3a631e81b3e6a46752
```

Canonical ID:

```text
mw:evidence:v1:sha256:72538a91352d690ff28786aff990359ae2846947367abd3a631e81b3e6a46752
```

## Idempotency and deduplication

Given the same recipe version and exactly the same semantic identity payload, producers MUST emit the same deterministic ID regardless of:

- dataset package containing the record;
- source file ordering;
- JSON object property ordering;
- database row identity;
- import/rebuild time;
- worker concurrency;
- evidence/provenance enrichment excluded by the relevant recipe.

An ingestion pipeline may therefore use deterministic IDs as an idempotency key after it has produced the normative identity payload.

Deterministic equality does not mean theological or historical truth. It means two generated records have the same normalized identity payload under the named recipe.

## Collision policy

V1 uses the complete 256-bit SHA-256 digest and does not truncate it.

If an implementation ever observes the same deterministic ID for two different canonical identity payload byte strings, it MUST treat this as a fatal integrity collision. It MUST NOT:

- overwrite one record with the other;
- append a sequence number;
- add a random suffix;
- silently choose one payload;
- reinterpret the records as semantically identical merely because the digest collided.

The conflicting canonical payloads and build provenance should be preserved for investigation.

## Dataset and cross-dataset behavior

Dataset membership is not part of the v1 assertion/evidence identity payload. The same generated semantic assertion may therefore receive the same deterministic ID when independently reproduced in two datasets.

Packaging/dependency rules remain P1-004. Deterministic identity does not by itself authorize a dataset to reference a record it has not declared/resolved through the corpus dependency mechanism.

## Metadata changes that do not remint IDs

For assertions, adding or changing evidence references, provenance metadata, extensions, database IDs, file locations, or dataset placement does not remint the v1 deterministic ID.

For evidence, changing provenance or extensions does not remint the v1 deterministic ID.

A change to an included identity field does remint the ID.

## Security and implementation requirements

Implementations MUST hash the canonical identity payload, not an arbitrary in-memory object's default serialization.

Implementations MUST reject unsupported/non-JSON values instead of silently dropping them.

Implementations MUST compare deterministic IDs byte-for-byte as lowercase ASCII canonical IDs.

The core runtime implementation uses Web Crypto `SubtleCrypto` so the hashing contract does not require Node-only `node:crypto` and remains suitable for modern Node.js and browser tooling.

The published fixtures in [`fixtures/deterministic-ids/v1.json`](../../fixtures/deterministic-ids/v1.json) are golden interoperability vectors. Changing their expected IDs is an identity-contract change, not routine test maintenance.

## Deferred work

P1-002 intentionally does not define:

- external identifier/alias/source-local envelopes (P1-003);
- dataset dependency and cross-dataset resolution mechanics (P1-004);
- final scoped assertion vocabulary constraints (P1-009);
- final literal/object value semantics (P1-010);
- deterministic IDs for every possible future profile record.

Those tasks may constrain future payload construction. They MUST NOT silently reinterpret already published `v1` deterministic IDs.
