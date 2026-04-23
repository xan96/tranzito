import nodemailer, { type Transporter } from 'nodemailer'
import type { MailService, MailMessage } from '~/server/types/mail'

export interface SmtpConfig {
  host: string
  port: number
  user: string
  password: string
  from: string
}

export class SmtpMailService implements MailService {
  private transporter: Transporter
  private from: string

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // Implicit TLS on 465, STARTTLS on 587/25.
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
      // Fail fast on SMTP issues — defaults are 2 min / 10 min and can
      // freeze HTTP handlers awaiting mail.send().
      connectionTimeout: 10_000,
      greetingTimeout: 5_000,
      socketTimeout: 15_000,
    })
    this.from = config.from
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
  }

  notify(message: MailMessage | MailMessage[], context = 'mail'): void {
    const messages = Array.isArray(message) ? message : [message]
    if (!messages.length) return

    // Fire-and-forget: HTTP-ответ не ждёт SMTP.
    void (async () => {
      const results = await Promise.allSettled(
        messages.map(m => this.send(m)),
      )
      for (const r of results) {
        if (r.status === 'rejected') {
          console.error(`[${context}] mail send failed:`, r.reason)
        }
      }
    })()
  }
}
