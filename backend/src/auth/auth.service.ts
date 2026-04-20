import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // findByEmail trae passwordHash explícitamente (select: false en entity)
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // El campo en la entity es passwordHash (columna: password_hash)
    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const expiresIn = dto.remember ? '7d' : '8h';
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, { expiresIn });

    const safeUser = this.usersService.sanitize(user);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: dto.remember ? 604800 : 28800,
      user: safeUser,
    };
  }

  async register(dto: RegisterDto) {
    if (dto.role === 'candidate' && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('Nombre y apellido son requeridos para candidatos');
    }
    if (dto.role === 'company' && !dto.companyName) {
      throw new BadRequestException('El nombre de la empresa es requerido');
    }

    try {
      const newUser = await this.usersService.create({
        email: dto.email,
        password: dto.password,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
      });

      const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
      const token = this.jwtService.sign(payload, { expiresIn: '8h' });

      return {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 28800,
        user: newUser,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async getMe(userId: string) {
    return this.usersService.findById(userId);
  }
}