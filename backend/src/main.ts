import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function runMigrations(dataSource: DataSource) {
  await dataSource.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128),
      ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ;
  `);
  await dataSource.query(`
    UPDATE users SET email_verified = true WHERE email_verified = false;
  `);
  console.log('✅ Columnas de verificación de email OK');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Correr migraciones manuales al arrancar
  try {
    const dataSource = app.get(DataSource);
    await runMigrations(dataSource);
  } catch (e) {
    console.warn('⚠️  Migration warning:');
  }

  // PDFs en base64 pueden ser grandes — aumentar límite
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ limit: '25mb', extended: true }));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: false — NO eliminar campos del body aunque no tengan decoradores
      // Esto es clave para que experience/education/languages lleguen al controller
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 TalentAI Backend corriendo en http://localhost:${port}/api`);
}
bootstrap();