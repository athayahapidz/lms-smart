import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  class_id!: string;

  @IsNotEmpty()
  title!: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty()
  rubric!: string;

  @IsOptional()
  due_date?: string;
}