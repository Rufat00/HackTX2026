import { z } from 'zod';
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  API_URL: z.url(),
  TRUSTED_ORIGINS: z.string().transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
  S3_ENDPOINT: z.url().optional(),
  S3_PUBLIC_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('false'),
});
export function readEnvironment(source: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success)
    throw new Error(
      `Invalid environment: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  const value = parsed.data;
  if (value.TRUSTED_ORIGINS.some((origin) => origin.includes('*')))
    throw new Error('TRUSTED_ORIGINS must be explicit');
  if (value.NODE_ENV === 'production' && !value.API_URL.startsWith('https://'))
    throw new Error('Production API_URL must use HTTPS');
  return value;
}
