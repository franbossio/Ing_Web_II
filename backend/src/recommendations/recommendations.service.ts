// src/recommendations/recommendations.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity';

export interface RecommendationResult {
  jobId:         string;
  title:         string;
  company:       string;
  location:      string | null;
  modality:      string | null;
  salaryMin:     number | null;
  salaryMax:     number | null;
  currency:      string | null;
  skills:        string[];
  matchPct:      number;
  reason:        string;
  missingSkills: string[];
}

/** Elimina saltos de línea, tabs y espacios múltiples de un string */
function sanitize(str: string, maxLen = 500): string {
  return (str || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

@Injectable()
export class RecommendationsService {
  constructor(
    private config: ConfigService,
    @InjectRepository(Job) private jobsRepo: Repository<Job>,
  ) {}

  async getRecommendations(
    candidateId: string,
    candidateSkills: string[],
    candidateJobTitle: string | null,
    candidateBio: string | null,
  ): Promise<RecommendationResult[]> {

    const groqApiKey = this.config.get<string>('GROQ_API_KEY', '');
    if (!groqApiKey) throw new BadRequestException('GROQ_API_KEY no configurada');

    // Traer hasta 20 ofertas activas de la BD
    const jobs = await this.jobsRepo.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (!jobs.length) return [];

    // Armar texto de ofertas para el prompt
    const jobsText = jobs.map(j =>
      j.id + ' - ' + sanitize(j.title, 150) +
      (j.area ? ' | area: ' + sanitize(j.area, 100) : '') +
      ' | skills: ' + (j.skills || []).map(s => sanitize(s, 100)).join(', ') +
      (j.softSkills && j.softSkills.length ? ' | soft skills: ' + j.softSkills.map(s => sanitize(s, 100)).join(', ') : '') +
      (j.requirements ? ' | requisitos: ' + sanitize(j.requirements, 200) : '') +
      (j.description  ? ' | descripcion: ' + sanitize(j.description,  200) : '')
    ).join('\n');

    const prompt =
      'Candidato:' +
      '\ntitulo: ' + sanitize(candidateJobTitle || '', 150) +
      '\nskills: ' + candidateSkills.map(s => sanitize(s, 100)).join(', ') +
      '\nbio: ' + sanitize(candidateBio || '', 200) +
      '\n\nOfertas disponibles (formato: uuid - titulo [skills: ...]):' +
      '\n' + jobsText +
      '\n\nDevuelve SOLO este JSON sin texto extra ni markdown:' +
      '\n{"recommendations":[{"jobId":"uuid-exacto","matchPct":85,"reason":"explicacion detallada","missingSkills":["skill1","skill2"]}]}' +
      '\n\nReglas:' +
      '\n- Usa SOLO los jobId exactos que aparecen al inicio de cada linea (antes del primer guion)' +
      '\n- Devuelve maximo 3 recomendaciones ordenadas de mayor a menor matchPct' +
      '\n- Solo incluye ofertas con matchPct >= 40' +
      '\n- Si ninguna supera 40, devuelve las 2 mejores igual' +
      '\n- El campo reason debe tener entre 60 y 120 palabras explicando: que skills especificas del candidato coinciden con la oferta, que experiencia o formacion es relevante para el puesto, y por que seria una buena eleccion para ese rol en particular. Se especifico y personalizado, no generico.' +
      '\n- El campo missingSkills debe ser un array con las 1 a 4 skills tecnicas o blandas que el candidato NO tiene pero que la oferta requiere. Si el candidato tiene todas las skills, devuelve un array vacio [].';

    console.log('=== CALLING GROQ DIRECT ===');
    console.log('=== JOBS COUNT:', jobs.length);
    console.log('=== CANDIDATE SKILLS:', candidateSkills);

    let response: Response;
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: 'Eres un motor de matching de empleos. Responde SOLO con JSON valido, sin markdown ni texto extra.',
            },
            {
              role:    'user',
              content: prompt,
            },
          ],
        }),
      });
    } catch (e: any) {
      throw new BadRequestException('No se pudo conectar con Groq: ' + e.message);
    }

    const responseText = await response.text();
    console.log('=== GROQ STATUS:', response.status);
    console.log('=== GROQ RESPONSE:', responseText.slice(0, 500));

    if (!response.ok) {
      throw new BadRequestException('Groq error ' + response.status + ': ' + responseText.slice(0, 100));
    }

    // Extraer el content del mensaje de Groq
    let content: string;
    try {
      const groqData = JSON.parse(responseText);
      content = groqData.choices[0].message.content;
    } catch (e: any) {
      throw new BadRequestException('Error al parsear respuesta de Groq: ' + e.message);
    }

    console.log('=== GROQ CONTENT:', content);

    // Parsear el JSON que devolvio el modelo
    let recs: any[] = [];
    try {
      const clean = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      let parsed: any;
      try   { parsed = JSON.parse(clean); }
      catch {
        const m = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        parsed = m ? JSON.parse(m[0]) : [];
      }

      recs = Array.isArray(parsed)
        ? parsed
        : (parsed.recommendations || parsed.data || []);

      console.log('=== RECS COUNT:', recs.length);
    } catch (e: any) {
      console.log('=== PARSE ERROR:', e.message);
      throw new BadRequestException('Error al parsear JSON del modelo: ' + e.message);
    }

    // Cruzar con DB y armar resultado final con todos los datos de la oferta
    const jobById = new Map(jobs.map(j => [j.id, j]));
    const results: RecommendationResult[] = [];

    for (const rec of recs) {
      const job = jobById.get(rec.jobId);
      console.log('=== MATCH:', rec.jobId, '->', job?.title || 'NO ENCONTRADO');
      if (!job) continue;

      results.push({
        jobId:         job.id,
        title:         job.title,
        company:       (job.company as any)?.companyName || 'Empresa',
        location:      job.location  || null,
        modality:      job.modality  || null,
        salaryMin:     job.salaryMin || null,
        salaryMax:     job.salaryMax || null,
        currency:      job.currency  || null,
        skills:        job.skills    || [],
        matchPct:      Number(rec.matchPct || 0),
        reason:        sanitize(rec.reason || 'Compatible con tu perfil', 600),
        missingSkills: Array.isArray(rec.missingSkills)
          ? rec.missingSkills.map((s: any) => sanitize(String(s), 80)).filter(Boolean).slice(0, 4)
          : [],
      });

      if (results.length === 3) break;
    }

    return results;
  }
}