# Architecture

This implements accounts, private profiles/media, and memory collection, composition previews, contributor invitations and public/private publication. The source behavior reference is [the supplied specification](../afterglow-agent-kit/product-specification.md); persistent global accounts supersede its guest identity. The audited Bond visual system and scoped dark backstory editor are documented in `docs/design/`.

## Runtime and package boundaries

Use Node 24.16.0 and pnpm 10.30.0. The API runs Hono on Node; the app uses Expo SDK 58 and native React Native screens with Expo Router. Expo's resolver selects the React/native dependencies. Exact versions are pinned in manifests and pnpm-lock.yaml.

Prisma 7.10.1 uses the `prisma-client` generator with explicit output, `prisma.config.ts`, and `@prisma/adapter-pg` 7.10.1. Better Auth, its Prisma adapter and Expo integration are 1.7.12. Credentials and sessions belong to Better Auth. Zod 4.1.12 wire schemas stay client safe. TanStack Form 1.33.5 owns form state; TanStack Query 5.104.5 owns remote state. AWS SDK v3 and Sharp 0.35.5 implement storage. OpenAI's Responses API is accessed only in the server-only AI package. Native bundles reach contracts through explicit subpaths, never server packages.

`packages/core` owns authorization, database writes and transactions. HTTP adapters build trusted contexts from verified sessions. Provider calls run outside database transactions. No generic repository layer or alternate ORM is used. The API generates request IDs and centrally translates errors; unexpected logs contain operation and request ID only.

Local Compose uses PostgreSQL 17.6 Alpine and RustFS 1.0.3, a maintained S3-compatible service. This is local infrastructure, not a public S3 deployment. The private bucket initialization script adds no anonymous policy. Use narrowly scoped IAM credentials and block public access on production S3.

## Memory relationships and publication

`Board` owns its content revision, private/public visibility and published layout pointer. Its owner publishes and invites; `BoardMember` grants contribution access only to that board. `Contribution` stores typed photo/story/song fragments and server-derived uploader identity. Existing users are selected by username; a separate social friendship/request system and participant tags are not implemented.

`Asset` now distinguishes PROFILE from board-bound MEMORY uploads. API proxy routes authenticate upload bytes and private media reads. Verified, oriented, metadata-stripped WebP derivatives are immutable. Public media reads require the photo to belong to the currently published snapshot and to remain undeleted. The private S3 bucket has no public policy. Unbound asset cleanup excludes all attached memory assets, while retained reusable sources are removed after the existing retention window.

`BoardLayout` persists its input snapshot and revision before provider work; analysis runs outside transactions. Validated semantic groups feed deterministic contributor constellations (`constellation-v2`): varied photo sizes and irregular nonoverlapping placement, with each contributor’s optional song fixed at their section center. Only READY analysis for the current revision may publish. Text/photos/song links in the published snapshot do not change with later edits; current tombstones suppress removed items immediately. `BoardAudit` records contributor additions, publication/privacy and deletions without raw content. The native preview uses native horizontal/vertical scrolling, inside a square dark viewport, with overlapping radial photo-palette fields and native animated directional edge fog; no device-performance claim has been measured.

Public reads use a transport-independent context without an actor. The Hono public page escapes contributed content and exposes only published snapshot content; pending titles, contributors and items stay private. Native bundles import only contracts, never core or provider SDKs. Owner/member lists and public snapshots share bounded list contracts with deterministic creation-time/ID ordering; search and shared-memory scope are applied in the database before pagination.

Voice, stickers, real-time editing, relationship/attendance inference, explicit participant tags, social request workflows, full-track playback and guided story modes remain outside this implementation. Current invitations add board contributors directly; the native Friends tab lists shared memories.

## Official references consulted

- [Better Auth username plugin](https://better-auth.com/docs/plugins/username)
- [Better Auth Expo integration](https://better-auth.com/docs/integrations/expo)
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- [Prisma 7 upgrade guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/)
- [TanStack Form](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts) and [native Query integration](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [RustFS Docker installation](https://docs.rustfs.com/en/installation/container/docker)
- [OpenAI GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) and [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

Registry versions were resolved on 2026-10-24. See [verification](verification.md) for actual execution evidence and limitations.

## Resolved versions

| Dependency                     | Pinned version |
| ------------------------------ | -------------- |
| typescript                     | 5.9.3          |
| @types/node                    | 24.10.0        |
| tsx                            | 4.20.6         |
| vitest                         | 3.2.4          |
| eslint                         | 9.39.1         |
| typescript-eslint              | 8.46.2         |
| prettier                       | 3.6.2          |
| auth                           | 1.7.12         |
| @better-auth/expo              | 1.7.12         |
| @tanstack/react-form           | 1.33.5         |
| @tanstack/react-query          | 5.104.5        |
| better-auth                    | 1.7.12         |
| expo                           | 58.0.19        |
| expo-constants                 | 58.0.13        |
| expo-image-picker              | 58.0.10        |
| expo-linking                   | 58.0.14        |
| expo-network                   | 58.0.4         |
| expo-router                    | 58.0.26        |
| expo-secure-store              | 58.0.2         |
| expo-web-browser               | 58.0.6         |
| react                          | 19.3.0         |
| react-dom                      | 19.3.0         |
| react-native                   | 0.88.0         |
| react-native-safe-area-context | 5.10.1         |
| react-native-screens           | 4.30.0         |
| zod                            | 4.1.12         |
| @types/react                   | 19.3.0         |
| hono                           | 4.13.13        |
| @hono/node-server              | 1.19.6         |
| sharp                          | 0.35.5         |
| @prisma/client                 | 7.10.1         |
| @prisma/adapter-pg             | 7.10.1         |
| pg                             | 8.16.3         |
| prisma                         | 7.10.1         |
| @types/pg                      | 8.15.6         |
| dotenv                         | 17.2.3         |
| @better-auth/prisma-adapter    | 1.7.12         |
| @aws-sdk/client-s3             | 3.1156.0       |
| @aws-sdk/s3-request-presigner  | 3.1156.0       |
| openai                         | 6.9.1          |

Song search uses bounded, validated iTunes catalog requests on the authenticated API. The server resolves chosen track IDs; clients cannot supply preview URLs. Metadata is persisted with contributions and immutable snapshots. A partial unique index enforces one undeleted song per contributor/board. Expo Audio 58.0.10 streams previews on demand, one player at a time, and pauses on route exit/background. No recording or background playback permissions are requested.
