# P12-026 / P12-027 source audit

## P12-026 — Indonesian Dhammapada

Candidate: *Kitab Suci Dhammapada*, LP2KBI under Bimas Buddha Kementerian Agama, 2011. The public mirror identifies the original government source and describes the work as public domain in Indonesia. The source PDF is 200 pages and was visually inspected at its cover page.

Current decision: keep the LP2KBI PDF as an extraction-pending candidate. The repository runtime has no `pdftotext` or Indonesian OCR language model, and the PDF is image-oriented. A future ingestion must preserve page/verse provenance and independently verify OCR against the rendered pages.

Alternative now bundled: `mw:dataset:dhammapada:indonesian-wikisource` pins Wikisource revision 198106 and provides a human Indonesian expression with 422/423 numbered stanzas. Wikisource's page contains a formatting exception for stanza 165 and no stanza 359; the latter is recorded as an explicit gap. The dataset is CC BY-SA 4.0, has deterministic source checksums, and structurally aligns the 422 available stanza numbers to the existing Sujato passage IDs without asserting semantic equivalence. This strengthens the corpus while keeping the LP2KBI candidate and the missing stanza auditable.

Reference: Wikimedia Commons file `Kitab_Suci_Dhammapada.pdf`, source URL in its metadata.

## P12-027 — Indonesian DN/MN/SN/AN

SuttaCentral history confirms Indonesian publication activity and identifies Dīgha coverage plus partial Saṃyutta coverage, but the discovery result does not establish a redistributable license for a complete human Indonesian corpus. The existing pinned Sujato data is English CC0 and cannot be relabeled as Indonesian.

The Indonesian Wikisource Sutta Piṭaka portal is now pinned as a discovery lead. It exposes DN/MN/SN/AN index structure and CC BY-SA notices, but it does not establish complete page-level Indonesian text availability; linked units include redlinks/index-only pages. The reproducible audit is in [`docs/P12-027-INDONESIAN-NIKAYA-AUDIT.md`](P12-027-INDONESIAN-NIKAYA-AUDIT.md).

Current decision: keep Indonesian DN/MN/SN/AN gaps explicit. No machine translation, incomplete index, scraped mirror, or unlicensed republication is added. Ingest can proceed when a complete human translation is enumerated with per-page revision/checksum, translation provenance, and redistribution terms.
