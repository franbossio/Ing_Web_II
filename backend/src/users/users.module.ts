import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Job } from '../jobs/job.entity';
import { Application } from '../applications/application.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Job, Application]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}