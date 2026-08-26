# Ingestion contract v0.1

Ingestion is an explicit, reproducible build-time supply chain. Released corpus consumers must not require upstream network access.

## Pipeline

```text
acquire -> verify pinned raw bytes -> parse -> normalize -> map -> curate/reconcile -> recipe validate -> deterministic JSONL
```

A recipe pins the source SHA-256 and versions for parser, normalizer, mapper, and optional recipe validator. Retrieval timestamps are execution metadata and never participate in deterministic output serialization.

## Acquisition

`filesystem` sources are relative to the recipe directory and cannot escape it. `http` sources require an explicit `allowNetwork=true` execution option (CLI: `--allow-network`). HTTP is therefore opt-in for ingestion jobs and is never needed to read a released dataset.

Raw bytes are verified before parsing. A checksum or byte-size mismatch aborts the job.

## Recipe interfaces

A recipe implementation exports `hooks` with:

- `parse(bytes, context)`
- `normalize(parsed, context)`
- `map(normalized, context)`
- optional `validate(records, context)`

Source-specific behavior belongs in recipes rather than a central source-name switch.

## Deterministic output

Mapped records are serialized as canonical JSON with recursively sorted object keys, preserved array order, records sorted by canonical ID, UTF-8, LF separators, and exactly one terminal LF. Execution timestamps and fetch locations are excluded from output bytes.

Same pinned raw bytes + same recipe/parser/normalizer/mapper/validator versions + same curation overlays must therefore yield byte-for-byte identical output and SHA-256.

## Curation overlays

Human corrections are explicit JSON Pointer operations (`add`, `replace`, `remove`). Each operation records a reason, curator canonical ID, and provenance canonical ID. Parser output is never silently hand-edited.

## Offline release rule

Network access is permitted only while explicitly running an ingestion job. Canonical datasets and release artifacts must remain independently consumable and validate without network access.
