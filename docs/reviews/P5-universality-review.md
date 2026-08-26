# P5 universality review

## Scope

P5 tests the same core + `textual@0.1` + `source@0.1` model against two real source families:

1. Tanzil Quran Uthmani v1.1 — Arabic, 114-surah / 6,236-ayah structure.
2. SuttaCentral Dhammapada 1–20 (Bhikkhu Sujato) — English Bilara segments represented as chapter / stanza / segment.

## Findings

The six core record types remain religion-neutral. No Quran-, Islam-, Buddhism-, or Dhammapada-specific field was added to core schemas.

Textual units such as `surah`, `ayah`, `chapter`, `stanza`, and `segment` occur only as data values inside the generic passage/citation profile. They are not schema primitives or enums.

`Work`, `Expression`, `Edition`, `Artifact`, `Passage`, `Content`, `CitationScheme`, and `Alignment` remain applicable to both datasets.

Source rights are artifact-specific: Tanzil's CC BY 3.0 + source-specific no-modification condition is distinct from the SuttaCentral translation's CC0 dedication. The corpus does not infer rights from the age or religious status of a work.

The cross-tradition fixture uses `textual.alignment` only to prove dependency/reference mechanics and explicitly denies identity/equivalence semantics.

## Vocabulary review

P5 does not require adding Abrahamic role concepts, Buddhist doctrinal concepts, or religion-specific predicates to the core vocabulary. Any future concepts such as prophet, bodhisattva, arahant, revelation, canon, lineage, or doctrinal authority must remain entities/assertions/assessments or profile-specific data rather than universal core booleans.

## Result

P5 provides evidence that the current core + textual profile is structurally reusable across two religious traditions with materially different source organizations without changing the universal core.
