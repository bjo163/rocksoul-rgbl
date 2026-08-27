# Complete Dhammapada — Bhikkhu Sujato English translation

This dataset contains the complete English Dhammapada translation by Bhikkhu Sujato from SuttaCentral Bilara, pinned to `published@cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6`.

## Coverage

- 26 chapter/range source files.
- 26 chapter passages.
- 423 stanza passages (`1` through `423`) with no gaps.
- 1,774 source segment passages and 1,774 matching English content records.
- Bilara segment text is preserved exactly, including punctuation, inline markup, and trailing spaces.

The dataset replaces the earlier registered 1–20 proof dataset. The proof files remain historical repository material but are no longer listed in `datasets/registry.json`, preventing overlapping canonical record IDs from being loaded together.

## Source and reproducibility

The exact upstream files, stanza ranges, byte sizes, SHA-256 hashes, and Git blob SHA-1 values are recorded in `ingestion/recipes/dhammapada-sujato/source/source-manifest.json`. Run `node scripts/acquire-dhammapada-sujato.mjs` to reacquire the exact pinned files, then materialize through the ingestion recipe.

Canonical partition checksums are recorded in `CHECKSUMS.sha256`.

## Rights and remaining P12 gaps

The bundled Bhikkhu Sujato English translation is recorded as `CC0-1.0`; see `LICENSES/SUTTACENTRAL-CC0.md`.

This dataset does not bundle Pali/root content. The P12-004 audit records the exact Pali source and concludes that root-text redistribution rights are unresolved; the safe availability decision is metadata-only. Indonesian human-published coverage is also still missing and remains tracked separately. No machine or LLM translation is used to satisfy those gaps.
