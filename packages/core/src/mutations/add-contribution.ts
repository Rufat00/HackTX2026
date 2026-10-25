import {
  addContributionSchema,
  boardIdSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { getCatalogSong } from '../music/catalog';
import { catalogSongSchema } from '@afterglow/contracts/music';
import { requireBoard, lockBoard } from '../boards/board-access';

export async function addContribution(
  ctx: CoreContext,
  rawId: unknown,
  input: unknown,
) {
  const boardId = boardIdSchema.parse(rawId),
    value = addContributionSchema.parse(input);
  await requireBoard(ctx.db, boardId, ctx.actor.userId);
  const song =
    value.kind === 'SONG' && value.songTrackId
      ? await getCatalogSong(value.songTrackId)
      : null;
  const { songTrackId: _trackId, ...fields } = value;
  const songUrl = song?.storeUrl ?? value.songUrl;
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, boardId);
    await requireBoard(tx, boardId, ctx.actor.userId);
    const existing = await tx.contribution.findUnique({
      where: { id: value.id },
    });
    if (existing) {
      if (
        existing.boardId !== boardId ||
        existing.contributorId !== ctx.actor.userId ||
        existing.deletedAt ||
        existing.kind !== value.kind ||
        existing.text !== value.text ||
        existing.assetId !== value.assetId ||
        (value.kind !== 'SONG' && existing.songUrl !== value.songUrl) ||
        (catalogSongSchema.safeParse(existing.song).success
          ? catalogSongSchema.parse(existing.song).id
          : null) !== value.songTrackId
      )
        throw new AppError('conflict', 'This item key has already been used');
      return;
    }
    if (
      (await tx.contribution.count({ where: { boardId, deletedAt: null } })) >=
      30
    )
      throw new AppError('validation', 'A memory can hold up to 30 items');
    if (
      value.kind === 'SONG' &&
      (await tx.contribution.count({
        where: {
          boardId,
          contributorId: ctx.actor.userId,
          kind: 'SONG',
          deletedAt: null,
        },
      }))
    )
      throw new AppError(
        'conflict',
        'You already have a song in this memory. Edit or replace it.',
      );
    if (value.assetId) {
      await tx.$queryRaw`SELECT "id" FROM "assets" WHERE "id" = ${value.assetId}::uuid FOR UPDATE`;
      const asset = await tx.asset.findFirst({
        where: {
          id: value.assetId,
          boardId,
          ownerUserId: ctx.actor.userId,
          purpose: 'MEMORY',
          status: 'READY',
        },
      });
      if (!asset)
        throw new AppError(
          'validation',
          'Choose a verified image uploaded to this memory',
        );
    }
    const inserted = await tx.contribution.createMany({
      skipDuplicates: true,
      data: {
        ...fields,
        songUrl,
        ...(song ? { song } : {}),
        boardId,
        contributorId: ctx.actor.userId,
      },
    });
    if (!inserted.count)
      throw new AppError('conflict', 'This item key has already been used');
    await tx.board.update({
      where: { id: boardId },
      data: { contentRevision: { increment: 1 }, updatedAt: new Date() },
    });
  });
  return { id: value.id };
}
