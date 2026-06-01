import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../modules/supabase/supabase.service';
import { AuthenticatedUser } from './authenticated-user.interface';

interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    const token = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!token?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const accessToken = token.slice('Bearer '.length);
    const user = await this.supabase.getUser(accessToken);
    request.user = {
      id: user.id,
      email: user.email,
    };

    return true;
  }
}

