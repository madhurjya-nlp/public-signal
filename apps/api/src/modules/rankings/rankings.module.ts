import { Module } from '@nestjs/common';
import { RankingsController } from './rankings.controller';
import { RankingsRepository } from './rankings.repository';
import { RankingsService } from './rankings.service';

@Module({
  controllers: [RankingsController],
  providers: [RankingsRepository, RankingsService],
})
export class RankingsModule {}

