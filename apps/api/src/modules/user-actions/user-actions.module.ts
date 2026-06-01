import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { StoriesModule } from '../stories/stories.module';
import { UsersModule } from '../users/users.module';
import { ArticleActionsController, MeActionsController } from './user-actions.controller';
import { UserActionsRepository } from './user-actions.repository';
import { UserActionsService } from './user-actions.service';

@Module({
  imports: [ArticlesModule, StoriesModule, UsersModule],
  controllers: [ArticleActionsController, MeActionsController],
  providers: [UserActionsRepository, UserActionsService],
})
export class UserActionsModule {}
