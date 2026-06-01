import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { UsersService } from './users.service';

@Controller({ path: 'me', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getProfile(user.id);
  }

  @Put('interests')
  updateInterests(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInterestsDto,
  ) {
    return this.users.updateInterests(user.id, dto);
  }

  @Post('interests')
  saveInterests(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInterestsDto,
  ) {
    return this.users.updateInterests(user.id, dto);
  }
}

@Controller({ path: 'users', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class UserInterestsController {
  constructor(private readonly users: UsersService) {}

  @Post('interests')
  saveInterests(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInterestsDto,
  ) {
    return this.users.updateInterests(user.id, dto);
  }

  @Put('interests')
  updateInterests(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInterestsDto,
  ) {
    return this.users.updateInterests(user.id, dto);
  }
}
