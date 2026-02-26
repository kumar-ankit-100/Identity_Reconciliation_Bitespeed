import { createApp } from './app';
import { config } from './config';
import { logger } from './common/logger';
import { prisma } from './config/database';

const app = createApp();
let server: ReturnType<typeof app.listen>;

async function start() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Database connection established');

    server = app.listen(config.port, () => {
      logger.info(
        { port: config.port, env: config.env },
        `Server running on port ${config.port}`,
      );
      logger.info(`API docs available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received, closing gracefully...');

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

start();
