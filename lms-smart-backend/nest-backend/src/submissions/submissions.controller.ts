import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { SubmissionsService } from './submissions.service';
import { ReviewSubmissionDto } from './dto/submissions.dto';

@UseGuards(AuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post('task/:taskId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  submitAssignment(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.submissionsService.submitAssignment(req.user.id, taskId, file);
  }

  @Get('task/:taskId/me')
  getMySubmission(@Req() req: any, @Param('taskId') taskId: string) {
    return this.submissionsService.getMySubmission(req.user.id, taskId);
  }

  @Get('task/:taskId/me/result')
  async downloadMyResult(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Res() res: Response,
  ) {
    const result = await this.submissionsService.downloadMyResult(
      req.user.id,
      taskId,
    );

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.file_name}"`,
    );

    return res.send(result.content);
  }

  @Get('task/:taskId')
  getTaskSubmissions(@Req() req: any, @Param('taskId') taskId: string) {
    return this.submissionsService.getTaskSubmissions(req.user.id, taskId);
  }

  @Patch(':submissionId/review')
  reviewSubmission(
    @Req() req: any,
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.submissionsService.reviewSubmission(
      req.user.id,
      submissionId,
      dto.grade,
      dto.score,
      dto.feedback,
    );
  }

  @Get(':submissionId/file-url')
  getSignedFileUrl(@Req() req: any, @Param('submissionId') submissionId: string) {
    return this.submissionsService.getSignedFileUrl(req.user.id, submissionId);
  }
}