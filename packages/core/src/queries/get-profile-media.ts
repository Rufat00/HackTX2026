import { assetIdSchema } from '@afterglow/contracts/schemas';
import { AppError } from '@afterglow/contracts/errors';
import type { CoreContext } from '../context';

export async function getProfileMedia(ctx: CoreContext, input: unknown) {
  const id = assetIdSchema.parse(input);
  const asset = await ctx.db.asset.findFirst({
    where: {
      id,
      ownerUserId: ctx.actor.userId,
      purpose: 'PROFILE',
      status: 'READY',
    },
  });
  if (!asset?.derivativeKey) throw new AppError('not-found', 'Photo not found');
  try {
    return await ctx.storage.readDerivative(asset.derivativeKey);
  } catch {
    throw new AppError(
      'provider-unavailable',
      'Could not load the photo. Try again.',
    );
  }
}
