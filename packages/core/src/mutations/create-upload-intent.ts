import { randomUUID } from 'node:crypto';
import type { CoreContext } from '../context';
import { uploadIntentSchema } from '@afterglow/contracts/schemas';
import { AppError } from '@afterglow/contracts/errors';
export async function createUploadIntent(ctx: CoreContext, input: unknown) {
  const value = uploadIntentSchema.parse(input);
  const active = await ctx.db.asset.count({
    where: {
      ownerUserId: ctx.actor.userId,
      status: { in: ['PENDING', 'PROCESSING'] },
      createdAt: { gt: new Date(Date.now() - 86400000) },
    },
  });
  if (active >= 10)
    throw new AppError('rate-limited', 'Finish an upload or try again later');
  const id = randomUUID(),
    sourceKey = `uploads/${ctx.actor.userId}/${randomUUID()}`;
  const asset = await ctx.db.asset.create({
    data: {
      id,
      ownerUserId: ctx.actor.userId,
      purpose: 'PROFILE',
      sourceKey,
      mime: value.mime,
      byteSize: value.byteSize,
    },
  });
  const uploadUrl = await ctx.storage.signUpload(
    asset.sourceKey,
    value.mime,
    value.byteSize,
  );
  return {
    assetId: id,
    uploadUrl,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    requiredHeaders: { 'Content-Type': value.mime },
  };
}
