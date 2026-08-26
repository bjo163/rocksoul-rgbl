# Textual Profile v0.1

Profile identifier: `textual@0.1`

The textual profile extends the six core record families without creating religion-specific core primitives. Textual objects are represented as core `resource` records whose `kind` is one of the `textual.*` kinds and whose profile payload lives under `extensions.textual`.

## Resource model

```text
Work
  ↓ expressed as
Expression
  ↓ realized by
Edition
  ↓ represented by
Artifact

Any Work / Expression / Edition / Artifact
  ↓ contains an arbitrary-depth structural tree
Passage
  ↓ carries language/script-specific text
Content
```

Additional structural resources are `CitationScheme`, `Alignment`, and `Variant`.

### Work

`textual.work` is the abstract textual identity. It is not a claim that a work is revealed, canonical, authentic, or normatively authoritative. Those are contextual assertions or assessments.

### Expression

`textual.expression` represents a language-, recension-, translation-, transliteration-, revision-, or adaptation-level expression of a work. `work` is required. `relations` may explicitly connect one expression to another with a structural relation such as `translation_of` or `recension_of`.

### Edition

`textual.edition` is an editorial/published realization of one or more expressions. Bibliographic and rights metadata are deliberately left for later source/bibliographic profiles.

### Artifact

`textual.artifact` is a concrete representation of a work, expression, or edition. The P2 contract only establishes the textual relationship and optional representation/media hints. URI, byte size, cryptographic hashes, availability, and rights are strengthened by the provenance/source/artifact work in P3.

### Passage

`textual.passage` is an addressable structural unit. `unit` is an open semantic string such as `surah`, `ayah`, `book`, `chapter`, `verse`, `canto`, `hymn`, `stanza`, `folio`, or `line`. No hierarchy is hard-coded. `parent` can form an arbitrary-depth tree and all parent/child passages must share a `container`.

### Citation scheme

`textual.citation_scheme` defines an ordered list of citation components. A passage citation points to one named scheme and stores both a display `reference` and a machine-stable `path` array. A path is canonical only within the named scheme; it is not a globally intrinsic identity for the passage.

### Content and derivation

`textual.content` attaches text to a textual resource, normally a passage. Content declares `language`, optional `script`, and one representation class:

- `source`: exact text as imported at the canonical source boundary;
- `diplomatic`: source-preserving transcription intended to retain visible/source distinctions;
- `normalized`: deterministic normalized text derived from another content record;
- `search`: potentially lossy search-oriented normalization derived from another content record.

`normalized` and `search` content must declare `derived_from`. Derivation relations include translation, transliteration, normalization, search normalization, transcription, correction, and an explicit `other` escape hatch. A `source` content record must not derive from another content record.

### Alignment

`textual.alignment` represents an explicit many-to-many correspondence between passage/content targets. It may carry text selectors, method text, and provenance. Alignment means correspondence under the recorded method; it does not imply identity or theological equivalence.

### Variant

`textual.variant` records a locus and two or more readings. Each reading is supported by one or more witnesses and is represented either by a content reference or inline text. The model deliberately has no required `base`, `original`, `correct`, or `preferred` reading.

## Text selectors

The profile provides Web-Annotation-inspired selectors:

- `TextQuoteSelector` — exact text with optional prefix/suffix context;
- `TextPositionSelector` — zero-based half-open character offsets `[start, end)`;
- `RangeSelector` — a range bounded by two quote/position selectors.

Selectors may be used by alignment/variant targets. On datasets declaring `textual@0.1`, recognized selector types on core Evidence records are also validated by the textual selector schema.

## Validation invariants

In addition to JSON Schema, the validator enforces:

- textual resource ID kind matches the textual resource kind;
- typed structural references point to compatible textual resource kinds;
- parent passages share their container and cannot form cycles;
- sibling passage `sequence` values are unique when present;
- citation paths do not exceed scheme depth and their terminal component matches passage `unit` when the scheme declares a unit;
- citation component keys are unique;
- source content is not derived from another content record;
- content derivation cannot self-reference or form cycles;
- alignment and variant selectors have valid position ordering;
- variant witness/content references have compatible resource kinds;
- profile data requires a dataset manifest declaration of `textual@0.1`.
