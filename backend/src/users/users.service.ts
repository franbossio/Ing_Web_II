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
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

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

  async findByEmail(email: string): Promise<User | undefined> {
    // Traer passwordHash explícitamente (tiene select: false en la entity)
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(user);
  }

  // ─── Actualizar perfil ───────────────────────────────────────────
  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Iteramos explícitamente para que "" y null también se guarden.
    // Object.assign descarta undefined pero sí pisa con "" y null.
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        (user as any)[key] = value;
      }
    }
    user.updatedAt = new Date();

    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  async create(data: {
    email: string;
    password: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): Promise<SafeUser> {
    const exists = await this.findByEmail(data.email);
    if (exists) throw new ConflictException('Ya existe una cuenta con ese correo electrónico');

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

  async findAll(): Promise<SafeUser[]> {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    return users.map(u => this.sanitize(u));
  }

  sanitize(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe as SafeUser;
  }
}