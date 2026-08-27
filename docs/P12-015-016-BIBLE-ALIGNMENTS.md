# P12-015–016 — Bible passage alignments

`scripts/materialize-bible-alignments.ts` emits 30,948 passage-reference alignments from the pinned OSHB/WLC, SBLGNT v1.2, and WEB Classic 2020 datasets. The method joins only mapped book code plus exactly equal chapter and verse.

The links are `corresponding_passage` metadata, not assertions of textual, translation, canonical, or semantic identity. Unmatched verse boundaries, absent books, and distinct versification remain explicit gaps.
