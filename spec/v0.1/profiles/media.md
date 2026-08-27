# Media and IIIF profile

`media.iiif_artifact` records a reference to an IIIF Presentation manifest or Image API service. It may identify a canvas, page, image region, or target resource using the URI conventions published by the provider.

IIIF references are descriptive access pointers. They do not copy or relicense remote bytes, and they do not establish that a scan is the original, complete, authentic, canonical, or authoritative witness. Rights and artifact integrity remain represented by the source profile when bytes are bundled or mirrored.

`media.selector` addresses a fragment of an audio, video, image, or other media resource. Time ranges use seconds and must be non-negative; track, language, and fragment URI values preserve provider-specific addressing. A selector is navigation metadata, not a copied media payload or a claim that the selected fragment has independent rights.
