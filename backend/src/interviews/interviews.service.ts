// src/interviews/interviews.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.entity';

export interface InterviewQuestion {
  question: string;
  type: 'tecnica' | 'comportamental';
}

export interface InterviewAnswerResult {
  question:  string;
  answer:    string;
  score:     number;
  feedback:  string;
}

export interface InterviewEvaluation {
  overallScore: number;
  summary:      string;
  strengths:    string[];
  improvements: string[];
  perQuestion:  InterviewAnswerResult[];
}

function sanitize(str: string, maxLen = 500): string {
  return (str || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        temperature,
        max_tokens:  maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      }),
    });
  } catch (e: any) {
    throw new BadRequestException('No se pudo conectar con Groq: ' + e.message);
  }

  const responseText = await response.text();
  if (!response.ok) {
    throw new BadRequestException('Groq error ' + response.status + ': ' + responseText.slice(0, 100));
  }

  try {
    const groqData = JSON.parse(responseText);
    return groqData.choices[0].message.content;
  } catch (e: any) {
    throw new BadRequestException('Error al parsear respuesta de Groq: ' + e.message);
  }
}

function parseJsonContent(content: string): any {
  const clean = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try { return JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) {
      try { return JSON.parse(m[0]); } catch {}
    }
  }
  throw new BadRequestException('El modelo no devolvió un JSON válido. Intentá de nuevo.');
}

@Injectable()
export class InterviewsService {
  constructor(
    private config: ConfigService,
    @InjectRepository(Job) private jobsRepo: Repository<Job>,
  ) {}

  private getApiKey(): string {
    const key = this.config.get<string>('GROQ_API_KEY', '');
    if (!key) throw new BadRequestException('GROQ_API_KEY no configurada');
    return key;
  }

  async generateQuestions(
    jobId: string | null,
    candidateSkills: string[],
    candidateJobTitle: string | null,
  ): Promise<{ jobTitle: string | null; questions: InterviewQuestion[] }> {
    const apiKey = this.getApiKey();

    let job: Job | null = null;
    if (jobId) {
      job = await this.jobsRepo.findOne({ where: { id: jobId } });
      if (!job) throw new BadRequestException('Oferta no encontrada');
    }

    const prompt =
      (job
        ? 'Puesto: ' + sanitize(job.title, 150) +
          (job.area ? ' | area: ' + sanitize(job.area, 100) : '') +
          ' | skills requeridas: ' + (job.skills || []).map(s => sanitize(s, 100)).join(', ') +
          (job.requirements ? ' | requisitos: ' + sanitize(job.requirements, 300) : '') +
          (job.description ? ' | descripcion: ' + sanitize(job.description, 300) : '')
        : 'Puesto generico segun el perfil del candidato.') +
      '\n\nCandidato:' +
      '\ntitulo: ' + sanitize(candidateJobTitle || '', 150) +
      '\nskills: ' + candidateSkills.map(s => sanitize(s, 100)).join(', ') +
      '\n\nGenera 5 preguntas de entrevista de trabajo para este puesto y candidato: 3 tecnicas (sobre las skills/tecnologias del puesto) y 2 de comportamiento (soft skills, trabajo en equipo, resolucion de problemas).' +
      '\n\nDevuelve SOLO este JSON sin texto extra ni markdown:' +
      '\n{"questions":[{"question":"texto de la pregunta","type":"tecnica"},{"question":"texto","type":"comportamental"}]}' +
      '\n\nReglas:' +
      '\n- Exactamente 5 preguntas, en español, claras y especificas al puesto/skills mencionadas' +
      '\n- El campo type debe ser "tecnica" o "comportamental"';

    const content = await callGroq(
      apiKey,
      'Eres un entrevistador de RRHH experto en tecnologia. Responde SOLO con JSON valido, sin markdown ni texto extra.',
      prompt,
      0.4,
      1200,
    );

    const parsed = parseJsonContent(content);
    const questions: InterviewQuestion[] = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (!questions.length) {
      throw new BadRequestException('No se pudieron generar preguntas. Intentá de nuevo.');
    }

    return {
      jobTitle: job ? job.title : candidateJobTitle,
      questions: questions.slice(0, 5).map(q => ({
        question: sanitize(q.question, 300),
        type: q.type === 'tecnica' ? 'tecnica' : 'comportamental',
      })),
    };
  }

  async evaluateAnswers(
    jobId: string | null,
    qa: { question: string; answer: string }[],
  ): Promise<InterviewEvaluation> {
    const apiKey = this.getApiKey();

    if (!Array.isArray(qa) || !qa.length) {
      throw new BadRequestException('Se requieren preguntas y respuestas');
    }

    let job: Job | null = null;
    if (jobId) {
      job = await this.jobsRepo.findOne({ where: { id: jobId } });
    }

    const qaText = qa.map((item, i) =>
      `${i + 1}. Pregunta: ${sanitize(item.question, 300)}\nRespuesta: ${sanitize(item.answer, 800) || '(sin respuesta)'}`
    ).join('\n\n');

    const prompt =
      (job ? 'Puesto evaluado: ' + sanitize(job.title, 150) + '\n\n' : '') +
      'Entrevista realizada (preguntas y respuestas del candidato):\n\n' + qaText +
      '\n\nEvalua el desempeño del candidato en esta entrevista simulada.' +
      '\n\nDevuelve SOLO este JSON sin texto extra ni markdown:' +
      '\n{"overallScore":75,"summary":"resumen general de 2-3 oraciones","strengths":["fortaleza1","fortaleza2"],"improvements":["mejora1","mejora2"],"perQuestion":[{"question":"texto exacto de la pregunta","score":80,"feedback":"feedback especifico de 1-2 oraciones sobre esta respuesta"}]}' +
      '\n\nReglas:' +
      '\n- overallScore y score son numeros enteros de 0 a 100' +
      '\n- perQuestion debe tener un item por cada pregunta, en el mismo orden, usando el texto exacto de la pregunta' +
      '\n- strengths y improvements: arrays de 1 a 4 strings cortos' +
      '\n- Si una respuesta esta vacia o es muy pobre, score bajo y feedback constructivo indicando que falto responder o profundizar' +
      '\n- Se objetivo, constructivo y especifico, evitando generalidades';

    const content = await callGroq(
      apiKey,
      'Eres un entrevistador senior de RRHH evaluando una entrevista simulada. Responde SOLO con JSON valido, sin markdown ni texto extra.',
      prompt,
      0.3,
      2000,
    );

    const parsed = parseJsonContent(content);

    const perQuestionRaw: any[] = Array.isArray(parsed.perQuestion) ? parsed.perQuestion : [];
    const perQuestion: InterviewAnswerResult[] = qa.map((item, i) => {
      const match = perQuestionRaw[i] || {};
      return {
        question: item.question,
        answer:   item.answer,
        score:    Math.max(0, Math.min(100, Number(match.score ?? 0))),
        feedback: sanitize(match.feedback || 'Sin feedback disponible', 400),
      };
    });

    return {
      overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore ?? 0))),
      summary:      sanitize(parsed.summary || '', 500),
      strengths:    Array.isArray(parsed.strengths) ? parsed.strengths.map((s: any) => sanitize(String(s), 150)).slice(0, 4) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map((s: any) => sanitize(String(s), 150)).slice(0, 4) : [],
      perQuestion,
    };
  }
}
