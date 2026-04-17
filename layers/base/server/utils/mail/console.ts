import type { MailService, MailMessage } from '~/server/types/mail'

export class ConsoleMailService implements MailService {
  async send(message: MailMessage): Promise<void> {
    console.log('='.repeat(50))
    console.log('EMAIL (Console Mode)')
    console.log('='.repeat(50))
    console.log(`To: ${message.to}`)
    console.log(`Subject: ${message.subject}`)
    console.log('-'.repeat(50))
    console.log(message.text || message.html)
    console.log('='.repeat(50))
  }
}
