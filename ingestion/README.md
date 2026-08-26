# Ingestion

Ingestion is the reproducible supply chain from external source material to canonical dataset records.

```text
source
  -> acquire/snapshot
  -> verify raw artifact SHA-256
  -> parse
  -> normalize deterministically
  -> map to core/profile records
  -> apply explicit curation/reconciliation overlays
  -> recipe-specific validate
  -> deterministic JSONL + checksum
  -> dataset release
```

The normative contract is documented in `spec/v0.1/ingestion.md` and `spec/v0.1/schemas/ingestion/`.

Recipes live under `ingestion/recipes/<recipe-id>/` and are registered by `ingestion/registry.json`. Source-specific parsing logic belongs inside the recipe rather than a central source-name switch.

HTTP acquisition is available only to explicit ingestion jobs and requires `--allow-network`. Repository validation and consumption of released datasets do not require network access.

Useful CLI commands:

```bash
moonwitness-corpus ingest mw:recipe:example:lines
moonwitness-corpus ingest <recipe> --allow-network
moonwitness-corpus checksum <file>
moonwitness-corpus validate
```

Production MoonWitness runtime should consume a pinned corpus release; it should not depend on live external websites for canonical seed data.
