import {
  Injectable, Logger, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application) private repo: Repository<Application>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  // Postularse a una oferta (candidato)
  async apply(candidateId: string, jobId: string, coverLetter?: string): Promise<Application> {
    const existing = await this.repo.findOne({ where: { candidateId, jobId } });
    if (existing) throw new ConflictException('Ya te postulaste a esta oferta');

    const app = this.repo.create({ candidateId, jobId, coverLetter, status: 'pendiente' });
    const saved = await this.repo.save(app);

    // Cargar relaciones para notificar a la empresa
    const full = await this.repo.findOne({ where: { id: saved.id } });
    if (full) {
      const candidateName = [full.candidate.firstName, full.candidate.lastName].filter(Boolean).join(' ') || full.candidate.email;
      const companyId = full.job.companyId;
      const jobTitle  = full.job.title;
      const companyName = (full.job as any).company?.companyName || 'tu empresa';
      const companyEmail = (full.job as any).company?.email;

      this.logger.log(`Nueva postulación: candidato="${candidateName}" → job="${jobTitle}" → empresa companyId=${companyId}`);

      this.notificationsService.create(
        companyId,
        'new_application',
        'Nueva postulación recibida',
        `${candidateName} se postuló a ${jobTitle}`,
        { jobId, candidateId, jobTitle, candidateName },
      ).catch(err => this.logger.error(`Error notif empresa: ${err.message}`));

      if (companyEmail) {
        this.mailService.sendNewApplication(companyEmail, companyName, candidateName, jobTitle)
          .catch(err => this.logger.error(`Error mail empresa: ${err.message}`));
      }
    } else {
      this.logger.warn(`No se encontró la postulación id=${saved.id} para notificar`);
    }

    return saved;
  }

  // Mis postulaciones (candidato)
  async findByCandidate(candidateId: string): Promise<Application[]> {
    return this.repo.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });
  }

  // Postulaciones recibidas para una oferta (empresa)
  async findByJob(jobId: string, companyId: string): Promise<Application[]> {
    const apps = await this.repo.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
    });
    // Verificar que la oferta pertenece a la empresa
    if (apps.length && apps[0].job.companyId !== companyId) {
      throw new ForbiddenException('No tenés permiso');
    }
    return apps;
  }

  // Todas las postulaciones recibidas por la empresa
  async findByCompany(companyId: string): Promise<Application[]> {
    return this.repo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.job', 'job')
      .leftJoinAndSelect('app.candidate', 'candidate')
      .where('job.companyId = :companyId', { companyId })
      .orderBy('app.createdAt', 'DESC')
      .getMany();
  }

  // Cambiar estado de postulación (empresa)
  async updateStatus(
    id: string,
    companyId: string,
    status: ApplicationStatus,
    notes?: string,
  ): Promise<Application> {
    const app = await this.repo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Postulación no encontrada');
    if (app.job.companyId !== companyId) throw new ForbiddenException('No tenés permiso');
    app.status = status;
    if (notes !== undefined) app.companyNotes = notes;
    const saved = await this.repo.save(app);

    // Notificar al candidato del cambio de estado
    const statusLabel: Record<string, string> = {
      pendiente: 'Pendiente',
      revision: 'En revisión',
      entrevista: '¡Convocado a entrevista!',
      rechazado: 'No seleccionado',
      aceptado: '¡Aceptado!',
    };
    const label = statusLabel[status] || status;
    const candidateId = app.candidateId;
    const candidateName = [app.candidate.firstName, app.candidate.lastName].filter(Boolean).join(' ') || app.candidate.email;
    const jobTitle = app.job.title;
    const companyName = (app.job as any).company?.companyName || 'la empresa';
    const candidateEmail = app.candidate.email;

    this.logger.log(`Cambio de estado: job="${jobTitle}" candidato="${candidateName}" → ${status}`);

    this.notificationsService.create(
      candidateId,
      'status_change',
      `Postulación actualizada — ${label}`,
      `Tu postulación a ${jobTitle} en ${companyName} cambió a: ${label}`,
      { jobId: app.jobId, jobTitle, companyName, status },
    ).catch(err => this.logger.error(`Error notif candidato: ${err.message}`));

    this.mailService.sendStatusChange(candidateEmail, candidateName, jobTitle, companyName, status)
      .catch(err => this.logger.error(`Error mail candidato: ${err.message}`));

    return saved;
  }

  // Verificar si el candidato ya se postuló a una oferta
  async hasApplied(candidateId: string, jobId: string): Promise<boolean> {
    const app = await this.repo.findOne({ where: { candidateId, jobId } });
    return !!app;
  }
}
