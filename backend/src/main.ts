import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — permite peticiones desde el frontend HTML estático
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', '*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 TalentAI Backend corriendo en http://localhost:${port}/api`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/users        (solo admin)`);
  console.log(`\n🧪 Usuarios de prueba (password: Test1234!)`);
  console.log(`   candidate@test.com  → Candidato`);
  console.log(`   company@test.com    → Empresa`);
  console.log(`   admin@test.com      → Admin`);
}
bootstrap();