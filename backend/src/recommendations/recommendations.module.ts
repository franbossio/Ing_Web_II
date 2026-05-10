// src/recommendations/recommendations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService }    from './recommendations.service';
import { Job }         from '../jobs/job.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    UsersModule,   // expone UsersService
  ],
  controllers: [RecommendationsController],
  providers:   [RecommendationsService],
})
export class RecommendationsModule {}