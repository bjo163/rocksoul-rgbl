# Ingestion

Ingestion is the reproducible supply chain from external source material to canonical dataset records.

Expected stages:

```text
source
  -> fetch/snapshot
  -> verify raw artifact checksum
  -> parse
  -> normalize deterministically
  -> curate/reconcile explicitly
  -> validate
  -> dataset release
```

Production MoonWitness runtime should consume a pinned corpus release; it should not depend on live external websites for canonical seed data.

Source-specific parsers should be isolated as recipes/adapters rather than one parser containing corpus-name conditionals.
