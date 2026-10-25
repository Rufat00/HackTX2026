import { createDatabase } from '@afterglow/db/client';
import { cleanupAssets } from '@afterglow/core/maintenance';
import { storageFromEnvironment } from './storage-environment';
import { randomUUID } from 'node:crypto';
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
const db = createDatabase(process.env.DATABASE_URL);
try {
  const counts = await cleanupAssets({
    db,
    storage: storageFromEnvironment(),
    actor: { kind: 'system', job: 'asset-cleanup' },
    diagnostics: { requestId: randomUUID(), operation: 'cleanupAssets' },
  });
  console.info(
    `Cleanup deleted ${counts.deletedAssets} unattached assets and ${counts.deletedSources} retained source objects`,
  );
} finally {
  await db.$disconnect();
}
