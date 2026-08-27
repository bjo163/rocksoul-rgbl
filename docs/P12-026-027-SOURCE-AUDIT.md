# P12-026 / P12-027 source audit

## P12-026 — Indonesian Dhammapada

Candidate: *Kitab Suci Dhammapada*, LP2KBI under Bimas Buddha Kementerian Agama, 2011. The public mirror identifies the original government source and describes the work as public domain in Indonesia. The source PDF is 200 pages and was visually inspected at its cover page.

Current decision: do not ingest extracted verse text yet. The repository runtime has no `pdftotext` or Indonesian OCR language model, and the PDF is image-oriented. A future ingestion must preserve page/verse provenance and independently verify OCR against the rendered pages. Until then this remains a rights-verified, extraction-pending candidate rather than a falsely complete text dataset.

Reference: Wikimedia Commons file `Kitab_Suci_Dhammapada.pdf`, source URL in its metadata.

## P12-027 — Indonesian DN/MN/SN/AN

SuttaCentral history confirms Indonesian publication activity and identifies Dīgha coverage plus partial Saṃyutta coverage, but the discovery result does not establish a redistributable license for a complete human Indonesian corpus. The existing pinned Sujato data is English CC0 and cannot be relabeled as Indonesian.

Current decision: keep Indonesian DN/MN/SN/AN gaps explicit. No machine translation, scraped mirror, or unlicensed republication is added. Ingest can proceed when a publisher/source provides a complete human translation with redistribution terms or a compatible public repository license.
