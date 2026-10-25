import { randomUUID } from 'node:crypto';
import { boardIdSchema } from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import {
  processMemoryImage,
  InvalidImageError,
} from '@afterglow/storage/images';
import type { CoreContext } from '../context';
import { requireBoard } from '../boards/board-access';

export async function completeMemoryUpload(
  ctx: CoreContext,
  rawBoard: unknown,
  rawAsset: unknown,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    id = boardIdSchema.parse(rawAsset);
  await requireBoard(ctx.db, boardId, ctx.actor.userId);
  const asset = await ctx.db.asset.findFirst({
    where: { id, boardId, ownerUserId: ctx.actor.userId, purpose: 'MEMORY' },
  });
  if (!asset) throw new AppError('not-found', 'Upload not found');
  if (asset.status === 'READY') return { assetId: id };
  if (asset.status === 'FAILED')
    throw new AppError('invalid-state', 'Choose the image again to retry');
  const derivativeKey = `memories/${boardId}/${randomUUID()}.webp`;
  if (
    !(
      await ctx.db.asset.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'PROCESSING', derivativeKey },
      })
    ).count
  )
    throw new AppError('conflict', 'Photo is already being verified');
  try {
    const bytes = await ctx.storage.readSource(asset.sourceKey);
    if (bytes.length !== asset.byteSize)
      throw new InvalidImageError('Uploaded size does not match');
    const image = await processMemoryImage(bytes, asset.mime);
    await ctx.storage.writeDerivative(derivativeKey, image.bytes);
    await ctx.db.asset.update({
      where: { id },
      data: {
        status: 'READY',
        verifiedAt: new Date(),
        derivativeKey,
        width: image.width,
        height: image.height,
        color: image.color,
        derivativeByteSize: image.byteSize,
      },
    });
  } catch (error) {
    await ctx.db.asset.updateMany({
      where: { id, status: 'PROCESSING' },
      data: { status: 'FAILED' },
    });
    throw new AppError(
      error instanceof InvalidImageError
        ? 'validation'
        : 'provider-unavailable',
      error instanceof InvalidImageError
        ? error.message
        : 'Photo processing failed. Choose it again to retry.',
    );
  }
  return { assetId: id };
}
