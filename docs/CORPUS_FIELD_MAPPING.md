# Corpus-to-Consumer Field Mapping

This is an integration contract, not an application ORM schema. The consumer owns its projection model.

| Corpus field | Meaning | Consumer expectation |
| --- | --- | --- |
| `id` | Stable canonical record identifier | Preserve as the source record key; do not mint a replacement identity during import. |
| `kind` | Typed corpus domain/kind | Use to route records; do not infer theology or admissibility from the kind alone. |
| `record_type` | JSON Schema record envelope type | Validate before import and retain for round-trip provenance. |
| `labels` | Localized labels with explicit roles/language/script | Preserve language, script, and role boundaries. |
| `extensions.textual` | Work, edition, passage, expression, and content relationships | Project hierarchy without flattening citation or edition boundaries. |
| `extensions.source` | Source descriptor, rights, attribution, provider, and retrieval metadata | Preserve source provenance and rights; do not replace it with consumer policy. |
| `extensions.provenance` / provenance records | Acquisition and derivation history | Retain source revision, activity, and software metadata where present. |
| `text` / textual content fields | Original or translated textual representation | Preserve the original field and language; translations remain distinct witnesses. |
| `language` / `script` | Language and writing system | Treat as explicit dimensions, not display-only metadata. |
| `edition` / edition references | Specific source edition or witness | Keep edition identity separate from work, source, and endpoint identity. |
| `source_reference` / upstream identifiers | Link to upstream evidence | Keep the identifier and resolver/source context intact. |

The consumer may add application-specific graph edges, policy, lifecycle, and indexing fields. Those fields are not authoritative corpus fields.
