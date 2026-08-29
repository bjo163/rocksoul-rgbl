# Knowledge Domain Contract

The corpus exposes an evidence-backed knowledge-domain audit over the canonical JSON/JSONL records. It does not replace the upstream registry or create an application ORM/database.

```text
tradition ─ person ─ event ─ place
     │        │        │
     ├─ work  ├─ work  ├─ work
     ├─ source └─ era  └─ era
     └─ language
```

Run the repository-derived audit with:

```bash
pnpm audit:knowledge
```

The output is `dist/knowledge-domain-audit.json`. Entity identity is the existing canonical `id`; aliases remain labels with explicit roles; external identifiers and provenance remain attached to the source records. Relationship counts are derived only from explicit assertion subject/object references and textual metadata.

Evidence status must remain distinguishable as `SUPPORTED`, `TRADITIONAL`, `INFERRED`, `UNCERTAIN`, `DISPUTED`, or `UNKNOWN`. The auditor reports orphan entities as coverage gaps and never creates edges to eliminate them.

Temporal entities use `event` and `era` identities when present. Dates are not inferred from names, doctrine, or model knowledge. An absent event/era record is reported as zero coverage rather than supplemented with fabricated historical claims.

The current baseline contains a bounded, Wikidata-sourced tradition/person/geography dataset with source snapshot provenance. Application-specific admissibility, lifecycle, and graph policy remain outside this corpus.
