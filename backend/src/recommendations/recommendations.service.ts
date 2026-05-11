// src/recommendations/recommendations.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity';

export interface RecommendationResult {
  jobId:     string;
  title:     string;
  company:   string;
  location:  string | null;
  modality:  string | null;
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
    if (!webhookUrl) throw new BadRequestException('MAKE_RECOMMENDATIONS_URL no configurada');

    const jobs = await this.jobsRepo.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (!jobs.length) return [];

    // Mandar al webhook en el formato que espera el Tools module de Make
    // candidate.skills = array, candidate.jobTitle = string
    // jobs = array de objetos con jobId, title, skills
    const payload = {
      candidate: {
        skills:   candidateSkills,
        jobTitle: candidateJobTitle || '',
        bio:      (candidateBio || '').slice(0, 200),
      },
      jobs: jobs.map(j => ({
        jobId:  j.id,
        title:  j.title,
        skills: j.skills || [],
      })),
    };

    console.log('=== CALLING MAKE:', webhookUrl.slice(0, 50));
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
      throw new BadRequestException('No se pudo conectar con Make: ' + e.message);
    }

    const responseText = await response.text();
    console.log('=== MAKE STATUS:', response.status);
    console.log('=== MAKE RESPONSE:', responseText.slice(0, 400));

    if (!response.ok) {
      throw new BadRequestException(`Make error ${response.status}: ${responseText.slice(0, 100)}`);
    }

    // Parsear
    let recs: any[] = [];
    try {
      const clean = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
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
      throw new BadRequestException('Error al parsear: ' + e.message);
    }

    // Cruzar con DB
    const jobById = new Map(jobs.map(j => [j.id, j]));
    const results: RecommendationResult[] = [];

    for (const rec of recs) {
      const job = jobById.get(rec.jobId);
      console.log('=== MATCH:', rec.jobId, '->', job?.title || 'NO ENCONTRADO');
      if (!job) continue;

      results.push({
        jobId:     job.id,
        title:     job.title,
        company:   (job.company as any)?.companyName || 'Empresa',
        location:  job.location  || null,
        modality:  job.modality  || null,
        salaryMin: job.salaryMin || null,
        salaryMax: job.salaryMax || null,
        currency:  job.currency  || null,
        skills:    job.skills    || [],
        matchPct:  Number(rec.matchPct || 0),
        reason:    rec.reason || 'Compatible con tu perfil',
      });

      if (results.length === 3) break;
    }

    return results;
  }
}