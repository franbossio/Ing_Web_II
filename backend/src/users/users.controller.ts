import {
  Controller, Get, Post, Patch, Delete,
  Body, Request, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard }  from '../common/guards/jwt-auth.guard';
import { RolesGuard }    from '../common/guards/roles.guard';
import { Roles }         from '../common/decorators/roles.decorator';
import { UsersService }  from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  /** GET /api/users/me */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  /** PATCH /api/users/me */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Request() req, @Body() body: any) {
    return this.usersService.update(req.user.id, body);
  }

  /** DELETE /api/users/me */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteMe(@Request() req) {
    return this.usersService.deleteById(req.user.id);
  }

  /** GET /api/users/candidates */
  @Get('candidates')
  @UseGuards(JwtAuthGuard)
  async getCandidates() {
    return this.usersService.findCandidates();
  }

  /** POST /api/users/candidates/suggest — IA ordena candidatos por oferta */
  @Post('candidates/suggest')
  @UseGuards(JwtAuthGuard)
  async suggestCandidates(
    @Body() body: { jobId: string; jobTitle: string; jobSkills: string[]; jobDescription: string },
  ) {
    const webhookUrl = this.config.get<string>('MAKE_CANDIDATES_URL', '');
    if (!webhookUrl) throw new Error('MAKE_CANDIDATES_URL no configurada');

    const candidates = await this.usersService.findCandidates();
    if (!candidates.length) return [];

    // Construir prompt texto plano — sin JSON anidado que rompe Make
    const candLines = candidates.map(c =>
      `ID:${c.id} | ${[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email} | titulo:${c.jobTitle || ''} | skills:${(c.skills || []).join(',')}`
    ).join('\n');

    const prompt =
      `Oferta:\n` +
      `- Título: ${body.jobTitle}\n` +
      `- Skills requeridas: ${(body.jobSkills || []).join(', ')}\n` +
      `- Descripción: ${(body.jobDescription || '').slice(0, 200)}\n\n` +
      `Candidatos disponibles (copiá el ID exacto):\n${candLines}\n\n` +
      `Devolvé SOLO un array JSON con los 5 candidatos más compatibles:\n` +
      `[{"candidateId":"ID_EXACTO","matchPct":90,"reason":"razón en español"},` +
      `{"candidateId":"ID_EXACTO","matchPct":80,"reason":"razón"},` +
      `{"candidateId":"ID_EXACTO","matchPct":70,"reason":"razón"}]`;

    console.log('=== CALLING MAKE CANDIDATES:', webhookUrl.slice(0, 50));
    console.log('=== CANDIDATES COUNT:', candidates.length);

    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt }),  // ← solo { prompt }
    });

    const rawText = await response.text();
    console.log('=== MAKE STATUS:', response.status);
    console.log('=== MAKE RESPONSE:', rawText.slice(0, 300));

    if (!response.ok) throw new Error(`Make error ${response.status}: ${rawText.slice(0, 100)}`);

    const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let parsed: any;
    try { parsed = JSON.parse(clean); }
    catch {
      const match = clean.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Respuesta inválida de Make');
    }

    const suggestions = Array.isArray(parsed)
      ? parsed
      : (parsed.suggestions || parsed.recommendations || []);

    const candMap = new Map(candidates.map(c => [c.id, c]));
    return suggestions.slice(0, 10).map((s: any) => {
      const cand = candMap.get(s.candidateId);
      return {
        candidateId: s.candidateId,
        nombre:      cand ? [cand.firstName, cand.lastName].filter(Boolean).join(' ') : '—',
        titulo:      cand?.jobTitle  || '—',
        ubicacion:   cand?.location  || '',
        skills:      cand?.skills    || [],
        bio:         cand?.bio       || '',
        cvUrl:       cand?.cvUrl     || null,
        cvFileName:  cand?.cvFileName || null,
        matchPct:    Number(s.matchPct || 0),
        reason:      s.reason || '',
      };
    }).filter(r => r.nombre !== '—');
  }

  /** GET /api/users — solo admin */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }
}