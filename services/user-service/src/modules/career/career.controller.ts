import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CareerService } from './career.service';

import type { CreateEducationDto, UpdateEducationDto } from './dto/create-education.dto';
import type { CreateWorkExperienceDto, UpdateWorkExperienceDto } from './dto/create-work-experience.dto';

@ApiTags('Career')
@ApiBearerAuth('JWT-auth')
@Controller('users/career')
@UseGuards(JwtAuthGuard)
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  // Work Experience Endpoints
  @Get('work-experience')
  @ApiOperation({ summary: 'Get all work experiences' })
  @ApiResponse({ status: 200, description: 'Work experiences retrieved successfully' })
  async getAllWorkExperiences(@CurrentUser('userId') userId: string) {
    return this.careerService.getAllWorkExperiences(userId);
  }

  @Get('work-experience/:id')
  @ApiOperation({ summary: 'Get work experience by ID' })
  @ApiResponse({ status: 200, description: 'Work experience retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Work experience not found' })
  async getWorkExperienceById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.careerService.getWorkExperienceById(userId, id);
  }

  @Post('work-experience')
  @ApiOperation({ summary: 'Create work experience' })
  @ApiResponse({ status: 201, description: 'Work experience created successfully' })
  async createWorkExperience(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateWorkExperienceDto,
  ) {
    return this.careerService.createWorkExperience(userId, createDto);
  }

  @Put('work-experience/:id')
  @ApiOperation({ summary: 'Update work experience' })
  @ApiResponse({ status: 200, description: 'Work experience updated successfully' })
  @ApiResponse({ status: 404, description: 'Work experience not found' })
  async updateWorkExperience(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkExperienceDto,
  ) {
    return this.careerService.updateWorkExperience(userId, id, updateDto);
  }

  @Delete('work-experience/:id')
  @ApiOperation({ summary: 'Delete work experience' })
  @ApiResponse({ status: 200, description: 'Work experience deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work experience not found' })
  async deleteWorkExperience(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.careerService.deleteWorkExperience(userId, id);
    return { message: 'Work experience deleted successfully' };
  }

  // Education Endpoints
  @Get('education')
  @ApiOperation({ summary: 'Get all education entries' })
  @ApiResponse({ status: 200, description: 'Education entries retrieved successfully' })
  async getAllEducation(@CurrentUser('userId') userId: string) {
    return this.careerService.getAllEducation(userId);
  }

  @Get('education/:id')
  @ApiOperation({ summary: 'Get education by ID' })
  @ApiResponse({ status: 200, description: 'Education retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Education not found' })
  async getEducationById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.careerService.getEducationById(userId, id);
  }

  @Post('education')
  @ApiOperation({ summary: 'Create education entry' })
  @ApiResponse({ status: 201, description: 'Education created successfully' })
  async createEducation(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateEducationDto,
  ) {
    return this.careerService.createEducation(userId, createDto);
  }

  @Put('education/:id')
  @ApiOperation({ summary: 'Update education entry' })
  @ApiResponse({ status: 200, description: 'Education updated successfully' })
  @ApiResponse({ status: 404, description: 'Education not found' })
  async updateEducation(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateEducationDto,
  ) {
    return this.careerService.updateEducation(userId, id, updateDto);
  }

  @Delete('education/:id')
  @ApiOperation({ summary: 'Delete education entry' })
  @ApiResponse({ status: 200, description: 'Education deleted successfully' })
  @ApiResponse({ status: 404, description: 'Education not found' })
  async deleteEducation(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.careerService.deleteEducation(userId, id);
    return { message: 'Education deleted successfully' };
  }
}
