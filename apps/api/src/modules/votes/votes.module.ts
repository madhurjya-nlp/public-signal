import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { UsersModule } from '../users/users.module';
import { VotesController } from './votes.controller';
import { VotesRepository } from './votes.repository';
import { VotesService } from './votes.service';

@Module({
  imports: [ArticlesModule, UsersModule],
  controllers: [VotesController],
  providers: [VotesRepository, VotesService],
  exports: [VotesRepository],
})
export class VotesModule {}

