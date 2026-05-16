import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    if (!user.emailVerified) {
      throw new UnauthorizedException('Debés verificar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.');
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
      // Crear usuario con emailVerified = false
      const newUser = await this.usersService.create({
        email: dto.email,
        password: dto.password,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
      });

      // Generar token seguro y guardarlo en la entidad
      const token  = crypto.randomBytes(48).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hs

      await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ verificationToken: token, verificationTokenExpiry: expiry })
        .where('id = :id', { id: newUser.id })
        .execute();

      // Enviar mail (no bloqueante — si falla el mail no rompe el registro)
      try {
        await this.mailService.sendVerificationEmail(newUser.email, token);
      } catch (mailErr) {
        console.error('⚠️  Error enviando mail de verificación:', mailErr);
      }

      return {
        message: 'Cuenta creada. Revisá tu email para verificar tu cuenta antes de ingresar.',
        email: newUser.email,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token) throw new BadRequestException('Token inválido');

    // Buscar usuario con ese token (campos select:false → query manual)
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.verificationToken')
      .addSelect('user.verificationTokenExpiry')
      .where('user.verificationToken = :token', { token })
      .getOne();

    if (!user) throw new NotFoundException('El enlace de verificación no es válido o ya fue usado.');

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw new BadRequestException('El enlace de verificación expiró. Volvé a registrarte para obtener uno nuevo.');
    }

    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ emailVerified: true, verificationToken: null, verificationTokenExpiry: null })
      .where('id = :id', { id: user.id })
      .execute();

    return { message: '¡Email verificado! Ya podés iniciar sesión.' };
  }

  async getMe(userId: string) {
    return this.usersService.findById(userId);
  }
}