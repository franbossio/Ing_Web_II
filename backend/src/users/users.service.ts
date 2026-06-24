import {
  Injectable, ConflictException, NotFoundException,
  BadRequestException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, SafeUser, UserRole } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Job } from '../jobs/job.entity';
import { Application } from '../applications/application.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      console.log('🌱 Creando usuarios de prueba...');
      await this.seedUsers();
      console.log('✅ Usuarios de prueba creados');
    } else {
      // Marcar usuarios existentes sin verificación como verificados (retrocompatibilidad)
      await this.repo
        .createQueryBuilder()
        .update()
        .set({ emailVerified: true })
        .where('email_verified = false')
        .execute();
      console.log('✅ Usuarios existentes marcados como verificados');
    }
  }

  private async seedUsers() {
    const password = await bcrypt.hash('Test1234!', 10);
    await this.repo.save([
      {
        email: 'candidate@test.com', passwordHash: password,
        role: 'candidate' as UserRole, firstName: 'Juan', lastName: 'Pérez',
        skills: [], softSkills: [], languages: [], experience: [], education: [],
        isActive: true, emailVerified: true,
      },
      {
        email: 'company@test.com', passwordHash: password,
        role: 'company' as UserRole, companyName: 'Acme S.A.',
        isActive: true, emailVerified: true,
      },
      {
        email: 'admin@test.com', passwordHash: password,
        role: 'admin' as UserRole, firstName: 'Admin', lastName: 'TalentAI',
        isActive: true, emailVerified: true,
      },
    ]);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    console.log(`🔍 findById ${id} — cvScore en DB: ${user.cvScore}, breakdown: ${JSON.stringify(user.cvScoreBreakdown)}`);
    return this.sanitize(user);
  }

  async updateRecommendationsCache(id: string, cache: any[]): Promise<void> {
    await this.repo.update(id, { recommendationsCache: cache, recommendationsCacheAt: new Date() });
  }

  async update(id: string, body: any): Promise<SafeUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const allowed = [
      'firstName','lastName','phone','jobTitle','location','bio',
      'linkedin','github','portfolio','salary','availability','modality',
      'skills','softSkills','experience','education','languages',
      'companyName','industry','companySize','website',
      'photo','cvFileName','cvUrl','cvAnalysis','cvScore','cvScoreBreakdown','isActive',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        (user as any)[key] = body[key];
      }
    }

    console.log(`📝 Actualizando usuario ${id}:`);
    console.log(`   experience: ${JSON.stringify(body.experience)?.substring(0,80)}`);
    console.log(`   education: ${JSON.stringify(body.education)?.substring(0,80)}`);
    console.log(`   skills: ${JSON.stringify(body.skills)?.substring(0,80)}`);
    console.log(`   cvScore recibido: ${body.cvScore} (tipo ${typeof body.cvScore})`);
    console.log(`   cvScoreBreakdown recibido: ${JSON.stringify(body.cvScoreBreakdown)}`);

    const saved = await this.repo.save(user);
    console.log(`   ✅ Guardado — cvScore en DB: ${saved.cvScore}, breakdown: ${JSON.stringify(saved.cvScoreBreakdown)}`);
    return this.sanitize(saved);
  }

  async create(data: {
    email: string; password: string; role: UserRole;
    firstName?: string; lastName?: string; companyName?: string;
  }): Promise<SafeUser> {
    const exists = await this.findByEmail(data.email);
    if (exists) throw new ConflictException('Ya existe una cuenta con ese correo electrónico');
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUser = this.repo.create({
      email: data.email.toLowerCase().trim(), passwordHash, role: data.role,
      firstName: data.firstName, lastName: data.lastName, companyName: data.companyName,
      skills: [], softSkills: [], languages: [], experience: [], education: [],
      isActive: true,
    });
    const saved = await this.repo.save(newUser);
    return this.sanitize(saved);
  }

  async findCandidates(): Promise<SafeUser[]> {
    const users = await this.repo.find({
      where: { role: 'candidate' as UserRole, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return users.map(u => this.sanitize(u));
  }

  /** Perfil público de un candidato: solo datos no sensibles, pensado para compartir. */
  async findPublicProfile(id: string) {
    const user = await this.repo.findOne({
      where: { id, role: 'candidate' as UserRole, isActive: true },
    });
    if (!user) throw new NotFoundException('Perfil no encontrado');

    return {
      id:         user.id,
      firstName:  user.firstName,
      lastName:   user.lastName,
      jobTitle:   user.jobTitle,
      location:   user.location,
      bio:        user.bio,
      photo:      user.photo,
      linkedin:   user.linkedin,
      github:     user.github,
      portfolio:  user.portfolio,
      skills:     user.skills,
      softSkills: user.softSkills,
      languages:  user.languages,
      experience: user.experience,
      education:  user.education,
    };
  }

  // Registrar una vista de perfil (una empresa abrió el perfil de un candidato)
  async incrementProfileViews(id: string): Promise<void> {
    await this.repo.increment({ id }, 'profileViews', 1);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    return users.map(u => this.sanitize(u));
  }

  // ── Cambiar contraseña ──────────────────────────────────────────────
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('La contraseña actual es incorrecta');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }

  // ── Eliminar cuenta ─────────────────────────────────────────────────
  async deleteById(id: string): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.repo.delete(id);
    return { message: 'Cuenta eliminada correctamente' };
  }

  sanitize(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe as SafeUser;
  }

  // ── Admin ───────────────────────────────────────────────
  async adminGetStats() {
    const [candidates, companies, admins, totalJobs, totalApps] = await Promise.all([
      this.repo.count({ where: { role: 'candidate' as UserRole } }),
      this.repo.count({ where: { role: 'company'   as UserRole } }),
      this.repo.count({ where: { role: 'admin'     as UserRole } }),
      this.jobRepo.count(),
      this.appRepo.count(),
    ]);
    return { candidates, companies, admins, totalJobs, totalApps, total: candidates + companies + admins };
  }

  async adminToggleActive(id: string): Promise<SafeUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.isActive = !user.isActive;
    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  async adminDeleteUser(id: string): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.repo.delete(id);
    return { message: 'Usuario eliminado correctamente' };
  }
}