import { Module } from '@nestjs/common';
import { StoriesModule } from '../stories/stories.module';
import { RankingsController } from './rankings.controller';
import { RankingsRepository } from './rankings.repository';
import { RankingsService } from './rankings.service';

@Module({
  imports: [StoriesModule],
  controllers: [RankingsController],
  providers: [RankingsRepository, RankingsService],
})
export class RankingsModule {}
