# Record lifecycle — v0.1

## Purpose

Lifecycle metadata describes whether a canonical corpus record is still the current record identity or has been intentionally superseded or retired. It is administrative metadata about the corpus record, not a claim about religion, history, truth, authority, authenticity, review quality, publication, or application policy.

The lifecycle envelope is optional. **Absence means `current`.** Producers should therefore omit it for ordinary current records unless an explicit lifecycle annotation is useful.

## Universal states

v0.1 defines exactly three core states:

- `current` — the canonical record remains current.
- `superseded` — the record is preserved for historical identity but one or more canonical successor records replace it.
- `retired` — the record is intentionally no longer current and has no canonical successor.

The core deliberately does not define `draft`, `reviewed`, `approved`, `rejected`, `verified`, `retracted`, `active`, `inactive`, `published`, or theological/domain-specific states. Those concepts belong to curation workflows, assessments, profiles, source metadata, or downstream policy as appropriate.

## Envelope

```json
{
  "lifecycle": {
    "status": "superseded",
    "replacements": ["mw:person:replacement-a"],
    "reason": "Identity split after source reconciliation."
  }
}
```

`status` is required whenever the lifecycle envelope is present. `reason` is optional human-readable metadata and is not an identity field.

`replacements` is required and non-empty for `superseded`. It is forbidden for `current` and `retired`. Replacement values are canonical IDs and participate in normal referential-integrity and cross-dataset dependency validation.

A record must not name itself as a replacement. Multiple replacements are allowed so a previously conflated identity can split into several canonical identities.

## Identity stability

Lifecycle transitions do not change a record's canonical ID. A superseded or retired ID remains reserved permanently and must not be reused for another semantic object.

For deterministic assertion/evidence IDs, lifecycle metadata is intentionally outside the semantic identity payload. Adding or changing lifecycle metadata therefore does not remint the deterministic ID.

## Tombstones and deletion

Canonical records should not be silently deleted merely because they are no longer current. `superseded` and `retired` preserve historical resolvability and provenance. Physical packaging details for compact tombstone-only releases may be defined later, but they must preserve the old canonical ID and lifecycle meaning.

## Separation from assessment and curation

Lifecycle must not be used as a substitute for assessment or review state. For example, a disputed assertion can remain `current`; its uncertainty belongs in assessments/evidence. Likewise, a machine-generated record can remain `current` while its curation status is unreviewed. These dimensions are independent.
