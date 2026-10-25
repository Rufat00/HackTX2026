import { boardIdSchema } from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';
import { requireBoard } from '../boards/board-access';

export async function uploadMemorySource(
  ctx: CoreContext,
  rawBoard: unknown,
  rawAsset: unknown,
  bytes: Buffer,
  mime: string,
) {
  const boardId = boardIdSchema.parse(rawBoard),
    id = boardIdSchema.parse(rawAsset);
  await requireBoard(ctx.db, boardId, ctx.actor.userId);
  const asset = await ctx.db.asset.findFirst({
    where: { id, boardId, ownerUserId: ctx.actor.userId, purpose: 'MEMORY' },
  });
  if (!asset) throw new AppError('not-found', 'Upload not found');
  if (asset.status !== 'PENDING')
    throw new AppError(
      'invalid-state',
      'This upload is already being verified',
    );
  if (
    bytes.length !== asset.byteSize ||
    bytes.length > 10 * 1024 * 1024 ||
    mime !== asset.mime
  )
    throw new AppError(
      'validation',
      'Image size or type does not match the upload',
    );
  try {
    await ctx.storage.writeSource(asset.sourceKey, bytes, mime);
  } catch {
    throw new AppError(
      'provider-unavailable',
      'Could not upload the photo. Try again.',
    );
  }
  return { ok: true };
}
