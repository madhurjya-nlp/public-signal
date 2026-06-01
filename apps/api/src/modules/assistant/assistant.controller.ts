import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { AssistantService } from './assistant.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller({ path: 'assistant', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @Post('messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.assistant.sendMessage(user.id, dto.message);
  }
}
