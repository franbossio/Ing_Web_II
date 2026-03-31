import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JWT_SECRET } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ─── Login ───────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Duración del token: 7 días si "recordarme", si no 8 horas
    const expiresIn = dto.remember ? '7d' : '8h';

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, { expiresIn, secret: JWT_SECRET });

    const safeUser = this.usersService.sanitize(user);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: dto.remember ? 604800 : 28800,
      user: safeUser,
    };
  }

  // ─── Register ────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Validaciones extra según rol
    if (dto.role === 'candidate' && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('Nombre y apellido son requeridos para candidatos');
    }
    if (dto.role === 'company' && !dto.companyName) {
      throw new BadRequestException('El nombre de la empresa es requerido');
    }

    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      role: dto.role,
      firstName: dto.firstName,
      lastName: dto.lastName,
      companyName: dto.companyName,
    });

    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    const token = this.jwtService.sign(payload, { expiresIn: '8h', secret: JWT_SECRET });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 28800,
      user: newUser,
    };
  }

  // ─── Me (perfil del usuario autenticado) ─────────────────────────
  async getMe(userId: string) {
    return this.usersService.findById(userId);
  }
}
