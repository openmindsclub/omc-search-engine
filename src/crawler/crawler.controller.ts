import { Controller, Get, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlerGuard } from './crawler.guard';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  @UseGuards(CrawlerGuard)
  async test() {
    const results = await this.crawlerService.crawlRemoteOK();
    console.log(results);

    return JSON.stringify(this.crawlerService.getDescriptions(), null, 2);
  }
}
