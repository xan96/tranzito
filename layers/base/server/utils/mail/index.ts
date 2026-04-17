import type { MailService, MailTemplate, MailTemplateData } from '~/server/types/mail'
import { ConsoleMailService } from './console'
import { UnisenderGoMailService } from './unisender'

let mailService: MailService | null = null

export function useMailService(): MailService {
  if (!mailService) {
    const config = useRuntimeConfig()

    switch (config.mailProvider) {
      case 'unisender':
        if (!config.unisenderApiKey) {
          throw new Error('UNISENDER_API_KEY is required when using unisender provider')
        }
        mailService = new UnisenderGoMailService(config.unisenderApiKey, config.mailFrom)
        break
      case 'console':
      default:
        mailService = new ConsoleMailService()
    }
  }

  return mailService
}

// Template renderer
export function renderMailTemplate<T extends MailTemplate>(
  template: T,
  data: MailTemplateData[T]
): { subject: string; html: string; text: string } {
  switch (template) {
    case 'application-created': {
      const d = data as MailTemplateData['application-created']
      return {
        subject: `Новая заявка №${d.applicationId}`,
        html: `<p>Брокер <strong>${d.brokerName}</strong> создал заявку №${d.applicationId} на сумму ${formatMoney(d.amount)} руб.</p>`,
        text: `Брокер ${d.brokerName} создал заявку №${d.applicationId} на сумму ${formatMoney(d.amount)} руб.`,
      }
    }

    case 'application-status-changed': {
      const d = data as MailTemplateData['application-status-changed']
      const comment = d.comment ? `\nКомментарий: ${d.comment}` : ''
      return {
        subject: `Статус заявки №${d.applicationId} изменён`,
        html: `<p>Статус заявки №${d.applicationId} изменён на <strong>${d.newStatus}</strong>.${comment ? `<br/>Комментарий: ${d.comment}` : ''}</p>`,
        text: `Статус заявки №${d.applicationId} изменён на ${d.newStatus}.${comment}`,
      }
    }

    case 'investor-interest': {
      const d = data as MailTemplateData['investor-interest']
      return {
        subject: `Инвестор интересуется заявкой №${d.applicationId}`,
        html: `<p>Инвестор <strong>${d.investorName}</strong> (${d.investorEmail}) интересуется заявкой №${d.applicationId}. Свяжитесь с ним.</p>`,
        text: `Инвестор ${d.investorName} (${d.investorEmail}) интересуется заявкой №${d.applicationId}. Свяжитесь с ним.`,
      }
    }

    case 'application-published': {
      const d = data as MailTemplateData['application-published']
      return {
        subject: `Новая заявка доступна для финансирования`,
        html: `<p>Новая заявка №${d.applicationId} доступна для финансирования: ${formatMoney(d.amount)} руб. на ${d.termDays} дней.</p>`,
        text: `Новая заявка №${d.applicationId} доступна для финансирования: ${formatMoney(d.amount)} руб. на ${d.termDays} дней.`,
      }
    }

    default:
      throw new Error(`Unknown mail template: ${template}`)
  }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount)
}
