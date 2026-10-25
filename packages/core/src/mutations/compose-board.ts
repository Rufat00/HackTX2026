import {
  boardIdSchema,
  revisionSchema,
  snapshotSchema,
  previewSchema,
} from '@afterglow/contracts/memories';
import { AppError } from '@afterglow/contracts/errors';
import {
  analyzeComposition,
  createCompositionProvider,
  type CompositionProvider,
} from '@afterglow/ai/composition';
import type { CoreContext } from '../context';
import { requireBoard, lockBoard, checkRevision } from '../boards/board-access';
import { readBoardItems } from '../boards/board-snapshot';
import { packMemory, geometryVersion } from '../boards/pack-memory';

export async function composeBoard(
  ctx: CoreContext,
  rawBoard: unknown,
  input: unknown,
  provider: CompositionProvider = createCompositionProvider(),
) {
  const boardId = boardIdSchema.parse(rawBoard),
    value = revisionSchema.parse(input);
  const job = await ctx.db.$transaction(async (tx) => {
    await lockBoard(tx, boardId);
    const board = await requireBoard(tx, boardId, ctx.actor.userId, true);
    checkRevision(board.contentRevision, value.contentRevision);
    const items = await readBoardItems(tx, boardId);
    if (!items.length)
      throw new AppError('validation', 'Add a photo, story, or song first');
    if (
      await tx.boardLayout.count({
        where: {
          boardId,
          status: 'PROCESSING',
          createdAt: { gt: new Date(Date.now() - 60000) },
        },
      })
    )
      throw new AppError('conflict', 'A preview is already being composed');
    const snapshot = snapshotSchema.parse({
      title: board.title,
      eventDate: board.eventDate?.toISOString().slice(0, 10) ?? null,
      items,
    });
    return tx.boardLayout.create({
      data: {
        boardId,
        contentRevision: board.contentRevision,
        snapshot,
        geometryVersion,
      },
    });
  });
  try {
    const snapshot = snapshotSchema.parse(job.snapshot);
    const items = await Promise.all(
      snapshot.items.map(async (item) => {
        let imageUrl: string | undefined;
        if (item.assetId && provider.model !== 'fixture-contributor-v1') {
          const asset = await ctx.db.asset.findFirst({
            where: {
              id: item.assetId,
              boardId,
              status: 'READY',
              purpose: 'MEMORY',
            },
          });
          if (!asset?.derivativeKey)
            throw new AppError(
              'invalid-state',
              'A photo is no longer available',
            );
          imageUrl = `data:image/webp;base64,${(await ctx.storage.readDerivative(asset.derivativeKey)).toString('base64')}`;
        }
        return {
          id: item.id,
          contributorId: item.contributorId,
          contributorName: item.contributorName.slice(0, 80),
          text: item.text,
          ...(imageUrl ? { imageUrl } : {}),
        };
      }),
    );
    const analysis = await analyzeComposition(
      { title: snapshot.title, contentRevision: job.contentRevision, items },
      provider,
    );
    const preview = previewSchema.parse({
      id: job.id,
      contentRevision: job.contentRevision,
      label: analysis.label,
      model: analysis.model,
      fallbackReason: analysis.fallbackReason,
      promptVersion: analysis.promptVersion,
      schemaVersion: analysis.schemaVersion,
      geometryVersion,
      ...analysis.composition,
      ...packMemory(
        snapshot.items,
        analysis.composition.clusters.flatMap((cluster) => cluster.itemIds),
      ),
    });
    const saved = await ctx.db.$transaction(async (tx) => {
      await lockBoard(tx, boardId);
      const board = await requireBoard(tx, boardId, ctx.actor.userId, true);
      if (board.contentRevision !== job.contentRevision) {
        await tx.boardLayout.update({
          where: { id: job.id },
          data: { status: 'FAILED' },
        });
        return false;
      }
      await tx.boardLayout.update({
        where: { id: job.id },
        data: { status: 'READY', analysis: preview },
      });
      return true;
    });
    if (!saved)
      throw new AppError(
        'conflict',
        'New items arrived while composing. Compose the updated memory.',
      );
    return preview;
  } catch (error) {
    await ctx.db.boardLayout.updateMany({
      where: { id: job.id, status: 'PROCESSING' },
      data: { status: 'FAILED' },
    });
    if (error instanceof AppError) throw error;
    throw new AppError(
      'provider-unavailable',
      'Could not compose this preview. Your items are saved; try again.',
    );
  }
}
