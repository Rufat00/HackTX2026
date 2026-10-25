import type { CoreContext } from '../context';
import { assetIdSchema } from '@afterglow/contracts/schemas';
import { AppError } from '@afterglow/contracts/errors';
export async function getAssetAccess(ctx: CoreContext, input: unknown) {
  const id = assetIdSchema.parse(input);
  const asset = await ctx.db.asset.findFirst({
    where: {
      id,
      ownerUserId: ctx.actor.userId,
      purpose: 'PROFILE',
      status: 'READY',
    },
  });
  if (!asset?.derivativeKey) throw new AppError('not-found', 'Image not found');
  return {
    url: await ctx.storage.signDownload(asset.derivativeKey),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
  };
}
