# Specification compatibility policy — v0.x

MoonWitness Corpus `v0.x` is pre-stable. Breaking changes are permitted, but they must be explicit, deterministic to migrate where practical, and never silently reinterpret published data.

## Compatibility classes

### Normally compatible

- adding an optional field with no changed semantics for existing fields;
- adding a new profile that core datasets are not required to use;
- adding vocabulary entries without changing existing entry meaning;
- adding validator warnings that do not invalidate previously valid canonical records.

### Breaking

- making an optional field required;
- changing a field's type, meaning, normalization, or identity role;
- tightening a schema/semantic invariant so previously valid data becomes invalid;
- changing canonical ID grammar or reference resolution rules;
- changing a deterministic ID identity payload or canonicalization algorithm;
- changing required dataset dependency semantics.

## Versioning obligations

Every dataset release pins the specification version it targets. A producer must not claim compatibility with a newer spec until the dataset validates against that version.

A breaking `v0.x` change must include migration notes in the same repository change and update fixtures/tests. Where published canonical IDs would change, old IDs must be preserved through lifecycle/reconciliation metadata when feasible rather than silently reused for different semantics.

## Deterministic ID recipes

Published deterministic IDs are immutable under their recipe version. A semantic change to the identity payload, canonical JSON rules, hash algorithm, or normalization rules requires a new recipe version (for example `v2`) and therefore new deterministic IDs. Existing `v1` IDs continue to mean the `v1` payload.

## Canonical identifiers

Human-curated canonical IDs are stable identity anchors. Label changes, source migrations, dataset reorganization, and storage changes do not rename them. If an identity was minted incorrectly, use lifecycle/reconciliation records; do not recycle the old ID for another object.

## Dataset and package independence

Spec version, software package version, dataset version, and corpus release version are independent namespaces. A validator bug fix does not by itself change a dataset's semantic version; a dataset correction does not by itself change the specification version.

## Pre-1.0 discipline

`v0.x` does not mean “anything may change without notice.” CI, fixtures, migration notes, and deterministic tests are the compatibility ledger until a stable `v1.0` contract is declared.
