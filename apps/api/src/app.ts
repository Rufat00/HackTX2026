import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Auth } from '@afterglow/auth/server';
import { registerAccount } from '@afterglow/auth/server';
import { loginSchema } from '@afterglow/contracts/schemas';
import { AppError, type ApiError } from '@afterglow/contracts/errors';
import type { PrismaClient } from '@afterglow/db/client';
import type { Storage } from '@afterglow/storage/s3';
import type { CoreContext } from '@afterglow/core/context';
import { getProfile, updateProfile } from '@afterglow/core/profile';
import {
  createUploadIntent,
  completeProfileUpload,
  getAssetAccess,
  uploadProfileSource,
  getProfileMedia,
} from '@afterglow/core/assets';
import {
  createBoard,
  updateBoard,
  addContribution,
  updateContribution,
  deleteContribution,
  createMemoryUpload,
  uploadMemorySource,
  completeMemoryUpload,
  composeBoard,
  publishLayout,
  unpublishBoard,
  inviteContributors,
  getBoard,
  getPublicBoard,
  getMemoryMedia,
  listBoards,
  listPeople,
} from '@afterglow/core/boards';
import { searchSongs } from '@afterglow/core/music';
import { publicMemoryPage } from './public-memory-page';
type Variables = { requestId: string; core: CoreContext };
export function createApp(deps: {
  auth: Auth;
  db: PrismaClient;
  storage: Storage;
  origins: string[];
}) {
  const app = new Hono<{ Variables: Variables }>();
  app.use('*', async (c, next) => {
    c.set('requestId', randomUUID());
    c.header('X-Request-Id', c.get('requestId'));
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.use(
    '*',
    cors({
      origin: (origin) => (deps.origins.includes(origin) ? origin : undefined),
      credentials: true,
      allowHeaders: [
        'Content-Type',
        'Cookie',
        'X-Afterglow-Client',
        'ngrok-skip-browser-warning',
      ],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use('*', (c, next) =>
    bodyLimit({
      maxSize: /^\/api\/v1\/(?:boards\/[^/]+\/)?assets\/[^/]+\/source$/.test(
        c.req.path,
      )
        ? 10 * 1024 * 1024
        : 32 * 1024,
      onError: () => {
        throw new AppError('validation', 'Request is too large');
      },
    })(c, next),
  );
  app.onError((error, c) => {
    let safe = error instanceof AppError ? error : null;
    if (error instanceof z.ZodError)
      safe = new AppError(
        'validation',
        'Check the highlighted fields',
        z.flattenError(error).fieldErrors as Record<string, string[]>,
      );
    if (error instanceof SyntaxError)
      safe = new AppError('validation', 'Send valid JSON');
    if (!safe) {
      console.error(
        JSON.stringify({
          event: 'unexpected_failure',
          operation: `${c.req.method} ${c.req.routePath}`,
          requestId: c.get('requestId'),
        }),
      );
      safe = new AppError(
        'provider-unavailable',
        'The service is temporarily unavailable',
      );
    }
    if (safe.code === 'provider-unavailable' && error instanceof AppError)
      console.error(
        JSON.stringify({
          event: 'service_failure',
          operation: `${c.req.method} ${c.req.routePath}`,
          requestId: c.get('requestId'),
          actorId: c.get('core')?.actor.userId,
        }),
      );
    const statuses = {
      validation: 400,
      unauthenticated: 401,
      forbidden: 403,
      'not-found': 404,
      conflict: 409,
      'invalid-state': 409,
      'rate-limited': 429,
      'provider-unavailable': 503,
    } as const;
    const body: ApiError = {
      error: {
        code: safe.code,
        message: safe.message,
        retryable:
          safe.code === 'provider-unavailable' || safe.code === 'rate-limited',
        requestId: c.get('requestId'),
        ...(safe.fieldErrors ? { fieldErrors: safe.fieldErrors } : {}),
      },
    };
    return c.json(body, statuses[safe.code]);
  });
  app.get('/health', (c) => c.json({ status: 'ok' }));
  const publicContext = (requestId: string) => ({
    db: deps.db,
    storage: deps.storage,
    diagnostics: { requestId, operation: 'boards.public.read' },
  });
  app.get('/api/public/boards/:id', async (c) =>
    c.json(
      await getPublicBoard(
        publicContext(c.get('requestId')),
        c.req.param('id'),
      ),
    ),
  );
  app.get('/api/public/boards/:id/media/:assetId', async (c) => {
    const bytes = await getMemoryMedia(
      publicContext(c.get('requestId')),
      c.req.param('id'),
      c.req.param('assetId'),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
  app.get('/m/:id', async (c) => {
    const nonce = randomUUID();
    c.header(
      'Content-Security-Policy',
      `default-src 'none'; script-src 'nonce-${nonce}'; img-src 'self' https://*.mzstatic.com https://*.itunes.apple.com; media-src https://*.mzstatic.com https://*.itunes.apple.com; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`,
    );
    c.header('X-Content-Type-Options', 'nosniff');
    return c.html(
      publicMemoryPage(
        await getPublicBoard(
          publicContext(c.get('requestId')),
          c.req.param('id'),
        ),
        nonce,
      ),
    );
  });
  // Browser mutations require an allowed origin. Native requests use a non-simple header,
  // which browser CORS cannot send cross-origin without a successful preflight.
  app.use('/api/*', async (c, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      const origin = c.req.header('origin');
      if (
        origin
          ? !deps.origins.includes(origin)
          : c.req.header('X-Afterglow-Client') !== 'native'
      )
        throw new AppError('forbidden', 'Request origin is not allowed');
    }
    await next();
  });
  app.post('/api/auth/register', async (c) => {
    const response = await registerAccount(
      deps.auth,
      deps.db,
      await c.req.json(),
      c.req.raw.headers,
    );
    if (!response.ok) {
      if (response.status === 429)
        throw new AppError('rate-limited', 'Try again later');
      if (response.status >= 500)
        throw new AppError(
          'provider-unavailable',
          'Account creation is temporarily unavailable',
        );
      const body = (await response.clone().json()) as { code?: string };
      if (body.code?.includes('USERNAME') || body.code?.includes('EXISTS'))
        throw new AppError('conflict', 'This username is taken', {
          username: ['This username is taken'],
        });
      throw new AppError('validation', 'Account could not be created');
    }
    // Preserve all session headers (including Expo set-cookie), expose no internal email.
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers });
  });
  app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
    const path = c.req.path.slice('/api/auth'.length);
    if (
      !(
        (path === '/sign-in/username' && c.req.method === 'POST') ||
        (path === '/get-session' && c.req.method === 'GET') ||
        (path === '/sign-out' && c.req.method === 'POST')
      )
    )
      throw new AppError('not-found', 'Route not found');
    if (path === '/sign-in/username')
      loginSchema.parse(await c.req.raw.clone().json());
    const response = await deps.auth.handler(c.req.raw);
    if (!response.ok) {
      if (response.status >= 500)
        throw new AppError(
          'provider-unavailable',
          'Sign in is temporarily unavailable',
        );
      if (response.status === 429)
        throw new AppError('rate-limited', 'Try again later');
      throw new AppError(
        'unauthenticated',
        'Username or password is incorrect',
      );
    }
    // Better Auth's native client needs its session shape. Internal email remains confined
    // to the auth transport and is never part of the business profile DTO.
    return response;
  });
  app.use('/api/v1/*', async (c, next) => {
    const session = await deps.auth.api.getSession({
      headers: c.req.raw.headers,
      query: { disableCookieCache: true },
    });
    if (!session) throw new AppError('unauthenticated', 'Please sign in');
    c.set('core', {
      db: deps.db,
      storage: deps.storage,
      actor: { kind: 'user', userId: session.user.id },
      diagnostics: {
        requestId: c.get('requestId'),
        operation: c.req.method + ' ' + c.req.path,
      },
    });
    await next();
  });
  app.get('/api/v1/me', async (c) => c.json(await getProfile(c.get('core'))));
  app.patch('/api/v1/me', async (c) =>
    c.json(await updateProfile(c.get('core'), await c.req.json())),
  );
  app.post('/api/v1/uploads', async (c) =>
    c.json(await createUploadIntent(c.get('core'), await c.req.json()), 201),
  );
  app.post('/api/v1/assets/:id/complete', async (c) =>
    c.json(await completeProfileUpload(c.get('core'), c.req.param('id'))),
  );
  app.get('/api/v1/assets/:id/access', async (c) =>
    c.json(await getAssetAccess(c.get('core'), c.req.param('id'))),
  );
  app.post('/api/v1/assets/:id/source', async (c) =>
    c.json(
      await uploadProfileSource(
        c.get('core'),
        c.req.param('id'),
        Buffer.from(await c.req.arrayBuffer()),
        c.req.header('content-type') ?? '',
      ),
    ),
  );
  app.get('/api/v1/assets/:id/content', async (c) => {
    const bytes = await getProfileMedia(c.get('core'), c.req.param('id'));
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
  app.get('/api/v1/music/search', async (c) =>
    c.json(await searchSongs(c.get('core'), c.req.query('q'))),
  );
  app.get('/api/v1/boards', async (c) =>
    c.json(await listBoards(c.get('core'), c.req.query())),
  );
  app.post('/api/v1/boards', async (c) =>
    c.json(await createBoard(c.get('core'), await c.req.json()), 201),
  );
  app.get('/api/v1/people', async (c) =>
    c.json(await listPeople(c.get('core'), c.req.query('query'))),
  );
  app.get('/api/v1/boards/:id', async (c) =>
    c.json(await getBoard(c.get('core'), c.req.param('id'))),
  );
  app.patch('/api/v1/boards/:id', async (c) =>
    c.json(
      await updateBoard(c.get('core'), c.req.param('id'), await c.req.json()),
    ),
  );
  app.post('/api/v1/boards/:id/items', async (c) =>
    c.json(
      await addContribution(
        c.get('core'),
        c.req.param('id'),
        await c.req.json(),
      ),
      201,
    ),
  );
  app.patch('/api/v1/boards/:id/items/:itemId', async (c) =>
    c.json(
      await updateContribution(
        c.get('core'),
        c.req.param('id'),
        c.req.param('itemId'),
        await c.req.json(),
      ),
    ),
  );
  app.delete('/api/v1/boards/:id/items/:itemId', async (c) =>
    c.json(
      await deleteContribution(
        c.get('core'),
        c.req.param('id'),
        c.req.param('itemId'),
      ),
    ),
  );
  app.post('/api/v1/boards/:id/uploads', async (c) =>
    c.json(
      await createMemoryUpload(
        c.get('core'),
        c.req.param('id'),
        await c.req.json(),
      ),
      201,
    ),
  );
  app.post('/api/v1/boards/:id/assets/:assetId/source', async (c) =>
    c.json(
      await uploadMemorySource(
        c.get('core'),
        c.req.param('id'),
        c.req.param('assetId'),
        Buffer.from(await c.req.arrayBuffer()),
        c.req.header('content-type') ?? '',
      ),
    ),
  );
  app.post('/api/v1/boards/:id/assets/:assetId/complete', async (c) =>
    c.json(
      await completeMemoryUpload(
        c.get('core'),
        c.req.param('id'),
        c.req.param('assetId'),
      ),
    ),
  );
  app.get('/api/v1/boards/:id/media/:assetId', async (c) => {
    const bytes = await getMemoryMedia(
      c.get('core'),
      c.req.param('id'),
      c.req.param('assetId'),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
  app.post('/api/v1/boards/:id/compose', async (c) =>
    c.json(
      await composeBoard(c.get('core'), c.req.param('id'), await c.req.json()),
    ),
  );
  app.post('/api/v1/boards/:id/publish', async (c) =>
    c.json(
      await publishLayout(c.get('core'), c.req.param('id'), await c.req.json()),
    ),
  );
  app.post('/api/v1/boards/:id/unpublish', async (c) =>
    c.json(await unpublishBoard(c.get('core'), c.req.param('id'))),
  );
  app.post('/api/v1/boards/:id/contributors', async (c) =>
    c.json(
      await inviteContributors(
        c.get('core'),
        c.req.param('id'),
        await c.req.json(),
      ),
    ),
  );
  app.notFound(() => {
    throw new AppError('not-found', 'Route not found');
  });
  return app;
}
