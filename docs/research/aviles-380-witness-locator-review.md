# TEXT #380 — Avilés bounded witness-locator review (noncanonical)

- Owner: `bjo163/rocksoul-rgbl`; research issue: #380 (`ready_for_observation`).
- Canonical base checked: `main@df00706c98e21fb3fb0146b8389b0f2978f3d833` (2026-10-15 Asia/Jakarta).
- Review status: **locator-only staging**; not corpus extraction, candidate promotion, translation equivalence, or canonical truth.
- Source inspection: Spanish and Portuguese official SEGIB five-page PDFs inspected separately; page numbering below is **1-based PDF page**, not a claim of shared exact wording.

| Witness | Language | Commitment | PDF page | Exact-text authority | Publication provenance |
|---|---|---:|---:|---|---|
| ES-SEGIB-2026-AVILES | es | 1 | 2 | Spanish full-text SEGIB PDF | ES official publication + linked PDF |
| ES-SEGIB-2026-AVILES | es | 10 | 3 | Spanish full-text SEGIB PDF | ES official publication + linked PDF |
| ES-SEGIB-2026-AVILES | es | 21 | 5 | Spanish full-text SEGIB PDF | ES official publication + linked PDF |
| PT-SEGIB-2026-AVILES | pt | 1 | 2 | Portuguese full-text SEGIB PDF | PT official publication + linked PDF |
| PT-SEGIB-2026-AVILES | pt | 10 | 3 | Portuguese full-text SEGIB PDF | PT official publication + linked PDF |
| PT-SEGIB-2026-AVILES | pt | 21 | 5 | Portuguese full-text SEGIB PDF | PT official publication + linked PDF |

## Source registry (external links, no bundled bytes)

- ES landing: https://segib.org/es/publicacion/declaracion-de-aviles-sobre-trabajo/
- ES witness: https://segib.org/wp-content/uploads/2026/07/Declaracion_VI_Conferencia_Iberoamericana_Ministerial_de-Trabajo_29-06-2026.pdf
- PT landing: https://segib.org/pt/publicacion/declaracao-da-aviles-sobre-trabalho/
- PT witness: https://segib.org/wp-content/uploads/2026/07/Declaracao_VI_Conferencia_Ibero-Americana_Ministerial_do_Trabalho_29-06-2026.pdf

The **document date is 2 July 2026**, distinct from `29-06-2026` embedded in both filenames. Each language version is a separate published witness. A matching commitment number is a locator only, **not** textual identity, juridical equivalence, or an inferred source/translation direction.

## Gates and uncertainty

- Issue-first: #380 existed before this review. Both official full-text witnesses were inspected before these locators were staged.
- Partial duplicate screening against current `main`: code search for `Avilés`, `Aviles`, `Declaracion_VI_Conferencia`, and `Declaração de Avilés` returned no indexed matches; `datasets/registry.json` does not list an Avilés dataset. **This is not exhaustive candidate/canonical deduplication**.
- Rights/reissue/byte-size/SHA-256: **pending**; no PDF bytes bundled, no license inferred.
- Exact-text transcription/quotation, page-specific variant analysis, normalized text, translation alignment, PERSON identity, LAW/EVENT conclusions, and canonical IDs: **not created**.
- Cross-domain relationship handoff: none; `canonical_edge_created=false`.
- No scheduled correlation or automatic identity merging.

## Next gate

Complete exhaustive candidate/canonical deduplication and PDF byte-level provenance/rights review; then decide whether to promote this locator review to an owner-native candidate under specialist review. Run repository-declared `pnpm check` and GitHub CI before any merge. **ISSUE FIRST. SOURCE SECOND. CANON LAST.**
