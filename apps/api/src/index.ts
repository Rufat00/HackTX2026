import { serve } from '@hono/node-server';
import { createDatabase } from '@afterglow/db/client';
import { createAuth } from '@afterglow/auth/server';
import { createStorage } from '@afterglow/storage/s3';
import { readEnvironment } from './env';
import { createApp } from './app';
const env = readEnvironment();
const db = createDatabase(env.DATABASE_URL);
const auth = createAuth(db, {
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.API_URL,
  trustedOrigins: env.TRUSTED_ORIGINS,
});
const storage = createStorage({
  endpoint: env.S3_ENDPOINT,
  publicEndpoint: env.S3_PUBLIC_ENDPOINT,
  region: env.S3_REGION,
  bucket: env.S3_BUCKET,
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
});
const server = serve(
  {
    fetch: createApp({ auth, db, storage, origins: env.TRUSTED_ORIGINS }).fetch,
    port: env.PORT,
    hostname: env.HOST,
  },
  () => console.info(`Afterglow API listening on port ${env.PORT}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    }),
  );
