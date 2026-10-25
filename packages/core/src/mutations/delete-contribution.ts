import { boardIdSchema } from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { requireBoard, lockBoard } from '../boards/board-access';

export async function deleteContribution(
  ctx: CoreContext,
  rawBoard: unknown,
  rawItem: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    id = boardIdSchema.parse(rawItem);
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, boardId);
    const board = await requireBoard(tx, boardId, ctx.actor.userId);
    const item = await tx.contribution.findFirst({ where: { id, boardId } });
    if (!item) throw new AppError('not-found', 'Item not found');
    if (
      board.ownerUserId !== ctx.actor.userId &&
      item.contributorId !== ctx.actor.userId
    )
      throw new AppError(
        'forbidden',
        'Only the uploader or memory owner can remove this item',
      );
    if (item.deletedAt) return;
    await tx.contribution.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await tx.board.update({
      where: { id: boardId },
      data: { contentRevision: { increment: 1 } },
    });
    await tx.boardAudit.create({
      data: {
        boardId,
        actorId: ctx.actor.userId,
        operation: 'contributions.delete',
      },
    });
  });
  return { ok: true };
}
