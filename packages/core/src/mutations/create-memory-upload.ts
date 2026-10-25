import {
  boardIdSchema,
  memoryUploadSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import { randomUUID } from 'node:crypto';
import type { CoreContext } from '../context';
import { requireBoard } from '../boards/board-access';

export async function createMemoryUpload(
  ctx: CoreContext,
  rawBoard: unknown,
  input: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    value = memoryUploadSchema.parse(input);
  await requireBoard(ctx.db, boardId, ctx.actor.userId);
  const previous = await ctx.db.asset.findUnique({ where: { id: value.id } });
  if (previous) {
    if (
      previous.ownerUserId !== ctx.actor.userId ||
      previous.boardId !== boardId ||
      previous.purpose !== 'MEMORY' ||
      previous.mime !== value.mime ||
      previous.byteSize !== value.byteSize
    )
      throw new AppError('conflict', 'Upload key has already been used');
    return { assetId: previous.id };
  }
  if (
    (await ctx.db.asset.count({
      where: {
        ownerUserId: ctx.actor.userId,
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { gt: new Date(Date.now() - 86400000) },
      },
    })) >= 40
  )
    throw new AppError('rate-limited', 'Finish your pending uploads first');
  await ctx.db.asset.createMany({
    skipDuplicates: true,
    data: {
      id: value.id,
      boardId,
      ownerUserId: ctx.actor.userId,
      purpose: 'MEMORY',
      sourceKey: `uploads/${ctx.actor.userId}/${randomUUID()}`,
      mime: value.mime,
      byteSize: value.byteSize,
    },
  });
  const asset = await ctx.db.asset.findUniqueOrThrow({
    where: { id: value.id },
  });
  if (
    asset.ownerUserId !== ctx.actor.userId ||
    asset.boardId !== boardId ||
    asset.purpose !== 'MEMORY' ||
    asset.mime !== value.mime ||
    asset.byteSize !== value.byteSize
  )
    throw new AppError('conflict', 'Upload key has already been used');
  return { assetId: asset.id };
}
