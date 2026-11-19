import { EnvironmentError, loadEnvironment } from './config/env.js';
import { startServer } from './core/server.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger();

async function bootstrap() {
  const environment = loadEnvironment();
  logger.level = environment.LOG_LEVEL;
  const runtime = await startServer(environment, logger);

  const shutdown = (exitCode: number) => {
    process.exitCode = Math.max(process.exitCode ? Number(process.exitCode) : 0, exitCode);
    void runtime.close().then(() => {
      logger.info('GitFolio API stopped');
    }).catch(() => {
      logger.fatal('GitFolio API shutdown failed');
      process.exitCode = 1;
    });
  };

  process.once('SIGINT', () => shutdown(0));
  process.once('SIGTERM', () => shutdown(0));
  process.once('uncaughtException', () => {
    logger.fatal('An uncaught exception requires server shutdown');
    shutdown(1);
  });
  process.once('unhandledRejection', () => {
    logger.fatal('An unhandled rejection requires server shutdown');
    shutdown(1);
  });
}

bootstrap().catch((error: unknown) => {
  if (error instanceof EnvironmentError) {
    logger.fatal({ fields: error.fields }, error.message);
  } else if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
    logger.fatal('GitFolio API port is already in use. Stop the existing API process before restarting.');
  } else {
    logger.fatal({ errorType: error instanceof Error ? error.name : 'UnknownError' }, 'GitFolio API startup failed');
  }
  process.exitCode = 1;
});
