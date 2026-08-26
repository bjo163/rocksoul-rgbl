# Quran — Tanzil Uthmani v1.1 ingestion recipe

This recipe consumes the pinned, verbatim Tanzil Uthmani v1.1 snapshot under `source/` and maps all 6,236 ayahs into the generic textual profile.

The text normalizer is intentionally an identity function. Tanzil permits redistribution under CC BY 3.0 subject to attribution and its additional requirement that the Quran text not be changed. The raw source includes the upstream copyright notice and is checksum-pinned.

Upstream: https://tanzil.net/download/
Pinned acquisition mirror: dotquran/corpus commit `c23f5cec2e95e253dc450bd0f34d09e37ba40fac`.
