import { randomUUID } from 'node:crypto';
import type { CoreContext } from '../context';
import { assetIdSchema } from '@afterglow/contracts/schemas';
import { AppError } from '@afterglow/contracts/errors';
import {
  processProfileImage,
  InvalidImageError,
} from '@afterglow/storage/images';
import { getProfile } from '../queries/get-profile';
export async function completeProfileUpload(ctx: CoreContext, input: unknown) {
  const id = assetIdSchema.parse(input);
  const asset = await ctx.db.asset.findFirst({
    where: { id, ownerUserId: ctx.actor.userId, purpose: 'PROFILE' },
  });
  if (!asset) throw new AppError('not-found', 'Upload not found');
  if (asset.status === 'READY') return getProfile(ctx);
  if (asset.status === 'FAILED')
    throw new AppError('invalid-state', 'Choose the image again to retry');
  const derivativeKey = `profiles/${ctx.actor.userId}/${randomUUID()}.webp`;
  const claimed = await ctx.db.asset.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'PROCESSING', derivativeKey },
  });
  if (!claimed.count)
    throw new AppError('conflict', 'This upload is already processing');
  try {
    const bytes = await ctx.storage.readSource(asset.sourceKey);
    if (bytes.length !== asset.byteSize)
      throw new InvalidImageError('Uploaded size does not match');
    const image = await processProfileImage(bytes, asset.mime);
    await ctx.storage.writeDerivative(derivativeKey, image.bytes);
    await ctx.db.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: {
          status: 'READY',
          derivativeKey,
          width: image.width,
          height: image.height,
          derivativeByteSize: image.byteSize,
          verifiedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: ctx.actor.userId },
        data: { profileImageAssetId: id },
      });
    });
  } catch (error) {
    await ctx.db.asset.updateMany({
      where: { id, status: 'PROCESSING' },
      data: { status: 'FAILED' },
    });
    if (error instanceof InvalidImageError)
      throw new AppError('validation', error.message);
    throw new AppError(
      'provider-unavailable',
      'Photo processing failed. Choose the image again to retry.',
    );
  }
  return getProfile(ctx);
}
