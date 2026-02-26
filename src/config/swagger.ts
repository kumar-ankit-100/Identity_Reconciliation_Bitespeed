import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bitespeed Identity Reconciliation API',
      version: '1.0.0',
      description:
        'API for identifying and reconciling customer contacts across multiple purchases. ' +
        'Links different email addresses and phone numbers to the same customer identity.',
      contact: {
        name: 'Bitespeed Engineering',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
