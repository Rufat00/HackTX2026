import { createStorage } from '@afterglow/storage/s3';
export function storageFromEnvironment() {
  const required = [
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
  ] as const;
  for (const name of required)
    if (!process.env[name]) throw new Error(`Missing ${name}`);
  return createStorage({
    endpoint: process.env.S3_ENDPOINT,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT,
    region: process.env.S3_REGION!,
    bucket: process.env.S3_BUCKET!,
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
}
