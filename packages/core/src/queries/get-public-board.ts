import {
  boardIdSchema,
  boardSchema,
  snapshotSchema,
  previewSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { PublicContext } from '../context';

export async function getPublicBoard(ctx: PublicContext, rawId: unknown) {
  const id = boardIdSchema.parse(rawId);
  const board = await ctx.db.board.findFirst({
    where: { id, visibility: 'PUBLIC', publishedLayoutId: { not: null } },
    include: { publishedLayout: true },
  });
  if (
    !board?.publishedLayout ||
    board.publishedLayout.boardId !== id ||
    board.publishedLayout.status !== 'READY'
  )
    throw new AppError('not-found', 'Public memory not found');
  const snapshot = snapshotSchema.parse(board.publishedLayout.snapshot),
    preview = previewSchema.parse(board.publishedLayout.analysis);
  const live = new Set(
    (
      await ctx.db.contribution.findMany({
        where: { boardId: id, deletedAt: null },
        select: { id: true },
      })
    ).map((row) => row.id),
  );
  return boardSchema.parse({
    id,
    ownerUserId: board.ownerUserId,
    title: snapshot.title,
    eventDate: snapshot.eventDate,
    contentRevision: board.publishedLayout.contentRevision,
    visibility: 'PUBLIC',
    publishedLayoutId: board.publishedLayoutId,
    canContribute: false,
    canPublish: false,
    pendingChanges: false,
    members: [],
    items: snapshot.items.filter((item) => live.has(item.id)),
    preview: {
      ...preview,
      sections: preview.sections
        .filter((section) =>
          snapshot.items.some(
            (item) =>
              item.contributorId === section.contributorId && live.has(item.id),
          ),
        )
        .map((section) => ({
          ...section,
          songItemId:
            section.songItemId && live.has(section.songItemId)
              ? section.songItemId
              : null,
        })),
      frames: preview.frames.filter((frame) => live.has(frame.id)),
      clusters: preview.clusters
        .map((cluster) => ({
          ...cluster,
          itemIds: cluster.itemIds.filter((item) => live.has(item)),
        }))
        .filter((cluster) => cluster.itemIds.length),
      suggestedLinks: preview.suggestedLinks.filter(
        (link) => live.has(link.a) && live.has(link.b),
      ),
    },
  });
}
