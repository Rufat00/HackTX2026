import { boardIdSchema } from '@afterglow/contracts/memories';
import type { CoreContext } from '../context';
import { lockBoard, requireBoard } from '../boards/board-access';

export async function unpublishBoard(ctx: CoreContext, input: unknown) {
  const id = boardIdSchema.parse(input);
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, id);
    const board = await requireBoard(tx, id, ctx.actor.userId, true);
    if (board.visibility === 'PRIVATE') return;
    await tx.board.update({ where: { id }, data: { visibility: 'PRIVATE' } });
    await tx.boardAudit.create({
      data: {
        boardId: id,
        actorId: ctx.actor.userId,
        operation: 'boards.unpublish',
      },
    });
  });
  return { ok: true };
}
