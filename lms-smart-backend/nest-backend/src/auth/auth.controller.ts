import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.me(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: any,
    @Headers('authorization') authorization: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const token = authorization?.replace('Bearer ', '');
    return this.authService.updateProfile(req.user.id, token, dto);
  }
}