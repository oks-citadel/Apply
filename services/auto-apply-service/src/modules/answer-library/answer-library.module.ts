import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerLibraryService } from './answer-library.service';
import { AnswerLibraryController } from './answer-library.controller';
import { Answer } from './entities/answer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Answer])],
  controllers: [AnswerLibraryController],
  providers: [AnswerLibraryService],
  exports: [AnswerLibraryService],
})
export class AnswerLibraryModule {}
