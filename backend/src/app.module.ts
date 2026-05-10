import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CvModule } from './cv/cv.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { User } from './users/user.entity';
import { Job } from './jobs/job.entity';
import { Application } from './applications/application.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('DB_HOST', 'localhost'),
        port:     config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'conectaia'),
        entities: [User, Job, Application],  // ← nuevas entidades
        synchronize: true,  // crea las tablas automáticamente
        logging: false,
      }),
    }),

    UsersModule,
    AuthModule,
    CvModule,
    JobsModule,
    ApplicationsModule,
  ],
})
export class AppModule {}
