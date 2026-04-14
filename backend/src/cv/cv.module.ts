// src/cv/cv.module.ts
import { Module }         from '@nestjs/common';
import { CvController }  from './cv.controller';
import { CvService }     from './cv.service';
import { UsersModule }   from '../users/users.module';

@Module({
  imports:     [UsersModule],
  controllers: [CvController],
  providers:   [CvService],
})
export class CvModule {}