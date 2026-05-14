import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';

const server = express();

const ready = NestFactory.create(AppModule, new ExpressAdapter(server)).then(
  async (app) => {
    app.setGlobalPrefix('_/backend');
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  },
);

export default async function handler(req: any, res: any) {
  await ready;
  server(req, res);
}
