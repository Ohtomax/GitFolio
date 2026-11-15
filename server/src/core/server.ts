import { createServer } from 'node:http';
import type { Logger } from 'pino';
import { createDatabase } from '../config/database.js';
import type { Environment } from '../config/env.schema.js';
import { createRedis } from '../config/redis.js';
import { createApp } from './app.js';

export async function startServer(environment: Environment, logger: Logger) {
  const database = createDatabase(environment);
  const redis = createRedis(environment, logger);

  const disconnect = async () => {
    redis.disconnect();
    await database.$disconnect();
  };

  try {
    const connections = await Promise.allSettled([database.$connect(), redis.connect()]);
    for (const connection of connections) {
      if (connection.status === 'rejected') throw connection.reason;
    }

    const app = createApp(environment, {
      logger,
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
