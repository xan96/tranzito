import type { MailService, MailTemplate, MailTemplateData } from '~/server/types/mail'
import { SmtpMailService } from './smtp'

let mailService: MailService | null = null

export function useMailService(): MailService {
  if (!mailService) {
    const config = useRuntimeConfig()
    const host = config.smtpHost as string
    const user = config.smtpUser as string
    const password = config.smtpPassword as string
    const port = Number(config.smtpPort) || 465
    const from = (config.mailFrom as string) || user

    if (!host || !user || !password) {
      throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASSWORD are required')
    }

    mailService = new SmtpMailService({ host, port, user, password, from })
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

    case 'user-registration-request': {
      const d = data as MailTemplateData['user-registration-request']
      const roleLabel = d.role === 'broker' ? 'Брокер' : 'Инвестор'
      return {
        subject: `Новая заявка на регистрацию — ${d.fullName}`,
        html: `<p>Поступила новая заявка на регистрацию:</p>
<ul>
  <li><strong>ФИО:</strong> ${escapeHtml(d.fullName)}</li>
  <li><strong>Email:</strong> ${escapeHtml(d.email)}</li>
  <li><strong>Роль:</strong> ${roleLabel}</li>
</ul>
<p>Одобрить или отклонить заявку можно в админке: <a href="${d.adminUrl}">${d.adminUrl}</a></p>`,
        text: `Новая заявка на регистрацию.\nФИО: ${d.fullName}\nEmail: ${d.email}\nРоль: ${roleLabel}\nАдминка: ${d.adminUrl}`,
      }
    }

    case 'user-approved': {
      const d = data as MailTemplateData['user-approved']
      return {
        subject: 'Ваша заявка на регистрацию одобрена',
        html: `<p>Здравствуйте, ${escapeHtml(d.fullName)}!</p>
<p>Ваша заявка на регистрацию в платформе «Tranzitum» одобрена. Теперь вы можете войти в аккаунт.</p>
<p><a href="${d.loginUrl}">${d.loginUrl}</a></p>`,
        text: `Здравствуйте, ${d.fullName}!\nВаша заявка на регистрацию одобрена. Войти: ${d.loginUrl}`,
      }
    }

    case 'user-rejected': {
      const d = data as MailTemplateData['user-rejected']
      const reasonHtml = d.reason ? `<p><strong>Причина:</strong> ${escapeHtml(d.reason)}</p>` : ''
      const reasonText = d.reason ? `\nПричина: ${d.reason}` : ''
      return {
        subject: 'Ваша заявка на регистрацию отклонена',
        html: `<p>Здравствуйте, ${escapeHtml(d.fullName)}!</p>
<p>К сожалению, ваша заявка на регистрацию в платформе «Tranzitum» отклонена.</p>
${reasonHtml}`,
        text: `Здравствуйте, ${d.fullName}!\nК сожалению, ваша заявка на регистрацию отклонена.${reasonText}`,
      }
    }

    default:
      throw new Error(`Unknown mail template: ${template}`)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount)
}
