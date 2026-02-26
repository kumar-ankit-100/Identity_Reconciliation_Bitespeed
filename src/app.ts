import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { contactRoutes } from './modules/contact/contact.routes';
import { swaggerSpec } from './config/swagger';
import { logger } from './common/logger';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors());

  // Body parsing
  app.use(express.json());

  // Request tracing & logging
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Routes
  app.use('/', contactRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
  });

  // Centralized error handling
  app.use(errorHandler);

  logger.info('Application initialized');
  return app;
}
