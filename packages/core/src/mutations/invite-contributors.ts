import {
  boardIdSchema,
  inviteContributorsSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { requireBoard, lockBoard } from '../boards/board-access';

export async function inviteContributors(
  ctx: CoreContext,
  rawBoard: unknown,
  input: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    value = inviteContributorsSchema.parse(input);
  await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, boardId);
    const board = await requireBoard(tx, boardId, ctx.actor.userId, true);
    const additions = value.userIds.filter(
      (id) =>
        id !== board.ownerUserId &&
        !board.members.some((member) => member.userId === id),
    );
    if (board.members.length + additions.length > 7)
      throw new AppError('validation', 'Invite up to seven contributors');
    if (
      (await tx.user.count({ where: { id: { in: additions } } })) !==
      additions.length
    )
      throw new AppError(
        'validation',
        'One of these people is no longer available',
      );
    await tx.boardMember.createMany({
      data: additions.map((userId) => ({ boardId, userId })),
      skipDuplicates: true,
    });
    if (additions.length)
      await tx.boardAudit.create({
        data: {
          boardId,
          actorId: ctx.actor.userId,
          operation: 'boards.contributors.add',
        },
      });
  });
  return { ok: true };
}
