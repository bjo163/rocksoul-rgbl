# MoonWitness Corpus — Current Status

Snapshot date: 2026-08-27.

This file is a concise implementation/release snapshot. `TODO.md` remains the canonical executable task state, while `docs/ROADMAP.md` preserves the detailed architecture and milestone rationale.

## Authoritative state

- `main` is the authoritative implementation branch.
- There are no open pull requests at this snapshot.
- The last code/release merge is PR #143 (`de14248276d53f16457bc219a14652443e3d1fc0`).
- Post-merge CI for that commit completed successfully.
- Subsequent `main` commits only reconciled TODO/Issue state before this status cleanup.
- Historical feature/bootstrap branches are non-authoritative and may be deleted after merge; consumers and downstream work must pin `main`/release commits, not those branch refs.

## Milestone state

```text
P0  Foundation                         complete
P1  Core contract stabilization        complete
P2  Textual profile v0.1               complete
P3  Provenance / source / rights        complete
P4  Reproducible ingestion framework   complete
P5  Two real dataset proofs             complete
P6  Repository / query / build          complete
P7  Public Corpus Explorer              complete
P8  Package/release infrastructure      complete
    npm publication tasks               blocked
P9  MoonWitness integration             not started here
P10 Advanced profiles                   not started
P11 Curation / collaboration            not started
```

P8 publication tasks intentionally remain open:

```text
P8-002  publish core
P8-003  publish schema
P8-004  publish repository
P8-005  publish validator
P8-006  publish CLI
```

They are not considered complete until packages are actually published and installable from the selected registry.

## Verified implementation baseline

The P8 post-merge CI baseline verified:

- 108 automated tests passing;
- 12,841 canonical records validating;
- 7 registered datasets;
- deterministic derived corpus build;
- deterministic release bundle across two independent builds;
- 7 npm tarballs prepared in the release bundle;
- npm publication dry-run resolving the expected package artifacts;
- production Corpus Explorer build and runtime smoke test passing.

Current real-data proofs include:

- full Tanzil Uthmani Quran dataset with 6,236 ayah and pinned source checksum/rights metadata;
- SuttaCentral/Bilara Dhammapada 1–20 proof with source-preserving provenance and explicit rights metadata.

These datasets remain descriptive corpus inputs. Their presence does not create universal theological identity, equivalence, or authority claims.

## Release boundary

Four version domains remain independent:

```text
spec version
package version
dataset version
aggregate corpus release version
```

Release preparation currently generates package tarballs, `SHA256SUMS`, a machine-readable release manifest, JSON-LD, and RO-Crate metadata. Generated release/build output under `dist/` is disposable and reproducible; it is not canonical authoring state.

## Publication blockers

Actual npm publication is deliberately disabled until both conditions are resolved:

1. select a repository-wide code license deliberately;
2. confirm ownership/publish permission for the chosen npm scope (`@moonwitness`).

Do not bypass these gates merely to mark P8 complete.

## Next safe sequence

```text
resolve code license
      ↓
confirm npm scope authorization
      ↓
prepare and create first pinned public corpus release
      ↓
publish target npm packages
      ↓
install/verify from a clean external consumer
      ↓
close P8-002..P8-006
      ↓
begin P9 in the separate MoonWitness repository
```

P9 must keep MoonWitness engine policy, ranking, embeddings, and ORM/database identity outside the canonical corpus truth layer.
