import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import { createDatabase } from '@afterglow/db/client';
import { createStorage } from '@afterglow/storage/s3';
import { FixtureCompositionProvider } from '@afterglow/ai/composition';
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
} from '@afterglow/core/boards';
import type { CoreContext } from '@afterglow/core/context';
import { cleanupAssets } from '@afterglow/core/maintenance';
import { publicMemoryPage } from './public-memory-page';
import { createAuth } from '@afterglow/auth/server';
import { createApp } from './app';

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error(
    'Use a separately migrated TEST_DATABASE_URL ending in _test',
  );
const db = createDatabase(url),
  storage = createStorage({
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    publicEndpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'afterglow-private',
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    forcePathStyle: true,
  });
const app = createApp({
  db,
  storage,
  auth: createAuth(db, {
    secret: 'memory-tests-only-at-least-32-characters',
    baseURL: 'http://localhost:3001',
    trustedOrigins: ['afterglow://'],
  }),
  origins: ['afterglow://'],
});
const userIds = [randomUUID(), randomUUID(), randomUUID()];
function context(index: number): CoreContext {
  return {
    db,
    storage,
    actor: { kind: 'user', userId: userIds[index]! },
    diagnostics: { requestId: randomUUID(), operation: 'integration.memory' },
  };
}
const alice = context(0),
  bob = context(1),
  stranger = context(2),
  fixture = new FixtureCompositionProvider();
async function board(title = 'A weekend together') {
  const id = randomUUID();
  await createBoard(alice, { id, title, eventDate: '2026-10-24' });
  return id;
}
function story(text = 'Made this with my friends.') {
  return {
    id: randomUUID(),
    kind: 'STORY',
    text,
    assetId: null,
    songUrl: null,
  };
}
async function photo(boardId: string) {
  const bytes = await sharp({
    create: { width: 800, height: 600, channels: 3, background: '#c07040' },
  })
    .jpeg()
    .toBuffer();
  const id = randomUUID();
  await createMemoryUpload(alice, boardId, {
    id,
    mime: 'image/jpeg',
    byteSize: bytes.length,
  });
  await uploadMemorySource(alice, boardId, id, bytes, 'image/jpeg');
  await completeMemoryUpload(alice, boardId, id);
  return { id, bytes };
}
beforeAll(async () => {
  await storage.initialize();
  for (const [index, id] of userIds.entries())
    await db.user.create({
      data: {
        id,
        name: `Memory ${index}`,
        firstName: 'Memory',
        lastName: String(index),
        username: `memory_${id.replaceAll('-', '').slice(0, 12)}`,
        email: `${id}@test.invalid`,
      },
    });
});
afterAll(async () => {
  const assets = await db.asset.findMany({
    where: { ownerUserId: { in: userIds } },
  });
  await db.board.deleteMany({ where: { ownerUserId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  for (const asset of assets) {
    await storage.remove(asset.sourceKey);
    if (asset.derivativeKey) await storage.remove(asset.derivativeKey);
  }
  await db.$disconnect();
});
describe('memory creation, contribution, and publication', () => {
  it('enforces membership and owner permissions on reads, writes, invitations and publishing', async () => {
    const id = await board();
    await expect(getBoard(stranger, id)).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(getPublicBoard(stranger, id)).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(addContribution(bob, id, story())).rejects.toMatchObject({
      code: 'not-found',
    });
    await inviteContributors(alice, id, { userIds: [bob.actor.userId] });
    expect((await getBoard(bob, id)).canContribute).toBe(true);
    await expect(
      inviteContributors(bob, id, { userIds: [stranger.actor.userId] }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    await expect(
      composeBoard(bob, id, { contentRevision: 0 }, fixture),
    ).rejects.toMatchObject({ code: 'forbidden' });
    await expect(
      publishLayout(bob, id, { layoutId: randomUUID(), visibility: 'PUBLIC' }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
  it('keeps one playable catalog song per person, supports replacement, and centers each song', async () => {
    const originalFetch = globalThis.fetch;
    const provider = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, options) => {
        const url = new URL(String(input));
        if (url.origin !== 'https://itunes.apple.com')
          return originalFetch(input, options);
        const trackId = Number(url.searchParams.get('id'));
        return Response.json({
          results: [
            {
              trackId,
              kind: 'song',
              trackName: 'Catalog song',
              artistName: 'Catalog artist',
              trackViewUrl: `https://music.apple.com/us/song/${trackId}`,
              previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
              artworkUrl100: 'https://is1-ssl.mzstatic.com/artwork.jpg',
            },
          ],
        });
      });
    try {
      const id = await board();
      const input = {
        id: randomUUID(),
        kind: 'SONG',
        text: 'Catalog song — Catalog artist',
        assetId: null,
        songUrl: null,
        songTrackId: '87654321',
      };
      const outcomes = await Promise.allSettled([
        addContribution(alice, id, input),
        addContribution(alice, id, { ...input, id: randomUUID() }),
      ]);
      expect(
        outcomes.filter((outcome) => outcome.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        outcomes.find((outcome) => outcome.status === 'rejected'),
      ).toMatchObject({ reason: { code: 'conflict' } });
      const saved = (await getBoard(alice, id)).items[0]!;
      expect(saved.song).toMatchObject({
        id: input.songTrackId,
        previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
      });
      await addContribution(alice, id, { ...input, id: saved.id });
      expect((await getBoard(alice, id)).items).toHaveLength(1);
      await inviteContributors(alice, id, { userIds: [bob.actor.userId] });
      await addContribution(bob, id, { ...input, id: randomUUID() });
      const preview = await composeBoard(
        alice,
        id,
        { contentRevision: 2 },
        fixture,
      );
      expect(preview.sections).toHaveLength(2);
      for (const section of preview.sections) {
        const frame = preview.frames.find(
          (entry) => entry.id === section.songItemId,
        )!;
        expect(frame.x + frame.width / 2).toBe(section.x + section.width / 2);
        expect(frame.y + frame.height / 2).toBe(section.y + section.height / 2);
      }
      await updateContribution(alice, id, saved.id, {
        contentRevision: 2,
        item: { ...input, id: saved.id, songTrackId: '87654322' },
      });
      expect(
        (await getBoard(alice, id)).items.find((entry) => entry.id === saved.id)
          ?.song?.id,
      ).toBe('87654322');
      await deleteContribution(alice, id, saved.id);
      await addContribution(alice, id, { ...input, id: randomUUID() });
      expect(
        (await getBoard(alice, id)).items.filter(
          (entry) =>
            entry.kind === 'SONG' && entry.contributorId === alice.actor.userId,
        ),
      ).toHaveLength(1);
    } finally {
      provider.mockRestore();
    }
  });
  it('makes retries idempotent and rejects changed payloads and stale edits', async () => {
    const id = randomUUID(),
      input = { id, title: 'Idempotent', eventDate: null };
    await Promise.all([createBoard(alice, input), createBoard(alice, input)]);
    await expect(
      createBoard(alice, { ...input, title: 'Different' }),
    ).rejects.toMatchObject({ code: 'conflict' });
    const item = story();
    await Promise.all([
      addContribution(alice, id, item),
      addContribution(alice, id, item),
    ]);
    expect((await getBoard(alice, id)).contentRevision).toBe(1);
    await expect(
      addContribution(alice, id, { ...item, text: 'Different' }),
    ).rejects.toMatchObject({ code: 'conflict' });
    await updateContribution(alice, id, item.id, {
      contentRevision: 1,
      item: { ...item, text: 'Edited' },
    });
    await expect(
      updateBoard(alice, id, {
        title: 'Stale rename',
        eventDate: null,
        contentRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect((await getBoard(alice, id)).items[0]!.text).toBe('Edited');
  });
  it('verifies real image bytes and scope, and keeps verified derivatives immutable', async () => {
    const id = await board(),
      other = await board(),
      image = await photo(id);
    const asset = await db.asset.findUniqueOrThrow({ where: { id: image.id } });
    expect(asset.width).toBe(800);
    expect(asset.height).toBe(600);
    expect(asset.color).toMatch(/^#[0-9a-f]{6}$/);
    const hash = createHash('sha256')
      .update(await storage.readDerivative(asset.derivativeKey!))
      .digest('hex');
    await expect(
      uploadMemorySource(alice, id, image.id, image.bytes, 'image/jpeg'),
    ).rejects.toMatchObject({ code: 'invalid-state' });
    const contribution = {
      id: randomUUID(),
      kind: 'PHOTO',
      text: 'A photograph',
      assetId: image.id,
      songUrl: null,
    };
    await expect(
      addContribution(alice, other, contribution),
    ).rejects.toMatchObject({ code: 'validation' });
    await inviteContributors(alice, id, { userIds: [bob.actor.userId] });
    await expect(addContribution(bob, id, contribution)).rejects.toMatchObject({
      code: 'validation',
    });
    await addContribution(alice, id, contribution);
    await storage.writeSource(
      asset.sourceKey,
      Buffer.from('tampered source'),
      'image/jpeg',
    );
    await completeMemoryUpload(alice, id, image.id);
    expect(
      createHash('sha256')
        .update(await storage.readDerivative(asset.derivativeKey!))
        .digest('hex'),
    ).toBe(hash);
    const brokenId = randomUUID(),
      broken = Buffer.from('not an image');
    await createMemoryUpload(alice, id, {
      id: brokenId,
      mime: 'image/jpeg',
      byteSize: broken.length,
    });
    await uploadMemorySource(alice, id, brokenId, broken, 'image/jpeg');
    await expect(
      completeMemoryUpload(alice, id, brokenId),
    ).rejects.toMatchObject({ code: 'validation' });
    const old = new Date(Date.now() - 2 * 86400000);
    await db.asset.update({
      where: { id: image.id },
      data: { createdAt: old, updatedAt: old },
    });
    await cleanupAssets({
      ...alice,
      actor: { kind: 'system', job: 'asset-cleanup' },
    });
    expect(
      await db.asset.findUnique({ where: { id: image.id } }),
    ).not.toBeNull();
  });
  it('publishes a fixed snapshot, keeps later contributions private and suppresses deletions immediately', async () => {
    const id = await board(),
      image = await photo(id),
      first = story('<script>alert("private")</script>');
    const photoItem = {
      id: randomUUID(),
      kind: 'PHOTO',
      text: 'Together',
      assetId: image.id,
      songUrl: null,
    };
    await addContribution(alice, id, first);
    await addContribution(alice, id, photoItem);
    const preview = await composeBoard(
      alice,
      id,
      { contentRevision: 2 },
      fixture,
    );
    expect(preview.label).toBe('Basic grouping used');
    await publishLayout(alice, id, {
      layoutId: preview.id,
      visibility: 'PUBLIC',
    });
    await publishLayout(alice, id, {
      layoutId: preview.id,
      visibility: 'PUBLIC',
    });
    expect(
      await db.boardAudit.count({
        where: { boardId: id, operation: 'boards.publish.public' },
      }),
    ).toBe(1);
    const published = await getPublicBoard(stranger, id);
    expect(published.items).toHaveLength(2);
    const pageResponse = await app.request(`/m/${id}`);
    expect(pageResponse.status).toBe(200);
    expect(pageResponse.headers.get('cache-control')).toBe('no-store');
    expect(pageResponse.headers.get('content-security-policy')).toContain(
      "default-src 'none'",
    );
    const publicMedia = await app.request(
      `/api/public/boards/${id}/media/${image.id}`,
    );
    expect(publicMedia.status).toBe(200);
    expect(publicMedia.headers.get('content-type')).toBe('image/webp');
    expect((await publicMedia.arrayBuffer()).byteLength).toBeGreaterThan(0);
    const html = publicMemoryPage(published);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    await inviteContributors(alice, id, { userIds: [bob.actor.userId] });
    await addContribution(
      bob,
      id,
      story('A late contribution, still pending.'),
    );
    await updateBoard(alice, id, {
      title: 'Private draft title',
      eventDate: null,
      contentRevision: 3,
    });
    expect((await getPublicBoard(stranger, id)).title).toBe(
      'A weekend together',
    );
    expect((await getPublicBoard(stranger, id)).items).toHaveLength(2);
    expect(
      (await listBoards(stranger, { limit: 30 })).items.find(
        (entry) => entry.id === id,
      )?.title,
    ).toBe('A weekend together');
    await expect(
      publishLayout(alice, id, { layoutId: preview.id, visibility: 'PUBLIC' }),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(
      (await db.board.findUniqueOrThrow({ where: { id } })).publishedLayoutId,
    ).toBe(preview.id);
    await deleteContribution(alice, id, photoItem.id);
    expect(
      (await getPublicBoard(stranger, id)).items.map((item) => item.id),
    ).toEqual([first.id]);
    await expect(getMemoryMedia(stranger, id, image.id)).rejects.toMatchObject({
      code: 'not-found',
    });
    expect(
      (await listBoards(stranger, { query: 'Private draft title' })).items.some(
        (entry) => entry.id === id,
      ),
    ).toBe(false);
    expect(
      (await listBoards(stranger, { query: 'weekend' })).items.some(
        (entry) => entry.id === id,
      ),
    ).toBe(true);
    expect(
      (await listBoards(bob, { scope: 'shared' })).items.some(
        (entry) => entry.id === id,
      ),
    ).toBe(true);
    await expect(unpublishBoard(bob, id)).rejects.toMatchObject({
      code: 'forbidden',
    });
    await unpublishBoard(alice, id);
    expect((await app.request(`/m/${id}`)).status).toBe(404);
    await expect(getPublicBoard(stranger, id)).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(deleteContribution(bob, id, first.id)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
  it('refuses a provider result when the revision changes during external work', async () => {
    const id = await board();
    await addContribution(alice, id, story());
    await expect(
      composeBoard(
        alice,
        id,
        { contentRevision: 1 },
        {
          model: fixture.model,
          compose: async (input) => {
            await addContribution(alice, id, story('Arrived during analysis'));
            return fixture.compose(input);
          },
        },
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(
      await db.boardLayout.count({ where: { boardId: id, status: 'READY' } }),
    ).toBe(0);
    expect(
      await db.boardLayout.count({ where: { boardId: id, status: 'FAILED' } }),
    ).toBe(1);
  });
  it('rejects a layout belonging to another memory without changing publication', async () => {
    const id = await board(),
      other = await board();
    await addContribution(alice, other, story());
    const preview = await composeBoard(
      alice,
      other,
      { contentRevision: 1 },
      fixture,
    );
    await expect(
      publishLayout(alice, id, { layoutId: preview.id, visibility: 'PUBLIC' }),
    ).rejects.toMatchObject({ code: 'invalid-state' });
    expect(
      (await db.board.findUniqueOrThrow({ where: { id } })).publishedLayoutId,
    ).toBeNull();
  });
});
