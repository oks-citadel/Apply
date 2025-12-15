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
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async findAll(@User('id') userId: string, @Query() query: QueryApplicationDto) {
    return await this.applicationsService.findAll(userId, query);
  }

  @Get('analytics')
  async getAnalytics(@User('id') userId: string) {
    return await this.applicationsService.getAnalytics(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @User('id') userId: string) {
    return await this.applicationsService.findOne(id, userId);
  }

  @Post('manual')
  async logManualApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @User('id') userId: string,
  ) {
    createApplicationDto.user_id = userId;
    return await this.applicationsService.logManualApplication(createApplicationDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @User('id') userId: string,
  ) {
    return await this.applicationsService.update(id, userId, updateApplicationDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @User('id') userId: string,
  ) {
    return await this.applicationsService.updateStatus(id, userId, updateStatusDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User('id') userId: string) {
    await this.applicationsService.remove(id, userId);
    return { message: 'Application deleted successfully' };
  }
}
