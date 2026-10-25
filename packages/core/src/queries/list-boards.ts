import {
  boardListInputSchema,
  boardListSchema,
  snapshotSchema,
} from '@afterglow/contracts/memories';
import type { CoreContext } from '../context';

export async function listBoards(ctx: CoreContext, input: unknown) {
  const value = boardListInputSchema.parse(input);
  const rows = await ctx.db.board.findMany({
    where:
      value.scope === 'shared'
        ? {
            OR: [
              { ownerUserId: ctx.actor.userId, members: { some: {} } },
              { members: { some: { userId: ctx.actor.userId } } },
            ],
            ...(value.query
              ? {
                  title: {
                    contains: value.query,
                    mode: 'insensitive' as const,
                  },
                }
              : {}),
          }
        : {
            OR: [
              {
                OR: [
                  { ownerUserId: ctx.actor.userId },
                  { members: { some: { userId: ctx.actor.userId } } },
                ],
                ...(value.query
                  ? {
                      title: {
                        contains: value.query,
                        mode: 'insensitive' as const,
                      },
                    }
                  : {}),
              },
              {
                visibility: 'PUBLIC',
                ownerUserId: { not: ctx.actor.userId },
                members: { none: { userId: ctx.actor.userId } },
                publishedLayout: {
                  is: {
                    status: 'READY',
                    ...(value.query
                      ? {
                          snapshot: {
                            path: ['title'],
                            string_contains: value.query,
                            mode: 'insensitive' as const,
                          },
                        }
                      : {}),
                  },
                },
              },
            ],
          },
    take: value.limit + 1,
    ...(value.cursor ? { cursor: { id: value.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      _count: { select: { members: true } },
      owner: { select: { firstName: true, lastName: true } },
      members: {
        where: { userId: ctx.actor.userId },
        select: { userId: true },
      },
      publishedLayout: { select: { snapshot: true, createdAt: true } },
    },
  });
  const page = rows.slice(0, value.limit);
  return boardListSchema.parse({
    items: page.map((row) => {
      const isOwner = row.ownerUserId === ctx.actor.userId,
        isMember = isOwner || !!row.members.length;
      return {
        id: row.id,
        title:
          !isMember && row.publishedLayout
            ? snapshotSchema.parse(row.publishedLayout.snapshot).title
            : row.title,
        ownerName: `${row.owner.firstName} ${row.owner.lastName}`,
        visibility: row.visibility,
        isMember,
        isOwner,
        contributorCount: isMember
          ? row._count.members + 1
          : new Set(
              snapshotSchema
                .parse(row.publishedLayout!.snapshot)
                .items.map((item) => item.contributorId),
            ).size || 1,
        published: !!row.publishedLayoutId,
        updatedAt: (isMember
          ? row.updatedAt
          : row.publishedLayout!.createdAt
        ).toISOString(),
      };
    }),
    nextCursor: rows.length > value.limit ? page.at(-1)!.id : null,
  });
}
