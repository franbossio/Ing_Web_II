import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
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

  /** PATCH /api/users/me/password */
  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  /** DELETE /api/users/me */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteMe(@Request() req) {
    return this.usersService.deleteById(req.user.id);
  }

  /** GET /api/users/public/:id — perfil público del candidato, sin autenticación */
  @Get('public/:id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.findPublicProfile(id);
  }

  /** GET /api/users/candidates */
  @Get('candidates')
  @UseGuards(JwtAuthGuard)
  async getCandidates() {
    return this.usersService.findCandidates();
  }

  /** POST /api/users/candidates/suggest — IA ordena candidatos por oferta usando Groq directo */
  @Post('candidates/suggest')
  @UseGuards(JwtAuthGuard)
  async suggestCandidates(
    @Body() body: { jobId: string; jobTitle: string; jobSkills: string[]; jobDescription: string },
  ) {
    const groqApiKey = this.config.get<string>('GROQ_API_KEY', '');
    if (!groqApiKey) throw new Error('GROQ_API_KEY no configurada');

    const candidates = await this.usersService.findCandidates();
    if (!candidates.length) return [];

    // Armar texto de candidatos para el prompt
    const candText = candidates.map(c =>
      c.id + ' - ' +
      clean([c.firstName, c.lastName].filter(Boolean).join(' ') || c.email, 60) +
      ' | titulo: ' + clean(c.jobTitle || '', 80) +
      ' | skills: ' + (c.skills || []).map(s => clean(s, 40)).join(', ') +
      (c.bio ? ' | bio: ' + clean(c.bio, 150) : '')
    ).join('\n');

    const prompt =
      'Oferta de trabajo:' +
      '\ntitulo: ' + clean(body.jobTitle, 150) +
      '\nskills requeridas: ' + (body.jobSkills || []).map(s => clean(s, 60)).join(', ') +
      (body.jobDescription ? '\ndescripcion: ' + clean(body.jobDescription, 300) : '') +
      '\n\nCandidatos disponibles (formato: uuid - nombre | titulo | skills | bio):' +
      '\n' + candText +
      '\n\nDevuelve SOLO este JSON sin texto extra ni markdown:' +
      '\n{"suggestions":[{"candidateId":"uuid-exacto","matchPct":85,"reason":"razon en espanol max 100 chars"}]}' +
      '\n\nReglas:' +
      '\n- Usa SOLO los candidateId exactos que aparecen al inicio de cada linea (antes del primer guion)' +
      '\n- Devuelve maximo 10 candidatos ordenados de mayor a menor matchPct' +
      '\n- Solo incluye candidatos con matchPct >= 40' +
      '\n- Si ninguno supera 40, devuelve los 3 mejores igual' +
      '\n- El campo reason debe explicar especificamente que skills o experiencia del candidato coinciden con la oferta';

    console.log('=== CALLING GROQ CANDIDATES DIRECT ===');
    console.log('=== CANDIDATES COUNT:', candidates.length);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + groqApiKey,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens:  1500,
        messages: [
          {
            role:    'system',
            content: 'Eres un motor de matching de candidatos para ofertas de trabajo. Responde SOLO con JSON valido, sin markdown ni texto extra.',
          },
          {
            role:    'user',
            content: prompt,
          },
        ],
      }),
    });

    const rawText = await response.text();
    console.log('=== GROQ STATUS:', response.status);
    console.log('=== GROQ RESPONSE:', rawText.slice(0, 500));

    if (!response.ok) throw new Error('Groq error ' + response.status + ': ' + rawText.slice(0, 100));

    let content: string;
    try {
      const groqData = JSON.parse(rawText);
      content = groqData.choices[0].message.content;
    } catch (e: any) {
      throw new Error('Error al parsear respuesta de Groq: ' + e.message);
    }

    console.log('=== GROQ CONTENT:', content);

    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); }
    catch {
      const m = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      parsed = m ? JSON.parse(m[0]) : [];
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
          photo:       cand?.photo     || null,
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

  /** GET /api/users/admin/stats — estadísticas globales */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminStats() {
    return this.usersService.adminGetStats();
  }

  /** PATCH /api/users/admin/:id/toggle — activar/desactivar usuario */
  @Patch('admin/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminToggle(@Param('id') id: string) {
    return this.usersService.adminToggleActive(id);
  }

  /** DELETE /api/users/admin/:id — eliminar cualquier usuario */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminDelete(@Param('id') id: string) {
    return this.usersService.adminDeleteUser(id);
  }
}