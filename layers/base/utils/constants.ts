// User roles
export const USER_ROLES = ['admin', 'broker', 'investor'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  broker: 'Брокер',
  investor: 'Инвестор',
}

export const USER_ROLE_OPTIONS = USER_ROLES.map(value => ({
  value,
  label: USER_ROLE_LABELS[value],
}))

/** Короткие подписи ролей (для компактных UI-элементов). */
export const USER_ROLE_SHORT_LABELS: Record<UserRole, string> = {
  admin: 'админ',
  broker: 'брокер',
  investor: 'инвестор',
}

/** Путь главной страницы кабинета по роли. */
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: '/admin',
  broker: '/broker',
  investor: '/investor',
}

/** Путь к списку заявок по роли. */
export const ROLE_APPLICATION_PATHS: Record<UserRole, string> = {
  admin: '/admin/applications',
  broker: '/broker/applications',
  investor: '/investor/applications',
}

export const LOGIN_PATH = '/login'

// Роли, доступные для самостоятельной регистрации (админ — только через ручное создание).
export const SELF_REGISTRATION_ROLES = ['broker', 'investor'] as const
export type SelfRegistrationRole = (typeof SELF_REGISTRATION_ROLES)[number]

export const SELF_REGISTRATION_ROLE_OPTIONS = SELF_REGISTRATION_ROLES.map(value => ({
  value,
  label: USER_ROLE_LABELS[value],
}))

// User approval status
export const USER_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type UserApprovalStatus = (typeof USER_APPROVAL_STATUSES)[number]

export const USER_APPROVAL_STATUS_LABELS: Record<UserApprovalStatus, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено',
}

// Application statuses
export const APPLICATION_STATUSES = ['pending', 'approved', 'in_progress', 'completed', 'rejected'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'На проверке',
  approved: 'Одобрена',
  in_progress: 'В работе',
  completed: 'Завершена',
  rejected: 'Отклонена',
}

/**
 * Разрешённые переходы статусов заявки.
 * Источник истины — ТЗ v0.2: pending → approved → in_progress → completed,
 * отклонить можно из pending/approved/in_progress. Терминальные состояния
 * (completed, rejected) необратимы.
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['in_progress', 'rejected'],
  in_progress: ['completed', 'rejected'],
  completed: [],
  rejected: [],
}

export function isAllowedStatusTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return true
  return APPLICATION_STATUS_TRANSITIONS[from].includes(to)
}

// Interest statuses
export const INTEREST_STATUSES = ['new', 'contacted', 'closed'] as const
export type InterestStatus = (typeof INTEREST_STATUSES)[number]

export const INTEREST_STATUS_LABELS: Record<InterestStatus, string> = {
  new: 'Новый',
  contacted: 'Связались',
  closed: 'Закрыт',
}

/**
 * Разрешённые переходы статусов интереса инвестора.
 * new → contacted → closed. Из new можно сразу в closed (если не интересно).
 * closed — терминальное состояние.
 */
export const INTEREST_STATUS_TRANSITIONS: Record<InterestStatus, readonly InterestStatus[]> = {
  new: ['contacted', 'closed'],
  contacted: ['closed'],
  closed: [],
}

export function isAllowedInterestTransition(from: InterestStatus, to: InterestStatus): boolean {
  if (from === to) return true
  return INTEREST_STATUS_TRANSITIONS[from].includes(to)
}

// Loan term
/** Допустимые сроки займа в днях (источник истины для формы брокера). */
export const LOAN_TERM_OPTIONS = [
  { value: 7, label: '7 дней' },
  { value: 14, label: '14 дней' },
  { value: 21, label: '21 день' },
  { value: 30, label: '30 дней' },
] as const

export const LOAN_TERM_DAYS = LOAN_TERM_OPTIONS.map(o => o.value)
export const LOAN_TERM_MIN_DAYS = Math.min(...LOAN_TERM_DAYS)
export const LOAN_TERM_MAX_DAYS = Math.max(...LOAN_TERM_DAYS)
export const LOAN_TERM_DEFAULT_DAYS = 14
/** Короткая текстовая метка диапазона, напр. «7–30». */
export const LOAN_TERM_RANGE_LABEL = `${LOAN_TERM_MIN_DAYS}–${LOAN_TERM_MAX_DAYS}`

// Loan economics
/** Ставка для инвестора — доля от суммы займа за сутки. */
export const DAILY_INTEREST_RATE = 0.01

/** Ожидаемая прибыль инвестора за весь срок займа. */
export function calculateExpectedReturn(amount: number, days: number): number {
  return Math.round(amount * DAILY_INTEREST_RATE * days)
}

/** Доходность за весь срок в процентах (округлено до 0.1). */
export function calculateYieldPercent(amount: number, days: number): number {
  if (!amount) return 0
  const profit = calculateExpectedReturn(amount, days)
  return +((profit / amount) * 100).toFixed(1)
}

/** LTV (loan-to-value) в процентах. */
export function calculateLTV(debt: number, marketValue: number): number {
  if (!marketValue) return 0
  return +((debt / marketValue) * 100).toFixed(1)
}