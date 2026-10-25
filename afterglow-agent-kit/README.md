# Afterglow agent handoff

Use the files in this order:

1. Put this kit's `AGENTS.md` at the root of the new Afterglow repository. It is a new project guideline file, not a replacement for the ChatGPT project mirror's `AGENTS.md`.
2. Give the implementation agent `01-bootstrap-agent-prompt.md` and the included `product-specification.md`. Run this task first.
3. Supply the Bond screenshot ZIP to that repository, then give the agent `02-design-system-agent-prompt.md`. It will inspect the archive, extract evidence-backed tokens, implement components and persist design rules for later work.

These are two task prompts and one persistent development guideline file. They do not claim that the app has been initialized or that the screenshots have already been analyzed.

## Architecture decision

Expo/React Native with Expo Router; Hono TypeScript API; PostgreSQL and Prisma; Better Auth with native session support; private S3 uploads; typed React Native themes; TanStack Query/Form; shared Zod contracts.

Use AI for semantic organization and short labels. Compute card packing and ambient colors in deterministic application code. The initial provider recommendation is OpenAI Responses with image input and structured output, using `gpt-6.1-sol` behind a replaceable adapter. Verify the model against available account access before a live call.

## Important auth detail

Better Auth's documented username signup still requires an email internally. The bootstrap prompt preserves a username-only interface through a server-generated, non-deliverable internal identifier and a narrow registration wrapper. No email collection or recovery UI is added. This integration needs real tests; it must not be handwaved as a built-in email-free signup method.

## Reference availability

The existing Critiq guidelines were read from `/home/rufat/acm/Critiq/AGENTS.md` in WSL and adapted. The Bond archive was not present in this chat's workspace when this kit was prepared. Its actual visual values remain for the second task to establish.

## Official implementation references

- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [Hono on Node](https://hono.dev/docs/getting-started/nodejs)
- [Better Auth Hono integration](https://better-auth.com/docs/integrations/hono)
- [Better Auth Expo integration](https://better-auth.com/docs/integrations/expo)
- [Better Auth username plugin and signup requirements](https://better-auth.com/docs/plugins/username)
- [Better Auth Prisma integration](https://better-auth.com/docs/adapters/prisma)
- [Prisma current and supported versions](https://docs.prisma.io/docs/prisma-orm/quickstart/postgresql)
- [S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [OpenAI model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
