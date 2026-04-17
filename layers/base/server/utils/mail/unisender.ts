import type { MailService, MailMessage } from '~/server/types/mail'

export class UnisenderGoMailService implements MailService {
  private apiKey: string
  private fromEmail: string

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
  }

  async send(message: MailMessage): Promise<void> {
    const response = await fetch('https://go1.unisender.ru/ru/transactional/api/v1/email/send.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify({
        message: {
          recipients: [{ email: message.to }],
          body: {
            html: message.html,
            plaintext: message.text,
          },
          subject: message.subject,
          from_email: this.fromEmail,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Unisender GO API error: ${error}`)
    }
  }
}
