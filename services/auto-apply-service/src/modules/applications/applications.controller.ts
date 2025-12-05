import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  private extractUserId(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      throw new BadRequestException('User ID is required in headers');
    }
    return userId;
  }

  @Get()
  async findAll(@Headers() headers: any, @Query() query: QueryApplicationDto) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.findAll(userId, query);
  }

  @Get('analytics')
  async getAnalytics(@Headers() headers: any) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.getAnalytics(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.findOne(id, userId);
  }

  @Post('manual')
  async logManualApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    createApplicationDto.user_id = userId;
    return await this.applicationsService.logManualApplication(createApplicationDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.update(id, userId, updateApplicationDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    return await this.applicationsService.updateStatus(id, userId, updateStatusDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.extractUserId(headers);
    await this.applicationsService.remove(id, userId);
    return { message: 'Application deleted successfully' };
  }
}
