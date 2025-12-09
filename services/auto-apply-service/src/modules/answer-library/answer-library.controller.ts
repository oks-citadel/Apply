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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnswerLibraryService, MatchedAnswer } from './answer-library.service';
import { CreateAnswerDto, UpdateAnswerDto, BulkCreateAnswersDto } from './dto/create-answer.dto';
import { Answer, QuestionCategory } from './entities/answer.entity';

@Controller('answers')
export class AnswerLibraryController {
  constructor(private readonly answerLibraryService: AnswerLibraryService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body() createAnswerDto: CreateAnswerDto,
  ): Promise<Answer> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.create(userId, createAnswerDto);
  }

  @Post('bulk')
  async bulkCreate(
    @Request() req: any,
    @Body() bulkDto: BulkCreateAnswersDto,
  ): Promise<Answer[]> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.bulkCreate(userId, bulkDto.answers);
  }

  @Post('initialize')
  async initializeDefaults(
    @Request() req: any,
    @Body() userData: {
      firstName?: string;
      lastName?: string;
      yearsOfExperience?: number;
      salaryExpectation?: string;
      availability?: string;
      workAuthorization?: boolean;
      requiresSponsorship?: boolean;
    },
  ): Promise<Answer[]> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.initializeDefaults(userId, userData);
  }

  @Get()
  async findAll(@Request() req: any): Promise<Answer[]> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.findAll(userId);
  }

  @Get('category/:category')
  async findByCategory(
    @Request() req: any,
    @Param('category') category: QuestionCategory,
  ): Promise<Answer[]> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.findByCategory(userId, category);
  }

  @Get('match')
  async findMatch(
    @Request() req: any,
    @Query('question') question: string,
  ): Promise<MatchedAnswer | { message: string }> {
    const userId = req.user?.id || req.headers['x-user-id'];
    const match = await this.answerLibraryService.findBestMatch(userId, question);
    if (!match) {
      return { message: 'No matching answer found' };
    }
    return match;
  }

  @Get('answer')
  async getAnswer(
    @Request() req: any,
    @Query('question') question: string,
  ): Promise<{ answer: string | null; category: QuestionCategory | null }> {
    const userId = req.user?.id || req.headers['x-user-id'];
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
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<Answer> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.findOne(userId, id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ): Promise<Answer> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.update(userId, id, updateAnswerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.answerLibraryService.remove(userId, id);
  }
}
