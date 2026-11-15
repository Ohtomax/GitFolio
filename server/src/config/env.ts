import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { EnvironmentSchema, type Environment } from './env.schema.js';

export class EnvironmentError extends Error {
  constructor(readonly fields: string[]) {
    super('Invalid environment configuration. Check the listed variables in the root .env file.');
    this.name = 'EnvironmentError';
  }
}

export function loadEnvironment(): Environment {
  config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
  const result = EnvironmentSchema.safeParse(process.env);

  if (!result.success) {
    // Zod's raw errors may contain supplied values. Only report variable names.
    throw new EnvironmentError([...new Set(result.error.issues.map((issue) => issue.path.join('.')))]);
  }

  return result.data;
}
