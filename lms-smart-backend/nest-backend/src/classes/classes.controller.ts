import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto, JoinClassDto } from './dto/classes.dto';

@UseGuards(AuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Post()
  createClass(@Req() req: any, @Body() dto: CreateClassDto) {
    return this.classesService.createClass(req.user.id, dto);
  }

  @Post('join')
  joinClass(@Req() req: any, @Body() dto: JoinClassDto) {
    return this.classesService.joinClass(req.user.id, dto);
  }

  @Get('my')
  getMyClasses(@Req() req: any) {
    return this.classesService.getMyClasses(req.user.id);
  }

  @Get(':id')
  getClassDetail(@Req() req: any, @Param('id') id: string) {
    return this.classesService.getClassDetail(req.user.id, id);
  }

  @Delete(':id')
  deleteClass(@Req() req: any, @Param('id') id: string) {
    return this.classesService.deleteClass(req.user.id, id);
  }
}