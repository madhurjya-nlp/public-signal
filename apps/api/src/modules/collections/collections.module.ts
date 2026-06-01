import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { CollectionsController } from './collections.controller';
import { CollectionsRepository } from './collections.repository';
import { CollectionsService } from './collections.service';

@Module({
  imports: [ArticlesModule],
  controllers: [CollectionsController],
  providers: [CollectionsRepository, CollectionsService],
})
export class CollectionsModule {}
