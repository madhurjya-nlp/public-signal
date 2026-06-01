import { Module } from '@nestjs/common';
import { StoriesModule } from '../stories/stories.module';
import { UsersModule } from '../users/users.module';
import { RankingsController } from './rankings.controller';
import { RankingsRepository } from './rankings.repository';
import { RankingsService } from './rankings.service';

@Module({
  imports: [StoriesModule, UsersModule],
  controllers: [RankingsController],
  providers: [RankingsRepository, RankingsService],
})
export class RankingsModule {}
