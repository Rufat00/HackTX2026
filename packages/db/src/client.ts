import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';
export { Prisma, type PrismaClient } from './generated/client';
export function createDatabase(connectionString: string) {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 5000,
      max: 10,
    }),
  });
}
