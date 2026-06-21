// src/cv/cv.service.ts
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CvExtracted {
  firstName:  string | null;
  lastName:   string | null;
  phone:      string | null;
  jobTitle:   string | null;
  location:   string | null;
  bio:        string | null;
  linkedin:   string | null;
  github:     string | null;
  portfolio:  string | null;
  salary:     null;
  skills:     string[];
  softSkills: string[];
  languages:  { name: string; level: string }[];
  experience: {
    title: string; company: string; startDate: string;
    endDate: string | null; current: boolean; description: string;
  }[];
  education: {
    career: string; institution: string;
    startYear: string; endYear: string | null; status: string;
  }[];
  cvComment: string;
  cvScore: number;
  cvScoreBreakdown: { clarity: number; skills: number; experience: number };
}

const PROMPT = `Sos un extractor de datos de CVs. Analizá el texto del CV y devolvé SOLO un JSON válido con exactamente esta estructura, sin texto extra ni markdown:

{
  "firstName":  "string o null",
  "lastName":   "string o null",
  "phone":      "string o null",
  "jobTitle":   "string o null (título profesional principal)",
  "location":   "string o null (ciudad, país)",
  "bio":        "string o null (resumen profesional de 2-3 oraciones)",
  "linkedin":   "string o null (URL o usuario)",
  "github":     "string o null (URL o usuario)",
  "portfolio":  "string o null (URL)",
  "salary":     null,
  "skills":     ["array de skills técnicas como strings"],
  "softSkills": ["array de habilidades blandas como strings"],
  "languages":  [{"name":"string","level":"string"}],
  "experience": [{"title":"string","company":"string","startDate":"string","endDate":"string o null","current":false,"description":"string"}],
  "education":  [{"career":"string","institution":"string","startYear":"string","endYear":"string o null","status":"string"}],
  "cvComment":  "string: comentario profesional de 3-4 oraciones sobre el perfil del candidato, sus fortalezas y áreas de mejora, pensado para ser leído por empresas",
  "cvScore": 75,
  "cvScoreBreakdown": {"clarity": 80, "skills": 70, "experience": 75}
}

Reglas:
- Devolvé SOLO el JSON, sin \`\`\`json ni texto antes o después
- Si un campo no aparece en el CV, usá null o [] según corresponda
- skills debe contener tecnologías, herramientas y conocimientos técnicos concretos
- cvComment debe ser objetivo, profesional y útil para una empresa que evalúa al candidato
- cvScore es un entero de 0 a 100 que resume la calidad general del CV
- cvScoreBreakdown.clarity (0-100): claridad, estructura y presentación del documento
- cvScoreBreakdown.skills (0-100): cantidad, variedad y relevancia de habilidades técnicas
- cvScoreBreakdown.experience (0-100): profundidad y cantidad de experiencia laboral`;

@Injectable()
export class CvService {
  constructor(private config: ConfigService) {}

  private async extractText(base64Pdf: string): Promise<string> {
    const buffer = Buffer.from(base64Pdf, 'base64');
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const result   = await pdfParse(buffer);
      const raw      = (result.text || '').trim();
      return raw
        .replace(/"/g,  "'")
        .replace(/\\/g, '')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    } catch (e: any) {
      throw new BadRequestException('No se pudo leer el PDF: ' + (e?.message || 'error'));
    }
  }

  private parseJson(text: string): CvExtracted | null {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try { return JSON.parse(clean) as CvExtracted; } catch {}
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as CvExtracted; } catch {}
    }
    return null;
  }

  async analyzeCV(base64Pdf: string, fileName: string): Promise<CvExtracted> {
    const groqApiKey = this.config.get<string>('GROQ_API_KEY', '');
    if (!groqApiKey) {
      throw new InternalServerErrorException('GROQ_API_KEY no configurada en el .env.');
    }

    const pdfText = await this.extractText(base64Pdf);
    if (!pdfText || pdfText.length < 50) {
      throw new BadRequestException('El PDF no tiene texto legible.');
    }

    console.log('[CvService] Texto extraído del PDF:', pdfText.slice(0, 200));
    console.log('[CvService] Llamando a Groq directo...');

    let groqResponse: Response;
    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + groqApiKey,
        },
        body: JSON.stringify({
          model:       'llama-3.3-70b-versatile',
          temperature: 0.1,
          max_tokens:  2000,
          messages: [
            { role: 'system', content: PROMPT },
            { role: 'user',   content: 'Texto del CV:\n\n' + pdfText },
          ],
        }),
      });
    } catch (e: any) {
      throw new InternalServerErrorException('No se pudo conectar con Groq: ' + e?.message);
    }

    const rawText = await groqResponse.text();
    console.log('[CvService] Groq status:', groqResponse.status);
    console.log('[CvService] Groq RAW (300):', rawText.slice(0, 300));

    if (!groqResponse.ok) {
      throw new InternalServerErrorException('Groq error ' + groqResponse.status + ': ' + rawText.slice(0, 100));
    }

    let content: string;
    try {
      const groqData = JSON.parse(rawText);
      content = groqData.choices[0].message.content;
    } catch (e: any) {
      throw new InternalServerErrorException('Error al parsear respuesta de Groq: ' + e.message);
    }

    console.log('[CvService] Groq content:', content.slice(0, 300));

    const parsed = this.parseJson(content);
    if (parsed) return parsed;

    console.error('[CvService] No parseable:', content.slice(0, 200));
    throw new BadRequestException('El modelo no devolvió un JSON válido. Intentá de nuevo.');
  }
}