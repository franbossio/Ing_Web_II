import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private repo: Repository<Job>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Crear oferta (solo empresa)
  async create(companyId: string, body: Partial<Job>): Promise<Job> {
    const job = this.repo.create({ ...body, companyId, active: true });
    const saved = await this.repo.save(job);

    // Notificar a todos los candidatos activos
    const candidates = await this.userRepo.find({ where: { role: 'candidate', isActive: true } });
    const company = await this.userRepo.findOne({ where: { id: companyId } });
    const companyName = company?.companyName || 'Una empresa';
    const jobTitle = saved.title;
    for (const candidate of candidates) {
      this.notificationsService.create(
        candidate.id,
        'new_job',
        'Nueva oferta disponible',
        `${companyName} publicó: ${jobTitle}`,
        { jobId: saved.id, jobTitle, companyName },
      ).catch(() => {});
    }

    return saved;
  }

  // Listar todas las ofertas activas (para candidatos)
  async findAll(): Promise<Job[]> {
    return this.repo.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Listar ofertas de una empresa
  async findByCompany(companyId: string): Promise<Job[]> {
    return this.repo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  // Obtener una oferta por ID
  async findOne(id: string): Promise<Job> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Oferta no encontrada');
    return job;
  }

  // Actualizar oferta (solo la empresa dueña)
  async update(id: string, companyId: string, body: Partial<Job>): Promise<Job> {
    const job = await this.findOne(id);
    if (job.companyId !== companyId) throw new ForbiddenException('No tenés permiso');
    Object.assign(job, body);
    return this.repo.save(job);
  }

  // Desactivar oferta (soft delete)
  async deactivate(id: string, companyId: string): Promise<void> {
    const job = await this.findOne(id);
    if (job.companyId !== companyId) throw new ForbiddenException('No tenés permiso');
    job.active = false;
    await this.repo.save(job);
  }

  // Eliminar oferta definitivamente
  async remove(id: string, companyId: string): Promise<{ message: string }> {
    const job = await this.findOne(id);
    if (job.companyId !== companyId) throw new ForbiddenException('No tenés permiso');
    await this.repo.delete(id);
    return { message: 'Oferta eliminada correctamente' };
  }

  // ── Admin ────────────────────────────────────────────────
  async adminFindAll(): Promise<Job[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async adminRemove(id: string): Promise<{ message: string }> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Oferta no encontrada');
    await this.repo.delete(id);
    return { message: 'Oferta eliminada correctamente' };
  }
}