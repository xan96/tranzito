import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'broker', 'investor'])

export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'approved',
  'in_progress',
  'completed',
  'rejected',
])

export const interestStatusEnum = pgEnum('interest_status', [
  'new',
  'contacted',
  'closed',
])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('broker'),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Applications table
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  brokerId: uuid('broker_id')
    .notNull()
    .references(() => users.id),

  // Borrower data
  borrowerName: varchar('borrower_name', { length: 255 }).notNull(),
  borrowerPhone: varchar('borrower_phone', { length: 20 }).notNull(),
  borrowerEmail: varchar('borrower_email', { length: 255 }),

  // Property data
  propertyAddress: text('property_address').notNull(),
  cadastralNumber: varchar('cadastral_number', { length: 50 }),
  marketValue: integer('market_value').notNull(), // in rubles
  currentDebt: integer('current_debt').notNull(), // in rubles
  bankAName: varchar('bank_a_name', { length: 255 }).notNull(),

  // Loan parameters
  requestedAmount: integer('requested_amount').notNull(), // equals currentDebt
  loanTermDays: integer('loan_term_days').notNull(), // 7, 14, 21, 30
  bankBInfo: text('bank_b_info'), // pre-approval info

  // Status
  status: applicationStatusEnum('status').notNull().default('pending'),
  managerComment: text('manager_comment'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
})

// Investor interests table
export const investorInterests = pgTable('investor_interests', {
  id: uuid('id').primaryKey().defaultRandom(),
  investorId: uuid('investor_id')
    .notNull()
    .references(() => users.id),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  status: interestStatusEnum('status').notNull().default('new'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Status history table
export const statusHistory = pgTable('status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  oldStatus: applicationStatusEnum('old_status'),
  newStatus: applicationStatusEnum('new_status').notNull(),
  changedByUserId: uuid('changed_by_user_id')
    .notNull()
    .references(() => users.id),
  comment: text('comment'),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  interests: many(investorInterests),
  statusChanges: many(statusHistory),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  broker: one(users, {
    fields: [applications.brokerId],
    references: [users.id],
  }),
  documents: many(documents),
  interests: many(investorInterests),
  statusHistory: many(statusHistory),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.applicationId],
    references: [applications.id],
  }),
}))

export const investorInterestsRelations = relations(investorInterests, ({ one }) => ({
  investor: one(users, {
    fields: [investorInterests.investorId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [investorInterests.applicationId],
    references: [applications.id],
  }),
}))

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  application: one(applications, {
    fields: [statusHistory.applicationId],
    references: [applications.id],
  }),
  changedBy: one(users, {
    fields: [statusHistory.changedByUserId],
    references: [users.id],
  }),
}))
