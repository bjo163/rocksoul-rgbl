# P12-027 — Indonesian DN/MN/SN/AN audit

## Finding

The Indonesian Wikisource Sutta Piṭaka portal provides index pages for Dīgha, Majjhima, Saṃyutta, and Aṅguttara Nikāya. The pages display CC BY-SA licensing and identify substantial collection structure, but the index is not a complete translation corpus. During review, linked individual sutta/chapter pages included redlinks or index-only pages rather than a complete page-level text set.

The pinned revision IDs, timestamps, collection counts, and disposition are recorded in [`datasets/registries/p12-indonesian-nikaya-audit.json`](../datasets/registries/p12-indonesian-nikaya-audit.json). No text is bundled from this audit lane.

## Decision

P12-027 remains open. The source is accepted as a reproducible discovery lead and metadata-only candidate, not as Indonesian DN/MN/SN/AN coverage. A future ingest must enumerate every individual page, pin each revision and checksum, identify translation/authorship provenance, verify rights at the page/source level, and publish explicit completeness counts. Machine translation and unverified third-party ebook mirrors are excluded.

## External evidence

- [Sutta Piṭaka portal](https://id.wikisource.org/wiki/Sutta_Pi%E1%B9%ADaka) lists the four Nikāya collections.
- [Dīgha Nikāya index](https://id.wikisource.org/wiki/D%C4%ABgha_Nik%C4%81ya) states 34 suttas and displays CC BY-SA licensing, while individual links require separate availability checks.
- [Majjhima Nikāya index](https://id.wikisource.org/wiki/Majjhima_Nik%C4%81ya) states 152 suttas and displays CC BY-SA licensing, while the linked chapter pages are not a complete bundled text set.
