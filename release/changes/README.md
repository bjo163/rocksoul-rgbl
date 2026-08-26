# Release change plans

MoonWitness Corpus uses a small repository-native change-plan workflow instead of a third-party
versioning dependency.

A pending plan is a JSON file in this directory (except this README) with this shape:

```json
{
  "format": "moonwitness-release-change-v1",
  "summary": "Describe the public change.",
  "packages": {
    "@moonwitness/corpus-core": "patch"
  },
  "corpusRelease": "patch"
}
```

Allowed bumps are `patch`, `minor`, and `major`. The package version and aggregate corpus release
version may move independently. Change plans intentionally cannot modify the spec version or any
dataset version.

Apply one plan with:

```bash
pnpm release:version release/changes/<plan>.json
```

The command updates only the package versions named by the plan and/or
`release/corpus-release.json`, then moves the consumed plan into `release/changes/applied/`.
Spec changes remain owned by `spec/`; dataset versions remain owned by dataset manifests.
