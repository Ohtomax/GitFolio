import { EnvironmentError, loadEnvironment } from './config/env.js';
import { startDeploymentWorker } from './core/deployment-worker.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger();
async function bootstrap() {
  const environment = loadEnvironment(); logger.level = environment.LOG_LEVEL;
  const runtime = await startDeploymentWorker(environment, logger);
  if (!runtime) { logger.warn('Publishing credentials are not configured; no deployment worker started'); return; }
  const shutdown = (code: number) => {
    process.exitCode = code;
    void runtime.close(true).catch(() => { logger.fatal('Deployment worker shutdown failed'); process.exitCode = 1; });
  };
  process.once('SIGINT', () => shutdown(0)); process.once('SIGTERM', () => shutdown(0));
  process.once('uncaughtException', () => { logger.fatal('Deployment worker exception requires shutdown'); shutdown(1); });
  process.once('unhandledRejection', () => { logger.fatal('Deployment worker rejection requires shutdown'); shutdown(1); });
}
bootstrap().catch((error: unknown) => {
  if (error instanceof EnvironmentError) logger.fatal({ fields: error.fields }, error.message);
  else logger.fatal('Deployment worker startup failed');
  process.exitCode = 1;
});
