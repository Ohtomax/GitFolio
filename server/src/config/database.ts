import { PrismaClient } from '@prisma/client';
import type { Environment } from './env.schema.js';

export function createDatabase(environment: Environment): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: environment.DATABASE_URL } },
    log: [],
  });
}
