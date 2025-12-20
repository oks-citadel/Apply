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

import type { CreateSkillDto, UpdateSkillDto } from './dto/create-skill.dto';
import type { SkillsService } from './skills.service';

@ApiTags('Skills')
@ApiBearerAuth('JWT-auth')
@Controller('users/skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user skills' })
  @ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
  async getAllSkills(@CurrentUser('userId') userId: string) {
    return this.skillsService.getAllSkills(userId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get skill suggestions based on profile' })
  @ApiResponse({ status: 200, description: 'Skill suggestions retrieved successfully' })
  async getSkillSuggestions(@CurrentUser('userId') userId: string) {
    return this.skillsService.getSkillSuggestions(userId);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get skills grouped by category' })
  @ApiResponse({ status: 200, description: 'Categorized skills retrieved successfully' })
  async getSkillsByCategory(@CurrentUser('userId') userId: string) {
    return this.skillsService.getSkillsByCategory(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by ID' })
  @ApiResponse({ status: 200, description: 'Skill retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async getSkillById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.skillsService.getSkillById(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new skill' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  @ApiResponse({ status: 400, description: 'Skill already exists' })
  async createSkill(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateSkillDto,
  ) {
    return this.skillsService.createSkill(userId, createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update skill proficiency' })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async updateSkill(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateSkillDto,
  ) {
    return this.skillsService.updateSkill(userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a skill' })
  @ApiResponse({ status: 200, description: 'Skill deleted successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async deleteSkill(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.skillsService.deleteSkill(userId, id);
    return { message: 'Skill deleted successfully' };
  }
}
