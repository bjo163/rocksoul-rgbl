# Canonical identifiers — v0.1

## Purpose

MoonWitness corpus identifiers provide stable semantic identity across datasets, imports, rebuilds, packages, and downstream applications. They are part of the corpus contract, not an implementation detail of PostgreSQL, an ORM, a web application, or a repository folder layout.

A canonical identifier answers: **which corpus object is this?** It does not by itself answer whether two source records are the same real-world thing, whether a claim is true, where a record is stored, or which database row currently represents it.

Canonical IDs MUST remain stable when data is rebuilt, moved between datasets, materialized into a database, or exposed through a different application.

Database primary keys MUST NOT become canonical corpus IDs.

## Terminology

The following identity forms are deliberately distinct:

| Term | Meaning | Example | Canonical? |
| --- | --- | --- | --- |
| Canonical ID | Repository-global semantic identity minted under this specification | `mw:person:musa` | Yes |
| External identifier | Identifier controlled by another authority | `wikidata:Q...` | No |
| Source-local identifier | Identifier meaningful only within an imported source/dataset context | `source-x:person:123` | No |
| Alias / label | Human-readable alternate name or spelling | `Musa`, `Moses`, `משה` | No |
| URL / URI | Locator or IRI representation | `https://moonwitness.org/id/person/musa` | No; maps to a canonical ID |
| Database primary key | Runtime/storage identity | `8712` | No |

An external identifier can be globally unique in its own authority and still is not a MoonWitness canonical ID. A label can be unique in a particular context and still is not an identity mechanism.

## Primary namespace

The canonical compact prefix is:

```text
mw
```

Every v0.1 canonical ID begins with `mw:`.

The `mw` prefix is reserved for MoonWitness canonical corpus identity. It MUST NOT be used for raw source-local identifiers, database keys, unreviewed reconciliation candidates, URLs, or mutable application state.

## Grammar

The exact v0.1 grammar is:

```text
canonical-id = "mw:" kind ":" segment *(":" segment)

kind         = lower-alpha *(lower-alpha / digit)
               *(punct 1*(lower-alpha / digit))

segment      = 1*(lower-alpha / digit)
               *(punct 1*(lower-alpha / digit))

punct        = "-" / "_" / "."
lower-alpha  = "a" ... "z"
digit        = "0" ... "9"
```

The normative regular expression is:

```regex
^mw:[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*:[a-z0-9]+(?:[._-][a-z0-9]+)*(?::[a-z0-9]+(?:[._-][a-z0-9]+)*)*$
```

A canonical ID therefore contains:

1. the fixed `mw` prefix;
2. one **kind namespace** segment;
3. one or more **identity segments**.

Examples:

```text
mw:person:musa
mw:place:jerusalem
mw:concept:prophet
mw:tradition:islam
mw:work:quran
mw:assertion:example:001
mw:passage:example-work:unit-0001
```

The deeper `passage` example demonstrates syntactic capacity only. This specification does not define passage hierarchy or citation semantics; the textual profile will do that later.

## Allowed characters and ASCII policy

Canonical IDs are ASCII-only.

Allowed characters are:

```text
a-z  0-9  :  -  _  .
```

The prefix and kind namespace are lowercase. The kind namespace MUST begin with `a-z`. Identity segments MAY begin with a digit.

Unicode characters are not valid inside canonical IDs. Unicode labels, scripts, source spellings, and transliterations belong in record data. This prevents identifiers from depending on Unicode normalization form, display font, script choice, or transliteration policy.

## Case sensitivity

Canonical IDs are compared byte-for-byte and are case-sensitive. Because the grammar permits only lowercase ASCII letters, any uppercase letter makes an ID invalid.

Consumers MUST NOT lowercase, case-fold, trim, Unicode-normalize, or otherwise repair an identifier while parsing it. A non-canonical string is an error, not an alternate spelling of a canonical ID.

## Separator semantics

`:` separates canonical identity segments. It is structural.

Inside a segment, `-`, `_`, and `.` are permitted URL-safe punctuation. They MUST occur only between alphanumeric runs. Leading punctuation, trailing punctuation, and adjacent punctuation are forbidden.

Good:

```text
mw:person:example-person
mw:concept:alpha_beta.gamma-1
mw:assertion:example:001
```

Bad:

```text
mw:person:-musa
mw:person:musa-
mw:person:musa--aaron
mw:person:musa__aaron
mw:person::musa
```

No theological, citation, language, or tradition-specific meaning is assigned to `:` or the internal punctuation characters by the universal grammar.

## Length

A canonical ID MUST be no more than **255 ASCII characters**.

Human-curated IDs SHOULD normally remain at or below **120 characters** for readability. Generated identifiers defined by later specifications may use more of the 255-character budget when necessary.

The limit is applied to the complete canonical ID string, including `mw:` and separators.

## Kind namespace rules

The first segment after `mw:` is a broad identity namespace. It is visible for readability and collision partitioning, but it is **not** a complete ontology type and does not replace a record's `kind` field or profile-specific semantics.

For example, `person`, `place`, `concept`, `tradition`, and `work` are useful neutral identity namespaces. They are not hard-coded schema enums. `islam`, `christianity`, `buddhism`, `hadith`, `prophet`, `saint`, or similar tradition-specific concepts MUST NOT become grammar primitives merely because they are important in one dataset. They belong in data and vocabulary.

The following kind tokens are core-controlled in v0.1 because they correspond to existing technical record/vocabulary families or synthetic fixtures:

```text
entity
resource
assertion
evidence
provenance
assessment
predicate
```

Other kind namespaces remain open but SHOULD be documented by the vocabulary/profile that uses them. A future profile may reserve additional neutral technical namespaces without changing the grammar.

The kind segment is a stable identity partition, not an assertion that can be safely recomputed from current classification. Reclassifying a record does not automatically rename its canonical ID.

## Slug normalization

Canonical parsing is strict; normalization is only a **pre-minting convenience** for human-curated candidates.

The reusable runtime helper performs the following conservative candidate normalization:

1. Unicode NFKC normalization;
2. trim leading/trailing whitespace;
3. lowercase;
4. replace runs of ASCII whitespace with `-`;
5. validate the result against the kind/segment grammar.

It does **not** transliterate non-ASCII scripts, strip diacritics, guess word boundaries, collapse arbitrary punctuation, or resolve identity.

Examples:

```text
" Example Person "  -> "example-person"
"Alpha_Beta.Gamma-1" -> "alpha_beta.gamma-1"
"Mūsā" -> rejected; an ASCII slug must be curator-selected
```

A normalizer MUST NOT be applied to an already published canonical ID in order to "fix" it.

## Human-curated identifiers

Human-readable slugs are encouraged when they can remain stable, but a mutable label, title, personal name, or transliteration MUST NOT be the only identity decision.

Before minting a curated ID, the curator or ingestion process MUST check whether the semantic object already has a canonical ID and MUST review collisions explicitly.

Once published, the slug is an opaque stable token even if the preferred display label later changes. For example, changing a preferred label from `Musa` to another spelling does not imply changing `mw:person:musa`.

When a readable slug would be ambiguous, mint a stable reviewed disambiguator rather than relying on import order or a database sequence. Avoid mutable facts as disambiguators when practical.

## Generated and deterministic identifiers

P1-002 will define deterministic identity for generated records such as assertions and evidence.

P1-001 only requires that generated IDs:

- use the same `mw:<kind>:<segment>[:<segment>...]` grammar;
- remain lowercase ASCII and URL-safe;
- remain within the 255-character limit;
- use an appropriate technical kind namespace such as `assertion` or `evidence`;
- encode any future algorithm/version token as ordinary identity segments rather than changing the universal grammar.

This specification does not choose a hash algorithm, canonical serialization, digest encoding, truncation length, or collision strategy for deterministic content hashes. Those choices belong to P1-002.

## Global vs dataset-local identity

A MoonWitness canonical ID is repository-global across all canonical datasets.

The same canonical object MUST use the same canonical ID when referenced from different datasets. Dataset membership, file location, partition path, import batch, dataset version, or manifest path MUST NOT be embedded merely to obtain uniqueness.

Dataset-local/source-local identifiers are not canonical IDs. They remain qualified by their source context and are used for ingestion, provenance, and reconciliation.

If a source record cannot yet be reconciled to a canonical object, ingestion SHOULD preserve its source-local identity rather than pretending that name similarity proves global identity. A canonical object is minted or reused only through an explicit identity decision.

P1-004 will define dataset dependency and resolution mechanics. It MUST preserve this rule: canonical cross-dataset references use canonical IDs, not relative paths or database keys.

## Cross-dataset references

Canonical reference fields such as assertion subjects, predicates, entity objects, evidence references, provenance references, and assessment targets use canonical IDs.

A reference is independent from the dataset containing the target. Moving a target record to another dataset, splitting a dataset, or merging datasets does not change the target's canonical ID.

This task does not define dependency declarations, lookup order, optional dependencies, or packaging rules; those are P1-004 concerns.

## External identifiers

External identifiers remain under the authority that minted them. They MUST NOT be rewritten into the `mw:` namespace merely by string substitution.

Example:

```text
Canonical ID:       mw:person:musa
External identifier: wikidata:Q...
Source-local ID:    source-x:person:123
Database key:       8712
```

The external identifier and source-local identifier may be recorded as evidence for reconciliation or as provenance metadata, but they are not accepted where a canonical ID is required.

P1-003 will define the exact data envelope for external identifiers, aliases, authority names, and source-local identifiers. P1-001 fixes their identity boundary but intentionally does not invent that schema prematurely.

## Alias vs external identifier vs canonical ID

An **alias** is an alternate human-facing name/spelling/label. It has linguistic and contextual meaning and may be non-unique.

An **external identifier** is an identifier minted by another authority. It has identity semantics in that authority, not automatically in MoonWitness.

A **canonical ID** is the MoonWitness corpus identity chosen for a canonical object.

A former canonical ID that has been deprecated is not a display alias. It is an identity redirect/tombstone and must remain machine-resolvable as historical identity metadata.

## Identity reconciliation

Similarity is not identity.

Records MUST NOT be merged solely because names, aliases, titles, transliterations, normalized slugs, external labels, or embeddings are similar.

Relationships such as:

```text
exact_match
close_match
identified_as_by
same_as
```

are explicit reconciliation assertions separate from canonical ID generation.

`same_as` MUST NOT be inferred solely from name similarity. Reconciliation decisions must remain inspectable and reviewable, with provenance/evidence where the relevant profile requires it.

Canonical ID equality means the corpus has chosen one identity. It is stronger than string/name similarity and separate from reconciliation confidence.

## Collision handling

If a proposed canonical ID is already assigned:

1. do not overwrite the existing object;
2. do not append a database sequence or import-order suffix automatically;
3. determine whether the incoming record is the same canonical object;
4. if it is the same object, reuse the existing canonical ID through explicit reconciliation;
5. if it is different, mint a distinct reviewed identifier, using a stable disambiguating segment or suffix;
6. record any reconciliation relation separately.

For future deterministic IDs, cryptographic collision handling and digest-length policy are deferred to P1-002.

## Rename policy

Published canonical IDs are immutable identifiers, not display names.

Changing a preferred label, title, transliteration, classification, dataset folder, or source does not rename the canonical ID.

An unpublished development fixture may be migrated before release. After an ID has been published in a released dataset or public package, a spelling improvement alone is not sufficient reason to replace it.

If an identifier itself is materially wrong or misleading and must be replaced, the change uses deprecation/redirect semantics rather than silent in-place identity rewriting.

## Deprecation, tombstones, and redirects

A canonical ID MUST NOT be reused for a different semantic object after publication.

When an identity is retired or replaced:

- keep the old canonical ID reserved permanently;
- preserve a tombstone or redirect mapping in canonical metadata;
- if there is one replacement object, explicitly point to its canonical ID;
- if an old object splits into multiple objects, do not choose a replacement silently; retain the tombstone and explicit split relations;
- consumers should be able to distinguish active identity from deprecated identity.

The exact lifecycle fields/storage representation are outside P1-001 and may be stabilized by later core lifecycle work. The non-reuse rule is normative now.

## Dataset split and merge behavior

Dataset packaging does not own semantic identity.

If a dataset splits, existing canonical IDs remain unchanged and move with their semantic records. References from other datasets continue using the same IDs.

If datasets merge, duplicate records that already share the same canonical ID become one packaging concern, not a new identity. If the merge reveals two canonical IDs that should represent one object, reconciliation is explicit; one ID may later become the surviving identity and the other a deprecated redirect, but the decision is never derived solely from the merge operation.

If one canonical object is discovered to contain multiple distinct objects, mint new canonical IDs for the split objects and retain the old ID as a tombstone with explicit split/replacement relations.

## Passage and future textual records

The universal grammar intentionally supports arbitrary-depth identity paths without embedding a religious citation system.

For example, this is syntactically valid:

```text
mw:passage:example-work:unit-0001
```

But P1-001 assigns no meaning to `passage`, `example-work`, or `unit-0001` beyond their position as identity segments. It does not define `quran:2:255`, `bible:john:3:16`, chapter/verse semantics, surah/ayah semantics, folio notation, or any other tradition-specific citation convention.

The P2 textual profile will define Work, Expression, Edition, Artifact, Passage, Content, Citation, hierarchy, and reference semantics while reusing this identifier grammar.

## URI mapping

Canonical IDs are compact authoring identifiers. For JSON-LD/RDF and public web resolution, the canonical reversible IRI mapping is:

```text
mw:<kind>:<segment>[:<segment>...]
    ->
https://moonwitness.org/id/<kind>/<segment>[/<segment>...]
```

Examples:

```text
mw:person:musa
https://moonwitness.org/id/person/musa

mw:assertion:example:001
https://moonwitness.org/id/assertion/example/001
```

The HTTPS IRI is a representation/resolution form, not a second canonical ID string. Canonical JSON/JSONL authoring continues to use the compact `mw:` form unless a later profile explicitly requires an IRI field.

The mapping contains no dataset version or repository path. All allowed segment characters are safe within an individual URL path segment without percent-encoding.

## URL safety and path safety

Canonical IDs never contain `/`, `\\`, `%`, `?`, `#`, spaces, control characters, or empty segments.

Applications MUST still treat a canonical ID as data, not as a filesystem path. Parse and validate before constructing URLs or storage lookups. Never concatenate an unvalidated external/source-local identifier into a canonical ID or local path.

The grammar prevents `.` and `..` path traversal segments because every identity segment must begin and end with an alphanumeric character.

The 255-character maximum also bounds common parser, log, and index abuse cases.

## Good and bad examples

Good canonical IDs:

```text
mw:person:musa
mw:tradition:islam
mw:concept:prophet
mw:work:quran
mw:place:jerusalem
mw:assertion:example:001
mw:passage:example-work:unit-0001
```

Invalid or non-canonical values:

```text
                                  # empty
MW:person:musa                    # uppercase prefix
mw:Person:musa                    # uppercase kind
mw:person:Musa                    # uppercase identity segment
mw::musa                          # empty kind
mw:person::musa                   # empty segment
mw:person:musa:                   # trailing separator
mw:person:musa--aaron             # adjacent punctuation separators
mw:person:mūsā                    # Unicode in canonical syntax
https://moonwitness.org/id/person/musa  # URL, not canonical ID
1842                              # database primary key, not canonical ID
```

## JSON and JSONL usage

Canonical IDs are ordinary JSON strings:

```json
{
  "id": "mw:person:musa"
}
```

A database identity may be completely different and may change without changing the corpus identity:

```text
Application database primary key: 8123
Corpus canonical ID:               mw:person:musa
```

JSON Schema validation uses the shared `common.schema.json#/$defs/canonicalId` definition. Core schemas MUST reference that shared definition rather than copy the regular expression.

## Compatibility and versioning

The v0.1 grammar is part of the corpus contract.

Canonical IDs do not include `v0.1`, dataset version, schema version, import version, or repository folder names because those describe representations or packaging rather than semantic identity.

A future specification may add namespace governance or new profile-owned kind tokens without changing existing IDs. Tightening or changing the lexical grammar in a way that invalidates published IDs is a compatibility change and requires an explicit migration/versioning decision; it must not happen silently.

Runtime TypeScript validation and JSON Schema validation MUST agree on the lexical grammar and maximum length. Automated tests compare the shared schema definition with the runtime validator against the canonical valid/invalid fixtures.

## Security considerations

Consumers should validate identifiers at trust boundaries and before using them in URLs, indexes, caches, logs, or lookup keys.

Canonical ID parsing must not:

- execute URI schemes;
- interpret segments as filesystem traversal;
- accept percent-decoded separators;
- case-fold or Unicode-normalize identifiers during lookup;
- accept numeric database IDs as a fallback;
- infer identity from normalized names;
- automatically promote external/source-local identifiers into the `mw:` namespace.

Identity reconciliation remains an explicit domain operation, not a string sanitation feature.

## Deferred work

P1-001 intentionally establishes the lexical and identity boundary only.

- **P1-002**: deterministic canonical serialization, hashing/digest scheme, generated assertion/evidence IDs, and deterministic collision policy.
- **P1-003**: exact schema for external identifiers, aliases, source-local identifiers, authority metadata, and reconciliation links.
- **P1-004**: cross-dataset dependency declarations, resolver behavior, packaging, and unresolved-reference handling.
- **P2 textual profile**: Work/Expression/Edition/Artifact/Passage/Content/Citation semantics and textual reference paths.
