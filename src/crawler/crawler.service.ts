import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { extractRequirements, extractSalary } from './crawler.data-extractor';
import { DeepPartial, Repository } from 'typeorm';
import { Job } from 'src/common/entities/job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CheerioCrawler, HttpCrawler } from 'crawlee';

@Injectable()
export class CrawlerService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {}

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

      const salary_extracted = extractSalary(descriptionText);
      const requirements_extracted = extractRequirements(descriptionText);

      const salary =
        job.salary_min && job.salary_max
          ? {
              min: job.salary_min,
              max: job.salary_max,
            }
          : {
              min: salary_extracted.min,
              max: salary_extracted.max,
            };

      return {
        title: job.position ?? '',
        description: descriptionText,
        salary_raw: salary_extracted.raw,
        salary: salary,
        requirements: requirements_extracted,
        tags: job.tags ?? [],
        link: job.apply_url ?? 'URL_NOT_FOUND',
        is_remote: true,
        location: undefined,
      };
    });

    return results;
  }

  async crawlWWR() {
    const BASE_URL = 'https://weworkremotely.com/';
    const results: RawJob[] = [];

    const crawler = new CheerioCrawler({
      async requestHandler({ request, $, enqueueLinks, log }) {
        if (request.label === 'LISTING') {
          const hrefs = $('a.listing-link--unlocked')
            .map((i, element) => $(element).attr('href'))
            .get()
            .filter(Boolean)
            .map((stub) => `${BASE_URL}${stub}`);

          await enqueueLinks({ urls: hrefs, label: 'DETAIL' });
        }

        if (request.label === 'DETAIL') {
          const descriptionText = $(
            'div.lis-container__job__content__description',
          ).text();

          type AboutJobType = {
            label: string;
            values: string[];
          };

          const aboutTheJob = $(
            'ul.lis-container__job__sidebar__job-about__list > li',
          )
            .map((i, el): AboutJobType | undefined => {
              const topLevelText = $(el)
                .contents()
                .filter((_, node) => node.type === 'text')
                .text()
                .trim();

              const boxes = $(el)
                .find('.box')
                .map((_, box) => $(box).text().trim())
                .get();

              if (boxes.length > 0) {
                return {
                  label: topLevelText,
                  values: boxes,
                };
              }
            })
            .get()
            .filter(Boolean);

          const extractedRequirements = extractRequirements(descriptionText);
          const extractedSalary = extractSalary(descriptionText);

          const extractedAbout = {
            skills: aboutTheJob.find((v) => v.label.toLowerCase() === 'skills'),
            country: aboutTheJob.find(
              (v) => v.label.toLowerCase() === 'country',
            ),
            title: $('title').text(),
            salary: extractSalary(
              aboutTheJob.find((v) => v.label.toLowerCase() === 'salary')
                ?.values[0] ?? '',
            ),
            is_global: aboutTheJob
              .find((v) => v.label === 'region')
              ?.values.includes('Anywhere in the World'),
          };

          const salary = extractedAbout['salary'].raw
            ? extractedAbout['salary']
            : extractedSalary;

          const job: RawJob = {
            title: extractedAbout['title'],
            description: descriptionText,
            salary_raw: salary.raw,
            salary: {
              min: salary.min,
              max: salary.max,
            },
            requirements: extractedRequirements,
            tags: extractedAbout['skills']?.values ?? [],
            is_remote: true,
            link: request.url,
          };
          results.push(job);
        }
      },

      maxConcurrency: 10,
      retryOnBlocked: true,
    });

    await crawler.run([
      { url: `${BASE_URL}/remote-jobs/search?sort=Any+Time`, label: 'LISTING' },
    ]);

    return results;
  }

  async saveJobs(rawJobs: RawJob[]) {
    const jobs = rawJobs.map(
      (rJob): DeepPartial<Job> => ({
        description: rJob.description,
        location: rJob.location,
        link: rJob.link,
        is_remote: rJob.is_remote,
        requirements: rJob.requirements,
        tags: rJob.tags,
        salary_raw: rJob.salary_raw,
        salary_min: rJob.salary.min,
        salary_max: rJob.salary.max,
      }),
    );

    await this.jobsRepository.upsert(jobs, ['link']);
    return jobs.length;
  }
}
