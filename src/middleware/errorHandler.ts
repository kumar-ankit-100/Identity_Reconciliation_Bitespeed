import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { logger } from '../common/logger';
import { config } from '../config';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(
      { requestId, statusCode: err.statusCode, message: err.message },
      'Operational error',
    );

    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(config.isProduction ? {} : { stack: err.stack }),
      },
    });
    return;
  }

  logger.error({ requestId, err }, 'Unhandled error');

  res.status(500).json({
    error: {
      message: 'Internal server error',
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  });
}
