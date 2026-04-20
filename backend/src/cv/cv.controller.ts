// src/cv/cv.controller.ts
import {
  Controller, Post, Body, UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CvService }    from './cv.service';
import { UsersService } from '../users/users.service';

interface AnalyzeCvBody {
  base64Pdf: string;  // PDF en base64 puro (sin prefijo data:...)
  fileName:  string;
}

@Controller('cv')
export class CvController {
  constructor(
    private readonly cvService:    CvService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /api/cv/analyze-preview
   * Analiza el CV con Gemini y devuelve los datos extraídos SIN guardar.
   * Útil para mostrar un preview al usuario antes de confirmar.
   */
  @Post('analyze-preview')
  @UseGuards(JwtAuthGuard)
  async analyzePreview(@Body() body: AnalyzeCvBody) {
    if (!body.base64Pdf || !body.fileName) {
      throw new BadRequestException('Se requieren base64Pdf y fileName');
    }
    const extracted = await this.cvService.analyzeCV(body.base64Pdf, body.fileName);
    return { extracted };
  }

  /**
   * POST /api/cv/analyze
   * Analiza el CV con Gemini, guarda el PDF y actualiza el perfil completo.
   * Devuelve { user, extracted } donde user es el perfil actualizado.
   */
  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyze(@Request() req, @Body() body: AnalyzeCvBody) {
    if (!body.base64Pdf || !body.fileName) {
      throw new BadRequestException('Se requieren base64Pdf y fileName');
    }

    // 1. Analizar con Gemini
    const extracted = await this.cvService.analyzeCV(body.base64Pdf, body.fileName);

    // 2. Construir el payload para actualizar el perfil
    //    cvComment se guarda en cvAnalysis (campo de texto libre)
    const { cvComment, ...profileData } = extracted;

    const updatePayload = {
      ...profileData,
      cvFileName: body.fileName,
      cvUrl:      `data:application/pdf;base64,${body.base64Pdf}`,
      cvAnalysis: cvComment || null,
    };

    // 3. Guardar en la DB
    const updatedUser = await this.usersService.update(req.user.id, updatePayload);

    return {
      user:      updatedUser,
      extracted: { ...extracted },
    };
  }
}