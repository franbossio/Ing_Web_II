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
}

@Injectable()
export class CvService {
  private readonly makeWebhookUrl: string;

  constructor(private config: ConfigService) {
    this.makeWebhookUrl = this.config.get<string>('MAKE_WEBHOOK_URL', '');
  }

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
    // Intento directo
    try { return JSON.parse(clean) as CvExtracted; } catch {}
    // Extraer objeto JSON del texto
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as CvExtracted; } catch {}
    }
    return null;
  }

  async analyzeCV(base64Pdf: string, fileName: string): Promise<CvExtracted> {
    if (!this.makeWebhookUrl) {
      throw new InternalServerErrorException('MAKE_WEBHOOK_URL no configurada en el .env.');
    }

    const pdfText = await this.extractText(base64Pdf);
    if (!pdfText || pdfText.length < 50) {
      throw new BadRequestException('El PDF no tiene texto legible.');
    }

    let makeResponse: Response;
    try {
      makeResponse = await fetch(this.makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText, fileName }),
      });
    } catch (e: any) {
      throw new InternalServerErrorException('No se pudo conectar con Make.com: ' + e?.message);
    }

    const rawText = await makeResponse.text();
    console.log('[CvService] Make status:', makeResponse.status);
    console.log('[CvService] Make RAW (100):', rawText.slice(0, 100));

    if (!makeResponse.ok) {
      throw new InternalServerErrorException(`Make.com error ${makeResponse.status}`);
    }

    // Caso 1: Make devuelve el JSON de Groq completo (con choices)
    try {
      const obj = JSON.parse(rawText);
      // Respuesta directa de Groq: { choices: [{ message: { content: "..." } }] }
      if (obj?.choices?.[0]?.message?.content) {
        const content = obj.choices[0].message.content;
        const parsed  = this.parseJson(content);
        if (parsed) return parsed;
      }
      // Ya es el JSON del perfil directamente
      if (obj?.firstName !== undefined) return obj as CvExtracted;
    } catch {}

    // Caso 2: Make devuelve solo el content como texto plano
    const parsed = this.parseJson(rawText);
    if (parsed) return parsed;

    console.error('[CvService] No parseable:', rawText.slice(0, 200));
    throw new BadRequestException('Respuesta inesperada de Make: ' + rawText.slice(0, 100));
  }
}