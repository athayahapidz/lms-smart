import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassesService } from '../classes/classes.service';
import { CreateTaskDto } from './dto/tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    private supabase: SupabaseService,
    private classesService: ClassesService,
  ) {}

  async createTask(userId: string, dto: CreateTaskDto) {
    await this.classesService.ensureOwner(userId, dto.class_id);

    const { data, error } = await this.supabase.admin
      .from('tasks')
      .insert({
        class_id: dto.class_id,
        owner_id: userId,
        title: dto.title,
        description: dto.description,
        rubric: dto.rubric,
        due_date: dto.due_date,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getClassTasks(userId: string, classId: string) {
    await this.classesService.ensureMember(userId, classId);

    const { data, error } = await this.supabase.admin
      .from('tasks')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getTaskDetail(userId: string, taskId: string) {
    const { data: task, error } = await this.supabase.admin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.classesService.ensureMember(userId, task.class_id);

    const { data: avgData } = await this.supabase.admin
      .from('submissions')
      .select('score')
      .eq('task_id', taskId)
      .not('score', 'is', null);

    const scores = avgData || [];
    const average =
      scores.length > 0
        ? scores.reduce((sum, item) => sum + Number(item.score), 0) / scores.length
        : 0;

    return {
      ...task,
      average_score: Number(average.toFixed(2)),
    };
  }

  async deleteTask(userId: string, taskId: string) {
    const { data: task, error: taskError } = await this.supabase.admin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new BadRequestException('Task tidak ditemukan');
    }

    await this.classesService.ensureOwner(userId, task.class_id);

    const { error } = await this.supabase.admin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Task berhasil dihapus',
    };
  }
}