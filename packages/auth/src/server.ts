import { randomUUID } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { username } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import type { PrismaClient } from '@afterglow/db/client';
import { AppError } from '@afterglow/contracts/errors';
import { registerSchema } from '@afterglow/contracts/schemas';

export function createAuth(
  db: PrismaClient,
  config: { secret: string; baseURL: string; trustedOrigins: string[] },
) {
  return betterAuth({
    logger: { disabled: true },
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    database: prismaAdapter(db, { provider: 'postgresql', transaction: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    session: { cookieCache: { enabled: false } },
    user: {
      additionalFields: {
        firstName: { type: 'string', required: true },
        lastName: { type: 'string', required: true },
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 24,
        usernameValidator: (value) => /^[A-Za-z0-9_]{3,24}$/.test(value),
        usernameNormalization: (value) => value.toLowerCase(),
      }),
      expo(),
    ],
    advanced: { database: { generateId: () => randomUUID() } },
  });
}
export type Auth = ReturnType<typeof createAuth>;
/** Only the transport registration wrapper calls this; email is never client supplied. */
export async function registerAccount(
  auth: Auth,
  db: PrismaClient,
  input: unknown,
  headers: Headers,
) {
  const value = registerSchema.parse(input);
  const response = await auth.api.signUpEmail({
    headers,
    asResponse: true,
    body: {
      ...value,
      name: `${value.firstName} ${value.lastName}`,
      email: `${randomUUID()}@accounts.afterglow.invalid`,
    },
  });
  // The adapter can turn a database uniqueness race into a generic create-user failure.
  if (
    !response.ok &&
    (await db.user.findUnique({
      where: { username: value.username },
      select: { id: true },
    }))
  )
    throw new AppError('conflict', 'This username is taken', {
      username: ['This username is taken'],
    });
  return response;
}
