import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateClassDto, JoinClassDto } from './dto/classes.dto';

@Injectable()
export class ClassesService {
  constructor(private supabase: SupabaseService) {}

  async createClass(userId: string, dto: CreateClassDto) {
    const code = nanoid(8).toUpperCase();

    const { data: classData, error } = await this.supabase.admin
      .from('classes')
      .insert({
        name: dto.name,
        description: dto.description,
        code,
        owner_id: userId,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.admin.from('class_members').insert({
      class_id: classData.id,
      user_id: userId,
      role: 'owner',
    });

    return classData;
  }

  async joinClass(userId: string, dto: JoinClassDto) {
    const { data: classData, error: classError } = await this.supabase.admin
      .from('classes')
      .select('*')
      .eq('code', dto.code)
      .single();

    if (classError || !classData) {
      throw new BadRequestException('Kode kelas tidak valid');
    }

    const { error } = await this.supabase.admin.from('class_members').insert({
      class_id: classData.id,
      user_id: userId,
      role: 'member',
    });

    if (error) throw new BadRequestException('User sudah join kelas ini');

    return {
      message: 'Berhasil join kelas',
      class: classData,
    };
  }

  async getMyClasses(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('class_members')
      .select('role, classes(*)')
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getClassDetail(userId: string, classId: string) {
    await this.ensureMember(userId, classId);

    const { data, error } = await this.supabase.admin
      .from('classes')
      .select(
        `
        *,
        class_members(
          role,
          profiles(id, name, email)
        )
      `,
      )
      .eq('id', classId)
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async ensureMember(userId: string, classId: string) {
    const { data } = await this.supabase.admin
      .from('class_members')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .single();

    if (!data) throw new ForbiddenException('Anda bukan anggota kelas ini');

    return data;
  }

  async ensureOwner(userId: string, classId: string) {
    const { data } = await this.supabase.admin
      .from('class_members')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single();

    if (!data) throw new ForbiddenException('Hanya owner yang boleh mengakses');

    return data;
  }
  
  async deleteClass(userId: string, classId: string) {
    await this.ensureOwner(userId, classId);

    const { error } = await this.supabase.admin
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Kelas berhasil dihapus',
    };
  }
}