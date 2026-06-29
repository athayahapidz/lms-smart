import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [SupabaseModule, ClassesModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}