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
  @ApiResponse({
    status: 200,
    description: 'Resumes retrieved successfully',
    type: ResumeListResponseDto,
  })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ResumeListResponseDto> {
    const { resumes, total } = await this.resumesService.findAll(user.userId, page, limit);

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

  @Post(':id/set-primary')
  @ApiOperation({ summary: 'Set resume as primary' })
  @ApiResponse({
    status: 200,
    description: 'Resume set as primary successfully',
    type: ResumeResponseDto,
  })
  async setPrimary(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumesService.setPrimary(id, user.userId);
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
        title: {
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
    @Body('title') title?: string,
  ): Promise<ResumeResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const resume = await this.resumesService.importFromFile(user.userId, file, title);
    return plainToInstance(ResumeResponseDto, resume);
  }

  @Get(':id/export/:format')
  @ApiOperation({ summary: 'Export resume in specified format' })
  @ApiResponse({ status: 200, description: 'Resume exported successfully' })
  async export(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('format') format: string,
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
        filename = `${resume.title}.pdf`;
        break;

      case 'docx':
        buffer = await this.exportService.generateDocx(resume);
        mimeType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${resume.title}.docx`;
        break;

      case 'json':
        buffer = Buffer.from(this.exportService.generateJson(resume));
        mimeType = 'application/json';
        filename = `${resume.title}.json`;
        break;

      default:
        throw new BadRequestException('Invalid export format. Use pdf, docx, or json');
    }

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
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

  @Post(':id/ats-score')
  @ApiOperation({ summary: 'Calculate ATS score for resume' })
  @ApiResponse({ status: 200, description: 'ATS score calculated successfully' })
  async calculateAtsScore(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const score = await this.resumesService.calculateAtsScore(id, user.userId);
    return { atsScore: score };
  }
}
