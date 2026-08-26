# Assessment semantics — v0.1

## Purpose

An assessment records an attributed evaluation of another canonical record. Assessment values are never intrinsic global properties of the target.

## Required fields

- `target` — canonical ID of the record being evaluated.
- `result` — non-blank result text/token interpreted under the declared method.
- `method` — required non-blank method key/name/version string that supplies the interpretation context for `result` and optional `confidence`.

## Optional fields

- `assessor` — canonical ID of the responsible person, group, institution, software agent, or other modeled agent when available.
- `confidence` — finite scalar from 0 through 1, meaningful only in the declared method context.
- `evidence` — canonical evidence records used by the assessment.

## Semantics

Two assessments may legitimately disagree. The corpus preserves both when their provenance and scope justify inclusion.

`confidence` is not a universal confidence score for the target assertion. Downstream applications may select, aggregate, or ignore assessments according to explicit policy; such policy is outside the canonical corpus.

Assessment `result` vocabularies may be domain-specific (`plausible`, `authentic`, `weak`, `accepted`, etc.) without making those vocabularies universal core enums. Their meaning is supplied by `method`, documentation, vocabularies, and provenance.
