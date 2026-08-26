# Referential integrity — v0.1

## Purpose

P1-005 requires canonical references to be more than syntactically valid strings. Every universal core reference must resolve to a known canonical object, canonical dataset manifest, or registered specification vocabulary value, and cross-dataset references must obey the exact direct-dependency contract from [`dataset-dependencies.md`](dataset-dependencies.md).

A record that passes JSON Schema but points to missing/undeclared canonical objects is not a valid complete corpus record graph.

## Universal core reference fields

V0.1 validates these fields as canonical references:

### Assertion

```text
subject
predicate
object.entity
evidence[]
provenance
scope.<key> when the scope value uses mw: canonical-ID syntax
```

Literal assertion objects do not create a canonical reference from `object.value`.

### Evidence

```text
target
provenance
```

Evidence selector internals are profile/selector-specific and are not recursively interpreted as references by the universal validator.

### Provenance

```text
source
```

### Assessment

```text
target
assessor
evidence[]
```

### Entity and Resource

The current universal Entity and Resource schemas contain no additional canonical-reference fields beyond their own `id`. Future profile fields must define their own reference semantics explicitly.

## Extensions are not guessed

The validator MUST NOT recursively scan arbitrary `extensions` objects and interpret every `mw:`-looking string as a reference.

Extensions and profiles may contain opaque strings, quoted source text, identifiers, or profile-specific structures. A profile becomes reference-aware only when its schema/specification explicitly declares the relevant fields.

This avoids hidden semantics and false dangling-reference failures.

## What counts as a resolvable target

A universal reference may resolve to:

1. a canonical record ID defined by a dataset in the validated workspace/dependency graph;
2. a canonical dataset manifest ID;
3. a canonical vocabulary ID registered under the v0.1 specification vocabulary, such as `mw:predicate:mentions`.

Vocabulary IDs are specification-owned constants and do not require a dataset dependency.

## Local references

If the target record is defined by the same dataset as the referencing record, the reference is local and requires no dependency declaration.

## Cross-dataset references

If the target record is owned by another dataset, the source dataset must declare that target dataset directly and pin exactly the version that supplies the target.

Example:

```json
{
  "dependencies": [
    { "dataset": "mw:dataset:example:provider", "version": "2.0.0" }
  ]
}
```

A target merely being present somewhere in the repository is not enough. This prevents accidental hidden dependencies caused by workspace layout.

## Dangling references

A canonical reference is dangling when no allowed target can be found.

Examples:

```text
subject -> mw:person:missing
provenance -> mw:provenance:missing
evidence[0] -> mw:evidence:missing
```

A complete repository validation reports these as errors.

Missing data is not interpreted as false. A dangling reference is a corpus integrity problem, not an epistemic statement about whether the referenced religious/historical object exists.

## Vocabulary references

Predicates such as:

```text
mw:predicate:mentions
```

may be supplied by specification vocabulary registries rather than dataset records. The validator loads vocabulary IDs from `spec/v0.1/vocab/*.json` and treats registered IDs as resolvable specification objects.

Unregistered arbitrary `mw:predicate:*` strings remain unresolved.

## Dataset dependency validation

Workspace validation also checks that every declared exact dependency can be found among the loaded dataset manifests and that the loaded dataset version matches the pinned version.

For example:

```text
consumer requires provider@2.0.0
workspace contains provider@1.0.0
```

is invalid for a complete build.

P6 may add remote/release locators to the reusable resolver. A tool operating on an intentionally incomplete checkout may later distinguish partial validation from complete validation, but it must not report the graph as fully reproducible while required dependencies are absent.

## Duplicate canonical IDs

A canonical record ID may have one authored owner in a resolved graph.

If the same canonical ID is defined more than once, the validator reports a duplicate ownership error. References to that ID are ambiguous and are also reported as such rather than being resolved by file order.

Generated distribution artifacts may duplicate physical representations for query performance; those artifacts are not authored canonical dataset ownership.

## Scope values

The current Assertion scope schema permits strings because P1-009 has not yet finalized scope semantics.

For forward safety, a scope value beginning with `mw:` is interpreted as an intended canonical reference and must resolve. Other scope strings remain literal/current-scope values until P1-009 defines stricter envelopes.

## Validation ordering

Reference validation runs after structural schema validation and after all dataset records have been indexed.

Conceptually:

```text
manifest/schema validation
        ↓
partition discovery
        ↓
record schema validation
        ↓
global canonical ID ownership index
        ↓
vocabulary identity index
        ↓
reference resolution
        ↓
direct dependency/version check
```

This ordering ensures forward references and file ordering do not matter.

## Non-goals

P1-005 does not infer:

- `same_as` from external identifiers;
- truth/falsity from missing relations;
- profile-specific links hidden in extensions;
- database foreign keys;
- network fetching of missing records;
- optional dependency behavior.

## Compatibility

The existing minimal synthetic dataset remains valid because its subject/object/evidence/provenance references resolve locally and its predicate resolves through the specification predicate vocabulary.

Datasets that previously contained dangling canonical references will now fail repository validation. This is intentional: a syntactically valid unresolved graph is not a complete canonical corpus release.
