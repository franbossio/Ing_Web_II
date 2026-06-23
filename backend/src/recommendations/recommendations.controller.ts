// src/recommendations/recommendations.controller.ts
import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';
import { UsersService } from '../users/users.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recService:   RecommendationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /api/recommendations
   * El candidato llama a esto al abrir el dashboard.
   * El backend busca sus skills, trae las ofertas y consulta Make → ChatGPT.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Request() req) {
    // Traer datos frescos del candidato desde la DB
    const user = await this.usersService.findById(req.user.id);
    return this.recService.getRecommendations(user);
  }
}