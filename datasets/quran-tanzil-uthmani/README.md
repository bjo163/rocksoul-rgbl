# Quran — Tanzil Uthmani v1.1

A complete 6,236-ayah Arabic Uthmani textual dataset mapped to the religion-neutral MoonWitness Corpus textual profile.

## Source identity

- Upstream work/distribution: Tanzil Quran Text, Uthmani Version 1.1.
- Upstream page: `https://tanzil.net/download/`.
- Acquisition mirror: `dotquran/corpus` pinned at commit `c23f5cec2e95e253dc450bd0f34d09e37ba40fac`.
- Mirror file: `src/resources/uthmani.txt`.
- Bundled recipe snapshot: `ingestion/recipes/quran-tanzil-uthmani/source/quran-uthmani-tanzil-v1.1.txt`.
- SHA-256: `6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f`.
- Byte size: `1,396,087`.
- Acquisition timestamp used by the provenance record: `2026-08-26T21:02:01Z`.
- Language/script: Arabic / Arab.

The pinned source has 6,236 `surah|ayah|text` rows followed by the Tanzil copyright/redistribution notice. The recipe does not normalize or alter the Quran text; each content string is copied exactly from its source row.

## Rights

Tanzil distributes Quran Text v1.1 under Creative Commons Attribution 3.0 with source-specific conditions including attribution/link-back and a prohibition on changing the Quran text. The bundled raw snapshot retains the upstream notice. See `LICENSES/TANZIL.md` and the record `mw:resource:quran:tanzil-rights-notice`.

No translation is included in this dataset. Translation rights must be audited separately before bundling any translation.

## Structure

`Work → Expression(ar/Arab) → Edition → Artifact → Passage(surah → ayah) → Content`

`surah` and `ayah` are dataset values under the generic passage model; they are not core schema primitives.
