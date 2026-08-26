# Source, provenance, rights, and artifact profile v0.1

## Purpose

`source@0.1` records descriptive source identity, artifact integrity, availability, rights, and processing lineage without importing downstream MoonWitness authority or normative policy into the corpus.

The profile is orthogonal to `textual@0.1`. A textual Artifact may carry `extensions.textual` to state what it represents and `extensions.source` to state where its bytes/metadata came from and under what rights they may be used.

## Source metadata

A resource opts into the profile through `extensions.source`. Datasets containing source metadata declare `source@0.1` in `manifest.json`.

Source metadata may record a descriptive title, publisher/institution Entity references, revision, canonical URL, external identifiers, language/script, an exact source Artifact reference, a Provenance reference, an embedded artifact descriptor, and an explicit rights statement. Source identity is descriptive; theological authority, normative weight, ranking policy, and MoonWitness runtime policy do not belong here.

## Artifact descriptor

`descriptor` describes retrievable or known bytes without requiring those bytes to be committed to Git. Fields include `availability`, absolute `locations`, `media_type`, `byte_size`, lowercase hexadecimal `sha256`, and `retrieved_at`.

For `bundled` artifacts, `byte_size`, `sha256`, and a redistribution-safe rights statement are mandatory semantic invariants.

`sha256` identifies the exact artifact bytes only. `retrieved_at`, URLs, HTTP headers, parser versions, and other operational metadata MUST NOT be included in that byte digest. Two acquisitions of the same bytes at different times therefore retain the same artifact SHA-256.

## Availability

- `bundled`: redistributable bytes/content are shipped or pinned by the release.
- `external`: an external retrievable location is recorded but bytes are not redistributed.
- `metadata_only`: identity/catalog/provenance metadata is recorded without redistributing bytes.
- `restricted`: access or redistribution is restricted.

Availability is technical distribution state, not religious or scholarly authority.

## Rights

`rights.status` is one of `public_domain`, `licensed`, `copyrighted`, `unknown`, or `not_applicable`. `rights.redistribution` is independently `permitted`, `restricted`, or `unknown`.

A bundled artifact is invalid when redistribution is not explicitly `permitted`, rights are missing, or status is merely `unknown`/unlicensed `copyrighted`.

### SPDX-compatible expressions

`license_expression` uses SPDX-style boolean syntax with `AND`, `OR`, parentheses, and `WITH` exceptions. v0.1 validates expression grammar but does not freeze the SPDX license-list registry.

Source-specific licenses use local identifiers such as `LicenseRef-Example-Archive-Terms`. Every `LicenseRef-*` token used by an expression must have a matching object in `license_refs` with at least a human-readable name and optionally a URI/note.

## Public domain is not edition-wide permission

A public-domain underlying work does not automatically make every modern edition, translation, transcription, scan, photograph, database arrangement, or API extraction redistributable. Rights review therefore occurs at the exact source/artifact/expression/edition being ingested. When rights are uncertain, prefer `external`, `metadata_only`, or `restricted` rather than bundling content.

## Provenance Agent and Activity

Agent is represented by a canonical reference to an `Entity`; a person, group, institution, or other suitable entity may act as an agent. A `Provenance` record contains an ordered `activities` array with universal classes `acquisition`, `parsing`, `normalization`, `mapping`, `curation`, `reconciliation`, `validation`, `generation`, or `other`.

Activities may record `agent`, `method`, processing `software.name`/`software.version`, timestamps, notes, and extensions. Array order is the processing chain: source artifact -> acquisition -> parsing -> normalization -> mapping -> curation/reconciliation when needed -> canonical record.

Parser, normalizer, and curation versions remain provenance metadata; they do not alter the SHA-256 of already-pinned raw artifact bytes.

## Textual content traceability

When a dataset declares both `textual@0.1` and `source@0.1`, every textual Content and textual Artifact must carry `extensions.source`. Textual Content must reference the exact `textual.artifact` from which it ultimately derives and a `Provenance` record describing its processing path. Derived normalized/search representations retain the exact source artifact reference plus explicit `derived_from` content lineage.

## Validation boundary

Semantic validation enforces source profile declaration, typed source references, bundled integrity/rights requirements, SPDX-style syntax, `LicenseRef-*` resolution, Content -> Artifact + Provenance traceability, Provenance source -> Resource, activity agent -> Entity, and activity timestamp ordering.

This profile describes evidence supply-chain facts. It does not determine whether a source is doctrinally authoritative, historically reliable, canonical, revealed, authentic, or preferred by a downstream engine.
