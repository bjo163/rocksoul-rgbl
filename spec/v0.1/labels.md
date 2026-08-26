# Multilingual labels — v0.1

Labels are human-facing descriptive names/titles, not identity.

Each label has required `value` and `role`, where `role` is `preferred` or `alternate`. `language` is an optional BCP 47-style language tag and `script` is an optional ISO 15924 code such as `Latn`, `Arab`, or `Hebr`.

```json
{
  "value": "Musa",
  "role": "preferred",
  "language": "id",
  "script": "Latn"
}
```

A record may have multiple preferred labels across different language/script scopes, but at most one preferred label for the same exact `(language, script)` pair. Multiple alternate labels are allowed.

Labels never mint or merge canonical identity. Similarity between names or transliterations must not automatically imply `same_as`. Changing a preferred label does not rename a published canonical ID.

Label Unicode text is preserved. Search normalization and transliteration are derived representations and must not overwrite the authored/curated label.
