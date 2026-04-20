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
}
