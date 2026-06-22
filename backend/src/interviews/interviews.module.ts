// src/interviews/interviews.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { Job } from '../jobs/job.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    UsersModule,
  ],
  controllers: [InterviewsController],
  providers:   [InterviewsService],
})
export class InterviewsModule {}
