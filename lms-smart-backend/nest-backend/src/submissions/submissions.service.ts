import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassesService } from '../classes/classes.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import type {
  TextItem,
  TextMarkedContent,
} from 'pdfjs-dist/types/src/display/api';

@Injectable()
export class SubmissionsService {
  constructor(
    private supabase: SupabaseService,
    private classesService: ClassesService,
    private config: ConfigService,
  ) {}

  async submitAssignment(userId: string, taskId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File wajib diupload');

    const ext = path.extname(file.originalname).toLowerCase();

    if (!['.pdf', '.docx'].includes(ext)) {
      throw new BadRequestException('File harus PDF atau DOCX');
    }

    const { data: task, error: taskError } = await this.supabase.admin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw new BadRequestException('Task tidak ditemukan');

    await this.classesService.ensureMember(userId, task.class_id);

    const filePath = `${taskId}/${userId}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await this.supabase.admin.storage
      .from('submissions')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw new BadRequestException(uploadError.message);

    const extractedText = await this.extractText(file, ext);

    const grading = await this.callAiGrader(extractedText, task.rubric);

    const { data, error } = await this.supabase.admin
      .from('submissions')
      .upsert(
        {
          task_id: taskId,
          user_id: userId,
          file_path: filePath,
          file_name: file.originalname,
          extracted_text: extractedText,
          grade: grading.grade,
          score: grading.score,
          max_score: grading.max_score,
          criteria_scores: grading.criteria_scores,
          feedback: grading.feedback,
          status: 'graded',
        },
        {
          onConflict: 'task_id,user_id',
        },
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Submission berhasil dikumpulkan dan dinilai otomatis',
      submission: data,
    };
  }

  async extractText(
    file: Express.Multer.File,
    ext: string,
  ): Promise<string> {
    if (ext === '.pdf') {
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(file.buffer),
      }).promise;

      let text = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        text +=
          content.items
            .filter(
              (item): item is TextItem => 'str' in item,
            )
            .map((item) => item.str)
            .join(' ');
      }

      return text.trim();
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({
        buffer: file.buffer,
      });

      return result.value;
    }

    throw new BadRequestException(
      'Format file tidak didukung',
    );
  }

  async callAiGrader(text: string, rubric: string) {
    const aiUrl = this.config.get<string>('AI_GRADER_URL');

    try {
      const response = await axios.post(`${aiUrl}/grade`, {
        text,
        rubric,
        model: 'gpt-4.1-mini',
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException('Gagal melakukan AI grading');
    }
  }

  async getMySubmission(userId: string, taskId: string) {
    const { data, error } = await this.supabase.admin
      .from('submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new BadRequestException('Submission tidak ditemukan');

    return data;
  }

  async downloadMyResult(userId: string, taskId: string) {
    const submission = await this.getMySubmission(userId, taskId);

    const resultText = `
LMS Smart - Hasil Penilaian

File: ${submission.file_name}
Grade: ${submission.grade}
Score: ${submission.score}/${submission.max_score}

Feedback:
${submission.feedback}

Criteria Scores:
${JSON.stringify(submission.criteria_scores, null, 2)}
`;

    return {
      file_name: `grading-result-${taskId}.txt`,
      content: resultText,
    };
  }

  async getTaskSubmissions(userId: string, taskId: string) {
    const { data: task } = await this.supabase.admin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) throw new BadRequestException('Task tidak ditemukan');

    await this.classesService.ensureOwner(userId, task.class_id);

    const { data, error } = await this.supabase.admin
      .from('submissions')
      .select(
        `
        *,
        profiles(id, name, email)
      `,
      )
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async reviewSubmission(
    ownerId: string,
    submissionId: string,
    grade: string,
    score: number,
    feedback?: string,
  ) {
    const { data: submission } = await this.supabase.admin
      .from('submissions')
      .select('*, tasks(*)')
      .eq('id', submissionId)
      .single();

    if (!submission) throw new BadRequestException('Submission tidak ditemukan');

    await this.classesService.ensureOwner(ownerId, submission.tasks.class_id);

    const { data, error } = await this.supabase.admin
      .from('submissions')
      .update({
        grade,
        score,
        feedback,
        status: 'reviewed',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Nilai berhasil direview owner',
      submission: data,
    };
  }

  async getSignedFileUrl(userId: string, submissionId: string) {
    const { data: submission } = await this.supabase.admin
      .from('submissions')
      .select('*, tasks(*)')
      .eq('id', submissionId)
      .single();

    if (!submission) throw new BadRequestException('Submission tidak ditemukan');

    const isOwner = await this.supabase.admin
      .from('class_members')
      .select('*')
      .eq('class_id', submission.tasks.class_id)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .maybeSingle();

    if (submission.user_id !== userId && !isOwner.data) {
      throw new ForbiddenException('Tidak boleh mengakses file ini');
    }

    const { data, error } = await this.supabase.admin.storage
      .from('submissions')
      .createSignedUrl(submission.file_path, 60 * 5);

    if (error) throw new BadRequestException(error.message);

    return data;
  }
}