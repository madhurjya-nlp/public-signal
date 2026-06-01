import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SaveArticleDto {
  @IsUUID()
  articleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

