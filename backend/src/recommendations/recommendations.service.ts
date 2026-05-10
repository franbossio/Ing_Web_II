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
  matchPct:  number;   // 0-100
  reason:    string;   // Por qué ChatGPT lo recomendó
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
      throw new BadRequestException(
        'MAKE_RECOMMENDATIONS_URL no configurada en el .env',
      );
    }

    // 1. Traer todas las ofertas activas de la DB
    const jobs = await this.jobsRepo.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 30, // máximo 30 ofertas para no saturar el prompt
    });

    if (jobs.length === 0) {
      return [];
    }

    // 2. Construir payload para Make
    const payload = {
      candidate: {
        id:       candidateId,
        skills:   candidateSkills,
        jobTitle: candidateJobTitle || '',
        bio:      candidateBio || '',
      },
      jobs: jobs.map(j => ({
        jobId:       j.id,   // <-- usar este jobId exacto en la respuesta
        id:          j.id,
        title:       j.title,
        company:     j.company?.companyName || j.company?.firstName || 'Empresa',
        skills:      j.skills || [],
        softSkills:  j.softSkills || [],
        description: j.description || '',
        requirements:j.requirements || '',
        location:    j.location || null,
        modality:    j.modality || null,
        salaryMin:   j.salaryMin || null,
        salaryMax:   j.salaryMax || null,
        currency:    j.currency || null,
      })),
    };

    // 3. Llamar al webhook de Make (Make → ChatGPT → respuesta)
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
      throw new BadRequestException(
        'No se pudo conectar con Make.com: ' + e.message,
      );
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Make.com devolvió error ${response.status}`,
      );
    }

    // 4. Parsear respuesta
    // Make puede devolver texto plano, JSON, o JSON con markdown wrapping
    const responseText = await response.text();
    console.log('=== MAKE RESPONSE STATUS:', response.status);
    console.log('=== MAKE RESPONSE TEXT:', responseText.slice(0, 500));

    let recs: any[] = [];
    try {
      // Limpiar posibles bloques de markdown que Groq/ChatGPT agregan
      const clean = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Parsear — puede ser string con JSON adentro, o JSON directo
      let parsed: any;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Si falla, buscar el primer bloque JSON dentro del texto
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('No se encontró JSON válido en la respuesta de Make');
      }

      // Aceptar { recommendations: [...] }, [...] directo, o { data: [...] }
      recs = Array.isArray(parsed)
        ? parsed
        : (parsed.recommendations || parsed.data || []);

      console.log('=== PARSED OK, recs count:', recs.length);
      console.log('=== RECS:', JSON.stringify(recs));

    } catch (e: any) {
      console.log('=== PARSE ERROR:', e.message);
      console.log('=== FULL RESPONSE TEXT:', responseText);
      throw new BadRequestException(
        'Error al parsear respuesta de Make/Groq: ' + e.message,
      );
    }

    // 5. Enriquecer con datos reales de la oferta
    // Groq puede devolver el UUID real o el título como jobId — manejamos ambos casos
    const jobById    = new Map(jobs.map(j => [j.id, j]));
    const jobByTitle = new Map(jobs.map(j => [j.title.toLowerCase().trim(), j]));

    console.log('=== RECS FROM GROQ:', JSON.stringify(recs));

    return recs.slice(0, 3).map((rec: any) => {
      // Buscar por UUID primero, luego por título
      const job = jobById.get(rec.jobId)
        || jobByTitle.get((rec.jobId || '').toLowerCase().trim())
        || jobByTitle.get((rec.title || '').toLowerCase().trim());

      console.log('=== MATCHING rec.jobId:', rec.jobId, '→ job found:', job?.title || 'NOT FOUND');

      return {
        jobId:     job?.id         || rec.jobId   || '',
        title:     job?.title      || rec.jobId   || rec.title || '—',
        company:   job?.company?.companyName || job?.company?.firstName || rec.company || 'Empresa',
        location:  job?.location   || rec.location || null,
        modality:  job?.modality   || rec.modality || null,
        salaryMin: job?.salaryMin  || rec.salaryMin || null,
        salaryMax: job?.salaryMax  || rec.salaryMax || null,
        currency:  job?.currency   || rec.currency || null,
        skills:    job?.skills     || rec.skills   || [],
        matchPct:  Number(rec.matchPct || rec.match || rec.score || 0),
        reason:    rec.reason      || rec.why      || 'Compatible con tu perfil',
      };
    });
  }
}