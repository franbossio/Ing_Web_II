import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const apiKey   = this.config.get<string>('BREVO_API_KEY');
    const frontUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5500');
    const fromAddr = this.config.get<string>('MAIL_FROM', 'noreply@talentai.com');
    const fromName = this.config.get<string>('MAIL_FROM_NAME', 'TalentAI');

    const verifyUrl = `${frontUrl}/pages/verify-email.html?token=${token}`;

    const payload = {
      sender:      { name: fromName, email: fromAddr },
      to:          [{ email: to }],
      subject:     'Verificá tu cuenta en TalentAI',
      htmlContent: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#16181f;border-radius:12px;border:1px solid #2a2d38;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1c24,#23263a);padding:32px 40px;text-align:center;border-bottom:1px solid #2a2d38;">
            <h1 style="color:#c9a84c;font-size:1.5rem;margin:8px 0 0;letter-spacing:0.05em;">TalentAI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#f0e6c8;font-size:1.2rem;margin:0 0 12px;">Bienvenido/a a TalentAI</h2>
            <p style="color:#a0a4b0;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">
              Gracias por registrarte. Para activar tu cuenta, verifica tu email haciendo clic en el boton de abajo.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${verifyUrl}" style="display:inline-block;background:#c9a84c;color:#0f1117;font-weight:700;font-size:0.95rem;text-decoration:none;padding:14px 36px;border-radius:8px;">
                  Verificar mi cuenta
                </a>
              </td></tr>
            </table>
            <p style="color:#606474;font-size:0.78rem;line-height:1.5;margin:28px 0 0;text-align:center;">
              Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mail.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2d38;text-align:center;">
            <p style="color:#404456;font-size:0.72rem;margin:0;">2025 TalentAI</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: {
        'api-key':      apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Brevo error (${res.status}): ${err}`);
      this.logger.error(`Payload sender: ${fromAddr}, to: ${to}`);
      throw new Error('No se pudo enviar el email de verificacion');
    }

    this.logger.log(`Verificacion enviada a ${to} - status ${res.status}`);
  }
}