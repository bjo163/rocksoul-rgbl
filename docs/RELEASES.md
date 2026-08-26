# Release model

MoonWitness Corpus keeps four version domains separate:

1. **Spec version** — owned by `spec/` and schema/profile contracts (currently `0.1`).
2. **Package version** — SemVer in each package `package.json`.
3. **Dataset version** — SemVer in each dataset `manifest.json`.
4. **Aggregate corpus release version** — SemVer in `release/corpus-release.json`.

Changing one domain never implicitly rewrites another.

## Local release build

After a normal corpus build:

```bash
pnpm build
pnpm release:prepare
```

`release:prepare` creates deterministic release material under `dist/release/`:

- npm tarballs for all public/runtime packages;
- `corpus.jsonld` — a conservative JSON-LD projection of canonical records;
- `ro-crate-metadata.json` — an RO-Crate metadata view over release artifacts;
- `release-manifest.json` — machine-readable versions, datasets, packages, and artifact digests;
- `SHA256SUMS` — SHA-256 checksums for release files.

`pnpm release:verify` builds the release twice and requires the release manifest and checksum file to
be byte-identical.

## Package version changes

P8 uses repository-native change plans in `release/changes/`. A plan can bump individual package
versions and/or the aggregate corpus release version. It cannot mutate spec or dataset versions.

```bash
pnpm release:version release/changes/example.json
```

This is intentionally equivalent in role to Changesets while adding no release-time dependency.

## GitHub Actions

`.github/workflows/release.yml` is manual by design. Every run builds and uploads the release bundle.
Optional npm publication and GitHub Release creation are explicit inputs.

npm publication additionally checks the publication gate and requires registry credentials. The
workflow cannot bypass unresolved license/scope ownership decisions.
