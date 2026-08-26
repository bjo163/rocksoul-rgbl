# Core model

## Entity vs assertion

An entity records stable identity and descriptive labels. Context-sensitive classifications should normally be assertions.

For example, a person should not receive a global `is_prophet: true` field. A dataset may instead assert `person -> has_role -> prophet` within an explicit tradition/community/source scope and attach evidence.

## Multilingual labels

Entity/resource labels use explicit `preferred` or `alternate` roles with optional BCP 47 language tags and ISO 15924 script codes. Preferred-label uniqueness is scoped by the exact `(language, script)` pair. Labels never establish canonical identity; see `labels.md`.

## Source vs evidence vs provenance

- **Resource/source**: what artifact, edition, publication, dataset, or work is being referenced.
- **Evidence**: exactly which fragment or selector is relevant to an assertion.
- **Provenance**: how the corpus record was obtained, parsed, normalized, curated, or derived.

## Assessment

Confidence and authenticity judgements belong to assessments with an assessor/method. They are not universal scalar attributes of an assertion or source.

## Structural relations

Structural metadata such as passage parentage, sequence, language, checksum, and edition membership should use profile-specific fields rather than being converted into generic knowledge assertions.
