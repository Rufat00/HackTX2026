// Isolated CLI configuration: no database connection is made while generating the auth schema.
import { createAuth } from './server';
import { createDatabase } from '@afterglow/db/client';
export const auth = createAuth(
  createDatabase(
    process.env.DATABASE_URL ??
      'postgresql://afterglow:afterglow_dev@localhost:5432/afterglow',
  ),
  {
    secret: 'schema-generation-only-not-a-runtime-secret',
    baseURL: 'http://localhost:3001',
    trustedOrigins: ['afterglow://'],
  },
);
