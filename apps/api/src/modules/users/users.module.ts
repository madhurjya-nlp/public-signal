import { Module } from '@nestjs/common';
import {
  UserInterestsController,
  UsersController,
} from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, UserInterestsController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository],
})
export class UsersModule {}
