# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tranzito** — платформа транзитного финансирования для погашения ипотечного долга. Брокеры создают заявки, инвесторы финансируют, администраторы управляют процессом.

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Nuxt 3 with Nuxt Layers
- **UI:** Nuxt UI + custom T-Bank style components
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Drizzle ORM (postgres.js driver)
- **Auth:** JWT
- **Email:** Abstract mail service (SMTP via nodemailer)
- **Package Manager:** pnpm (monorepo)

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build                # Build for production

pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Apply migrations
pnpm db:seed              # Seed test data
pnpm db:studio            # Open Drizzle Studio

docker compose up -d      # Start PostgreSQL
```

## Project Structure

```
tranzitum/
├── app/                      # Main Nuxt app (landing, login)
│   ├── assets/css/main.css   # Global T-Bank styles
│   └── nuxt.config.ts        # Extends all layers
├── layers/
│   ├── base/                 # Shared: components, API, auth, mail
│   ├── broker/               # /broker/* pages
│   ├── investor/             # /investor/* pages
│   └── admin/                # /admin/* pages
├── packages/db/              # Drizzle schema & migrations
└── docker-compose.yml
```

## Architecture

### Nuxt Layers
Each role has isolated pages/layouts. Base layer provides shared functionality.

```typescript
// app/nuxt.config.ts
extends: ['../layers/base', '../layers/broker', '../layers/investor', '../layers/admin']
```

### Route Protection
```vue
<script setup>
definePageMeta({
  layout: 'broker',
  middleware: ['auth', 'role-broker']
})
</script>
```

### Database Schema (Drizzle)
- `users` — id, email, passwordHash, fullName, role, phone, isActive
- `applications` — borrower data, property data, loan params, status
- `documents` — applicationId, fileName, filePath
- `investorInterests` — investorId, applicationId, status
- `statusHistory` — applicationId, oldStatus, newStatus, changedByUserId

Statuses: `pending` → `approved` → `in_progress` → `completed` | `rejected`

### Mail
```typescript
// SMTP via nodemailer (SMTP_HOST/PORT/USER/PASSWORD + MAIL_FROM env)
const mailService = useMailService()
await mailService.send({ to, subject, html })
```

## Custom Components (T-Bank Style)

All prefixed with `T`:
- `TInput` — floating label input
- `TButton` — yellow primary, variants: secondary, outline, ghost, link
- `TStepForm` — multi-step form with progress bar
- `TTabs` — pills, underline, solid variants
- `TFileUpload` — drag & drop file upload
- `TStatusBadge` — application status indicator

## Code Conventions

- Code/comments: English
- UI text: Russian (not hardcoded, use constants)
- Mobile-first (min-width: 320px)
- T-Bank colors: primary `#ffdd2d`, hover `#ffcd33`, pressed `#fab619`

## API Endpoints

```
POST /api/auth/login          # Returns JWT + sets cookie
GET  /api/auth/me             # Current user

GET  /api/applications        # List (filtered by role)
POST /api/applications        # Create (broker, multipart/form-data)
GET  /api/applications/:id    # Details
PATCH /api/applications/:id   # Update status (admin)

GET  /api/users               # List (admin)
POST /api/users               # Create (admin)
PATCH /api/users/:id          # Update (admin)

GET  /api/documents/:id       # Download file
```

## Environment Variables

```env
DATABASE_URL=postgresql://tranzitum:tranzitum@localhost:5432/tranzitum
JWT_SECRET=your-secret
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@tranzitum.ru
SMTP_PASSWORD=...
MAIL_FROM=Tranzitum <noreply@tranzitum.ru>
UPLOAD_DIR=./uploads
ADMIN_EMAIL=admin@tranzitum.ru        # создаётся первым seed
ADMIN_PASSWORD=change-me-min-8       # только для первого seed
```

## Initial admin

`pnpm db:seed` создаёт **единственного** админа из `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
Остальных пользователей (брокеры, инвесторы) создаёт сам админ через UI
(`POST /api/users`, требует роль `admin`). Тестовых аккаунтов в seed нет.

После первого seed `ADMIN_PASSWORD` можно убрать из `.env` — хеш уже лежит в БД.
Смена пароля админа пока только через прямой SQL.
