import type { CoreContext } from '../context';
import { updateProfileSchema } from '@afterglow/contracts/schemas';
import { AppError } from '@afterglow/contracts/errors';
import { getProfile } from '../queries/get-profile';
export async function updateProfile(ctx: CoreContext, input: unknown) {
  const value = updateProfileSchema.parse(input);
  await ctx.db.$transaction(async (tx) => {
    if (value.profileImageAssetId) {
      // Coordinate attachment with cleanup before checking state/ownership.
      await tx.$queryRaw`SELECT "id" FROM "assets" WHERE "id" = ${value.profileImageAssetId}::uuid FOR UPDATE`;
      const asset = await tx.asset.findFirst({
        where: {
          id: value.profileImageAssetId,
          ownerUserId: ctx.actor.userId,
          purpose: 'PROFILE',
          status: 'READY',
        },
      });
      if (!asset)
        throw new AppError('not-found', 'Profile image is unavailable');
    }
    await tx.user.update({
      where: { id: ctx.actor.userId },
      data: { ...value, name: `${value.firstName} ${value.lastName}` },
    });
  });
  return getProfile(ctx);
}
