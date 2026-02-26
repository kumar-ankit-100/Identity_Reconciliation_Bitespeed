import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  isProduction: process.env.NODE_ENV === 'production',
} as const;
