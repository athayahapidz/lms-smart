import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [SupabaseModule, ClassesModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}