import { Module } from '@nestjs/common';
import { StoriesRepository } from './stories.repository';
import { StoriesService } from './stories.service';

@Module({
  providers: [StoriesRepository, StoriesService],
  exports: [StoriesRepository, StoriesService],
})
export class StoriesModule {}
