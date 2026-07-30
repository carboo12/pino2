import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { onRequest } from 'firebase-functions/v2/https';
import { ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import express from 'express';

const expressServer = express();
let isAppInitialized = false;

const bootstrapNestApp = async () => {
  if (!isAppInitialized) {
    const { AppModule } = require('./app.module');
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressServer),
    );
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.enableCors({
      origin: true,
      credentials: true,
    });
    await app.init();
    isAppInitialized = true;
  }
};

export const api = onRequest(
  {
    cors: true,
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    await bootstrapNestApp();
    expressServer(req, res);
  },
);
