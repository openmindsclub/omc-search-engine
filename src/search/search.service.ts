import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'src/common/entities/job.entity';
import { Repository } from 'typeorm';
import { BM25 } from './BM25.index';

@Injectable()
export class SearchService {
  private BM25Index!: BM25;
  private _ready: Promise<void>;

  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {
    this._ready = this.buildIndex();
  }

  private async ensureReady() {
    if (this._ready) {
      await this._ready;
      if (!this.BM25Index)
        throw new InternalServerErrorException(
          'Error while initializing BM25 Index',
        );
    }
  }

  private async buildIndex() {
    const jobs: Job[] = await this.jobsRepository.find();
    this.BM25Index = new BM25(jobs);
    console.info('Finished Initialization of BM25 Index [In Memory]');
  }

  public async query(queryString: string) {
    await this.ensureReady();

    const results = this.BM25Index.query(queryString);

    return results.map((result) => ({
      id: result.job.id,
      score: result.score,
      applyLink: result.job.link,
      title: result.job.title,
      tags: result.job.tags,
      salary: {
        min: result.job.salary_min,
        max: result.job.salary_max,
      },
    }));
  }

  public async getDocument(id: string) {
    const job = await this.jobsRepository.findOne({
      where: {
        id: id,
      },
    });

    return job;
  }
}
