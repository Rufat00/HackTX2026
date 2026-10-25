import type { SystemContext } from '../context';
export async function cleanupAssets(ctx: SystemContext) {
  const cutoff = new Date(Date.now() - 86400000);
  // Never delete recent/active work. Bounded, repeatable, and safe after partial failure.
  let deletedAssets = 0;
  const assets = await ctx.db.asset.findMany({
    where: {
      createdAt: { lt: cutoff },
      updatedAt: { lt: cutoff },
      profileUsers: { none: {} },
      contributions: { none: {} },
    },
    take: 100,
    orderBy: { id: 'asc' },
  });
  for (const asset of assets) {
    // Exclude assets from new attachments while deleting; core accepts READY only.
    const claimed = await ctx.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "assets" WHERE "id" = ${asset.id}::uuid FOR UPDATE`;
      return tx.asset.updateMany({
        where: {
          id: asset.id,
          updatedAt: asset.updatedAt,
          profileUsers: { none: {} },
          contributions: { none: {} },
        },
        data: { status: 'FAILED' },
      });
    });
    if (!claimed.count) continue;
    await ctx.storage.remove(asset.sourceKey);
    if (asset.derivativeKey) await ctx.storage.remove(asset.derivativeKey);
    await ctx.db.asset.delete({ where: { id: asset.id } });
    deletedAssets++;
  }
  // Reusable source URLs expire after ten minutes; remove retained originals after 24h.
  const ready = await ctx.db.asset.findMany({
    where: {
      status: 'READY',
      sourceDeletedAt: null,
      createdAt: { lt: cutoff },
    },
    take: 100,
    orderBy: { id: 'asc' },
  });
  for (const asset of ready) {
    await ctx.storage.remove(asset.sourceKey);
    await ctx.db.asset.update({
      where: { id: asset.id },
      data: { sourceDeletedAt: new Date() },
    });
  }
  return { deletedAssets, deletedSources: ready.length };
}
