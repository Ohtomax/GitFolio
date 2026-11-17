import { loadEnvironment } from '../dist/config/env.js';
import { createDatabase } from '../dist/config/database.js';
import { seedTemplates } from '../dist/modules/template/template.seed.js';

let database;
try {
  database = createDatabase(loadEnvironment());
  const result = await seedTemplates(database);
  process.stdout.write(`Template catalog ready; ${result.count} templates added, ${result.updated} untouched legacy templates upgraded. Custom catalog edits and project drafts preserved.\n`);
} catch {
  process.stderr.write('Template seeding failed. Check local configuration, migrations, and PostgreSQL availability.\n');
  process.exitCode = 1;
} finally { await database?.$disconnect(); }
