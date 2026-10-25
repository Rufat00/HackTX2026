import {
  updateBoardSchema,
  boardIdSchema,
} from '@afterglow/contracts/memories';
import type { CoreContext } from '../context';
import { requireBoard, lockBoard, checkRevision } from '../boards/board-access';

export async function updateBoard(
  ctx: CoreContext,
  rawId: unknown,
  input: unknown,
) {
  const id = boardIdSchema.parse(rawId),
    value = updateBoardSchema.parse(input);
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, id);
    const board = await requireBoard(tx, id, ctx.actor.userId, true);
    checkRevision(board.contentRevision, value.contentRevision);
    await tx.board.update({
      where: { id },
      data: {
        title: value.title,
        eventDate: value.eventDate ? new Date(value.eventDate) : null,
        contentRevision: { increment: 1 },
      },
    });
  });
  return { ok: true };
}
