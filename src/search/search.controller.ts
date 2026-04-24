import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string) {
    return await this.searchService.query(query);
  }

  @Get('/:id')
  async getOne(@Param('id') id: string) {
    return await this.searchService.getDocument(id);
  }
}
