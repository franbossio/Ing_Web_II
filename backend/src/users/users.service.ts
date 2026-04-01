// users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepo.findOneBy({ email });
  }

  async findById(id: number) {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    // No devolver la contraseña
    const { password, ...result } = user;
    return result;
  }

  async create(data: Partial<User>) {
    const exists = await this.findByEmail(data.email);
    if (exists) throw new ConflictException('El email ya está registrado');
    const hashed = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({ ...data, password: hashed });
    return this.usersRepo.save(user);
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Mergear solo los campos enviados
    Object.assign(user, dto);
    const saved = await this.usersRepo.save(user);

    // Devolver sin contraseña
    const { password, ...result } = saved;
    return result;
  }
}