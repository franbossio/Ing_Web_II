import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ nullable: true, length: 100 })
  area?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @Column({ type: 'jsonb', default: [] })
  skills: string[];

  @Column({ name: 'soft_skills', type: 'jsonb', default: [] })
  softSkills: string[];

  @Column({ nullable: true, length: 50 })
  experience?: string;

  @Column({ nullable: true, length: 50 })
  modality?: string;

  @Column({ nullable: true, length: 50 })
  contract?: string;

  @Column({ nullable: true, length: 150 })
  location?: string;

  @Column({ nullable: true, length: 10 })
  currency?: string;

  @Column({ name: 'salary_min', nullable: true, type: 'int' })
  salaryMin?: number;

  @Column({ name: 'salary_max', nullable: true, type: 'int' })
  salaryMax?: number;

  @Column({ nullable: true, type: 'date' })
  deadline?: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  views: number;

  // Empresa que publica la oferta
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: User;

  @Column({ name: 'company_id' })
  companyId: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
