import { createBoardSchema } from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';

export async function createBoard(ctx: CoreContext, input: unknown) {
  const value = createBoardSchema.parse(input);
  await ctx.db.board.createMany({
    skipDuplicates: true,
    data: {
      id: value.id,
      title: value.title,
      eventDate: value.eventDate ? new Date(value.eventDate) : null,
      ownerUserId: ctx.actor.userId,
    },
  });
  const row = await ctx.db.board.findUniqueOrThrow({ where: { id: value.id } });
  if (
    row.ownerUserId !== ctx.actor.userId ||
    row.title !== value.title ||
    (row.eventDate?.toISOString().slice(0, 10) ?? null) !== value.eventDate
  )
    throw new AppError('conflict', 'This draft key has already been used');
  return { id: row.id };
}
