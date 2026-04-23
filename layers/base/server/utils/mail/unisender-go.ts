import type { MailService, MailMessage } from '~/server/types/mail'

export interface UnisenderGoConfig {
  apiKey: string
  /** Например `Tranzitum <noreply@tranzitum.ru>` или просто `noreply@tranzitum.ru`. */
  from: string
  /** Базовый URL API. По умолчанию — EU-instance. */
  baseUrl?: string
}

interface SuccessResponse {
  status: 'success'
  job_id: string
  emails: string[]
}

interface ErrorResponse {
  status: 'error'
  message?: string
  code?: number
}

/**
 * Отправка через HTTP API Unisender Go — используется на проде, где
 * исходящие SMTP-порты (25/465/587) блокируются провайдером VPS.
 * HTTPS 443 открыт везде.
 *
 * API: https://godocs.unisender.ru/web-api-ref#email-send
 */
export class UnisenderGoMailService implements MailService {
  private readonly apiKey: string
  private readonly from: { email: string; name?: string }
  private readonly endpoint: string

  constructor(config: UnisenderGoConfig) {
    this.apiKey = config.apiKey
    this.from = parseFrom(config.from)
    const base = (config.baseUrl || 'https://goapi.unisender.ru').replace(/\/+$/, '')
    this.endpoint = `${base}/ru/transactional/api/v1/email/send.json`
  }

  async send(message: MailMessage): Promise<void> {
    const body = {
      message: {
        recipients: [{ email: message.to }],
        body: {
          html: message.html,
          plaintext: message.text ?? stripHtml(message.html),
        },
        subject: message.subject,
        from_email: this.from.email,
        ...(this.from.name ? { from_name: this.from.name } : {}),
      },
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify(body),
      // Fail fast — не ждём дольше 15s на сетевые проблемы.
      signal: AbortSignal.timeout(15_000),
    })

    const text = await res.text()
    let parsed: SuccessResponse | ErrorResponse | null = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      // Оставляем parsed = null — обработаем как HTTP-ошибку ниже.
    }

    if (!res.ok || !parsed || parsed.status !== 'success') {
      const err = parsed as ErrorResponse | null
      const detail = err?.message || text || res.statusText
      const code = err?.code ?? res.status
      throw new Error(`Unisender Go send failed (${code}): ${detail}`)
    }
  }

  notify(message: MailMessage | MailMessage[], context = 'mail'): void {
    const messages = Array.isArray(message) ? message : [message]
    if (!messages.length) return
    void (async () => {
      const results = await Promise.allSettled(messages.map(m => this.send(m)))
      for (const r of results) {
        if (r.status === 'rejected') {
          console.error(`[${context}] mail send failed:`, r.reason)
        }
      }
    })()
  }
}

/**
 * `Name <email@host>` → { name, email }; `email@host` → { email }.
 */
function parseFrom(raw: string): { email: string; name?: string } {
  const m = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/)
  if (m) return { name: m[1] || undefined, email: m[2]! }
  return { email: raw.trim() }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
