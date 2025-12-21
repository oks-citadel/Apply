import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileSectionsService } from './profile-sections.service';
import { ProfileService } from './profile.service';

import type {
  CreateCertificationDto,
  UpdateCertificationDto,
} from './dto/certification.dto';
import type { CreateEducationDto, UpdateEducationDto } from './dto/education.dto';
import type { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
} from './dto/work-experience.dto';



@ApiTags('Profile')
@ApiBearerAuth('JWT-auth')
@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly profileSectionsService: ProfileSectionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, updateDto);
  }

  @Post('photo')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    return this.profileService.uploadProfilePhoto(userId, file);
  }

  @Delete('photo')
  @ApiOperation({ summary: 'Remove profile photo' })
  @ApiResponse({ status: 200, description: 'Photo removed successfully' })
  async deleteProfilePhoto(@CurrentUser('userId') userId: string) {
    await this.profileService.deleteProfilePhoto(userId);
    return { message: 'Profile photo deleted successfully' };
  }

  @Get('completeness')
  @ApiOperation({ summary: 'Get profile completeness score' })
  @ApiResponse({ status: 200, description: 'Completeness score retrieved successfully' })
  async getCompletenessScore(@CurrentUser('userId') userId: string) {
    return this.profileService.getCompletenessScore(userId);
  }

  // Work Experience endpoints
  @Get('work-experience')
  @ApiOperation({ summary: 'Get all work experiences' })
  @ApiResponse({ status: 200, description: 'Work experiences retrieved successfully' })
  async getWorkExperiences(@CurrentUser('userId') userId: string) {
    return this.profileSectionsService.getWorkExperiences(userId);
  }

  @Post('work-experience')
  @ApiOperation({ summary: 'Create work experience' })
  @ApiResponse({ status: 201, description: 'Work experience created successfully' })
  async createWorkExperience(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateWorkExperienceDto,
  ) {
    return this.profileSectionsService.createWorkExperience(userId, createDto);
  }

  @Put('work-experience/:id')
  @ApiOperation({ summary: 'Update work experience' })
  @ApiResponse({ status: 200, description: 'Work experience updated successfully' })
  async updateWorkExperience(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkExperienceDto,
  ) {
    return this.profileSectionsService.updateWorkExperience(id, userId, updateDto);
  }

  @Delete('work-experience/:id')
  @ApiOperation({ summary: 'Delete work experience' })
  @ApiResponse({ status: 200, description: 'Work experience deleted successfully' })
  async deleteWorkExperience(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.profileSectionsService.deleteWorkExperience(id, userId);
    return { message: 'Work experience deleted successfully' };
  }

  // Education endpoints
  @Get('education')
  @ApiOperation({ summary: 'Get all education entries' })
  @ApiResponse({ status: 200, description: 'Education entries retrieved successfully' })
  async getEducation(@CurrentUser('userId') userId: string) {
    return this.profileSectionsService.getEducation(userId);
  }

  @Post('education')
  @ApiOperation({ summary: 'Create education entry' })
  @ApiResponse({ status: 201, description: 'Education entry created successfully' })
  async createEducation(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateEducationDto,
  ) {
    return this.profileSectionsService.createEducation(userId, createDto);
  }

  @Put('education/:id')
  @ApiOperation({ summary: 'Update education entry' })
  @ApiResponse({ status: 200, description: 'Education entry updated successfully' })
  async updateEducation(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateEducationDto,
  ) {
    return this.profileSectionsService.updateEducation(id, userId, updateDto);
  }

  @Delete('education/:id')
  @ApiOperation({ summary: 'Delete education entry' })
  @ApiResponse({ status: 200, description: 'Education entry deleted successfully' })
  async deleteEducation(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.profileSectionsService.deleteEducation(id, userId);
    return { message: 'Education entry deleted successfully' };
  }

  // Skills endpoints
  @Get('skills')
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
  async getSkills(@CurrentUser('userId') userId: string) {
    return this.profileSectionsService.getSkills(userId);
  }

  @Post('skills')
  @ApiOperation({ summary: 'Create skill' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  async createSkill(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateSkillDto,
  ) {
    return this.profileSectionsService.createSkill(userId, createDto);
  }

  @Put('skills/:id')
  @ApiOperation({ summary: 'Update skill' })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  async updateSkill(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateSkillDto,
  ) {
    return this.profileSectionsService.updateSkill(id, userId, updateDto);
  }

  @Delete('skills/:id')
  @ApiOperation({ summary: 'Delete skill' })
  @ApiResponse({ status: 200, description: 'Skill deleted successfully' })
  async deleteSkill(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.profileSectionsService.deleteSkill(id, userId);
    return { message: 'Skill deleted successfully' };
  }

  // Certifications endpoints
  @Get('certifications')
  @ApiOperation({ summary: 'Get all certifications' })
  @ApiResponse({ status: 200, description: 'Certifications retrieved successfully' })
  async getCertifications(@CurrentUser('userId') userId: string) {
    return this.profileSectionsService.getCertifications(userId);
  }

  @Post('certifications')
  @ApiOperation({ summary: 'Create certification' })
  @ApiResponse({ status: 201, description: 'Certification created successfully' })
  async createCertification(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateCertificationDto,
  ) {
    return this.profileSectionsService.createCertification(userId, createDto);
  }

  @Put('certifications/:id')
  @ApiOperation({ summary: 'Update certification' })
  @ApiResponse({ status: 200, description: 'Certification updated successfully' })
  async updateCertification(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateCertificationDto,
  ) {
    return this.profileSectionsService.updateCertification(id, userId, updateDto);
  }

  @Delete('certifications/:id')
  @ApiOperation({ summary: 'Delete certification' })
  @ApiResponse({ status: 200, description: 'Certification deleted successfully' })
  async deleteCertification(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.profileSectionsService.deleteCertification(id, userId);
    return { message: 'Certification deleted successfully' };
  }
}
