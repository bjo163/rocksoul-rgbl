# Contextual profiles

Contextual profiles describe time and place without turning uncertain historical claims into hidden entity fields. They are source-attributed records that may be attached to entities, works, expressions, events, or assertions through canonical references.

## Temporal profile

`contextual.temporal` records a calendar-aware point or range. A point has one authored value; a range has `earliest` and `latest` bounds. Values are preserved as published strings because calendars and dating conventions differ. `precision`, `uncertainty`, `calendar`, and `note` describe the claim and do not imply false precision.

## Geography profile

`contextual.geography` records a place association between a target and a place entity. The relation is explicit (`origin`, `located_in`, `associated_with`, `attested_in`, or `published_in`) and must carry source/evidence/provenance when asserted. Geography is not an intrinsic definition of a tradition, person, or work.

Both profiles are descriptive and compatible with multiple competing source claims. They do not define chronology truth, canonical borders, religious authority, or modern political status.
