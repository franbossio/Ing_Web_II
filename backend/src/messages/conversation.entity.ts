import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Job } from '../jobs/job.entity';

@Entity('conversations')
@Unique(['candidateId', 'companyId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: User;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Job, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_id' })
  job?: Job;

  @Column({ name: 'job_id', nullable: true })
  jobId?: string;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @Column({ name: 'last_message_preview', nullable: true, length: 200 })
  lastMessagePreview?: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
