import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Job  } from '../jobs/job.entity';

export type ApplicationStatus = 'pendiente' | 'revision' | 'entrevista' | 'rechazado' | 'aceptado';

@Entity('applications')
@Unique(['candidateId', 'jobId']) // un candidato solo puede postularse una vez por oferta
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => Job, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'job_id' })
  jobId: string;

  @Column({ type: 'varchar', default: 'pendiente' })
  status: ApplicationStatus;

  @Column({ name: 'cover_letter', nullable: true, type: 'text' })
  coverLetter?: string;

  @Column({ name: 'company_notes', nullable: true, type: 'text' })
  companyNotes?: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
