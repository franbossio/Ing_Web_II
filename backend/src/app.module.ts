import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CvModule } from './cv/cv.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { InterviewsModule } from './interviews/interviews.module';
import { MessagesModule } from './messages/messages.module';
import { MailModule } from './mail/mail.module';
import { User } from './users/user.entity';
import { Job } from './jobs/job.entity';
import { Application } from './applications/application.entity';
import { Conversation } from './messages/conversation.entity';
import { Message } from './messages/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production'
          || !!config.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          // Render provee DATABASE_URL completa — usarla si existe
          url:      config.get<string>('DATABASE_URL') || undefined,
          host:     config.get<string>('DB_HOST', 'localhost'),
          port:     config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', ''),
          database: config.get<string>('DB_NAME', 'conectaia'),
          // SSL solo en producción (Render lo requiere, local no)
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          entities: [User, Job, Application, Conversation, Message],
          synchronize: true,
          logging: false,
        };
      },
    }),

    UsersModule,
    AuthModule,
    CvModule,
    JobsModule,
    ApplicationsModule,
    RecommendationsModule,
    InterviewsModule,
    MessagesModule,
    MailModule,
  ],
})
export class AppModule {}