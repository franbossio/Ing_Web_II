import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

interface StartConversationBody {
  otherUserId: string;
  jobId?: string;
}

interface SendMessageBody {
  content: string;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // POST /api/messages/conversations — obtiene o crea una conversación con otro usuario
  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  startConversation(@Request() req, @Body() body: StartConversationBody) {
    return this.messagesService.getOrCreateConversation(
      req.user.id,
      req.user.role,
      body.otherUserId,
      body.jobId,
    );
  }

  // GET /api/messages/conversations — lista mis conversaciones
  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  listConversations(@Request() req) {
    return this.messagesService.listConversations(req.user.id, req.user.role);
  }

  // GET /api/messages/conversations/:id/messages — historial + marca como leídos
  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  getMessages(@Param('id') id: string, @Request() req) {
    return this.messagesService.getMessages(id, req.user.id);
  }

  // POST /api/messages/conversations/:id/messages — enviar un mensaje
  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  sendMessage(@Param('id') id: string, @Body() body: SendMessageBody, @Request() req) {
    return this.messagesService.sendMessage(id, req.user.id, body.content);
  }

  // GET /api/messages/unread-count — total de mensajes no leídos (para badge del sidebar)
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Request() req) {
    const count = await this.messagesService.getUnreadCount(req.user.id, req.user.role);
    return { count };
  }
}
