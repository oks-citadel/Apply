import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnswerLibraryController } from './answer-library.controller';
import { AnswerLibraryService } from './answer-library.service';
import { Answer } from './entities/answer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Answer])],
  controllers: [AnswerLibraryController],
  providers: [AnswerLibraryService],
  exports: [AnswerLibraryService],
})
export class AnswerLibraryModule {}
