import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/tasks.dto';

@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(req.user.id, dto);
  }

  @Get('class/:classId')
  getClassTasks(@Req() req: any, @Param('classId') classId: string) {
    return this.tasksService.getClassTasks(req.user.id, classId);
  }

  @Get(':id')
  getTaskDetail(@Req() req: any, @Param('id') id: string) {
    return this.tasksService.getTaskDetail(req.user.id, id);
  }

  @Delete(':id')
  deleteTask(@Req() req: any, @Param('id') id: string) {
    return this.tasksService.deleteTask(req.user.id, id);
  }
}