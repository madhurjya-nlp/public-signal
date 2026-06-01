import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ArticlesModule } from './modules/articles/articles.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { FeedModule } from './modules/feed/feed.module';
import { HealthModule } from './modules/health/health.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { SearchModule } from './modules/search/search.module';
import { StoriesModule } from './modules/stories/stories.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { UsersModule } from './modules/users/users.module';
import { VotesModule } from './modules/votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    HealthModule,
    ArticlesModule,
    UsersModule,
    FeedModule,
    VotesModule,
    RankingsModule,
    CollectionsModule,
    SearchModule,
    StoriesModule,
    AssistantModule,
  ],
})
export class AppModule {}
