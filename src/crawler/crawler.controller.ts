import { Controller, Get, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlerGuard } from './crawler.guard';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  @UseGuards(CrawlerGuard)
  async test() {
    const [remoteOK, WWR] = await Promise.allSettled([
      this.crawlerService.crawlRemoteOK(),
      this.crawlerService.crawlWWR(),
    ]);

    const saves: Promise<number>[] = [];

    if (remoteOK.status === 'fulfilled') {
      saves.push(this.crawlerService.saveJobs(remoteOK.value));
    }

    if (WWR.status === 'fulfilled') {
      saves.push(this.crawlerService.saveJobs(WWR.value));
    }

    const [remoteOkResults, wwrResults] = await Promise.all(saves);
    return {
      status: 'success',
      message: 'Crawled Successfully',
      values: {
        remoteOK: remoteOkResults,
        wwr: wwrResults,
      },
    };
  }
}
