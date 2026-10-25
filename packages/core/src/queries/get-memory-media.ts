import { boardIdSchema } from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext, PublicContext } from '../context';
import { requireBoard } from '../boards/board-access';
import { getPublicBoard } from './get-public-board';

export async function getMemoryMedia(
  ctx: CoreContext | PublicContext,
  rawBoard: unknown,
  rawAsset: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    id = boardIdSchema.parse(rawAsset);
  let privateAccess = false;
  if ('actor' in ctx) {
    try {
      await requireBoard(ctx.db, boardId, ctx.actor.userId);
      privateAccess = true;
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== 'not-found')
        throw error;
    }
  }
  if (!privateAccess) {
    const board = await getPublicBoard(ctx, boardId);
    if (!board.items.some((item) => item.assetId === id))
      throw new AppError('not-found', 'Image not found');
  }
  const asset = await ctx.db.asset.findFirst({
    where: {
      id,
      boardId,
      purpose: 'MEMORY',
      status: 'READY',
      ...(privateAccess
        ? {
            OR: [
              { ownerUserId: (ctx as CoreContext).actor.userId },
              { contributions: { some: { boardId, deletedAt: null } } },
            ],
          }
        : {}),
    },
  });
  if (!asset?.derivativeKey) throw new AppError('not-found', 'Image not found');
  try {
    return await ctx.storage.readDerivative(asset.derivativeKey);
  } catch {
    throw new AppError(
      'provider-unavailable',
      'The photo could not be loaded. Try again.',
    );
  }
}
