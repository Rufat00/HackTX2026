import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { createDatabase } from '@afterglow/db/client';
import { createAuth } from '@afterglow/auth/server';
import { createStorage } from '@afterglow/storage/s3';
import { cleanupAssets } from '@afterglow/core/maintenance';
import { createApp } from './app';

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error(
    'TEST_DATABASE_URL must name a disposable database ending in _test; migrate it first',
  );
const db = createDatabase(url);
const storage = createStorage({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  publicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? 'http://localhost:9000',
  region: 'us-east-1',
  bucket: process.env.S3_BUCKET ?? 'afterglow-private',
  accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'afterglow_local',
  secretAccessKey:
    process.env.S3_SECRET_ACCESS_KEY ?? 'afterglow_local_storage_only',
  forcePathStyle: true,
});
const auth = createAuth(db, {
  secret: 'integration-only-secret-at-least-32-characters',
  baseURL: 'http://localhost:3001',
  trustedOrigins: ['afterglow://'],
});
const app = createApp({ auth, db, storage, origins: ['afterglow://'] });
const prefix = `test_${randomUUID().replaceAll('-', '').slice(0, 10)}`;
const password = 'Integration password 123';
let aliceCookie = '',
  bobCookie = '',
  aliceId = '',
  aliceAsset = '',
  aliceUpload = '',
  source: Buffer;
const usernames: string[] = [];
function request(path: string, method = 'GET', cookie = '', body?: unknown) {
  return app.request(`http://localhost:3001${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Afterglow-Client': 'native',
      'expo-origin': 'afterglow://',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
async function signup(suffix: string) {
  const username = `${prefix}_${suffix}`;
  usernames.push(username);
  const response = await request('/api/auth/register', 'POST', '', {
    username,
    password,
    firstName: 'माया',
    lastName: 'Demo',
  });
  expect(response.status).toBe(201);
  const cookie = response.headers
    .getSetCookie()
    .map((v) => v.split(';')[0])
    .join('; ');
  expect(cookie).toContain('session_token');
  expect(await response.json()).toEqual({ ok: true });
  return cookie;
}
beforeAll(async () => {
  await storage.initialize();
  aliceCookie = await signup('a');
  bobCookie = await signup('b');
  source = await sharp({
    create: { width: 24, height: 12, channels: 3, background: 'red' },
  })
    .jpeg()
    .toBuffer();
});
afterAll(async () => {
  const users = await db.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true },
  });
  const assets = await db.asset.findMany({
    where: { ownerUserId: { in: users.map((v) => v.id) } },
  });
  for (const asset of assets) {
    await storage.remove(asset.sourceKey);
    if (asset.derivativeKey) await storage.remove(asset.derivativeKey);
  }
  await db.user.deleteMany({ where: { id: { in: users.map((v) => v.id) } } });
  await db.$disconnect();
});
describe.sequential('real PostgreSQL / Better Auth / S3 foundation', () => {
  it('restores sessions for authenticated business reads without exposing internal email', async () => {
    const response = await request('/api/v1/me', 'GET', aliceCookie);
    expect(response.status).toBe(200);
    const profile = await response.json();
    aliceId = profile.id;
    expect(profile.firstName).toBe('माया');
    expect(profile).not.toHaveProperty('email');
    expect(profile.username).toBe(`${prefix}_a`);
  });
  it('edits names through the trusted actor and keeps the auth display name derived', async () => {
    const response = await request('/api/v1/me', 'PATCH', aliceCookie, {
      firstName: 'Maya',
      lastName: '李',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: aliceId,
      firstName: 'Maya',
      lastName: '李',
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: aliceId } })).name,
    ).toBe('Maya 李');
  });
  it('rejects invalid credentials', async () => {
    expect(
      (
        await request('/api/auth/sign-in/username', 'POST', '', {
          username: `${prefix}_a`,
          password: 'Incorrect password 123',
        })
      ).status,
    ).toBe(401);
  });
  it('resolves a concurrent username uniqueness race', async () => {
    const username = `${prefix}_race`;
    usernames.push(username);
    const body = { username, password, firstName: 'Race', lastName: 'Demo' };
    const responses = await Promise.all([
      request('/api/auth/register', 'POST', '', body),
      request('/api/auth/register', 'POST', '', body),
    ]);
    expect(responses.map((v) => v.status).sort()).toEqual([201, 409]);
    expect(await db.user.count({ where: { username } })).toBe(1);
  });
  it('rejects client supplied user identity', async () => {
    expect(
      (
        await request('/api/v1/me', 'PATCH', aliceCookie, {
          userId: 'another',
          firstName: 'Maya',
          lastName: 'Demo',
        })
      ).status,
    ).toBe(400);
  });
  it('uploads profile bytes through the API tunnel above 32 KB and protects photo reads', async () => {
    const bytes = await sharp(randomBytes(256 * 256 * 3), {
      raw: { width: 256, height: 256, channels: 3 },
    })
      .png()
      .toBuffer();
    expect(bytes.length).toBeGreaterThan(32 * 1024);
    const intent = await (
      await request('/api/v1/uploads', 'POST', bobCookie, {
        mime: 'image/png',
        byteSize: bytes.length,
      })
    ).json();
    const upload = (cookie: string) =>
      app.request(`/api/v1/assets/${intent.assetId}/source`, {
        method: 'POST',
        headers: {
          Cookie: cookie,
          'X-Afterglow-Client': 'native',
          'Content-Type': 'image/png',
        },
        body: new Uint8Array(bytes),
      });
    expect((await upload(aliceCookie)).status).toBe(404);
    expect((await upload(bobCookie)).status).toBe(200);
    expect(
      (
        await request(
          `/api/v1/assets/${intent.assetId}/complete`,
          'POST',
          bobCookie,
          {},
        )
      ).status,
    ).toBe(200);
    const image = await request(
      `/api/v1/assets/${intent.assetId}/content`,
      'GET',
      bobCookie,
    );
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/webp');
    expect(image.headers.get('cache-control')).toBe('no-store');
    expect(
      (
        await request(
          `/api/v1/assets/${intent.assetId}/content`,
          'GET',
          aliceCookie,
        )
      ).status,
    ).toBe(404);
  });
  it('uploads, verifies, strips and atomically attaches a profile derivative', async () => {
    const intentResponse = await request(
      '/api/v1/uploads',
      'POST',
      aliceCookie,
      { mime: 'image/jpeg', byteSize: source.length },
    );
    expect(intentResponse.status).toBe(201);
    const intent = await intentResponse.json();
    aliceAsset = intent.assetId;
    aliceUpload = intent.uploadUrl;
    expect(
      (
        await fetch(intent.uploadUrl, {
          method: 'PUT',
          headers: intent.requiredHeaders,
          body: new Uint8Array(source),
        })
      ).ok,
    ).toBe(true);
    const complete = await request(
      `/api/v1/assets/${aliceAsset}/complete`,
      'POST',
      aliceCookie,
      {},
    );
    expect(complete.status).toBe(200);
    expect((await complete.json()).profileImageAssetId).toBe(aliceAsset);
    const asset = await db.asset.findUniqueOrThrow({
      where: { id: aliceAsset },
    });
    expect(asset.derivativeKey).not.toBe(asset.sourceKey);
    expect(asset.status).toBe('READY');
  });
  it('prevents cross-user completion, attachment and download', async () => {
    expect(
      (
        await request(
          `/api/v1/assets/${aliceAsset}/complete`,
          'POST',
          bobCookie,
          {},
        )
      ).status,
    ).toBe(404);
    expect(
      (await request(`/api/v1/assets/${aliceAsset}/access`, 'GET', bobCookie))
        .status,
    ).toBe(404);
    expect(
      (
        await request('/api/v1/me', 'PATCH', bobCookie, {
          firstName: 'Bob',
          lastName: 'Demo',
          profileImageAssetId: aliceAsset,
        })
      ).status,
    ).toBe(404);
  });
  it('serves the verified derivative despite reusable source URL overwrites', async () => {
    const access = await (
      await request(`/api/v1/assets/${aliceAsset}/access`, 'GET', aliceCookie)
    ).json();
    const hash = async () =>
      createHash('sha256')
        .update(Buffer.from(await (await fetch(access.url)).arrayBuffer()))
        .digest('hex');
    const before = await hash();
    expect(
      (
        await fetch(aliceUpload, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: new Uint8Array(Buffer.alloc(source.length)),
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await request(
          `/api/v1/assets/${aliceAsset}/complete`,
          'POST',
          aliceCookie,
          {},
        )
      ).status,
    ).toBe(200);
    expect(await hash()).toBe(before);
  });
  it('replaces a photo and does not reattach an older completed upload', async () => {
    const older = aliceAsset;
    const intent = await (
      await request('/api/v1/uploads', 'POST', aliceCookie, {
        mime: 'image/jpeg',
        byteSize: source.length,
      })
    ).json();
    expect(
      (
        await request(
          `/api/v1/assets/${intent.assetId}/access`,
          'GET',
          aliceCookie,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await fetch(intent.uploadUrl, {
          method: 'PUT',
          headers: intent.requiredHeaders,
          body: new Uint8Array(source),
        })
      ).ok,
    ).toBe(true);
    const response = await request(
      `/api/v1/assets/${intent.assetId}/complete`,
      'POST',
      aliceCookie,
      {},
    );
    expect(response.status).toBe(200);
    aliceAsset = intent.assetId;
    expect((await response.json()).profileImageAssetId).toBe(aliceAsset);
    const repeated = await request(
      `/api/v1/assets/${older}/complete`,
      'POST',
      aliceCookie,
      {},
    );
    expect((await repeated.json()).profileImageAssetId).toBe(aliceAsset);
  });
  it('rejects spoofed image content and preserves the previous profile image', async () => {
    const intent = await (
      await request('/api/v1/uploads', 'POST', aliceCookie, {
        mime: 'image/jpeg',
        byteSize: 100,
      })
    ).json();
    await fetch(intent.uploadUrl, {
      method: 'PUT',
      headers: intent.requiredHeaders,
      body: new Uint8Array(Buffer.alloc(100)),
    });
    expect(
      (
        await request(
          `/api/v1/assets/${intent.assetId}/complete`,
          'POST',
          aliceCookie,
          {},
        )
      ).status,
    ).toBe(400);
    const profile = await (
      await request('/api/v1/me', 'GET', aliceCookie)
    ).json();
    expect(profile.profileImageAssetId).toBe(aliceAsset);
  });
  it('cleans abandoned uploads repeatably while retaining an attached derivative', async () => {
    const stale = new Date(Date.now() - 2 * 86400000);
    const orphan = await db.asset.create({
      data: {
        ownerUserId: aliceId,
        purpose: 'PROFILE',
        sourceKey: `uploads/test/${randomUUID()}`,
        mime: 'image/jpeg',
        byteSize: 1,
        createdAt: stale,
        updatedAt: stale,
      },
    });
    await db.asset.update({
      where: { id: aliceAsset },
      data: { createdAt: stale, updatedAt: stale },
    });
    const ctx = {
      db,
      storage,
      actor: { kind: 'system' as const, job: 'asset-cleanup' as const },
      diagnostics: { requestId: randomUUID(), operation: 'cleanupAssets' },
    };
    const counts = await cleanupAssets(ctx);
    expect(counts.deletedAssets).toBe(1);
    expect(counts.deletedSources).toBe(1);
    expect(await db.asset.findUnique({ where: { id: orphan.id } })).toBeNull();
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: aliceId } }))
        .profileImageAssetId,
    ).toBe(aliceAsset);
    const access = await (
      await request(`/api/v1/assets/${aliceAsset}/access`, 'GET', aliceCookie)
    ).json();
    expect((await fetch(access.url)).ok).toBe(true);
    expect(await cleanupAssets(ctx)).toEqual({
      deletedAssets: 0,
      deletedSources: 0,
    });
  });
  it('rejects an expired session and restores via username login', async () => {
    await db.session.updateMany({
      where: { userId: aliceId },
      data: { expiresAt: new Date(0) },
    });
    expect((await request('/api/v1/me', 'GET', aliceCookie)).status).toBe(401);
    const signedIn = await request('/api/auth/sign-in/username', 'POST', '', {
      username: `${prefix}_a`,
      password,
    });
    expect(signedIn.status).toBe(200);
    aliceCookie = signedIn.headers
      .getSetCookie()
      .map((v) => v.split(';')[0])
      .join('; ');
    expect((await request('/api/v1/me', 'GET', aliceCookie)).status).toBe(200);
  });
  it('revokes the server session on logout', async () => {
    expect(
      (await request('/api/auth/sign-out', 'POST', aliceCookie, {})).status,
    ).toBe(200);
    expect((await request('/api/v1/me', 'GET', aliceCookie)).status).toBe(401);
  });
});
