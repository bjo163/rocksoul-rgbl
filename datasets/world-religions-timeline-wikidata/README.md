# Wikidata referenced timeline claims

This bounded metadata dataset normalizes only referenced Wikidata `P569` (date of birth) and `P570` (date of death) claims for people already present in the world-religions baseline. It is not a complete historical chronology.

The raw, pinned Special:EntityData records remain authoritative in `datasets/registries/snapshots/wikidata`. Each event retains the source QID, statement IDs, reference identifiers, source precision, and alternate values when claims disagree. Event IDs are deterministic from the canonical person identity and Wikidata property. No tradition, work, place, or era relationship is added without an explicit source claim.

Source provenance, retrieval date, license, and snapshot checksum are recorded in `source-manifest.json`; the bundled rights basis is Wikidata CC0-1.0 structured data.
