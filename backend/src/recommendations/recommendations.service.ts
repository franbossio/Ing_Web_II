// src/recommendations/recommendations.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity';

export interface RecommendationResult {
  jobId:    string;
  title:    string;
  company:  string;
  location: string | null;
  modality: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency:  string | null;
  skills:    string[];
  matchPct:  number;
  reason:    string;
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
    const webhookUrl = this.config.get<string>('MAKE_RECOMMENDATIONS_URL', '');
    if (!webhookUrl) {
      throw new BadRequestException('MAKE_RECOMMENDATIONS_URL no configurada en el .env');
    }

    // 1. Traer todas las ofertas activas de la DB
    const jobs = await this.jobsRepo.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    if (jobs.length === 0) return [];

    // 2. Construir payload para Make
    const payload = {
  candidate: {
    id:       candidateId,
    skills:   candidateSkills.join(', '),
    jobTitle: candidateJobTitle || '',
    bio:      (candidateBio || '').replace(/\n/g, ' ').replace(/"/g, "'").replace(/\\/g, ''),
  },
  jobsText: jobs.map(j =>
    `ID:${j.id}|Titulo:${j.title}|Skills:${(j.skills||[]).join(',')}|Desc:${(j.description||'').slice(0,120).replace(/\n/g,' ').replace(/"/g,"'").replace(/\\/g,'')}`
  ).join(';;;'),
};

    // 3. Llamar al webhook de Make
    console.log('=== CALLING MAKE WEBHOOK:', webhookUrl.slice(0, 60) + '...');
    console.log('=== CANDIDATE SKILLS:', candidateSkills);
    console.log('=== JOBS COUNT:', jobs.length);

    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } catch (e: any) {
      throw new BadRequestException('No se pudo conectar con Make.com: ' + e.message);
    }

    if (!response.ok) {
      throw new BadRequestException(`Make.com devolvio error ${response.status}`);
    }

    // 4. Parsear respuesta
    const responseText = await response.text();
    console.log('=== MAKE RESPONSE STATUS:', response.status);
    console.log('=== MAKE RESPONSE TEXT:', responseText.slice(0, 500));

    let recs: any[] = [];
    try {
      // Estrategia 1: extraer exactamente { "recommendations": [...] }
      const recsMatch = responseText.match(/\{\s*"recommendations"\s*:\s*\[[\s\S]*?\]\s*\}/);
      if (recsMatch) {
        recs = JSON.parse(recsMatch[0]).recommendations || [];
        console.log('=== PARSED via regex, recs count:', recs.length);
      } else {
        // Estrategia 2: limpiar markdown y parsear completo
        const clean = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        let parsed: any;
        try {
          parsed = JSON.parse(clean);
        } catch {
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
          else throw new Error('No se encontro JSON valido en la respuesta de Make');
        }
        recs = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.data || []);
      }
      console.log('=== PARSED OK, recs count:', recs.length);
    } catch (e: any) {
      console.log('=== PARSE ERROR:', e.message);
      console.log('=== FULL RESPONSE TEXT:', responseText);
      throw new BadRequestException('Error al parsear respuesta de Make/Groq: ' + e.message);
    }

    // 5. Cruzar con la BD — SOLO incluir ofertas que existan realmente
    const jobById    = new Map(jobs.map(j => [j.id, j]));
    const jobByTitle = new Map(jobs.map(j => [j.title.toLowerCase().trim(), j]));

    console.log('=== RECS FROM GROQ:', JSON.stringify(recs));

    const results: RecommendationResult[] = [];

    for (const rec of recs) {
      const job = jobById.get(rec.jobId)
        || jobByTitle.get((rec.jobId || '').toLowerCase().trim())
        || jobByTitle.get((rec.title  || '').toLowerCase().trim());

      console.log('=== MATCHING rec.jobId:', rec.jobId, '->', job?.title || 'NOT FOUND — DESCARTADO');

      // Si Groq invento un trabajo que no existe en la BD, lo ignoramos
      if (!job) continue;

      results.push({
        jobId:     job.id,
        title:     job.title,
        company:   job.company?.companyName || job.company?.firstName || 'Empresa',
        location:  job.location  || null,
        modality:  job.modality  || null,
        salaryMin: job.salaryMin || null,
        salaryMax: job.salaryMax || null,
        currency:  job.currency  || null,
        skills:    job.skills    || [],
        matchPct:  Number(rec.matchPct || rec.match || rec.score || 0),
        reason:    rec.reason    || rec.why || 'Compatible con tu perfil',
      });

      if (results.length === 3) break;
    }

    return results;
  }
}