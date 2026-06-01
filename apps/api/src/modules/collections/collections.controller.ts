import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { SaveArticleDto } from './dto/save-article.dto';

@Controller({ path: 'collections', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.collections.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collections.create(user.id, dto);
  }

  @Get(':collectionId')
  getDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
  ) {
    return this.collections.getDetail(user.id, collectionId);
  }

  @Post(':collectionId/items')
  saveArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() dto: SaveArticleDto,
  ) {
    return this.collections.saveArticle(user.id, collectionId, dto);
  }

  @Delete(':collectionId/items/:articleId')
  removeArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.collections.removeArticle(user.id, collectionId, articleId);
  }
}
