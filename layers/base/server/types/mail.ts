export interface MailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface MailService {
  /**
   * Блокирующая отправка. Бросает исключение при неудаче.
   * Используется только если вызывающему важен результат (редко).
   */
  send(message: MailMessage): Promise<void>

  /**
   * Fire-and-forget отправка одного или нескольких писем.
   * Не блокирует HTTP-ответ, ошибки логируются в консоль.
   * Используется для всех пользовательских уведомлений.
   *
   * @param context короткое имя места вызова для лога, например 'users/approve'
   */
  notify(message: MailMessage | MailMessage[], context?: string): void
}

export type MailTemplate =
  | 'application-created'
  | 'application-status-changed'
  | 'investor-interest'
  | 'application-published'
  | 'user-registration-request'
  | 'user-approved'
  | 'user-rejected'

export interface MailTemplateData {
  'application-created': {
    brokerName: string
    applicationId: string
    amount: number
  }
  'application-status-changed': {
    applicationId: string
    newStatus: string
    comment?: string
  }
  'investor-interest': {
    investorName: string
    investorEmail: string
    applicationId: string
  }
  'application-published': {
    applicationId: string
    amount: number
    termDays: number
  }
  'user-registration-request': {
    email: string
    fullName: string
    role: 'broker' | 'investor'
    adminUrl: string
  }
  'user-approved': {
    fullName: string
    loginUrl: string
  }
  'user-rejected': {
    fullName: string
    reason?: string
  }
}
