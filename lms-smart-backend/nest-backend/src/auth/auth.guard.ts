import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    const token = authHeader.replace('Bearer ', '');

    const { data, error } = await this.supabase.client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token tidak valid');
    }

    req.user = data.user;

    return true;
  }
}