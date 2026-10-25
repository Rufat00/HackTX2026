# Afterglow

Expo native app and separate TypeScript API. Persistent username/password accounts, editable profiles, private media, and a working collect → compose → share flow. Memories support photos, stories and optional Spotify/Apple Music links, invitations to contribute, private drafts and public published snapshots. The mobile UI uses the shared native design system.

## Start locally

Prerequisites: Node 24.16.0 (`nvm use`), pnpm 10.30.0, Docker Compose with a working daemon, and an iOS/Android device or emulator compatible with Expo SDK 58.

```bash
nvm use
pnpm install --frozen-lockfile
cp .env.example .env
```

Set `BETTER_AUTH_SECRET` to a random value of at least 32 characters (`openssl rand -hex 32`), and choose unique local `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` values before starting Compose. For a physical phone, set `API_URL=http://YOUR_LAN_IP:3001` and `TRUSTED_ORIGINS=afterglow://,http://YOUR_LAN_IP:3001`. Native image uploads and reads go through the authenticated API; keep `S3_ENDPOINT=http://localhost:9000` for the host-run API. Put `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001` in **apps/mobile/.env**. These are development addresses; use HTTPS for hosted services.

```bash
pnpm services:up
pnpm db:generate
pnpm db:deploy
pnpm storage:init
pnpm dev
```

Or run `pnpm dev:api` and `pnpm dev:mobile` in separate terminals. The API binds `0.0.0.0:3001`; health is `http://YOUR_LAN_IP:3001/health`. Expo Metro uses port 8081. S3 uses port 9000; the local RustFS console is `http://localhost:9001`. PostgreSQL is bound to host loopback port 5432. No paid service or deployment is required.

Use `pnpm --filter @afterglow/db migrate --name your_change` to author a development migration. `pnpm db:migrate` opens the standard Prisma development migration flow. Use `pnpm db:deploy` for existing committed migrations. Do not use db push.

Optional development seed: set `DEV_SEED_PASSWORD` in your private root .env, then `pnpm db:seed`. It creates `demo_afterglow` (Demo Account) only when absent, requires `NODE_ENV=development`, and never resets a database. Profile pictures are optional after signup. No recovery contact is collected, so account recovery is unavailable.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm db:validate
```

`pnpm format` formats source. `pnpm storage:cleanup` performs bounded repeatable cleanup; schedule it hourly. `pnpm services:down` stops services while retaining named data volumes.

For integration tests, create a separate disposable database and migrate it:

```bash
docker compose exec postgres createdb -U afterglow afterglow_test
DATABASE_URL=postgresql://afterglow:afterglow_dev@localhost:5432/afterglow_test pnpm db:deploy
TEST_DATABASE_URL=postgresql://afterglow:afterglow_dev@localhost:5432/afterglow_test pnpm test:integration
```

These tests require the private storage service too; they create unique test accounts and remove only their own rows/objects. They refuse database names without the `_test` suffix. Do not run them against shared/production data.

For an optional paid model check, set server-only `OPENAI_API_KEY`, `AI_COMPOSITION_PROVIDER=openai` and `AI_COMPOSITION_MODEL=gpt-6.1-sol`, then `pnpm ai:check`. It verifies model access before one analysis. Ordinary startup/tests use the deterministic fixture and need no OpenAI credentials.

## Phone and WSL connectivity

The phone must reach the API on port 3001; native memory and profile images use authenticated API proxies, so port 9000 only needs to be reachable by the server. WSL's loopback address, container service names such as `storage:9000`, and phone-local `localhost` are unsuitable for physical phones. Use a LAN address reachable from the phone. With WSL mirrored networking, check Windows firewall inbound rules; with WSL NAT, configure Windows forwarding for the **API** port to the current WSL address and permit them through the firewall. Bind the API to `0.0.0.0`; Compose already publishes storage port 9000. Keep database and console loopback-only. Guest Wi-Fi client isolation can prevent phone-to-laptop access even when host curl works.

Open `http://YOUR_LAN_IP:3001/health` from the phone browser before troubleshooting auth or uploads. Expo's Metro tunnel exposes Metro only; it does not expose the API or S3 service. For native scheme behavior, build the configured app with `pnpm --filter @afterglow/mobile android` or `ios` on the appropriate host; Expo Go is not proof of a custom app scheme.

See [architecture](docs/architecture.md), [auth](docs/auth.md), [private storage](docs/storage.md), [AI](docs/ai.md), and [verification / native smoke checklist](docs/verification.md). The native design system is documented below; device verification remains tracked separately.

## Native design system

The Bond audit covers 149 individually inspected references. Start with the [design language](docs/design/design-language.md), [component catalog](docs/design/components.md), [screen recipes](docs/design/screen-recipes.md) and [native workflow](apps/mobile/AGENTS.md). [Evidence](design/evidence.json) separates observations, inferences and Afterglow adaptations. [Discrepancies and device verification](docs/design/discrepancies.md) tracks remaining native checks.

Run `pnpm dev:mobile`, then open `/gallery` through the development router or the custom-build URL `afterglow://gallery`. Expo Go uses its development-server `/--/gallery` URL. This route contains local fixtures and redirects in production. Account/profile routes continue to use the real API. The gallery is not a substitute for native device testing.

Edit `design/tokens.json`, run `pnpm design:tokens`, and check drift with `pnpm design:tokens:check` (also part of `typecheck`). Use `pnpm design:test:import` for archive-security checks and `pnpm design:references:check` for inventory/evidence integrity. Importing references requires Python 3 with Pillow and `pnpm design:import '<Bond ZIP path>'`; it preserves the source and creates originals, readable copies and numbered contact sheets under ignored `design/reference/bond/`. An existing import is never overwritten. Fresh imports begin unreviewed; preserve/reapply the committed inspection records only after confirming the archive hash matches. Source media remains outside application imports and release assets.

See the discrepancy log for the 360×800, 390×844, wider-phone and native large-text matrix, as well as the capture/masking comparison command. Native keyboard, autofill and accessibility acceptance remains pending device access.

For a public Expo Go gallery preview, run `EXPO_PUBLIC_API_URL=http://127.0.0.1:3001 pnpm --filter @afterglow/mobile exec expo start --go --tunnel ngrok`. SDK 58's default tunnel requires an Expo login; the explicit `ngrok` mode uses Expo's legacy integration and requires globally installed `@expo/ngrok`. Use an Expo Go client supporting SDK 58. The tunnel exposes the development bundle/endpoints, not the API or S3; local-loopback API configuration supports gallery inspection only. Sign-in and uploads need separately authorized, phone-reachable backend endpoints. Never change only the manifest's SDK number to suppress a runtime mismatch; align the SDK and all native dependencies.

## Create and share a memory

After applying migrations with `pnpm db:deploy`, reload Expo Go and tap the center **+**. Give the memory an optional title/date, collect up to 30 photos/stories/songs, then **Compose memory**. Tap a saved item to edit its text. Review the dark, square, scrollable preview before opening sharing. Search by username to invite up to seven other contributors; they find the same memory in Friends. Invites grant contribution access immediately and do not post anything publicly.

**Post publicly** asks for confirmation and publishes the current complete preview. The public link is `${API_URL}/m/<board-id>` and opens without an account; the signed-in Home feed also includes public posts. Later contributions and edits remain pending until a fresh composition is published. Deletion suppresses the item immediately from public reads, including the public media endpoint. Making the memory private disables its public page immediately, even when a newer draft is pending.

Memory uploads and verified photo reads use authenticated API proxy routes, so the API's existing HTTPS tunnel is sufficient for this flow. The S3 bucket remains private; database/storage credentials and originals are never exposed. Profile uploads and photo display also use authenticated API proxy routes; they do not require a second storage tunnel. For iOS memory selection, the picker explicitly requests the compatible representation; bytes, size, decoded dimensions and MIME are still verified server-side. [Expo ImagePicker reference](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

Composition defaults to **Basic grouping used** when `AI_COMPOSITION_PROVIDER=fixture` or no model credentials are configured. For real semantic analysis, set server-only `OPENAI_API_KEY`, `AI_COMPOSITION_PROVIDER=openai`, and your permitted `AI_COMPOSITION_MODEL`, then restart the API. Each Compose action can then make paid provider calls. Tests inject fixtures and never call the paid model. Provider output only proposes groups and connections; deterministic application code places cards with visible gaps. The saved analysis records model, prompt, schema and geometry versions.

Draft metadata and successfully saved items persist on the server. Text currently saves on Done, rather than on every keystroke; unfinished editor text is kept through request failures while the editor stays open. Photo retries reuse upload/item IDs within the collecting screen; abandoned unbound assets are cleaned by `pnpm storage:cleanup`. Song search accepts titles and artists and streams available catalog previews through Expo Audio. Each contributor has one song per memory; adding again replaces it. Full tracks, voice and stickers remain deferred. Recompose existing memories to apply the new contributor layout, and republish to update a public snapshot. Replace old song links through search to enable previews. No native screenshot or device-performance claim is implied by release exports.

## Native upload transport

`expo-blob` 58.0.3 and `expo/fetch` handle selected photo bytes explicitly. The shared upload reader calls `arrayBuffer()` rather than React Native’s legacy `Response.blob()` conversion, validates the actual file signature and byte size, and sends binary ArrayBuffer bodies through Expo’s fetch transport. The API still performs authoritative image verification. After installing dependency changes, restart Metro and reload Expo Go. Both memory and profile image data travel through the same phone-reachable API URL.
