import type { PrismaClient } from '@afterglow/db/client';
import type { Storage } from '@afterglow/storage/s3';
export type CoreContext = {
  db: PrismaClient;
  actor: { kind: 'user'; userId: string };
  diagnostics: { requestId: string; operation: string };
  storage: Storage;
};

export type SystemContext = Omit<CoreContext, 'actor'> & {
  actor: { kind: 'system'; job: 'asset-cleanup' };
};
export type PublicContext = Omit<CoreContext, 'actor'>;
