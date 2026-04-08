import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'candidate' | 'company' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  // select: false → no se incluye en queries normales (seguridad)
  // Usar repo.findOne({ select: [..., 'passwordHash'] }) cuando se necesite
  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', default: 'candidate' })
  role: UserRole;

  @Column({ name: 'first_name',   nullable: true, length: 100 }) firstName?: string;
  @Column({ name: 'last_name',    nullable: true, length: 100 }) lastName?: string;
  @Column({ nullable: true, length: 30 })                        phone?: string;
  @Column({ name: 'job_title',    nullable: true, length: 150 }) jobTitle?: string;
  @Column({ nullable: true, length: 150 })                       location?: string;
  @Column({ nullable: true, type: 'text' })                      bio?: string;
  @Column({ nullable: true, length: 255 })                       linkedin?: string;
  @Column({ nullable: true, length: 255 })                       github?: string;
  @Column({ nullable: true, length: 255 })                       portfolio?: string;
  @Column({ nullable: true, type: 'int' })                       salary?: number;
  @Column({ nullable: true, length: 100 })                       availability?: string;
  @Column({ nullable: true, length: 50 })                        modality?: string;
  @Column({ nullable: true, type: 'jsonb', default: [] })        skills?: string[];
  @Column({ name: 'soft_skills', nullable: true, type: 'jsonb', default: [] }) softSkills?: string[];
  @Column({ nullable: true, type: 'jsonb', default: [] })        languages?: any[];
  @Column({ nullable: true, type: 'jsonb', default: [] })        experience?: any[];
  @Column({ nullable: true, type: 'jsonb', default: [] })        education?: any[];
  @Column({ name: 'company_name', nullable: true, length: 200 }) companyName?: string;
  @Column({ nullable: true, length: 100 })                       industry?: string;
  @Column({ name: 'company_size', nullable: true, length: 50 })  companySize?: string;
  @Column({ nullable: true, length: 255 })                       website?: string;
  @Column({ name: 'cv_file_name', nullable: true, length: 255 }) cvFileName?: string;
  @Column({ name: 'cv_url',       nullable: true, type: 'text'  }) cvUrl?: string;
  @Column({ name: 'cv_analysis',  nullable: true, type: 'text' }) cvAnalysis?: string;
  @Column({ name: 'is_active', default: true })                  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash'>;
