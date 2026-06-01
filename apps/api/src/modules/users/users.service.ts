import { Injectable } from '@nestjs/common';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getProfile(userId: string) {
    return this.users.getProfile(userId);
  }

  async updateInterests(userId: string, dto: UpdateInterestsDto) {
    return this.users.updateInterests(
      userId,
      dto.interests,
      dto.suppressedTopics ?? [],
    );
  }
}
