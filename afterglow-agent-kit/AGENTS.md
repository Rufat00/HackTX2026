# Afterglow Development Instructions for Agents

Afterglow is a collaborative spatial memory application. It is UX-first: people should understand what they contributed, what is saved, what is shared, and which connections were proposed by AI. Deliver complete, usable workflows rather than isolated endpoints or polished mockups with no behavior.

These guidelines adapt Critiq's development conventions to Expo, React Native and a separate TypeScript API. They describe the target architecture and behavior; they do not imply that every listed module or workflow already exists.

## Current stage and scope

- Follow the active task's cutline. Bootstrap establishes accounts, profiles, private uploads, shared contracts and provider boundaries. The subsequent design task extracts Bond reference patterns and implements the visual system. Neither automatically authorizes the entire product.
- Use the supplied product specification for memory behavior. Persistent username/password accounts supersede its guest-only identity proposal. Contributor and viewer permissions remain board-scoped.
- Keep the scaffold minimal. Add directories, models, abstractions and exports only when backed by an implementation or a specifically requested design artifact.
- Use pnpm and workspace dependencies. Commit manifest and lockfile changes together. Pin compatible dependency versions and read the official documentation matching the installed release.
- The bootstrap prompt authorizes its named stack and necessary adapters. Routine installation of declared dependencies is allowed. For genuinely new dependencies outside that scope, explain the concrete need and obtain approval. Do not ask again for packages already authorized in the current task.
- Do not introduce a second ORM, auth system, styling framework, state library or backend transport without a concrete requirement.

## Product invariants

- One board represents a shared event or memory, containing contributions from multiple people.
- Content cards use structured two-dimensional masonry with visible gaps. Photo, story and music cards never overlap. Optional later stickers are decorative and cannot cover text or controls.
- Exploration supports left, right, up and down. Phone entry scale prioritizes readable cards rather than an overview of the entire board.
- Nearby photo palettes influence a continuously blended ambient field. Semantic cluster boundaries never switch the background abruptly. Filtering does not change the field.
- Uploader attribution, explicit participant tags and AI semantic suggestions are separate concepts. Do not infer identity from faces or treat model confidence as confirmed attendance.
- Published layouts are immutable snapshots. Late contributions remain pending until a new preview is published. Deletion suppresses removed content immediately from older published reads.
- Music is optional. Video, voice recording, games, generated stickers, real-time co-editing and guided story mode are outside the initial scope.

## Project ownership

- `apps/mobile`: Expo Router, React Native UI, auth/API clients, native integrations and route-specific feature composition.
- `apps/api`: Hono HTTP adapters, authentication boundary, trusted context construction and safe response/error translation.
- `packages/auth`: Better Auth configuration, credential/session workflows, identity schema integration and auth-specific database access. Mobile auth client stays in mobile.
- `packages/core`: all business authorization, validation of invariants, business Prisma access and workflow orchestration.
- `packages/contracts`: client-safe Zod wire schemas, error codes and inferred types. No Prisma, credentials, provider SDKs or server-only imports.
- `packages/db`: Prisma schema, migrations, client generation/configuration and shared database instance. No business rules.
- `packages/storage`: private S3 infrastructure, signing, verification and derivative helpers. Core authorizes business uses.
- `packages/ai`: composition provider contracts, external model adapters, strict result validation and deterministic fallback.
- Shared native primitives belong in `apps/mobile/src/components/ui`; product widgets stay in their feature or a genuinely shared widget directory. Theme values belong in `apps/mobile/src/theme`.

Routes should compose a feature screen. Keep feature-specific components, hooks, adapters and formatting beside that feature. Prefer domain names such as `auth`, `profile`, `boards`, `contributions` and `memories`. Avoid empty `modules`, broad `data` directories and catchall `utils.ts` files.

Expose intentional package subpaths. Never deep-import another package's `src` directory. Keep server-only exports unreachable from native bundles and client-safe export barrels.

## Preproduction changes

There are no supported legacy clients unless the user identifies them. Make clean changes across schema, migrations, contracts, callers, seeds and tests together. Avoid dual writes, compatibility aliases and fallback reads solely to preserve disposable development data. Remove superseded code after replacement.

Do not reset shared or production data. A development reset is appropriate only on a known disposable database and within the authorized task. Changing preproduction code does not authorize destructive operations on real users' data.

## Naming

- Files and folders: kebab-case. Components: PascalCase.
- Core operations: domain verbs such as `createBoard`, `addContribution`, `publishLayout`.
- Queries: `getX` for record-or-not-found, `findX` for record-or-null, `listX` and `countX` for their respective intent.
- Schemas: camelCase ending in `Schema`; schema filenames end in `-schema.ts`.
- Types: scoped PascalCase, such as `PublishLayoutInput`.
- Prisma models: singular PascalCase; SQL table maps: plural snake_case; fields: camelCase.
- Enum names: PascalCase; persisted enum values: SCREAMING_SNAKE_CASE.
- Permissions: stable dot-separated names such as `boards.publish`.
- Timestamps end in `At`; calendar-only dates end in `Date`.

Use plain, searchable names. Avoid `handleThing`, `Data`, `Payload` or `Result` without meaningful domain scope.

## Core operations and trusted context

- Core receives a transport-independent context containing the database, verified actor and named diagnostic metadata. It never imports Hono, Expo, React, request/response objects or provider-specific session retrieval APIs.
- Transport authenticates and constructs trusted context. Core resolves ownership, membership and permissions from server data. UI visibility and a board ID in a URL are never authorization.
- Validate external input in core even if the transport or form already validated it. Share safe shape schemas through contracts; keep ownership, state and permission rules server-only.
- Verify that related participant, item, asset, cluster and layout IDs belong to the authorized board and are valid for the operation. An authenticated global user does not automatically have access to every board.
- Keep reads in `queries/`, writes in `mutations/`, schemas in `schemas/`, and private helpers beside their domain. One public operation per file. Do not use a web `actions/` convention in core.
- Use Prisma directly. Introduce shared wrappers when repeated workflows justify them, not as a speculative framework.
- Distinguish user actors, viewer-link capabilities and trusted system jobs. A background worker must not impersonate a human session.

## Writes, concurrency and publication

- Core owns database transactions and consistency. Never hold a transaction open while uploading to S3 or calling a model.
- Separate external effects into explicit phases. Persist a job/snapshot before provider work and compare the revision before publication.
- Scope uniqueness constraints and idempotency keys to their operation and owner/board. Reusing a key with a different payload is a conflict.
- Increment contentRevision with content mutations in the same transaction. Publish only a complete validated preview for the current revision.
- Use tombstones and cache invalidation for immediate content suppression; immutable historic layouts must not resurrect deleted photos.
- Audit sensitive permission, membership, publication and deletion changes with trusted actor/scope when those workflows are implemented. Exclude secrets and full private content.

## Errors and diagnostics

Use a small shared error vocabulary for validation, unauthenticated, forbidden, not-found, conflict, invalid-state, rate-limited and provider-unavailable cases. Preserve field errors when useful. Translate errors centrally to safe API responses.

Log unexpected failures server-side with operation, request ID and safe scope metadata. Never return raw Prisma/Zod/provider exceptions, stacks, SQL or storage credentials. Never log passwords, cookies, tokens, signed URLs or raw photo/story payloads. Avoid a logging package until a concrete need justifies one.

## Accounts and sessions

- Visible identity fields: username, password, first name, last name and profile picture. No email/OTP/social sign-in UI unless newly requested.
- Better Auth owns credentials, hashing and sessions. Persist native session material through the official Expo integration with SecureStore; never use AsyncStorage for secrets.
- Document the internal non-deliverable email compatibility identifier required by the configured username signup flow. Generate it server-side, keep it immutable and exclude it from profile DTOs. It is not a verified recovery address.
- Expose only the authorized signup/login flows. Do not leave public email-based routes that bypass the username/profile contract.
- Authenticate business API requests as well as auth client calls. Verify session expiration/revocation server-side. Logout also clears private client caches.
- Store separate first and last names; support Unicode names. Derive uploader identity from the session, never client-posted identity fields.
- Allow profile upload after signup with initials as a recoverable fallback. Do not block account creation on image processing.
- Password recovery is not implemented while no recovery contact is collected. Do not display fake reset functionality.

## Files and private storage

- Buckets are private. S3 credentials remain server-only. Mobile receives narrowly scoped, short-lived signed access.
- Server chooses object keys and validates owner, purpose, MIME, actual bytes, source size and decoded dimensions. Client declarations and successful PUTs are insufficient.
- Process images into EXIF-stripped, oriented derivatives. Keep verified derivatives immutable and separate from reusable signed-upload targets.
- Store object keys and metadata, not expiring URLs. Resolve authorized URLs at read time. Handle expiry/retry without creating a new asset unnecessarily.
- Cross-user profile asset attachment and cross-board memory asset attachment must fail. A tag never grants file access.
- Clean abandoned uploads and superseded media through explicit, repeatable cleanup behavior.
- Phone development must use reachable API and storage addresses. Document WSL/LAN setup; a Metro tunnel does not tunnel every service.

## AI and deterministic composition

- Provider calls run on the server behind a replaceable interface and environment-selected model.
- AI proposes semantic groups, labels and related item pairs. Validate the result as untrusted data; reject invented IDs, invalid membership and unsupported assertions.
- Layout packing, gap/collision validation, camera geometry and palette interpolation are deterministic application code. AI does not position live UI cards.
- Do not infer participant identities or factual attendance from photos. Explicit tags and reviewed relations remain distinct from model suggestions.
- Version prompts, schema, model and geometry algorithm with the saved analysis. Use bounded attempts/timeouts and a clearly labeled fallback.
- Use fixture providers in tests. Paid live calls require actual credentials and a purposeful check; never include them in default CI.

## Native UI and design system

- Before the screenshot audit, the scaffold theme is provisional. Do not claim it is derived from Bond.
- After the audit, read `docs/design/design-language.md`, `components.md` and the nearest screen recipe before adding UI. Follow `apps/mobile/AGENTS.md` for local visual rules.
- Reuse existing primitives and widgets. Do not copy web-only HTML, shadcn components or browser layout assumptions into React Native.
- Use typed semantic theme roles. Do not scatter raw colors, radii, font sizes and spacing through feature screens. Algorithmic coordinates and measured sizes are a separate concern from design tokens.
- Reference observations need screenshot IDs and confidence. Unknown font identity, inferred motion and adapted states must be labeled honestly.
- Keep screenshots/reference archives out of the production bundle. Never embed an entire screenshot as a substitute for real UI.
- Every relevant screen has loading, error, empty and recoverable retry states. Preserve typed input on failures and distinguish pending, saved and published states.
- Respect safe areas, keyboard avoidance, scalable text, native back behavior and screen-reader labels. Use stable high-contrast surfaces over the ambient background.
- Confirm destructive actions when needed. Avoid blocking overlays when work can continue. Disable duplicate submissions and show nearby progress/feedback.

## Forms and client state

- Use TanStack Form for interactive forms with shared field adapters and Zod-compatible validation. Keep authoritative business checks on the server.
- TanStack Query owns remote state and invalidation. Use local state for sheet visibility, draft editing and transient interactions. Do not duplicate query state in an unrelated store.
- Map field errors to the shared field UI. Show pending button state, preserve recoverable input and prevent duplicate writes.
- Configure native input behavior intentionally: username capitalization/correction off, appropriate password autofill and secure entry, normal name entry behavior. Do not copy Critiq's browser autocomplete rules mechanically.
- Clear private cached data on logout or identity switch. Handle stale network results so one user's response cannot populate another user's session.

## Lists and performance

Use explicit bounded list contracts with whitelisted sort/filter fields and deterministic ID tie-breakers. Cursor pagination is appropriate for growing memory lists; avoid importing admin-table page-size rules without a UI need. Scope item and count queries consistently.

Virtualize ordinary long native lists. For the spatial canvas, use viewport-based mounting only when scale requires it, preserving focus and geometry. Animate camera updates on the appropriate native/UI thread, not through full React rerenders on every drag. Record actual device results before making performance claims.

## Migrations and checks

- Preserve Better Auth models and generate schema from the configured plugins. Use Prisma migrations, including custom SQL constraints where necessary. Do not use `db push` to bypass migration history.
- Regenerate the client after schema/dependency changes. Use development migration commands locally and deploy migrations for hosted environments.
- Test real risks: cross-user/board access, related-ID ownership, username uniqueness races, session revocation, upload validation, immutable verified assets, revision conflicts, duplicate writes, publication rollback and safe errors.
- Test deterministic packing invariants independently of the packing implementation. Verify continuous palette behavior and confirmed versus suggested sharing with fixtures.
- Use focused colocated tests. Do not write tests that merely assert files exist or mirror empty scaffolding.
- Run relevant typecheck, lint, tests and targeted native smoke checks. Do not claim iOS validation from Android or browser-only evidence.
- Report what changed, why, what was checked and any real limitation. Keep startup documentation and environment examples synchronized with working scripts.
