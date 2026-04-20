// src/cv/cv.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CvExtracted {
  firstName:    string | null;
  lastName:     string | null;
  phone:        string | null;
  jobTitle:     string | null;
  location:     string | null;
  bio:          string | null;
  linkedin:     string | null;
  github:       string | null;
  portfolio:    string | null;
  salary:       null;
  skills:       string[];
  softSkills:   string[];
  languages:    { name: string; level: string }[];
  experience:   {
    title: string; company: string; startDate: string;
    endDate: string; current: boolean; description: string;
  }[];
  education:    {
    career: string; institution: string;
    startYear: string; endYear: string; status: string;
  }[];
  cvComment:    string;   // comentario/análisis del CV en español
}

@Injectable()
export class CvService {
  private readonly geminiKey: string;
  // Gemini 2.0 Flash — rápido, soporta PDF nativo
  private readonly GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(private config: ConfigService) {
    this.geminiKey = this.config.get<string>('GEMINI_API_KEY', '');
  }

  // ── Analizar PDF base64 con Gemini ─────────────────────────────────────────
  async analyzeCV(base64Pdf: string, fileName: string): Promise<CvExtracted> {
    if (!this.geminiKey) {
      throw new BadRequestException(
        'GEMINI_API_KEY no configurada. Agregala al .env: GEMINI_API_KEY=tu_key',
      );
    }

    const prompt = `Analizá este CV en PDF y extraé toda la información disponible.
Respondé ÚNICAMENTE con un JSON válido. Sin texto adicional, sin markdown, sin backticks.

El JSON debe tener EXACTAMENTE esta estructura:
{
  "firstName": "nombre (string o null)",
  "lastName": "apellido (string o null)",
  "phone": "teléfono con código de país o null",
  "jobTitle": "título profesional más reciente o principal",
  "location": "ciudad, país",
  "bio": "resumen profesional de 2-3 oraciones redactado en primera persona, basado en el CV",
  "linkedin": "URL completa o null",
  "github": "URL completa o null",
  "portfolio": "URL completa o null",
  "salary": null,
  "skills": ["tecnología1", "tecnología2", "...máximo 12"],
  "softSkills": ["habilidad blanda 1", "...máximo 6"],
  "languages": [
    {"name": "nombre del idioma", "level": "Nativo|Avanzado|Intermedio|Básico"}
  ],
  "experience": [
    {
      "title": "cargo/puesto",
      "company": "nombre de la empresa",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM o null si es trabajo actual",
      "current": true/false,
      "description": "descripción de 1-2 oraciones de las responsabilidades"
    }
  ],
  "education": [
    {
      "career": "nombre de la carrera o título",
      "institution": "nombre de la institución",
      "startYear": "YYYY",
      "endYear": "YYYY o null si está en curso",
      "status": "Graduado|En curso|Incompleto"
    }
  ],
  "cvComment": "Análisis profesional del CV en 3-4 oraciones: fortalezas detectadas, áreas de mejora, y recomendaciones concretas para mejorar las chances de conseguir trabajo. Escribí en segunda persona (vos)."
}

Reglas importantes:
- Levels de idioma: solo Nativo, Avanzado, Intermedio o Básico
- Status educación: solo Graduado, En curso o Incompleto
- Si no encontrás un dato, usá null o array vacío
- Las fechas van en formato YYYY-MM (ej: 2023-06)
- El cvComment debe ser útil, específico y en español rioplatense`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature:    0.1,   // bajo para respuestas más precisas
        maxOutputTokens: 2048,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.GEMINI_URL}?key=${this.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } catch (e) {
      throw new BadRequestException('Error de red al conectar con Gemini: ');
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as any;
      const errMsg  = errBody?.error?.message || `Error Gemini ${response.status}`;

      // Mensajes de error más claros
      if (response.status === 400) throw new BadRequestException('API key inválida o request malformado: ' + errMsg);
      if (response.status === 403) throw new BadRequestException('GEMINI_API_KEY sin permisos. Verificá que esté habilitada en Google AI Studio.');
      if (response.status === 429) throw new BadRequestException('Límite de requests de Gemini alcanzado. Esperá un momento y volvé a intentar.');
      throw new BadRequestException(errMsg);
    }

    const geminiResponse = await response.json() as any;

    // Extraer texto de la respuesta de Gemini
    const rawText: string =
      geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      throw new BadRequestException(
        'Gemini no devolvió respuesta. El PDF puede estar vacío o no ser legible.',
      );
    }

    // Limpiar y parsear JSON
    const clean = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    try {
      const parsed = JSON.parse(clean) as CvExtracted;
      return parsed;
    } catch {
      // Si no parseó, intentar extraer el JSON del texto
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as CvExtracted;
        } catch {}
      }
      throw new BadRequestException(
        'Gemini no pudo extraer los datos del CV en el formato esperado. Asegurate de subir un PDF con texto legible (no escaneado).',
      );
    }
  }
}