import {
  boardIdSchema,
  publishBoardSchema,
  previewSchema,
  snapshotSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { requireBoard, lockBoard, checkRevision } from '../boards/board-access';

export async function publishLayout(
  ctx: CoreContext,
  rawBoard: unknown,
  input: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    value = publishBoardSchema.parse(input);
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, boardId);
    const board = await requireBoard(tx, boardId, ctx.actor.userId, true);
    const layout = await tx.boardLayout.findFirst({
      where: { id: value.layoutId, boardId, status: 'READY' },
    });
    if (!layout)
      throw new AppError('invalid-state', 'Compose a complete preview first');
    checkRevision(board.contentRevision, layout.contentRevision);
    const preview = previewSchema.parse(layout.analysis),
      snapshot = snapshotSchema.parse(layout.snapshot);
    const current = await tx.contribution.findMany({
      where: { boardId, deletedAt: null },
      select: { id: true },
    });
    const ids = new Set(current.map((item) => item.id));
    if (
      !ids.size ||
      snapshot.items.length !== ids.size ||
      preview.frames.length !== ids.size ||
      snapshot.items.some((item) => !ids.has(item.id)) ||
      preview.frames.some((frame) => !ids.has(frame.id))
    )
      throw new AppError(
        'invalid-state',
        'The preview is incomplete. Compose again.',
      );
    if (
      board.publishedLayoutId === layout.id &&
      board.visibility === value.visibility
    )
      return;
    await tx.board.update({
      where: { id: boardId },
      data: { publishedLayoutId: layout.id, visibility: value.visibility },
    });
    await tx.boardAudit.create({
      data: {
        boardId,
        actorId: ctx.actor.userId,
        operation:
          value.visibility === 'PUBLIC'
            ? 'boards.publish.public'
            : 'boards.publish.private',
      },
    });
  });
  return { ok: true };
}
