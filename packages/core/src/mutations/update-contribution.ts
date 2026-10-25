import {
  boardIdSchema,
  updateContributionSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { getCatalogSong } from '../music/catalog';
import { requireBoard, lockBoard, checkRevision } from '../boards/board-access';

export async function updateContribution(
  ctx: CoreContext,
  rawBoard: unknown,
  rawItem: unknown,
  input: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    id = boardIdSchema.parse(rawItem);
  const { contentRevision, item: value } =
    updateContributionSchema.parse(input);
  if (id !== value.id) throw new AppError('validation', 'Item IDs must match');
  await requireBoard(ctx.db, boardId, ctx.actor.userId);
  const song =
    value.kind === 'SONG' && value.songTrackId
      ? await getCatalogSong(value.songTrackId)
      : null;
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, boardId);
    const board = await requireBoard(tx, boardId, ctx.actor.userId);
    checkRevision(board.contentRevision, contentRevision);
    const item = await tx.contribution.findFirst({
      where: { id, boardId, deletedAt: null },
    });
    if (!item) throw new AppError('not-found', 'Item not found');
    if (
      item.contributorId !== ctx.actor.userId &&
      board.ownerUserId !== ctx.actor.userId
    )
      throw new AppError(
        'forbidden',
        'Only the uploader or owner can edit this item',
      );
    if (item.kind !== value.kind || item.assetId !== value.assetId)
      throw new AppError('validation', 'Replace photos by adding a new image');
    await tx.contribution.update({
      where: { id },
      data: {
        text: value.text,
        songUrl: song?.storeUrl ?? value.songUrl,
        ...(song ? { song } : {}),
      },
    });
    await tx.board.update({
      where: { id: boardId },
      data: { contentRevision: { increment: 1 } },
    });
  });
  return { ok: true };
}
