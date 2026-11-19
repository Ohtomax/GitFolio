import { createServer } from 'node:http';
import type { Logger } from 'pino';
import { createDatabase } from '../config/database.js';
import type { Environment } from '../config/env.schema.js';
import { createRedis } from '../config/redis.js';
import { createApp } from './app.js';
import { createAuthModule, createFeatureGuard } from '../modules/auth/auth.module.js';
import { createTemplateRepository } from '../modules/template/template.repository.js';
import { createTemplateService } from '../modules/template/template.service.js';
import { createTemplateRouter } from '../modules/template/template.route.js';
import { seedTemplates } from '../modules/template/template.seed.js';
import { createProjectRepository } from '../modules/project/project.repository.js';
import { createProjectService } from '../modules/project/project.service.js';
import { createProjectRouter } from '../modules/project/project.route.js';
import { createDeploymentQueue, type DeploymentQueue } from '../queues/deployment.queue.js';
import { createDeploymentRepository } from '../modules/deployment/deployment.repository.js';
import { createDeploymentService } from '../modules/deployment/deployment.service.js';
import { createDeploymentRouter } from '../modules/deployment/deployment.route.js';

export async function startServer(environment: Environment, logger: Logger) {
  const database = createDatabase(environment);
  const redis = createRedis(environment, logger);
  let deployments: DeploymentQueue | undefined;

  const disconnect = async () => {
    try { await deployments?.close(); }
    finally { redis.disconnect(); await database.$disconnect(); }
  };

  try {
    const connections = await Promise.allSettled([database.$connect(), redis.connect()]);
    for (const connection of connections) {
      if (connection.status === 'rejected') throw connection.reason;
    }

    await seedTemplates(database);
    const guard = createFeatureGuard(environment, redis);
    deployments = createDeploymentQueue(environment.REDIS_URL, logger);
    // Finish queue initialization before binding HTTP so a bind failure can
    // close BullMQ safely instead of masking EADDRINUSE with a Redis error.
    await deployments.queue.waitUntilReady();
    const app = createApp(environment, {
      logger,
      authRouter: createAuthModule(environment, database, redis),
      templateRouter: createTemplateRouter(createTemplateService(createTemplateRepository(database)), guard),
      projectRouter: createProjectRouter(createProjectService(createProjectRepository(database), createTemplateRepository(database)), guard),
      deploymentRouter: createDeploymentRouter(createDeploymentService(createDeploymentRepository(database), deployments), guard),
      checkReadiness: async () => {
        await Promise.all([database.$queryRaw`SELECT 1`, redis.ping()]);
      },
    });
    const server = createServer(app);

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      server.once('error', onError);
      server.listen(environment.SERVER_PORT, environment.SERVER_HOST, () => {
        server.removeListener('error', onError);
        resolve();
      });
    });

    logger.info({ port: environment.SERVER_PORT, host: environment.SERVER_HOST }, 'GitFolio API is listening');
    let closePromise: Promise<void> | undefined;

    return {
      server,
      close() {
        closePromise ??= (async () => {
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                server.closeAllConnections();
                reject(new Error('HTTP shutdown deadline exceeded'));
              }, 10000);

              server.close((error) => {
                clearTimeout(timeout);
                if (error) reject(error);
                else resolve();
              });
              server.closeIdleConnections();
            });
          } finally {
            await disconnect();
          }
        })();
        return closePromise;
      },
    };
  } catch (error) {
    await disconnect();
    throw error;
  }
}
