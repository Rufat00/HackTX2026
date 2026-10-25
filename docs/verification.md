# Bootstrap verification

Run date: 2026-10-24. This is a foundation, not the complete memory product.

## Executed

- Strict TypeScript checks across all eight workspace application/packages and root scripts/configuration.
- ESLint and Prettier checks.
- 28 passing focused unit tests for account contracts, safe HTTP errors, ownership, duplicate completion, actual image validation/orientation/metadata removal, and AI partition/link/fallback/time-budget rules.
- Real PostgreSQL 17.6 migration application on a fresh disposable database; migration status confirmed current. The database came from a temporary embedded-postgres 17.6.0-beta.15 binary package because this session could not access the Docker socket. No existing/shared database was reset.
- Real RustFS 1.0.3 from its official release binary, using a separate disposable data directory. All 13 integration tests pass. The suite uses real Better Auth credentials/sessions, PostgreSQL and S3 requests. It covers signup session headers, profile reads/edits, invalid credentials, username uniqueness races, client identity rejection, upload verification/replacement, private ownership checks, signed-source overwrites, spoof rejection, cleanup, expiry and logout revocation.
- Hono Node server startup and an actual HTTP `/health` response of `{"status":"ok"}`.
- Private-bucket initialization, bounded cleanup script startup, and development seed creation followed by an idempotent second run.
- `docker compose config --quiet` and Expo SDK dependency compatibility check.
- Expo production JavaScript/Hermes bundle export for **both Android and iOS**. These are compilation checks, not device validation.

The temporary PostgreSQL/RustFS services are verification substitutes for the same service versions in Compose. Docker Compose containers themselves were not started in this session. Temporary ports/data are not the application's normal startup configuration.

No live OpenAI request was made and account access to `gpt-6.1-sol` was not checked. The default fixture and fallback are tested. See [AI configuration](ai.md) for the explicitly paid optional check.

## Required device smoke before accepting native auth

No Android SDK/emulator or iOS simulator was available in this session. The Better Auth registration wrapper has been verified with real session headers and API authentication, but **SecureStore persistence and the real native cookie transport still require the following device check**. Do not infer it from successful native bundle exports.

1. Start services/API/Metro using the [README](../README.md), confirm phone-reachable API and signed storage hosts, then install an SDK 58 development build on the nominated Android or iOS device.
2. Create an account with a mixed-case username, a 12+ character password and Unicode first/last names. Skip the profile image and confirm the initials fallback and protected profile screen. Confirm the UI never requests an email or offers fake password recovery.
3. Force-quit and relaunch. Confirm the session restores from SecureStore and `/api/v1/me` succeeds with its cookie. Edit first/last names, save, relaunch and confirm persistence.
4. Select a supported photo, observe upload/verification feedback and confirm the saved profile image. Replace it, then simulate a failed replacement and confirm the previous image remains. Retry a failed image download without creating another asset.
5. Disconnect networking while saving: entries must remain, duplicate submission must be disabled, and retry must recover. Check keyboard/safe areas, native Back, text scaling and screen-reader labels on this device.
6. Sign out, then relaunch and confirm the protected route redirects. Sign in as a second account and confirm no prior private profile/image cache appears. Verify the revoked first cookie cannot access `/api/v1/me`.
7. Record OS, device/build, outcomes and any failure. Repeat independently on the other OS before claiming validation for both.

The Bond audit and working native creation flow are now implemented; device acceptance remains pending as described in the design discrepancy log.

## Memory workflow verification — 2026-10-24

The additive memory migration was deployed to the local development database without a reset. A separate local `afterglow_test` database was created and migrated for integration verification; test users, board rows and their storage objects were cleaned by the suites. No real user content was posted for smoke testing, and no paid model calls ran.

- Workspace typecheck and generated-token drift passed. ESLint passed. Formatting excludes Expo's regenerated `expo-env.d.ts` and checks maintained sources.
- 45 ordinary tests passed, including independent all-pairs masonry-gap checks, invalid composition IDs, ambient continuity, safe account/memory HTTP boundaries and existing contrast/native control contracts.
- 19 integration tests passed against real PostgreSQL, Better Auth and private S3. Memory cases cover cross-user/board access, owner-only invites/publication, concurrent retry idempotency, stale edits, actual image decoding and immutable derivatives, attached-asset cleanup retention, fixed published snapshots, late pending contributions, immediate deletion suppression, publication rollback and composition revision races. Public-title search, unpublishing, unauthenticated public HTML/media, escaping and no-store headers were also exercised.
- The iOS release export compiled the creation/editor/preview/sharing routes successfully (1,489 modules, 24 framework/font assets). No Bond screenshot/reference asset was bundled. Native rendering, photo-library behavior, keyboard/autofill, VoiceOver/large text, diagonal scrolling and native color animations remain unverified on a real phone. No Android runtime claim is made.

Device walkthrough: create two accounts; create a private memory with a photo/story/song; edit a caption; compose and inspect four-direction scrolling; invite the second username; add another item as that contributor; publish as the owner; open the public link in a signed-out browser; add a late item and confirm the public snapshot stays unchanged; delete a published photo and reload; make the post private while a newer draft is pending. Check airplane-mode retry without duplicate content and verify that signing out clears all private memory caches. The model currently uses the explicitly labeled fixture fallback until server credentials are configured.

## Upload transport correction and form copy — 2026-10-24

Replaced local-file `fetch(uri).blob()` usage in both memory and profile flows with a shared reader using `expo/fetch`, explicit `expo-blob` 58.0.3 and ArrayBuffer upload bodies. MIME comes from supported file signatures, not picker declarations. Actual server image decoding and ownership checks remain. Profile source uploads and image/thumbnail reads now pass through authenticated API endpoints as well, removing dependence on a second phone-reachable S3 address. Form slogans, repeated descriptions and instructional footers were removed; field labels, error/retry messages, saved/pending indicators and public-post confirmation remain.

52 ordinary tests and 20 database/storage integration tests passed. The new upload reader checks preserve binary bytes for JPEG/PNG/WebP, avoid legacy `.blob()`, reject unsupported/empty/oversized bytes and report missing files. A real PNG larger than 32 KB was sent through the profile API upload route, verified and read back as WebP; a different account could neither upload nor read it. Mobile/API TypeScript and ESLint passed. Native file-picker/network behavior on the iPhone still requires a real-device retry; mocks and backend tests are not native runtime evidence.

## Upload HTML response handling — 2026-10-25

All API/auth, image upload and native image read requests now send ngrok’s documented browser-warning bypass header. API CORS permits that header for approved origins. JSON reads use a shared response boundary: successful HTML pages cannot mark an upload as saved, structured field errors remain intact, and offline/upstream/oversize/malformed responses produce safe retry instructions rather than a raw JSON parser error. No proxy HTML or request secrets are displayed or logged. Regression tests exercise HTTP-200 HTML warnings, ngrok offline/upstream pages, 413 pages, invalid JSON and structured API errors.

## Contributor sections and song search — 2026-10-25

The additive song metadata/partial uniqueness migration was deployed to the local development and isolated test databases without resetting data. A read-only preflight found no existing duplicate contributor songs. New contributions require a server-resolved catalog track, with one live song per contributor/board. Existing immutable snapshots are preserved and require recomposition/republishing for the new geometry.

Workspace TypeScript and generated-token drift, ESLint and formatting checks passed. All 61 ordinary tests passed. All 21 integration tests passed against the isolated `afterglow_test` database and private storage, including concurrent song uniqueness, idempotent retry, replacement, different contributors, deletion/re-add and exact song centering. Catalog tests use fixtures and reject untrusted asset URLs and unsupported preview choices. A separate live public catalog search returned 20 results with 20 available previews; no paid AI call ran.

The iOS release bundle exports the audio/search/canvas code successfully. This establishes compilation only. Actual iPhone playback, silent-switch behavior, background/route pause, catalog network reachability, gradients, directional fog, nested gestures, dynamic text and VoiceOver remain device checks. The development gallery now includes a labeled static dark ambient-color fixture; it never pretends to play audio. Fog uses gradients rather than a Gaussian backdrop blur. Music is streamed catalog preview audio, not full-track playback.

Device check: restart Metro after installing Expo Audio; search by title and artist, preview/pause two tracks, replace your song, and recompose. Verify each contributor’s song is centered, cards remain readable, colors follow photos during panning, and fog disappears at each actual boundary. Leave the view and background the app to verify pause. Republish explicitly to update a public snapshot, then verify its audio controls and single-player behavior in Safari.
