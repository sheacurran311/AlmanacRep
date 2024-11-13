import { Application } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Almanac Labs API',
    version: '1.0.0',
    description: 'API documentation for Almanac Labs platform',
  },
  servers: [
    {
      url: '/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Application) {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec));
  
  // Serve swagger spec as JSON
  app.get('/api-docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export default setupSwagger;
