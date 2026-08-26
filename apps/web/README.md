# Corpus Web

Reserved for the public MoonWitness Corpus Explorer.

The web application must consume corpus data through the repository/client abstractions in `packages/`; it must not import files from `datasets/` directly. This keeps the UI independent from canonical filesystem layout and allows local-file, generated-index, HTTP, and future service backends.
