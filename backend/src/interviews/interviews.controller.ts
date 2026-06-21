// src/interviews/interviews.controller.ts
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InterviewsService } from './interviews.service';
import { UsersService } from '../users/users.service';

interface StartInterviewBody {
  jobId?: string;
}

interface EvaluateInterviewBody {
  jobId?: string;
  qa: { question: string; answer: string }[];
}

@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly usersService: UsersService,
  ) {}

  // POST /api/interviews/start — genera preguntas para una oferta (o genericas)
  @Post('start')
  @UseGuards(JwtAuthGuard)
  async start(@Request() req, @Body() body: StartInterviewBody) {
    const user = await this.usersService.findById(req.user.id);
    return this.interviewsService.generateQuestions(
      body.jobId || null,
      user.skills || [],
      user.jobTitle || null,
    );
  }

  // POST /api/interviews/evaluate — evalua las respuestas dadas por el candidato
  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluate(@Body() body: EvaluateInterviewBody) {
    return this.interviewsService.evaluateAnswers(body.jobId || null, body.qa || []);
  }
}
