import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SectionsService } from './sections.service';

import type { CreateSectionDto } from './dto/create-section.dto';
import type { UpdateSectionDto } from './dto/update-section.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('sections')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('resumes/:resumeId/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Body() createSectionDto: CreateSectionDto,
  ) {
    return await this.sectionsService.create(resumeId, createSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sections for a resume' })
  @ApiResponse({ status: 200, description: 'Sections retrieved successfully' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
  ) {
    return await this.sectionsService.findAll(resumeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get section by ID' })
  @ApiResponse({ status: 200, description: 'Section retrieved successfully' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.sectionsService.findOne(id, resumeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return await this.sectionsService.update(id, resumeId, updateSectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete section' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.sectionsService.remove(id, resumeId);
    return { message: 'Section deleted successfully' };
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder sections' })
  @ApiResponse({ status: 200, description: 'Sections reordered successfully' })
  async reorder(
    @CurrentUser() user: JwtPayload,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Body() sectionOrders: { id: string; order: number }[],
  ) {
    await this.sectionsService.reorder(resumeId, sectionOrders);
    return { message: 'Sections reordered successfully' };
  }
}
