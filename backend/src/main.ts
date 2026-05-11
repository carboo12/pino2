import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    }),
  );

  const config = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix(config.get('API_PREFIX') || 'api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (
    config.get('CORS_ORIGIN') || 'http://localhost:5173,http://localhost:9002'
  ).split(',');

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  // Swagger - Solo habilitado en entornos no productivos
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MultiTienda API (Fastify)')
      .setDescription(
        'API del sistema de punto de venta y gestión multi-tienda - Motor Fastify de alto rendimiento',
      )
      .setVersion('1.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    console.log(`📖 Swagger docs enabled at /docs`);
  } else {
    console.log(`🔒 Swagger docs disabled in production`);
  }

  // --- FASTIFY SECURITY PLUGINS ---
  // 1. Helmet: Secure HTTP headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });

  // 2. Rate Limiting: Prevent brute-force/DoS
  await app.register(rateLimit, {
    max: 2000,
    timeWindow: '1 minute',
  });
  // --------------------------------

  const port = config.get('PORT') || 3010;

  // Important for Fastify: listen on 0.0.0.0 for external access (like Flutter app)
  await app.listen(port, '0.0.0.0');

  console.log(
    `⚡ MultiTienda API (FASTIFY) running on http://localhost:${port}`,
  );
}
bootstrap();
