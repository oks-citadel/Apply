// COMPLETE UPDATED CONTROLLER
// File: src/modules/resumes/resumes.controller.ts
// Copy this entire file to replace the existing controller

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { ResumesService } from './resumes.service';
import { ExportService } from '../export/export.service';
import { ParserService } from '../parser/parser.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeResponseDto, ResumeListResponseDto } from './dto/resume-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('resumes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(
    private readonly resumesService: ResumesService,
    private readonly exportService: ExportService,
    private readonly parserService: ParserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resume' })
  @ApiResponse({
    status: 201,
    description: 'Resume created successfully',
    type: ResumeResponseDto,
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createResumeDto: CreateResumeDto,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.create(user.userId, createResumeDto);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Resumes retrieved successfully',
    type: ResumeListResponseDto,
  })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<ResumeListResponseDto> {
    const { resumes, total } = await this.resumesService.findAll(user.userId, page, limit, search);

    return {
      resumes: plainToInstance(ResumeResponseDto, resumes),
      total,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume by ID' })
  @ApiResponse({
    status: 200,
    description: 'Resume retrieved successfully',
    type: ResumeResponseDto,
  })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.findOne(id, user.userId);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update resume' })
  @ApiResponse({
    status: 200,
    description: 'Resume updated successfully',
    type: ResumeResponseDto,
  })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResumeDto: UpdateResumeDto,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.update(id, user.userId, updateResumeDto);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resume' })
  @ApiResponse({ status: 200, description: 'Resume deleted successfully' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.resumesService.remove(id, user.userId);
    return { message: 'Resume deleted successfully' };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate resume' })
  @ApiResponse({
    status: 201,
    description: 'Resume duplicated successfully',
    type: ResumeResponseDto,
  })
  async duplicate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.duplicate(id, user.userId);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set resume as default' })
  @ApiResponse({
    status: 200,
    description: 'Resume set as default successfully',
    type: ResumeResponseDto,
  })
  async setDefault(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.setDefault(id, user.userId);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import resume from file (PDF/DOCX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        parseFormat: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Resume imported successfully',
    type: ResumeResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimetype === 'application/msword'
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and DOCX files are allowed'), false);
        }
      },
    }),
  )
  async import(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('parseFormat') parseFormat?: string,
  ): Promise<ResumeResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const resume = await this.resumesService.importFromFile(user.userId, file, parseFormat);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export resume in specified format' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'docx', 'txt', 'json'], required: false })
  @ApiResponse({ status: 200, description: 'Resume exported successfully' })
  async export(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: string = 'pdf',
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const resume = await this.resumesService.findOne(id, user.userId);

    let buffer: Buffer;
    let mimeType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await this.exportService.generatePdf(resume);
        mimeType = 'application/pdf';
        filename = `${resume.name}.pdf`;
        break;

      case 'docx':
        buffer = await this.exportService.generateDocx(resume);
        mimeType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${resume.name}.docx`;
        break;

      case 'json':
        buffer = Buffer.from(this.exportService.generateJson(resume));
        mimeType = 'application/json';
        filename = `${resume.name}.json`;
        break;

      case 'txt':
        buffer = Buffer.from(JSON.stringify(resume.content, null, 2));
        mimeType = 'text/plain';
        filename = `${resume.name}.txt`;
        break;

      default:
        throw new BadRequestException('Invalid export format. Use pdf, docx, txt, or json');
    }

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post(':id/ats-score')
  @ApiOperation({ summary: 'Calculate ATS score for resume against job description' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jobDescription: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'ATS score calculated successfully' })
  async calculateAtsScore(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('jobDescription') jobDescription: string,
  ) {
    const atsScore = await this.resumesService.calculateAtsScore(id, user.userId, jobDescription);
    return atsScore;
  }

  @Post('parse')
  @ApiOperation({ summary: 'Parse resume from file or text' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          required: false,
        },
        text: {
          type: 'string',
          required: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resume parsed successfully',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimetype === 'application/msword'
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and DOCX files are allowed'), false);
        }
      },
    }),
  )
  async parse(
    @UploadedFile() file?: Express.Multer.File,
    @Body('text') text?: string,
  ): Promise<any> {
    if (!file && !text) {
      throw new BadRequestException('Either file or text must be provided');
    }

    let parsedContent;

    if (file) {
      if (file.mimetype === 'application/pdf') {
        parsedContent = await this.parserService.parsePdf(file.buffer);
      } else {
        parsedContent = await this.parserService.parseDocx(file.buffer);
      }
    } else if (text) {
      // For text parsing, create a buffer from text
      parsedContent = await this.parserService.parsePdf(Buffer.from(text));
    }

    return parsedContent;
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get resume version history' })
  @ApiResponse({ status: 200, description: 'Version history retrieved successfully' })
  async getVersions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.resumesService.getVersions(id, user.userId);
  }

  @Post(':id/versions/:version/restore')
  @ApiOperation({ summary: 'Restore resume to specific version' })
  @ApiResponse({
    status: 200,
    description: 'Resume restored successfully',
    type: ResumeResponseDto,
  })
  async restoreVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('version') version: number,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.restoreVersion(id, version, user.userId);
    return plainToInstance(ResumeResponseDto, resume);
  }
}
