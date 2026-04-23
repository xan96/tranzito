import type { MailService, MailTemplate, MailTemplateData } from '~/server/types/mail'
import { UnisenderGoMailService } from './unisender-go'
import { USER_ROLE_LABELS } from '../../../utils/constants'

let mailService: MailService | null = null

/**
 * Отправка почты через HTTP API Unisender Go.
 * SMTP не используется — на VPS исходящие SMTP-порты (25/465/587)
 * как правило заблокированы, HTTPS 443 — всегда открыт.
 */
export function useMailService(): MailService {
  if (!mailService) {
    const config = useRuntimeConfig()
    const apiKey = (config.unisenderApiKey as string | undefined) || ''
    const from = (config.mailFrom as string) || ''
    if (!apiKey) throw new Error('UNISENDER_API_KEY is required')
    if (!from) throw new Error('MAIL_FROM is required')
    mailService = new UnisenderGoMailService({ apiKey, from })
  }

  return mailService
}

// ---------- Layout ----------

interface LayoutOptions {
  /** Текст под заголовком письма в жёлтой шапке. */
  preheader: string
  /** Заголовок основной части (h1). */
  heading: string
  /** HTML основного содержимого — параграфы, списки, таблицы. */
  content: string
  /** CTA-кнопка (необязательная). */
  cta?: { label: string; url: string }
  /** Короткий текст внизу над отпиской — контекст, почему получатель получил письмо. */
  footerNote?: string
}

const BRAND = {
  name: 'Tranzitum',
  primary: '#ffdd2d',
  primaryText: '#1a1a1a',
  bg: '#f5f6f8',
  card: '#ffffff',
  text: '#1a1a1a',
  muted: '#6b7280',
  border: '#e5e7eb',
}

function renderLayout(opts: LayoutOptions): string {
  const preheader = escapeHtml(opts.preheader)
  const heading = escapeHtml(opts.heading)
  const note = opts.footerNote ? escapeHtml(opts.footerNote) : ''
  const ctaHtml = opts.cta
    ? `
      <tr>
        <td style="padding: 8px 0 24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td bgcolor="${BRAND.primary}" style="border-radius: 8px;">
                <a href="${opts.cta.url}"
                   style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; font-weight: 600; color: ${BRAND.primaryText}; text-decoration: none; border-radius: 8px;">
                  ${escapeHtml(opts.cta.label)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: ${BRAND.text};">
  <!-- Preheader (прячется, но виден в списке писем) -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.bg};">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 16px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 12px 20px; background: ${BRAND.primary}; border-radius: 12px; font-size: 20px; font-weight: 700; color: ${BRAND.primaryText};">
                    ${BRAND.name}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 0 0 16px 0; font-size: 22px; font-weight: 600; line-height: 1.3; color: ${BRAND.text};">
                    ${heading}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 15px; line-height: 1.6; color: ${BRAND.text};">
                    ${opts.content}
                  </td>
                </tr>
                ${ctaHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 20px 0 20px; font-size: 13px; line-height: 1.5; color: ${BRAND.muted};">
              ${note ? `<p style="margin: 0 0 8px 0;">${note}</p>` : ''}
              <p style="margin: 0;">
                Платформа транзитного финансирования «${BRAND.name}».<br>
                Если у вас есть вопросы, напишите нам на
                <a href="mailto:support@tranzitum.ru" style="color: ${BRAND.muted};">support@tranzitum.ru</a>.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------- Templates ----------

export function renderMailTemplate<T extends MailTemplate>(
  template: T,
  data: MailTemplateData[T]
): { subject: string; html: string; text: string } {
  switch (template) {
    case 'application-created': {
      const d = data as MailTemplateData['application-created']
      const amount = formatMoney(d.amount)
      const subject = `Новая заявка №${d.applicationId}`
      const content = `
        <p style="margin: 0 0 12px 0;">Брокер <strong>${escapeHtml(d.brokerName)}</strong> создал новую заявку.</p>
        ${infoTable([
          ['Номер заявки', `№${d.applicationId}`],
          ['Сумма', `${amount} ₽`],
        ])}`
      return {
        subject,
        html: renderLayout({
          preheader: `Брокер ${d.brokerName} — ${amount} ₽`,
          heading: subject,
          content,
          footerNote: 'Вы получили это письмо как администратор платформы Tranzitum.',
        }),
        text: `Брокер ${d.brokerName} создал заявку №${d.applicationId} на сумму ${amount} руб.`,
      }
    }

    case 'application-status-changed': {
      const d = data as MailTemplateData['application-status-changed']
      const subject = `Статус заявки №${d.applicationId} изменён`
      const content = `
        <p style="margin: 0 0 12px 0;">Статус заявки №${d.applicationId} обновлён.</p>
        ${infoTable([
          ['Новый статус', escapeHtml(d.newStatus)],
          ...(d.comment ? [['Комментарий', escapeHtml(d.comment)]] as [string, string][] : []),
        ])}`
      return {
        subject,
        html: renderLayout({
          preheader: `Новый статус: ${d.newStatus}`,
          heading: subject,
          content,
        }),
        text: `Статус заявки №${d.applicationId} изменён на ${d.newStatus}.${d.comment ? `\nКомментарий: ${d.comment}` : ''}`,
      }
    }

    case 'investor-interest': {
      const d = data as MailTemplateData['investor-interest']
      const subject = `Инвестор интересуется заявкой №${d.applicationId}`
      const content = `
        <p style="margin: 0 0 12px 0;">По вашей заявке №${d.applicationId} поступил запрос от инвестора. Свяжитесь с ним напрямую.</p>
        ${infoTable([
          ['Инвестор', escapeHtml(d.investorName)],
          ['Email', escapeHtml(d.investorEmail)],
        ])}`
      return {
        subject,
        html: renderLayout({
          preheader: `${d.investorName} — ${d.investorEmail}`,
          heading: subject,
          content,
        }),
        text: `Инвестор ${d.investorName} (${d.investorEmail}) интересуется заявкой №${d.applicationId}.`,
      }
    }

    case 'application-published': {
      const d = data as MailTemplateData['application-published']
      const amount = formatMoney(d.amount)
      const subject = `Новая заявка доступна для финансирования`
      const content = `
        <p style="margin: 0 0 12px 0;">На платформе появилась новая заявка, которую можно профинансировать.</p>
        ${infoTable([
          ['Номер заявки', `№${d.applicationId}`],
          ['Сумма', `${amount} ₽`],
          ['Срок', `${d.termDays} дней`],
        ])}`
      return {
        subject,
        html: renderLayout({
          preheader: `${amount} ₽ на ${d.termDays} дней`,
          heading: subject,
          content,
          footerNote: 'Вы получили это письмо как инвестор платформы Tranzitum.',
        }),
        text: `Новая заявка №${d.applicationId} доступна для финансирования: ${amount} руб. на ${d.termDays} дней.`,
      }
    }

    case 'user-registration-request': {
      const d = data as MailTemplateData['user-registration-request']
      const roleLabel = USER_ROLE_LABELS[d.role]
      const subject = `Новая заявка на регистрацию — ${d.fullName}`
      const content = `
        <p style="margin: 0 0 12px 0;">Поступила новая заявка на регистрацию на платформе.</p>
        ${infoTable([
          ['ФИО', escapeHtml(d.fullName)],
          ['Email', escapeHtml(d.email)],
          ['Тип аккаунта', roleLabel],
        ])}
        <p style="margin: 16px 0 0 0;">Проверьте данные и примите решение в админке.</p>`
      return {
        subject,
        html: renderLayout({
          preheader: `${d.fullName} — ${roleLabel}`,
          heading: subject,
          content,
          cta: { label: 'Открыть админку', url: d.adminUrl },
          footerNote: 'Вы получили это письмо как администратор платформы Tranzitum.',
        }),
        text: `Новая заявка на регистрацию.\nФИО: ${d.fullName}\nEmail: ${d.email}\nРоль: ${roleLabel}\nАдминка: ${d.adminUrl}`,
      }
    }

    case 'user-approved': {
      const d = data as MailTemplateData['user-approved']
      const roleLabel = USER_ROLE_LABELS[d.role]
      const subject = 'Заявка на регистрацию одобрена'
      const content = `
        <p style="margin: 0 0 12px 0;">Здравствуйте, ${escapeHtml(d.fullName)}!</p>
        <p style="margin: 0 0 16px 0;">Ваша заявка на регистрацию на платформе «${BRAND.name}» одобрена. Теперь вы можете войти в свой аккаунт и начать работу.</p>
        ${infoTable([['Тип аккаунта', roleLabel]])}`
      return {
        subject,
        html: renderLayout({
          preheader: `${roleLabel} — вход в Tranzitum открыт`,
          heading: subject,
          content,
          cta: { label: 'Войти в аккаунт', url: d.loginUrl },
          footerNote: 'Вы получили это письмо, потому что отправили заявку на регистрацию на tranzitum.ru.',
        }),
        text: `Здравствуйте, ${d.fullName}!\n\nВаша заявка на регистрацию на платформе Tranzitum одобрена.\nТип аккаунта: ${roleLabel}\nВойти: ${d.loginUrl}`,
      }
    }

    case 'user-rejected': {
      const d = data as MailTemplateData['user-rejected']
      const roleLabel = USER_ROLE_LABELS[d.role]
      const tableRows: Array<[string, string]> = [['Тип аккаунта', roleLabel]]
      if (d.reason) tableRows.push(['Причина', escapeHtml(d.reason)])
      const subject = 'Заявка на регистрацию отклонена'
      const content = `
        <p style="margin: 0 0 12px 0;">Здравствуйте, ${escapeHtml(d.fullName)}!</p>
        <p style="margin: 0 0 12px 0;">К сожалению, ваша заявка на регистрацию на платформе «${BRAND.name}» отклонена.</p>
        ${infoTable(tableRows)}
        <p style="margin: 16px 0 0 0;">Если это ошибка — напишите нам на <a href="mailto:support@tranzitum.ru" style="color: ${BRAND.text};">support@tranzitum.ru</a>.</p>`
      return {
        subject,
        html: renderLayout({
          preheader: `${roleLabel} — заявка отклонена`,
          heading: subject,
          content,
          footerNote: 'Вы получили это письмо, потому что отправили заявку на регистрацию на tranzitum.ru.',
        }),
        text: `Здравствуйте, ${d.fullName}!\n\nК сожалению, ваша заявка на регистрацию на платформе Tranzitum отклонена.\nТип аккаунта: ${roleLabel}${d.reason ? `\nПричина: ${d.reason}` : ''}`,
      }
    }

    default:
      throw new Error(`Unknown mail template: ${template}`)
  }
}

// ---------- Helpers ----------

function infoTable(rows: Array<[string, string]>): string {
  const trs = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.muted}; font-size: 13px; width: 40%;">${escapeHtml(label)}</td>
        <td style="padding: 8px 0 8px 12px; border-bottom: 1px solid ${BRAND.border}; font-size: 14px; color: ${BRAND.text};">${value}</td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 8px 0;">${trs}</table>`
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
