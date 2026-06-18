import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';

function sanitize(str: string, maxLen = 4000): string {
  return (str || '').trim().slice(0, maxLen);
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation) private conversationsRepo: Repository<Conversation>,
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getOrCreateConversation(
    currentUserId: string,
    currentUserRole: string,
    otherUserId: string,
    jobId?: string,
  ): Promise<Conversation> {
    if (currentUserRole !== 'candidate' && currentUserRole !== 'company') {
      throw new BadRequestException('Solo candidatos y empresas pueden iniciar conversaciones');
    }
    if (currentUserId === otherUserId) {
      throw new BadRequestException('No podés iniciar una conversación con vos mismo');
    }

    const otherUser = await this.usersRepo.findOne({ where: { id: otherUserId } });
    if (!otherUser) throw new NotFoundException('Usuario no encontrado');

    const expectedOtherRole = currentUserRole === 'candidate' ? 'company' : 'candidate';
    if (otherUser.role !== expectedOtherRole) {
      throw new BadRequestException('El destinatario debe ser ' + (expectedOtherRole === 'company' ? 'una empresa' : 'un candidato'));
    }

    const candidateId = currentUserRole === 'candidate' ? currentUserId : otherUserId;
    const companyId   = currentUserRole === 'company'   ? currentUserId : otherUserId;

    let conversation = await this.conversationsRepo.findOne({ where: { candidateId, companyId } });
    if (!conversation) {
      conversation = this.conversationsRepo.create({ candidateId, companyId, jobId: jobId || undefined });
      conversation = await this.conversationsRepo.save(conversation);
    } else if (jobId && !conversation.jobId) {
      conversation.jobId = jobId;
      conversation = await this.conversationsRepo.save(conversation);
    }

    return conversation;
  }

  private async assertParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOne({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.candidateId !== userId && conversation.companyId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta conversación');
    }
    return conversation;
  }

  async listConversations(userId: string, role: string) {
    const where = role === 'company' ? { companyId: userId } : { candidateId: userId };
    const conversations = await this.conversationsRepo.find({
      where,
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    const result = [];
    for (const conv of conversations) {
      const unreadCount = await this.messagesRepo
        .createQueryBuilder('m')
        .where('m.conversationId = :id', { id: conv.id })
        .andWhere('m.isRead = false')
        .andWhere('m.senderId != :userId', { userId })
        .getCount();

      result.push({
        id: conv.id,
        otherUser: role === 'company' ? conv.candidate : conv.company,
        job: conv.job || null,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount,
      });
    }

    return result;
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.assertParticipant(conversationId, userId);

    const messages = await this.messagesRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    await this.messagesRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :id', { id: conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();

    return {
      conversation: {
        id: conversation.id,
        candidate: conversation.candidate,
        company: conversation.company,
        job: conversation.job || null,
      },
      messages,
    };
  }

  async sendMessage(conversationId: string, userId: string, content: string): Promise<Message> {
    const conversation = await this.assertParticipant(conversationId, userId);

    const clean = sanitize(content);
    if (!clean) throw new BadRequestException('El mensaje no puede estar vacío');

    const message = this.messagesRepo.create({
      conversationId,
      senderId: userId,
      content: clean,
    });
    const saved = await this.messagesRepo.save(message);

    conversation.lastMessageAt = saved.createdAt;
    conversation.lastMessagePreview = clean.slice(0, 200);
    await this.conversationsRepo.save(conversation);

    return saved;
  }

  async getUnreadCount(userId: string, role: string): Promise<number> {
    const column = role === 'company' ? 'companyId' : 'candidateId';
    return this.messagesRepo
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .where(`c.${column} = :userId`, { userId })
      .andWhere('m.isRead = false')
      .andWhere('m.senderId != :userId', { userId })
      .getCount();
  }
}
