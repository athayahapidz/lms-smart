import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          name: dto.name,
        },
      },
    });

    if (error) throw new BadRequestException(error.message);

    if (data.user) {
      await this.supabase.admin.from('profiles').insert({
        id: data.user.id,
        name: dto.name,
        email: dto.email,
      });
    }

    return {
      message: 'Register berhasil',
      user: data.user,
      session: data.session,
    };
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Login berhasil',
      session: data.session,
      user: data.user,
    };
  }

  async logout(token: string) {
    const { error } = await this.supabase.client.auth.admin.signOut(token);

    if (error) {
      return { message: 'Logout lokal di client saja' };
    }

    return { message: 'Logout berhasil' };
  }

  async me(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async updateProfile(userId: string, token: string, dto: UpdateProfileDto) {
    if (dto.email || dto.password) {
      const { error } = await this.supabase.client.auth.updateUser(
        {
          email: dto.email,
          password: dto.password,
        },
        {
          emailRedirectTo: undefined,
        },
      );

      if (error) throw new BadRequestException(error.message);
    }

    if (dto.name || dto.email) {
      const updateData: any = {};

      if (dto.name) updateData.name = dto.name;
      if (dto.email) updateData.email = dto.email;

      const { error } = await this.supabase.admin
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw new BadRequestException(error.message);
    }

    return { message: 'Profil berhasil diperbarui' };
  }
}