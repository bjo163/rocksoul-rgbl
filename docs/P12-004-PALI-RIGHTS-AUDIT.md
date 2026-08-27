# P12-004 — SuttaCentral Pali Dhammapada rights audit

Audit date: 2026-08-27

## Exact source

- Repository: `https://github.com/suttacentral/bilara-data`
- Branch: `published`
- Pinned commit: `cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6`
- Source family: `root/pli/ms/sutta/kn/dhp/*_root-pli-ms.json`
- Expected files: 26 chapter/range JSON files, matching the published Dhammapada segmentation.

## Rights finding

The pinned repository `LICENSE.md` states that translations created in Bilara and supported by SuttaCentral are dedicated to the public domain under CC0. That statement does not expressly grant redistribution rights for the separate `root/` Pali files or identify the rights holder/edition terms for the Mahāsaṅgīti root text. A general public-domain claim about ancient source material is not sufficient to clear a modern edition, transcription, segmentation, or database arrangement.

Decision: **do not bundle the Pali root bytes**. Record the exact source and pin as `metadata_only`/`external` until an edition-specific redistribution grant is obtained. The existing CC0 license evidence for the Sujato English translation must not be reused for the Pali root.

## Consequences

- P12-005 is satisfied through an explicit metadata-only decision.
- P12-006 remains conditional; no bundled Pali↔English alignment is generated while the Pali representation lacks cleared redistribution rights.
- Any future rights clarification must update this audit, add exact artifact checksums, and undergo a new review before changing availability to `bundled`.

Evidence: [pinned Bilara license](https://github.com/suttacentral/bilara-data/blob/cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6/LICENSE.md), [pinned Pali source directory](https://github.com/suttacentral/bilara-data/tree/cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6/root/pli/ms/sutta/kn/dhp).
