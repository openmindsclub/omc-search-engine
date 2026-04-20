import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from 'src/common/entities/job.entity';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forFeature([Job])],
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
