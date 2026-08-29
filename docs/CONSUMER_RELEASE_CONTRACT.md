# MoonWitness Corpus Consumer Release Contract

`moonwitness-corpus` is the canonical upstream corpus. A MoonWitness application database is a consumer-side projection and is not an authoring source for this repository.

## Release identity

Every consumer release is identified by the tuple:

```text
corpus version + Git commit SHA + artifact SHA-256
```

The machine-readable contract is generated beside the release artifact as:

```text
dist/release/moonwitness-corpus-<version>.jsonl.manifest.json
```

It names the corpus version, commit, schema version, upstream registry version, artifact path, byte size, SHA-256, record count, domain counts, and rights metadata.

## Consumption modes

Development integration may pin a specific `dev` commit and verify the generated manifest and checksum. Production integration must use an immutable tagged GitHub Release asset; `dev`, `main`, and `latest` are not immutable production identities.

Build and validate locally:

```bash
pnpm build:release
pnpm validate:release
```

The canonical authoring files remain UTF-8 JSON/JSONL validated against JSON Schema 2020-12. Generated SQLite, search indexes, and consumer artifacts are projections/distribution outputs, never the canonical source.

## Rights and provenance

Consumers must preserve the per-dataset license, attribution, provider, edition, language, source, and provenance fields. Rights are authoritative in each dataset manifest, README, and record provenance data. Unclear rights remain review-required and are not silently treated as unrestricted.

If a source record disappears from a later release, the consumer must decide its application lifecycle; absence is not an automatic deletion command.

## GitHub distribution

The existing manual release workflow uploads the generated release bundle and can create a GitHub Release only when explicitly requested. It does not publish every `dev` push as production.
