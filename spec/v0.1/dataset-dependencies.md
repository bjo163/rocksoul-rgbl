# Cross-dataset references and dependency resolution — v0.1

## Purpose

This document defines P1-004: how a dataset declares that it depends on another dataset release and how canonical references are interpreted across dataset boundaries.

The design separates two concerns:

```text
canonical ID       = semantic object identity

dataset dependency = which exact dataset release is allowed to supply that object
```

A canonical ID never contains a dataset path or dataset version merely to make resolution convenient.

## Canonical reference syntax

Cross-dataset canonical references use the **same bare canonical ID syntax** as local references:

```text
mw:person:example
mw:work:example-text
mw:assertion:v1:sha256:...
```

There is no v0.1 syntax such as:

```text
../other-dataset/entities.jsonl#123
other-dataset@1.0.0:mw:person:example
registry/path/to/file
```

The record field identifies the semantic object. The containing dataset manifest declares which external dataset releases may satisfy references to objects that the dataset does not own locally.

## Dependency declaration

A dataset manifest may declare:

```json
{
  "id": "mw:dataset:example:consumer",
  "datasetVersion": "1.0.0",
  "dependencies": [
    {
      "dataset": "mw:dataset:example:text-a",
      "version": "2.1.0"
    },
    {
      "dataset": "mw:dataset:example:text-b",
      "version": "1.4.3"
    }
  ]
}
```

Each dependency has exactly two identity fields in v0.1:

```text
dataset   repository-global canonical dataset ID
version   exact pinned dataset release version
```

Dependency declarations MUST NOT use filesystem paths as identity.

## Exact version pinning

V0.1 dependency manifests require an exact `MAJOR.MINOR.PATCH`-style version, optionally with pre-release/build components.

Valid examples:

```text
0.1.0
1.2.3
1.2.3-alpha.1
1.2.3+build.5
```

Invalid dependency selectors:

```text
^1.2.3
~1.2.3
1.x
1.2
*
latest
```

The reason is reproducibility. Given one released consumer manifest, dependency resolution must not change because a newer compatible-looking dataset happened to be published later.

P8 may strengthen or formalize the release-version grammar, but it must preserve the v0.1 rule that a released dataset dependency resolves to one exact dataset release rather than a floating range.

## Dependency-list invariants

A dataset MUST NOT depend on itself.

A v0.1 dependency list MUST NOT declare the same canonical dataset identity more than once, even with different versions. One resolution graph uses one exact version per dataset identity.

Example invalid list:

```json
[
  { "dataset": "mw:dataset:b", "version": "1.0.0" },
  { "dataset": "mw:dataset:b", "version": "2.0.0" }
]
```

This prevents resolution behavior from depending on lookup order.

## Direct dependency rule

A dataset may always reference canonical records it owns locally.

If a record is owned by another dataset, the referencing dataset MUST declare that owning dataset as a **direct dependency**.

A transitive dependency does not silently grant reference permission.

Example:

```text
A depends on B
B depends on C
```

B may reference C according to B's manifest. A does not gain permission to author new direct references to C merely because C appears in B's transitive closure. If A directly references an object owned by C, A declares C directly as well.

This keeps authored dependencies explicit and prevents a change inside B's dependency graph from silently changing the meaning of A's declared requirements.

## Resolution model

A full resolver is implemented later in the repository/build layer (P6), but all compliant resolvers MUST implement the following semantics.

For a dataset `(id, version)`:

1. load and validate its manifest;
2. resolve every direct dependency by exact canonical dataset ID + exact version;
3. recursively load dependency manifests to create the dependency closure;
4. reject dependency cycles;
5. reject a closure that requires two different versions of the same canonical dataset ID;
6. build or consult an ownership index mapping canonical record IDs to the dataset release that defines them;
7. resolve a canonical record reference against the current dataset first;
8. if not local, require the owning dataset to be declared as a direct dependency of the referencing dataset;
9. require exactly one owning record for the canonical ID;
10. report zero matches as an unresolved/dangling reference and multiple owners as an ownership/duplicate-ID error.

Lookup order MUST NOT choose between ambiguous providers.

## Dataset registry versus dataset identity

A workspace/release registry may map:

```text
mw:dataset:example:text-a @ 2.1.0
```

to a local path, GitHub release artifact, object-store URI, or another distribution locator.

That locator is operational metadata. Moving a dataset directory or release archive does not change its canonical dataset ID or dependency declaration.

The current `datasets/registry.json` is a workspace catalog, not part of canonical record identity.

## Dataset version versus canonical record identity

The same canonical semantic object may exist across several versions of one dataset:

```text
mw:person:example
```

Its canonical ID remains stable while the pinned dataset version determines which released representation/revision is consumed.

A dependency update from `1.0.0` to `1.1.0` therefore changes the selected dataset release, not the canonical identity syntax used by references.

If a newer dataset version deletes, replaces, or deprecates a referenced record, the consumer must pass reference validation again before updating its dependency pin.

## Dataset ownership

Canonical authoring treats a record as owned/defined by one dataset in a resolved dependency graph. Other datasets reference that record by canonical ID instead of copying it as a second authored definition.

If the same canonical ID is defined by multiple dataset providers in one resolution graph, the resolver MUST report an ownership conflict rather than choosing one by order.

Generated aggregate distributions may physically materialize or denormalize records for performance; that does not change authored ownership and must remain reproducible from canonical dataset packs.

## Cycles

Dataset dependency cycles are invalid in v0.1.

Invalid:

```text
A -> B -> C -> A
```

Cycles make release construction, ownership validation, and deterministic dependency closure unnecessarily ambiguous. Shared records should instead live in an explicit lower-level dataset that dependents reference.

## Missing dependencies

A dependency declaration whose exact `(dataset ID, version)` cannot be resolved is an error for a complete build/release.

A tooling mode may inspect an incomplete checkout and report unresolved dependencies without downloading them, but it MUST NOT claim the dataset is fully validated or reproducible until every required dependency is resolved.

V0.1 dependencies are required. Optional/peer dependency semantics are intentionally not defined yet.

## Cross-dataset reference example

Dataset B defines:

```json
{
  "id": "mw:person:example",
  "record_type": "entity",
  "kind": "person"
}
```

Dataset A declares:

```json
{
  "id": "mw:dataset:example:a",
  "datasetVersion": "1.0.0",
  "dependencies": [
    { "dataset": "mw:dataset:example:b", "version": "2.0.0" }
  ]
}
```

An assertion in A may then use:

```json
{
  "subject": "mw:person:example"
}
```

The assertion does not encode `example:b` or `2.0.0` into the subject reference. The manifest pin provides release resolution; `mw:person:example` provides semantic identity.

## Relationship to P1-005

P1-004 defines the contract and resolution semantics.

P1-005 implements referential-integrity validation over actual canonical record fields and reports dangling references according to this dependency model.

P6 later implements the reusable dataset registry/dependency resolver used by applications and build artifacts. P1-004 deliberately does not couple the specification to one filesystem or database implementation.

## Compatibility

`dependencies` is optional, so existing standalone fixture datasets remain valid.

Changing `dataset.id` validation from arbitrary string to canonical ID is compatible with the existing fixture because it already uses `mw:dataset:...` identity.

No existing canonical record ID changes are required.
