import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotifType } from './notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotifType,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    try {
      const notif = this.repo.create({ userId, type, title, message, metadata });
      const saved = await this.repo.save(notif);
      this.logger.log(`Notificación creada [${type}] para userId=${userId}: "${title}"`);
      return saved;
    } catch (err) {
      this.logger.error(`Error al crear notificación [${type}] para userId=${userId}: ${err.message}`);
      throw err;
    }
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, read: false }, { read: true });
  }
}
