import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isVoteType } from '../../common/public-signal/votes';
import { ArticlesRepository } from '../articles/articles.repository';
import { UsersRepository } from '../users/users.repository';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { VotesRepository } from './votes.repository';

@Injectable()
export class VotesService {
  constructor(
    private readonly votes: VotesRepository,
    private readonly articles: ArticlesRepository,
    private readonly users: UsersRepository,
  ) {}

  async submitVote(userId: string, dto: SubmitVoteDto) {
    if (!isVoteType(dto.vote_type)) {
      throw new BadRequestException('Invalid vote_type');
    }

    await this.users.getProfile(userId);

    const exists = await this.articles.exists(dto.article_id);
    if (!exists) {
      throw new NotFoundException('Article not found');
    }

    return this.votes.upsertVote({
      userId,
      articleId: dto.article_id,
      voteType: dto.vote_type,
    });
  }
}

