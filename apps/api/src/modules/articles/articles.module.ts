import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ArticlesController } from './articles.controller';
import { ArticlesRepository } from './articles.repository';
import { ArticlesService } from './articles.service';

@Module({
  imports: [UsersModule],
  controllers: [ArticlesController],
  providers: [ArticlesRepository, ArticlesService],
  exports: [ArticlesRepository],
})
export class ArticlesModule {}
