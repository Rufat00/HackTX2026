import { AppError } from '@afterglow/contracts/errors';
import { boardIdSchema } from '@afterglow/contracts/memories';
import type { Prisma, PrismaClient } from '@afterglow/db/client';

export async function requireBoard(
  db: Pick<PrismaClient, 'board'>,
  rawId: unknown,
  userId: string,
  ownerOnly = false,
) {
  const id = boardIdSchema.parse(rawId);
  const board = await db.board.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      },
    },
  });
  if (
    !board ||
    (board.ownerUserId !== userId &&
      !board.members.some((member) => member.userId === userId))
  )
    throw new AppError('not-found', 'Memory not found');
  if (ownerOnly && board.ownerUserId !== userId)
    throw new AppError('forbidden', 'Only the memory owner can do that');
  return board;
}
export async function lockBoard(tx: Prisma.TransactionClient, id: string) {
  boardIdSchema.parse(id);
  await tx.$queryRaw`SELECT "id" FROM "boards" WHERE "id" = ${id}::uuid FOR UPDATE`;
}
export function checkRevision(actual: number, expected: number) {
  if (actual !== expected)
    throw new AppError(
      'conflict',
      'This memory changed. Reload before continuing.',
    );
}
