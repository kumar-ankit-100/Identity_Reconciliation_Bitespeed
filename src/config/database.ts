import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from '../common/logger';

const prisma = new PrismaClient({
  log: config.isProduction
    ? [{ level: 'error', emit: 'event' }]
    : [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
});

prisma.$on('error' as never, (e: any) => {
  logger.error({ err: e }, 'Prisma error');
});

export { prisma };
