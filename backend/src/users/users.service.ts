import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, SafeUser, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  // ─── Seed automático al arrancar ─────────────────────────────────
  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      console.log('🌱 Creando usuarios de prueba...');
      await this.seedUsers();
      console.log('✅ Usuarios de prueba creados');
    }
  }

  private async seedUsers() {
    const password = await bcrypt.hash('Test1234!', 10);

    await this.repo.save([
      {
        email: 'candidate@test.com',
        passwordHash: password,
        role: 'candidate' as UserRole,
        firstName: 'Juan',
        lastName: 'Pérez',
        isActive: true,
      },
      {
        email: 'company@test.com',
        passwordHash: password,
        role: 'company' as UserRole,
        companyName: 'Acme S.A.',
        isActive: true,
      },
      {
        email: 'admin@test.com',
        passwordHash: password,
        role: 'admin' as UserRole,
        firstName: 'Admin',
        lastName: 'TalentAI',
        isActive: true,
      },
    ]);
  }

  // ─── Buscar por email (incluye hash — solo uso interno) ──────────
  async findByEmail(email: string): Promise<User | undefined> {
    return this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  // ─── Buscar por id ───────────────────────────────────────────────
  async findById(id: string): Promise<SafeUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(user);
  }

  // ─── Crear usuario ───────────────────────────────────────────────
  async create(data: {
    email: string;
    password: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): Promise<SafeUser> {
    const exists = await this.findByEmail(data.email);
    if (exists) {
      throw new ConflictException('Ya existe una cuenta con ese correo electrónico');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUser = this.repo.create({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
      isActive: true,
    });

    const saved = await this.repo.save(newUser);
    return this.sanitize(saved);
  }

  // ─── Listar todos (admin) ────────────────────────────────────────
  async findAll(): Promise<SafeUser[]> {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    return users.map(u => this.sanitize(u));
  }

  // ─── Quitar passwordHash antes de enviar al cliente ──────────────
  sanitize(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe as SafeUser;
  }
}
