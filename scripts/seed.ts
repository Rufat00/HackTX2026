import { createDatabase } from '@afterglow/db/client';
import { createAuth, registerAccount } from '@afterglow/auth/server';
if (process.env.NODE_ENV !== 'development')
  throw new Error('Seed requires NODE_ENV=development');
if (
  !process.env.DATABASE_URL ||
  !process.env.BETTER_AUTH_SECRET ||
  !process.env.API_URL
)
  throw new Error('Missing database/auth configuration');
if (!process.env.DEV_SEED_PASSWORD)
  throw new Error(
    'Set DEV_SEED_PASSWORD (12–128 characters); no default demo credential is stored',
  );
const db = createDatabase(process.env.DATABASE_URL);
try {
  if (await db.user.findUnique({ where: { username: 'demo_afterglow' } })) {
    console.info('Development demo already exists; no changes made.');
  } else {
    const auth = createAuth(db, {
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.API_URL,
      trustedOrigins: ['afterglow://'],
    });
    const response = await registerAccount(
      auth,
      db,
      {
        username: 'demo_afterglow',
        password: process.env.DEV_SEED_PASSWORD,
        firstName: 'Demo',
        lastName: 'Account',
      },
      new Headers(),
    );
    if (!response.ok)
      throw new Error('Development seed account could not be created');
    console.info(
      'Created development Demo Account (demo_afterglow); no shared data was reset.',
    );
  }
} finally {
  await db.$disconnect();
}
