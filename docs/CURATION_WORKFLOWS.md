# Curation and collaboration workflows

This document defines the repository-local v0.1 curation contract. It is intentionally Git- and dataset-oriented: canonical data changes are reviewable patches, never hidden application state.

## Roles and review states

Curators, reviewers, source/rights reviewers, evidence reviewers, and maintainers are represented by repository identities or canonical `Entity` references. A role grants review responsibility; it does not grant doctrinal authority or bypass provenance requirements.

Workflow state is kept in pull requests, issue checklists, and reviewable patch metadata. Core record lifecycle remains independent from workflow state. A record may remain `current` while a proposed patch is pending, disputed, or rejected.

Every curation action must identify:

- the dataset and exact base revision;
- the target canonical record or source-local record;
- the curator/reviewer identity;
- the reason and scope of the action;
- the evidence or provenance supporting it;
- the validation result and, when applicable, the replacement record.

## Patch lifecycle

```text
proposal → automated validation → specialist review → maintainer decision → merge/reject
```

Generated output is never edited directly. A correction to parsed data is expressed as a curation overlay using JSON Pointer operations (`add`, `replace`, or `remove`), with curator and provenance references. A reconciliation or identity decision is represented as an explicit assertion/record, not an implicit merge.

## Review lanes

### Source and rights review

Before a new bundled artifact is accepted, a source/rights reviewer verifies the exact upstream location, revision, retrieval method, byte size, SHA-256, license/terms, attribution, and redistribution status. Unclear rights must be represented as `external`, `metadata_only`, or `restricted`; the bytes are not bundled until the status is resolved.

### Assertion and evidence review

An assertion reviewer checks subject, predicate, object, scope, evidence relation, selector, and source boundaries. Claims about roles, authority, identity, historicity, or equivalence must remain scoped and source-attributed. Name similarity alone is not evidence of identity.

### Duplicate and reconciliation review

Duplicate candidates are reported deterministically by canonical key, external identifier, source-local identifier, and normalized display labels. Candidate reports never merge records automatically. A merge/equivalence decision requires an explicit source-backed assertion and a maintainer-reviewed patch; unresolved candidates remain separate.

## Pull-request checklist

1. Explain the dataset, source revision, and intended semantic change.
2. Include only canonical authoring changes and reproducible recipe changes; exclude generated `dist/` output.
3. Include rights/provenance evidence for every new artifact or source claim.
4. Run typecheck, tests, validator, build, and release verification as applicable.
5. State known gaps, uncertainty, rejected alternatives, and compatibility impact.
6. Obtain the specialist review required by the review lane before maintainer approval.

## Non-goals

This contract does not define a universal religion taxonomy, global role booleans, normative ranking, or a database-only studio workflow. Those concerns remain source-scoped or downstream policy concerns.
