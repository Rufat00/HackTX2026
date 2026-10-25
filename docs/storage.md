# Private profile media

1. An authenticated user creates an intent with JPEG/PNG/WebP MIME and source byte size (at most 10 MB).
2. The server chooses an unguessable private source key and persists an actor-bound PROFILE Asset. The signed PUT expires after ten minutes and binds MIME and byte length.
3. Native Expo fetch uploads verified-length binary bytes to the authenticated `/api/v1/assets/:id/source` API proxy, which checks owner, purpose, MIME, pending state and byte length before writing the private source object. The signed PUT remains a narrowly scoped authorized infrastructure capability. Neither upload route makes the asset ready.
4. Completion atomically claims the pending record. The server reads a bounded snapshot of the object, checks actual byte length, decodes the actual format with a 25-megapixel ceiling, rejects animation/multipage images and MIME mismatches, orients it, strips metadata and emits a WebP derivative with longest side at most 400 pixels.
5. The derivative has a separate random key with conditional create. The server atomically marks READY and replaces the user's profile reference. Failure preserves the previous image. Repeated successful completion returns the current profile; it cannot reprocess overwritten source bytes or reattach an older image.
6. Native photo reads use `/api/v1/assets/:id/content`, which checks owner, purpose and ready state and returns derivative bytes with `Cache-Control: no-store`. Authorized signed derivative access also remains available for server-side workflows. A different user cannot attach or access the asset. The mobile client refreshes access URLs periodically and offers a photo retry without creating another asset.

Signed source PUT URLs can be reused until expiry. The completed derivative is never a signed upload target and is unaffected by later source overwrites. Credentials, keys and signed URLs are never logged or stored in profile presentation fields. Source MIME/size and derivative dimensions/size are recorded separately.

Run `pnpm storage:cleanup` periodically (for example hourly). It processes at most 100 unattached assets older than 24 hours per invocation and up to 100 retained source objects for ready assets. Repeat until the backlog is cleared. Deletes are idempotent, attached derivatives are retained, and records remain for retry if storage deletion fails. Superseded profile assets become eligible after 24 hours. Abandoned PROCESSING records from a terminated API are included. No bucket-wide deletion/reset is used.

Source uploads consume local disk/network before verification. Upload URLs are short lived, active per-user intents are bounded, and verification enforces byte/decoded size limits. Deployment-level request quotas and S3 lifecycle expiry for the uploads prefix are recommended before public release. This prototype's local service is not configured as a public cloud deployment.

## Board-bound memory photos

Memory intents also carry a board ID and a scoped client retry ID. Uploading, completing, and attaching a photo each require current board membership; attachment additionally requires the verified image to belong to that uploader and board. The authenticated API accepts at most 10 MB of bytes and sends them to server-chosen private S3 keys. Completion validates byte size, actual MIME, decoded dimensions and the existing 25-megapixel ceiling; it emits an oriented, EXIF-stripped WebP bounded to 1600 pixels with a dominant palette color. Ready derivatives never reuse the mutable source key.

Private media reads check owner/membership and current attachment. Public media reads check the current published snapshot, its board-bound asset and the item's live tombstone before returning bytes. All media proxy responses use `Cache-Control: no-store`. Consequently the memory workflow works through the API tunnel without publicly exposing S3 or its console. Profile media also uses its authenticated API proxy for native uploads and reads.

Cleanup excludes attached memory assets, including historic references needed for deletion suppression; unbound intents are cleaned by the existing bounded job and ready source objects expire through its source-removal phase. Deleting a contribution immediately suppresses published reads; it does not rewrite immutable layouts or bulk-delete the bucket.
