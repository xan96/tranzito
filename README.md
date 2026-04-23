# Tranzitum

Платформа транзитного финансирования для сделок с недвижимостью.

## О проекте

Tranzitum помогает погасить ипотечный долг и снять обременение для продажи или рефинансирования недвижимости. Платформа связывает брокеров, которые подают заявки от заёмщиков, с инвесторами, предоставляющими краткосрочное финансирование (7-30 дней).

### Роли

- **Брокер** — создаёт заявки, загружает документы, отслеживает статус
- **Инвестор** — просматривает одобренные заявки, выбирает для финансирования
- **Администратор** — проверяет заявки, управляет пользователями, меняет статусы

## Технологии

- **Frontend:** Nuxt 3, Vue 3, Nuxt UI, Tailwind CSS
- **Backend:** Nitro (server engine)
- **Database:** PostgreSQL, Drizzle ORM
- **Auth:** JWT
- **Architecture:** Monorepo с Nuxt Layers

## Требования

- Node.js 20+
- pnpm 9+
- Docker (для PostgreSQL)

## Установка

```bash
# Клонирование репозитория
git clone <repo-url>
cd tranzitum

# Установка зависимостей
pnpm install

# Копирование env файла
cp .env.example .env
```

## Запуск

```bash
# 1. Запуск PostgreSQL
docker compose up -d

# 2. Генерация и применение миграций
pnpm db:generate
pnpm db:migrate

# 3. Заполнение тестовыми данными (опционально)
pnpm db:seed

# 4. Запуск dev сервера
pnpm dev
```

Приложение будет доступно на http://localhost:3000

## Начальный админ

`pnpm db:seed` создаёт **только** админа. Email и пароль берутся из `.env`:

```env
ADMIN_EMAIL=admin@tranzitum.ru
ADMIN_PASSWORD=my-strong-password-8+-chars
```

Остальных пользователей (брокеров, инвесторов) админ создаёт сам из UI.
После первого seed `ADMIN_PASSWORD` из `.env` можно убрать.

## Команды

```bash
pnpm dev              # Запуск dev сервера
pnpm build            # Сборка для production
pnpm preview          # Просмотр production сборки

pnpm db:generate      # Генерация миграций Drizzle
pnpm db:migrate       # Применение миграций
pnpm db:studio        # Открыть Drizzle Studio
pnpm db:seed          # Заполнить БД тестовыми данными
```

## Структура проекта

```
tranzitum/
├── app/                      # Главное Nuxt приложение
│   ├── pages/                # Лендинг, логин
│   ├── assets/css/           # Глобальные стили
│   └── nuxt.config.ts
│
├── layers/
│   ├── base/                 # Общий слой
│   │   ├── components/ui/    # UI компоненты (TInput, TButton, etc.)
│   │   ├── composables/      # useAuth, useApi
│   │   ├── server/api/       # API endpoints
│   │   └── server/utils/     # DB, Auth, Mail utilities
│   │
│   ├── broker/               # Слой брокера
│   │   ├── pages/broker/     # Страницы брокера
│   │   └── layouts/          # Layout брокера
│   │
│   ├── investor/             # Слой инвестора
│   │   ├── pages/investor/   # Витрина заявок
│   │   └── layouts/
│   │
│   └── admin/                # Слой администратора
│       ├── pages/admin/      # Управление заявками и пользователями
│       └── layouts/
│
├── packages/
│   └── db/                   # Drizzle ORM
│       ├── src/schema/       # Схема БД
│       └── migrations/       # Миграции
│
├── uploads/                  # Загруженные файлы (gitignored)
├── docker-compose.yml        # PostgreSQL
└── pnpm-workspace.yaml
```

## Переменные окружения

```env
# Database
DATABASE_URL=postgresql://tranzitum:tranzitum@localhost:5432/tranzitum

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Mail (SMTP — Unisender Go)
SMTP_HOST=smtp.go2.unisender.ru
SMTP_PORT=587
SMTP_USER=<логин из кабинета go2.unisender.ru>
SMTP_PASSWORD=<пароль из кабинета go2.unisender.ru>
MAIL_FROM=Tranzitum <noreply@tranzitum.ru>

# Files
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760       # 10MB

# App
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

## API

### Аутентификация

```
POST /api/auth/login     # Вход
POST /api/auth/logout    # Выход
GET  /api/auth/me        # Текущий пользователь
```

### Заявки

```
GET  /api/applications        # Список заявок (фильтр по роли)
POST /api/applications        # Создать заявку (брокер)
GET  /api/applications/:id    # Детали заявки
PATCH /api/applications/:id   # Обновить статус (админ)
POST /api/applications/:id/interest  # Проявить интерес (инвестор)
```

### Пользователи (только админ)

```
GET  /api/users          # Список пользователей
POST /api/users          # Создать пользователя
PATCH /api/users/:id     # Обновить пользователя
```

### Документы

```
GET /api/documents/:id   # Скачать документ
```

## Дизайн

UI выполнен в стиле T-Bank:
- Основной цвет: `#ffdd2d` (жёлтый)
- Border-radius: 8px (кнопки), 12-16px (карточки)
- Плавающие лейблы в инпутах
- Mobile-first адаптация

## Лицензия

Proprietary
