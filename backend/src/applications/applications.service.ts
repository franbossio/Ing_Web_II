import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application) private repo: Repository<Application>,
  ) {}

  // Postularse a una oferta (candidato)
  async apply(candidateId: string, jobId: string, coverLetter?: string): Promise<Application> {
    const existing = await this.repo.findOne({ where: { candidateId, jobId } });
    if (existing) throw new ConflictException('Ya te postulaste a esta oferta');

    const app = this.repo.create({
      candidateId,
      jobId,
      coverLetter,
      status: 'pendiente',
    });
    return this.repo.save(app);
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
    return this.repo.save(app);
  }

  // Verificar si el candidato ya se postuló a una oferta
  async hasApplied(candidateId: string, jobId: string): Promise<boolean> {
    const app = await this.repo.findOne({ where: { candidateId, jobId } });
    return !!app;
  }
}
