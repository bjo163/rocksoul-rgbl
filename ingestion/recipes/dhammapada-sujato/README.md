# Dhammapada — Bhikkhu Sujato complete ingestion recipe

This recipe ingests the complete English Dhammapada from SuttaCentral Bilara at the exact `published` commit `cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6`.

## Acquisition

Run:

```bash
node scripts/acquire-dhammapada-sujato.mjs
```

The acquisition script downloads the 26 exact chapter/range translation files from the pinned commit, preserves their bytes, computes SHA-256 and Git blob SHA-1 values, and writes `source/source-manifest.json`. `recipe.json` pins that source-manifest checksum and byte size.

## Mapping

The recipe verifies every source file against the manifest, preserves each Bilara segment value without text normalization, and maps the source to the generic textual profile as 26 chapters, 423 stanzas, and source segments. The English expression remains explicitly a translation of a Pali expression; this recipe does not bundle a Pali text.

Materialized dataset output is stored in `datasets/dhammapada-sujato/` and is checked for byte-for-byte reproducibility by the repository test suite. The separate `pali-root-rights-audit.json` records why the Pali root is metadata-only and why no Pali bytes or alignment are generated here.
