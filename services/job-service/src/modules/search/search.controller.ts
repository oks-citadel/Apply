import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards';

import type { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search for jobs' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  async globalSearch(@Query() searchDto: any) {
    return this.searchService.searchJobs(searchDto);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete suggestions for job titles' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async autocomplete(
    @Query('query') query: string,
    @Query('limit') limit: number = 10,
  ) {
    const suggestions = await this.searchService.autocomplete('title', query, limit);
    return { suggestions };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions across multiple fields' })
  @ApiQuery({ name: 'query', required: true, type: String })
  async searchSuggestions(@Query('query') query: string) {
    return this.searchService.getSuggestions(query);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Search for locations' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async locationSearch(
    @Query('query') query: string,
    @Query('limit') limit: number = 10,
  ) {
    const locations = await this.searchService.locationSearch(query, limit);
    return { locations };
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get recent searches for user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentSearches(
    @Request() req: any,
    @Query('limit') limit: number = 10,
  ) {
    const searches = await this.searchService.getRecentSearches(req.user.sub, limit);
    return { searches };
  }

  @Delete('recent/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a recent search' })
  async deleteRecentSearch(@Param('id') id: string, @Request() req: any) {
    await this.searchService.deleteRecentSearch(req.user.sub, id);
    return { message: 'Search deleted successfully' };
  }
}
