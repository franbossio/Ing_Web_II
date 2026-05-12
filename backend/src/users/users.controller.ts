import {
  Controller, Get, Post, Patch, Delete,
  Body, Request, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard }  from '../common/guards/jwt-auth.guard';
import { RolesGuard }    from '../common/guards/roles.guard';
import { Roles }         from '../common/decorators/roles.decorator';
import { UsersService }  from './users.service';

/** Elimina saltos de línea y tabs de un string para no romper JSON */
function clean(str: string, max = 500): string {
  return (str || '').replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

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

    // Cada candidato en UNA sola línea, sin \n internos
    const candList = candidates.map(c =>
      `ID:${c.id} NOMBRE:${clean([c.firstName, c.lastName].filter(Boolean).join(' ') || c.email, 60)} TITULO:${clean(c.jobTitle || '', 80)} SKILLS:${(c.skills || []).map(s => clean(s, 40)).join(',')}`
    );

    // Payload limpio: el prompt es un string sin \n
    const payload = {
      jobTitle:       clean(body.jobTitle, 150),
      jobSkills:      (body.jobSkills || []).map(s => clean(s, 60)),
      jobDescription: clean(body.jobDescription || '', 300),
      candidates:     candList,   // array de strings limpios, sin \n
    };

    console.log('=== CALLING MAKE CANDIDATES:', webhookUrl.slice(0, 50));
    console.log('=== CANDIDATES COUNT:', candidates.length);

    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log('=== MAKE STATUS:', response.status);
    console.log('=== MAKE RESPONSE:', rawText.slice(0, 300));

    if (!response.ok) throw new Error(`Make error ${response.status}: ${rawText.slice(0, 100)}`);

    // Si Make devuelve "Accepted" significa que el Webhook Response
    // no está configurado para esperar — ver README de Make
    if (rawText.trim() === 'Accepted') {
      throw new Error('Make respondió "Accepted" en lugar de JSON. Configurá el Webhook Response para devolver la respuesta del HTTP module.');
    }

    const clean2 = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let parsed: any;
    try { parsed = JSON.parse(clean2); }
    catch {
      const match = clean2.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Respuesta inválida de Make: ' + rawText.slice(0, 100));
    }

    const suggestions = Array.isArray(parsed)
      ? parsed
      : (parsed.suggestions || parsed.recommendations || []);

    const candMap = new Map(candidates.map(c => [c.id, c]));
    const seen = new Set<string>();
    return suggestions
      .filter((s: any) => {
        if (seen.has(s.candidateId)) return false;
        seen.add(s.candidateId);
        return true;
      })
      .slice(0, 10)
      .map((s: any) => {
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