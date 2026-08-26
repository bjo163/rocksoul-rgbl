# Canonical identity, external identifiers, source-local identifiers, and aliases — v0.1

## Purpose

This document defines P1-003: the semantic boundary between MoonWitness canonical IDs, identifiers controlled by external authorities, identifiers that exist only inside one imported source, and human-facing aliases/labels.

The central rule is:

> A string that identifies something somewhere is not automatically a MoonWitness canonical ID.

MoonWitness must preserve outside identity systems without pretending to own them and without using name similarity as proof of cross-tradition or cross-source identity.

## Four distinct identity forms

### 1. Canonical ID

A canonical ID is repository-global MoonWitness corpus identity under the `mw:` namespace.

Example:

```text
mw:person:musa
```

Canonical IDs are used in canonical `id` fields and canonical cross-record reference fields. Their grammar, immutability, rename policy, and global scope are defined in [`identifiers.md`](identifiers.md).

Canonical equality means the corpus has chosen one canonical identity. It is stronger than label similarity or the mere presence of matching external identifiers.

### 2. External identifier

An external identifier is minted/controlled by another authority.

Canonical representation:

```json
{
  "scheme": "wikidata",
  "value": "Q12345",
  "uri": "https://www.wikidata.org/entity/Q12345"
}
```

The identity tuple is:

```text
scheme + exact value
```

`uri` is optional metadata/resolution information and does not change external-identifier equality.

Examples of schemes include, where relevant to a dataset:

```text
wikidata
viaf
doi
isbn
orcid
```

The scheme token is a corpus-controlled lowercase ASCII authority name. The external `value` itself is preserved exactly as published by the authority. It MUST NOT be lowercased, transliterated, slugified, trimmed, or rewritten merely to fit MoonWitness conventions.

Therefore these are distinct external identifiers unless the owning authority says otherwise:

```text
wikidata:Q1
wikidata:q1
```

An external identifier MUST NOT be converted into a canonical ID by string substitution. For example, `wikidata:Q12345` does not become `mw:person:q12345` automatically.

### 3. Source-local identifier

A source-local identifier is meaningful only with an explicit source context.

Representation:

```json
{
  "source": "mw:resource:source-example",
  "namespace": "people",
  "value": "123"
}
```

The identity tuple is:

```text
source + optional namespace + exact local value
```

The same local value in two different sources is not the same identifier:

```text
source A / people / 123
source B / people / 123
```

A source-local ID is useful during ingestion, provenance, reconciliation, and round-tripping to the original dataset. It MUST NOT be accepted in a field that requires a canonical ID.

If an imported source record has not yet been reconciled to a canonical object, preserve its source-local identity rather than minting a global canonical identity from name similarity or import order.

P3 will stabilize source/resource metadata. P1-003 requires only that the `source` context itself be a canonical corpus reference; it does not yet constrain which resource kind represents a source.

### 4. Alias / label

An alias is a human-facing name, spelling, title, transliteration, or other label.

Examples:

```json
{ "value": "Musa", "language": "id" }
{ "value": "Moses", "language": "en" }
{ "value": "משה", "language": "he", "script": "Hebr" }
```

Aliases are not identity keys. They may be non-unique, contextual, contested, transliterated, translated, historical, or shared by several entities.

This task does not finalize preferred/alternate-label roles, language-tag rules, transliteration schemes, or label ordering. Those belong to P1-008. P1-003 fixes only the identity boundary: labels MUST NOT be promoted into canonical IDs or `same_as` relations automatically.

## Comparison table

| Form | Owned by | Equality | Mutable display? | Valid canonical reference? |
| --- | --- | --- | --- | --- |
| Canonical ID | MoonWitness corpus | exact canonical ID bytes | No | Yes |
| External identifier | external authority | exact scheme + exact value | Authority-defined | No |
| Source-local identifier | imported source context | source + namespace + exact value | Source-defined | No |
| Alias/label | linguistic/editorial context | not an identity relation | Yes | No |
| Database PK | downstream runtime | database-specific | Yes/rebuildable | No |

## External identifier scheme rules

The `scheme` field uses:

```regex
^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$
```

Examples:

```text
wikidata
viaf
doi
source.registry-v2
```

A pre-authoring helper may trim/lowercase a curator-entered scheme name, but once stored the scheme must already be canonical. That helper never modifies the authority-controlled identifier value.

The repository should eventually document commonly used schemes in vocabulary/registry data rather than turning them into a closed TypeScript enum.

## External values are opaque authority data

External identifier values are exact opaque strings for corpus identity purposes.

MoonWitness MUST NOT globally assume:

- case-insensitive comparison;
- Unicode normalization equivalence;
- punctuation equivalence;
- numeric equivalence;
- URL-decoding equivalence;
- leading-zero equivalence.

An authority-specific importer/profile may know stronger rules, but those rules belong to that authority adapter and must not silently change the preserved original value.

Control characters and empty values are rejected as structurally unsafe. Ordinary spaces/punctuation may remain if the external authority genuinely uses them.

## Optional URI

An external identifier may carry an absolute URI:

```json
{
  "scheme": "doi",
  "value": "10.1000/example",
  "uri": "https://doi.org/10.1000/example"
}
```

The URI is a resolver/representation, not a second identity key. Two external identifiers with the same exact `scheme` and `value` remain equal even if one record has no URI or uses a different legitimate resolver URI.

Corpus consumers MUST NOT automatically fetch external URIs merely because they appear in data. Network acquisition belongs to explicit ingestion workflows.

## Reconciliation rules

External identifier equality may be strong reconciliation evidence, but it is not a universal automatic `same_as` rule.

Reasons include:

- an external authority may represent a work while MoonWitness represents an expression/edition;
- one source may intentionally conflate several historical entities;
- identifier assignments can be deprecated or corrected;
- a dataset can quote another authority without asserting strict identity;
- traditions can identify figures/works differently.

Therefore:

1. preserve the external identifier exactly;
2. record how it was obtained in provenance where relevant;
3. apply authority/profile-specific reconciliation rules explicitly;
4. keep strict `same_as` reviewable rather than deriving it solely from labels or generic identifier matching.

Relations such as `exact_match`, `close_match`, `identified_as_by`, or reviewed `same_as` remain semantic mappings, not alternate identifier syntaxes.

## Cross-dataset behavior

Canonical IDs are repository-global and remain the mechanism for canonical cross-dataset references.

External identifiers do not bypass dataset dependency resolution. A dataset cannot reference `wikidata:Q12345` in a canonical entity reference field as a shortcut for resolving `mw:person:...`.

Source-local identifiers are even narrower: they are meaningful only in their declared source context.

P1-004 defines dependency/reference resolution mechanics; P1-003 only defines which identity forms are eligible as canonical references.

## Storage guidance

Reusable JSON Schema definitions live in `common.schema.json`:

```text
$defs.externalIdentifier
$defs.sourceLocalIdentifier
```

These definitions establish the envelopes without forcing every core record family to expose identifier arrays immediately. Profiles or later core work may attach them where semantically appropriate.

This avoids turning optional authority metadata into mandatory fields on every assertion/evidence/provenance record.

## Security

Treat external/source-local values and URIs as untrusted data.

Consumers MUST NOT:

- concatenate them into filesystem paths without explicit encoding;
- treat them as canonical IDs;
- execute/fetch URI content implicitly;
- generate HTML without normal escaping;
- assume a URI is safe because its scheme/value passed structural validation.

Canonical-ID validation remains separate and stricter.

## Compatibility

Adding external/source-local envelopes is additive to v0.1. Existing records do not need migration because P1-003 does not make these fields mandatory on current core record families.

Future attachment of these envelopes to entity/resource/profile schemas must use the same semantics unless the specification version changes.

## Deferred work

P1-003 intentionally defers:

- canonical dataset dependency/reference resolution (P1-004);
- final multilingual preferred/alternate alias model (P1-008);
- identity mapping predicates/review workflows beyond the boundary rules;
- source/resource provenance model (P3);
- authority-specific normalization/reconciliation adapters.
