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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { QuestionCategory } from './entities/answer.entity';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { AnswerLibraryService, MatchedAnswer } from './answer-library.service';
import type { CreateAnswerDto, UpdateAnswerDto, BulkCreateAnswersDto } from './dto/create-answer.dto';
import type { Answer} from './entities/answer.entity';

@ApiTags('Answer Library')
@ApiBearerAuth('JWT-auth')
@Controller('answers')
@UseGuards(JwtAuthGuard)
export class AnswerLibraryController {
  constructor(private readonly answerLibraryService: AnswerLibraryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create answer',
    description: 'Creates a new pre-saved answer for application questions',
  })
  @ApiResponse({
    status: 201,
    description: 'Answer created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createAnswerDto: CreateAnswerDto,
    @User('id') userId: string,
  ): Promise<Answer> {
    return this.answerLibraryService.create(userId, createAnswerDto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Bulk create answers',
    description: 'Creates multiple pre-saved answers at once',
  })
  @ApiResponse({
    status: 201,
    description: 'Answers created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkCreate(
    @Body() bulkDto: BulkCreateAnswersDto,
    @User('id') userId: string,
  ): Promise<Answer[]> {
    return this.answerLibraryService.bulkCreate(userId, bulkDto.answers);
  }

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize default answers',
    description: 'Creates default answers based on user profile data for common application questions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        yearsOfExperience: { type: 'number', example: 5 },
        salaryExpectation: { type: 'string', example: '100000-150000' },
        availability: { type: 'string', example: 'Immediate' },
        workAuthorization: { type: 'boolean', example: true },
        requiresSponsorship: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Default answers initialized successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get all answers',
    description: 'Retrieves all pre-saved answers for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Answers retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@User('id') userId: string): Promise<Answer[]> {
    return this.answerLibraryService.findAll(userId);
  }

  @Get('category/:category')
  @ApiOperation({
    summary: 'Get answers by category',
    description: 'Retrieves all pre-saved answers for a specific category',
  })
  @ApiParam({ name: 'category', description: 'Question category', enum: QuestionCategory })
  @ApiResponse({
    status: 200,
    description: 'Answers retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByCategory(
    @Param('category') category: QuestionCategory,
    @User('id') userId: string,
  ): Promise<Answer[]> {
    return this.answerLibraryService.findByCategory(userId, category);
  }

  @Get('match')
  @ApiOperation({
    summary: 'Find best matching answer',
    description: 'Finds the best matching pre-saved answer for a given question',
  })
  @ApiQuery({ name: 'question', description: 'Question to match', example: 'Are you authorized to work in the US?' })
  @ApiResponse({
    status: 200,
    description: 'Match result returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get answer for question',
    description: 'Gets the answer value and detected category for a question',
  })
  @ApiQuery({ name: 'question', description: 'Question to get answer for' })
  @ApiResponse({
    status: 200,
    description: 'Answer and category returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnswer(
    @Query('question') question: string,
    @User('id') userId: string,
  ): Promise<{ answer: string | null; category: QuestionCategory | null }> {
    const answer = await this.answerLibraryService.getAnswerForQuestion(userId, question);
    const category = this.answerLibraryService.detectCategory(question);
    return { answer, category };
  }

  @Get('detect-category')
  @ApiOperation({
    summary: 'Detect question category',
    description: 'Analyzes a question and detects its category',
  })
  @ApiQuery({ name: 'question', description: 'Question to analyze' })
  @ApiResponse({
    status: 200,
    description: 'Category detected',
  })
  async detectCategory(
    @Query('question') question: string,
  ): Promise<{ category: QuestionCategory | null }> {
    const category = this.answerLibraryService.detectCategory(question);
    return { category };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get answer by ID',
    description: 'Retrieves a specific pre-saved answer by its ID',
  })
  @ApiParam({ name: 'id', description: 'Answer ID' })
  @ApiResponse({
    status: 200,
    description: 'Answer retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<Answer> {
    return this.answerLibraryService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update answer',
    description: 'Updates an existing pre-saved answer',
  })
  @ApiParam({ name: 'id', description: 'Answer ID' })
  @ApiResponse({
    status: 200,
    description: 'Answer updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @User('id') userId: string,
  ): Promise<Answer> {
    return this.answerLibraryService.update(userId, id, updateAnswerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete answer',
    description: 'Removes a pre-saved answer from the library',
  })
  @ApiParam({ name: 'id', description: 'Answer ID' })
  @ApiResponse({
    status: 204,
    description: 'Answer deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<void> {
    return this.answerLibraryService.remove(userId, id);
  }
}
