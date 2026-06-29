import { IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class ReviewSubmissionDto {
  @IsNotEmpty()
  grade!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  feedback?: string;
}