import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class CrawlerService {
  private descriptions: string[] = [];

  test() {
    return 'Hello I am a crawler !!!';
  }

  async crawlRemoteOK(): Promise<RawJob[]> {
    const response = await fetch('https://www.remoteok.com/api');

    if (!response.ok)
      throw new InternalServerErrorException(
        `Remote OK Crawler crashed with response ${response.status}`,
      );

    const json = (await response.json()) as any[];

    const listings = json.slice(1);

    const results: RawJob[] = listings.map((job, index): RawJob => {
      const $ = cheerio.load('<span>' + job.description + '</span>');
      const descriptionText = $('span').text();

      return {
        title: job.position ?? '',
        description: descriptionText,
        salary_raw: '',
        salary: {
          min: job.salary_min ?? -1,
          max: job.salary_max ?? -1,
        },
        // FIXME: Requirements are always empty
        requirements: [],
        tags: job.tags ?? [],
        is_remote: true,
        location: undefined,
      };
    });

    return results;
  }

  async crawlWWR() {}

  getDescriptions() {
    return this.descriptions;
  }
}
