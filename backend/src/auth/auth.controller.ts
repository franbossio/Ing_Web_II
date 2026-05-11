import {
  Controller, Post, Get,
  Body, UseGuards, Request,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApplicationsService } from '../applications/applications.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private applicationsService: ApplicationsService,
  ) {}

  /** POST /api/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** POST /api/auth/register */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * GET /api/auth/me
   * Devuelve el usuario + las últimas 5 postulaciones para el dashboard
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    const user = req.user;

    // Solo candidatos necesitan recentApplications
    if (user.role !== 'candidate') return user;

    try {
      const apps = await this.applicationsService.findByCandidate(user.id);
      const recentApplications = apps.slice(0, 5).map(a => ({
        jobTitle: a.job?.title || '—',
        company:  a.job?.company?.companyName || 'Empresa',
        icon:     '🏢',
        status:   a.status,
        date:     new Date(a.createdAt).toLocaleDateString('es-AR'),
      }));
      return { ...user, recentApplications };
    } catch {
      return user;
    }
  }
}