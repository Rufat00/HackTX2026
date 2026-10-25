# Agent instruction 1 — Bootstrap Afterglow

You are implementing the foundation of Afterglow, an Expo mobile application with a separate TypeScript backend. Complete the working scaffold and verification described below. Do not implement the full social product or invent its final visual design in this task.

## Read first

Read the supplied `AGENTS.md` and Afterglow product specification. The specification defines a collaborative spatial memory post: people contribute photos and short stories, AI suggests semantic groups and titles, and the app renders a gap-separated two-dimensional masonry space. Cards must never overlap, except future decorative stickers. People can pan in every direction. Nearby photo palettes smoothly influence the ambient background without discrete zone switching.

This task changes the specification's guest-only identity proposal: use persistent username/password accounts. Keep board ownership, membership and permissions separate from authentication. Music remains optional. Video, recorded audio, live co-editing, generated stickers and story mode remain deferred.

The source specification includes web implementation examples. Replace its DOM container, browser pointer and cookie-only client details with native React Native rendering, Gesture Handler/Reanimated and Better Auth's Expo session transport. Preserve the world-coordinate, card-gap, revision and color-field contracts. Do not implement the native canvas using DOM nodes or a WebView. The canvas itself is a later feature, so add native gesture/animation dependencies only when their first working use is included.

If working inside an existing repository, inspect it before changing anything. If starting fresh, use the current target folder. Do not modify Critiq. Its conventions have already been adapted into the supplied guidelines. Do not copy its Next.js, judging, organization, OTP or admin-table code.

## Chosen stack

- pnpm workspaces; TypeScript in strict mode; Node.js 24 for server tooling.
- `apps/mobile`: Expo and React Native with Expo Router, iOS and Android first. Web is optional; never substitute a working web page for native validation.
- `apps/api`: Hono on Node, REST routes, structured errors and request IDs.
- `packages/db`: PostgreSQL, Prisma schema/client/migrations. Start with Prisma 7 and its PostgreSQL driver adapter because Better Auth's documented Prisma integration uses that generation. Pin exact compatible versions after checking current official docs. Do not mix Prisma 8 setup instructions with Prisma 7 code.
- `packages/auth`: Better Auth server configuration, Prisma adapter, username plugin, Expo integration and account/session workflows.
- `packages/core`: provider-independent business logic, authorization and business database access.
- `packages/contracts`: client-safe Zod request/response schemas, error codes and inferred types. Core revalidates all external input and owns business invariants. Never export a server module through this package.
- `packages/storage`: server-only S3 signing, upload verification and media access helpers.
- `packages/ai`: server-only composition adapter, result validation and deterministic fallback.
- React Native `StyleSheet` and typed theme tokens. A later task will derive the visual system from the Bond references. Do not add NativeWind, a web component kit or a second styling system.
- TanStack Query for server state; TanStack Form for interactive client forms; Zod for runtime schemas. Use local state for ephemeral UI. Do not install a global state library without a real need.

These packages and their necessary adapters, official Expo dependencies and focused test/lint tooling are authorized for this bootstrap. Install native libraries through Expo's compatibility resolver. Commit the lockfile. Additional services or unrelated packages require a concrete explanation and approval; do not repeatedly ask about this approved stack.

Create package directories only when they contain working code. A package may begin with one implemented responsibility. Do not create dozens of empty domains or placeholder public exports.

## Repository boundaries

```text
apps/mobile/src/app/                  # Route composition and navigation
apps/mobile/src/features/auth/        # Auth forms and mobile adapters
apps/mobile/src/features/profile/     # Profile UI and mobile adapters
apps/mobile/src/components/ui/        # Shared native primitives
apps/mobile/src/theme/                # Provisional tokens, replaced in task 2
apps/mobile/src/lib/                  # API and auth clients, query setup
apps/api/src/                        # HTTP adapters and trusted context
packages/auth/src/                   # Identity, credentials and sessions
packages/core/src/                   # Domain operations
packages/contracts/src/              # Safe wire contracts and schemas
packages/db/                        # Schema, migrations, client and seed
packages/storage/src/                # Private object storage
packages/ai/src/                     # Composition providers and fixtures
docs/                               # Decisions, setup and design contracts
```

Keep framework routes thin. Auth establishes identity; core determines board permissions. Mobile must never import Prisma, auth server configuration, S3 credentials or AI SDK credentials. Do not introduce generic repository classes over Prisma.

## Accounts and authentication

The visible account fields are username, password, first name, last name and profile picture. No email, phone, OTP, social login or email verification UI. Profile image upload happens after account creation; allow an initials avatar if skipped or failed, so an image problem cannot lock someone out.

Use username login, persisted sessions, logout, app-restart restoration and a protected profile route. First and last names are separate fields; derive the auth library's display name from them. Allow Unicode names. Normalize username once, enforce its uniqueness in PostgreSQL and validate both on server and client. Initial username policy: 3–24 ASCII letters, numbers and underscores, stored lowercase with a separate display representation if needed. Passwords: 12–128 characters; do not trim, lowercase, log or store them yourself. Better Auth owns hashing and credential persistence.

**Important integration detail:** Better Auth's documented username signup builds on its email/password flow and still requires an internal email value. Preserve the requested username-only UI by implementing one server-owned registration wrapper. Generate an immutable unique internal value such as `<random-uuid>@accounts.afterglow.invalid`; do not derive it from username or accept it from the client. This is an internal compatibility identifier, not a real or verified email. Document this decision in `docs/auth.md`.

Block direct public access to alternative email signup/login, verification, email-change and email-based recovery routes for this prototype. The custom registration route must validate the same identity/profile constraints and preserve the library's session headers and Expo cookie behavior. Do not disable checks globally, fabricate sessions or bypass the library's password machinery. Test the wrapper on a real native session. If the installed Better Auth release cannot support this integration safely, report the precise blocker and alternatives instead of silently adding email to the product or inventing authentication code.

Use Better Auth's Expo client with SecureStore. Verify that authenticated business API requests carry the session too; configuring only the auth client is insufficient. Configure trusted origins and the app's `afterglow://` scheme narrowly. Use explicit development origins; do not ship wildcard credentialed CORS or disabled CSRF checks. Logout revokes the session on the server and clears local cached identity and private query data.

No self-service recovery UI is in this prototype because no recovery contact is collected. State this limitation plainly in development documentation. Do not display a nonfunctional Forgot password link.

## Database and profile foundation

Generate the required Better Auth tables from the actual configured plugins and integrate them into Prisma migrations. Do not hand-invent a competing credential or token schema. Add firstName, lastName and profileImageAssetId in the appropriate owned model; keep one authoritative value for each field. If using Better Auth's image field, treat it as derived presentation data, not a stored expiring signed URL.

Implement an Asset record with ownerUserId, unique object key, purpose (`PROFILE` initially), MIME, byte size, dimensions, processing status and timestamps. Add an authenticated `/api/v1/me` read/update workflow. Derive the actor from the verified session, never a posted userId. Users can attach only their own ready profile asset. New uploads become the profile image atomically after successful validation. Preserve the previous image on failure.

Document the planned Board, BoardMember, Item, ItemPersonTag, AnalysisJob and LayoutRevision relationships from the specification. Do not create unused feature tables unless they are needed by an implemented operation in this task. User identity is global; board membership remains board-scoped.

## Files and local development

Use AWS SDK v3 with S3-compatible configuration: endpoint, region, bucket, credentials and optional path-style access. Production targets private S3. Use a maintained S3-compatible service in Docker for local development and document its exact version. A local storage endpoint is not a public cloud deployment.

Implement authenticated upload-intent, direct signed upload, completion/verification and authorized signed download. Server chooses an unguessable key and binds it to the actor and purpose. Initially allow JPEG, PNG and WebP, a 10 MB source limit and a 25-megapixel decoded limit. Verify bytes and actual file format server-side; request metadata and a successful PUT do not establish validity. Strip EXIF, orient correctly and generate profile-sized derivatives. Store keys, never expiring signed URLs.

Signed upload URLs may be reused before expiry. Process the verified object into a separate server-only immutable derivative key, and serve that derivative; do not let overwriting the original bypass completed validation. Publish no asset before verification. Clean up abandoned uploads through a documented repeatable script or bounded worker task.

Use Docker Compose for PostgreSQL and local object storage. Document phone connectivity from WSL, including a reachable LAN API/storage hostname, API bind address, CORS/trusted origins and firewall considerations. A presigned URL containing container-only `storage:9000` or phone-local `localhost` is broken. Do not claim Expo's Metro tunnel automatically exposes the API or storage.

## AI composition boundary

For this scaffold, implement a `CompositionProvider` contract, a deterministic fixture provider and a real server-side OpenAI adapter behind environment configuration. Use the Responses API, image inputs and structured JSON outputs. Start with `AI_COMPOSITION_MODEL=gpt-6.1-sol`, verified against current official documentation and available account access before live use. Keep the provider replaceable. Missing credentials must not prevent the app, auth or storage from running.

AI returns semantic group membership, concise proposed titles/descriptions and suggested related pairs keyed by existing item IDs. Validate complete membership, known IDs, uniqueness, bounded text and link counts. Handle refusals, incomplete responses, timeout and invalid output. Persist prompt/model/schema versions. Use no tools and treat contributed text as untrusted data.

The application calculates rectangle positions, collision/gap guarantees and photo palette transitions deterministically. AI does not generate screen layouts, per-card pixel coordinates or background animation frames. People tags and confirmed participant relationships remain explicit evidence. Do not claim an AI suggestion confirms attendance.

Do not implement the complete composition endpoint or canvas here. Exercise the adapter contract with a fixture and an optional manual live check; no paid API calls in ordinary tests or CI. If no live call was made, report that clearly. Document the 20-second per-attempt and 45-second total analysis budgets and the contributor-based fallback from the product specification.

## Deliver a working foundation

1. Inspect existing files and compatible dependency versions. Save architecture decisions and resolved versions in `docs/architecture.md`.
2. Initialize the monorepo, explicit package exports, TypeScript, formatting/linting, environment validation, `.env.example` and reproducible local services.
3. Implement database migrations and a clearly labeled development seed that does not reset shared data.
4. Implement username registration, login, session restoration, logout and profile editing.
5. Implement private profile-photo upload and replacement end to end.
6. Implement and test the AI adapter boundary and fixture fallback.
7. Add a minimal accessible mobile shell. Mark its theme provisional; do not claim Bond-derived styling before inspecting the screenshots.
8. Provide root scripts for development, mobile/API separately, typecheck, lint, format check, tests, database generation/validation/migrate/deploy and local services. Only document scripts that exist and work.

Verify typecheck, lint and relevant tests, database migration on a disposable local database, API startup and a native auth/upload smoke flow. Focus tests on username races, invalid credentials, revoked sessions, cross-user profile/asset access, upload spoofing and overwrite handling, safe errors and model-result validation. Do not write tests that merely count scaffold files.

Finish with exact startup commands, URLs/ports, environment names, what was tested, any missing external credentials and the next task. Keep all real secrets out of source, logs and Expo public environment variables. Do not deploy paid services or claim full product completion.
