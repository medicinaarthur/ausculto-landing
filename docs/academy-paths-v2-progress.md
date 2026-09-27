# Academy paths v2 — approved implementation, in progress

Requested sequence: Residence → audited bank cards → ENAMED book → clinical tools; then full-width PRO and refined learning orbit.

Checkpoint before further visual corrections, requested by owner. This snapshot is not a production release. The deployable baseline is generated in dist/site, which is intentionally ignored by Git. Build scripts and source assets are preserved here.

Completed: read-only Firestore bank audit (40 banks, 14345 documents, 234 duplicate exam numbers, 14022 unique commented questions); original doctor/hand/book and tool icons packaged; imagegen book half/open, device and PRO plate generated; path markup/styles/controllers drafted.

Remaining: PRO and orbit integration, stylesheet consolidation, live visual review including hand, book and device projection; runtime/regression checks, build/manifest verification.

Ruling: imagegen returned opaque studio backdrops despite transparent prompts. Preserve original generated masters and use measured CSS geometry masks for the book frames, rather than painting/editing raster pixels or regenerating repeatedly.

Local audit exports and captures remain in .local-art and are excluded from Git. No credential material belongs in the backup.
