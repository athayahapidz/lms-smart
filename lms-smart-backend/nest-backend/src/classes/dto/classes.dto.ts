import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description?: string;
}

export class JoinClassDto {
  @IsNotEmpty()
  code: string;
}