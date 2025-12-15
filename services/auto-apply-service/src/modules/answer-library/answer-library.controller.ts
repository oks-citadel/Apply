import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnswerLibraryService, MatchedAnswer } from './answer-library.service';
import { CreateAnswerDto, UpdateAnswerDto, BulkCreateAnswersDto } from './dto/create-answer.dto';
import { Answer, QuestionCategory } from './entities/answer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('answers')
@UseGuards(JwtAuthGuard)
export class AnswerLibraryController {
  constructor(private readonly answerLibraryService: AnswerLibraryService) {}

  @Post()
  async create(
    @Body() createAnswerDto: CreateAnswerDto,
    @User('id') userId: string,
  ): Promise<Answer> {
    return this.answerLibraryService.create(userId, createAnswerDto);
  }

  @Post('bulk')
  async bulkCreate(
    @Body() bulkDto: BulkCreateAnswersDto,
    @User('id') userId: string,
  ): Promise<Answer[]> {
    return this.answerLibraryService.bulkCreate(userId, bulkDto.answers);
  }

  @Post('initialize')
  async initializeDefaults(
    @Body() userData: {
      firstName?: string;
      lastName?: string;
      yearsOfExperience?: number;
      salaryExpectation?: string;
      availability?: string;
      workAuthorization?: boolean;
      requiresSponsorship?: boolean;
    },
    @User('id') userId: string,
  ): Promise<Answer[]> {
    return this.answerLibraryService.initializeDefaults(userId, userData);
  }

  @Get()
  async findAll(@User('id') userId: string): Promise<Answer[]> {
    return this.answerLibraryService.findAll(userId);
  }

  @Get('category/:category')
  async findByCategory(
    @Param('category') category: QuestionCategory,
    @User('id') userId: string,
  ): Promise<Answer[]> {
    return this.answerLibraryService.findByCategory(userId, category);
  }

  @Get('match')
  async findMatch(
    @Query('question') question: string,
    @User('id') userId: string,
  ): Promise<MatchedAnswer | { message: string }> {
    const match = await this.answerLibraryService.findBestMatch(userId, question);
    if (!match) {
      return { message: 'No matching answer found' };
    }
    return match;
  }

  @Get('answer')
  async getAnswer(
    @Query('question') question: string,
    @User('id') userId: string,
  ): Promise<{ answer: string | null; category: QuestionCategory | null }> {
    const answer = await this.answerLibraryService.getAnswerForQuestion(userId, question);
    const category = this.answerLibraryService.detectCategory(question);
    return { answer, category };
  }

  @Get('detect-category')
  async detectCategory(
    @Query('question') question: string,
  ): Promise<{ category: QuestionCategory | null }> {
    const category = this.answerLibraryService.detectCategory(question);
    return { category };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<Answer> {
    return this.answerLibraryService.findOne(userId, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @User('id') userId: string,
  ): Promise<Answer> {
    return this.answerLibraryService.update(userId, id, updateAnswerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<void> {
    return this.answerLibraryService.remove(userId, id);
  }
}
