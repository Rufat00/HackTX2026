import type { PrismaClient } from '@afterglow/db/client';
import { catalogSongSchema } from '@afterglow/contracts/music';
import type { MemoryItem } from '@afterglow/contracts/memories';

export async function readBoardItems(
  db: Pick<PrismaClient, 'contribution'>,
  boardId: string,
): Promise<MemoryItem[]> {
  const rows = await db.contribution.findMany({
    where: { boardId, deletedAt: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: {
      contributor: { select: { firstName: true, lastName: true } },
      asset: true,
    },
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    text: row.text,
    assetId: row.assetId,
    songUrl: row.songUrl,
    song: row.song ? catalogSongSchema.parse(row.song) : null,
    contributorId: row.contributorId,
    contributorName: `${row.contributor.firstName} ${row.contributor.lastName}`,
    width: row.asset?.width ?? null,
    height: row.asset?.height ?? null,
    color: row.asset?.color ?? null,
  }));
}
