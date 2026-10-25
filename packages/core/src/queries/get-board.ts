import {
  boardIdSchema,
  boardSchema,
  previewSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { requireBoard } from '../boards/board-access';
import { readBoardItems } from '../boards/board-snapshot';
import { getPublicBoard } from './get-public-board';

export async function getBoard(ctx: CoreContext, rawId: unknown) {
  const id = boardIdSchema.parse(rawId);
  let board;
  try {
    board = await requireBoard(ctx.db, id, ctx.actor.userId);
  } catch (error) {
    if (error instanceof AppError && error.code === 'not-found')
      return getPublicBoard(ctx, id);
    throw error;
  }
  const preview = await ctx.db.boardLayout.findFirst({
    where: {
      boardId: id,
      contentRevision: board.contentRevision,
      status: 'READY',
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  const published = board.publishedLayoutId
    ? await ctx.db.boardLayout.findUnique({
        where: { id: board.publishedLayoutId },
        select: { contentRevision: true },
      })
    : null;
  const people = [board.owner, ...board.members.map((member) => member.user)];
  return boardSchema.parse({
    id,
    ownerUserId: board.ownerUserId,
    title: board.title,
    eventDate: board.eventDate?.toISOString().slice(0, 10) ?? null,
    contentRevision: board.contentRevision,
    visibility: board.visibility,
    publishedLayoutId: board.publishedLayoutId,
    canContribute: true,
    canPublish: board.ownerUserId === ctx.actor.userId,
    pendingChanges:
      !published || published.contentRevision !== board.contentRevision,
    members: people.map((person) => ({
      id: person.id,
      name: `${person.firstName} ${person.lastName}`,
      username: person.username ?? '',
    })),
    items: await readBoardItems(ctx.db, id),
    preview: preview ? previewSchema.parse(preview.analysis) : null,
  });
}
