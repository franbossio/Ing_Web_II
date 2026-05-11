import { Controller, Get, Patch, Delete, Body, UseGuards, Request, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  /** PATCH /api/users/me — actualizar perfil */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req, @Body() body: any) {
    return this.usersService.update(req.user.id, body);
  }

  /** PATCH /api/users/me/password — cambiar contraseña */
  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  /** DELETE /api/users/me — eliminar cuenta */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(@Request() req) {
    return this.usersService.deleteById(req.user.id);
  }

  /** GET /api/users/candidates — lista de candidatos para empresa */
  @Get('candidates')
  @UseGuards(JwtAuthGuard)
  async getCandidates() {
    return this.usersService.findCandidates();
  }

  /** POST /api/users/candidates/suggest — IA sugiere candidatos para un puesto */
  @Post('candidates/suggest')
  @UseGuards(JwtAuthGuard)
  async suggestCandidates(@Body() body: { jobId: string; jobTitle: string; jobSkills: string[]; jobDescription: string }) {
    const webhookUrl = this.config.get<string>('MAKE_CANDIDATES_URL', '');
    if (!webhookUrl) throw new Error('MAKE_CANDIDATES_URL no configurada');

    // Traer todos los candidatos
    const candidates = await this.usersService.findCandidates();

    // Mandar a Make → Groq
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job: {
          jobId:       body.jobId,
          title:       body.jobTitle,
          skills:      body.jobSkills,
          description: body.jobDescription,
        },
        candidates: candidates.map(c => ({
          candidateId: c.id,
          nombre:      [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
          titulo:      c.jobTitle || '',
          skills:      c.skills   || [],
          softSkills:  c.softSkills || [],
          bio:         c.bio      || '',
          ubicacion:   c.location || '',
        })),
      }),
    });

    if (!response.ok) throw new Error('Error al conectar con Make');

    const rawText = await response.text();
    const clean   = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed: any;
    try { parsed = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Respuesta inválida de Make');
    }

    const suggestions = Array.isArray(parsed)
      ? parsed
      : (parsed.suggestions || parsed.recommendations || parsed.candidatos || []);

    // Enriquecer con datos reales
    const candMap = new Map(candidates.map(c => [c.id, c]));
    return suggestions.slice(0, 10).map((s: any) => {
      const cand = candMap.get(s.candidateId);
      return {
        candidateId: s.candidateId,
        nombre:      cand ? [cand.firstName, cand.lastName].filter(Boolean).join(' ') : s.nombre || '—',
        titulo:      cand?.jobTitle  || s.titulo   || '—',
        ubicacion:   cand?.location  || s.ubicacion || '',
        skills:      cand?.skills    || s.skills    || [],
        bio:         cand?.bio       || '',
        cvUrl:       cand?.cvUrl     || null,
        cvFileName:  cand?.cvFileName || null,
        matchPct:    Number(s.matchPct || s.match || 0),
        reason:      s.reason || s.razon || '',
      };
    });
  }

  /** GET /api/users — solo admin */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }
}