// users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'candidate' | 'company';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar' })
  role: UserRole;

  // ── Candidato ──────────────────────────────────────────────
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ nullable: true })
  github: string;

  @Column({ nullable: true })
  portfolio: string;

  @Column({ nullable: true, type: 'float' })
  salary: number;

  @Column({ nullable: true })
  availability: string;

  @Column({ nullable: true })
  modality: string;

  // Arrays guardados como JSON
  @Column({ nullable: true, type: 'jsonb' })
  skills: string[];

  @Column({ nullable: true, type: 'jsonb' })
  softSkills: string[];

  @Column({ nullable: true, type: 'jsonb' })
  languages: { name: string; level: string }[];

  @Column({ nullable: true, type: 'jsonb' })
  experience: {
    title: string; company: string;
    startDate: string; endDate?: string;
    current: boolean; description?: string;
  }[];

  @Column({ nullable: true, type: 'jsonb' })
  education: {
    degree: string; institution: string;
    startYear: number; endYear?: number; status: string;
  }[];

  // ── Empresa ────────────────────────────────────────────────
  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  companySize: string;

  @Column({ nullable: true })
  website: string;

  // ── CV ─────────────────────────────────────────────────────
  @Column({ nullable: true })
  cvFileName: string;

  @Column({ nullable: true })
  cvUrl: string;

  @Column({ nullable: true, type: 'jsonb' })
  cvAnalysis: {
    skills: string[];
    summary: string;
    analyzedAt: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}