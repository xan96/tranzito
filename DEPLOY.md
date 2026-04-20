# Deploy

Один сервер, одно окружение, всё в одном `docker-compose.yml`.

| Где     | Что                          |
|---------|------------------------------|
| Домен   | tranzitum.ru                 |
| Сервер  | `/opt/tranzitum`             |
| Ветка   | `main`                       |
| Деплой  | `./scripts/deploy.sh` руками |

Стек:

```
┌────────────── internet ──────────────┐
              │ 80/443
┌─────────────▼──────────────┐
│ caddy  (TLS, reverse proxy)│  tranzitum.ru
└─┬──────────────────────────┘
  │ compose net
  │
┌─▼─────────────┐   ┌─────────────┐   ┌────────────┐
│ app (Nuxt)    │◄──┤ postgres    │◄──┤ backup     │
└───────────────┘   └─────────────┘   └────────────┘
        │
     uploads (volume)
```

---

## 1. Подготовка сервера (один раз)

```bash
ssh root@<server-ip>

apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw gnupg lsb-release

# Firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker run --rm hello-world   # проверка
```

## 2. DNS

A-запись у регистратора:

```
tranzitum.ru.   A   <server-ip>
```

Проверь:
```bash
dig +short tranzitum.ru   # должно вернуть <server-ip>
```

Без этого Let's Encrypt не выдаст сертификат.

## 3. Первый запуск

```bash
# Клонируем репу (ветка main)
git clone -b main <repo-url> /opt/tranzitum
cd /opt/tranzitum

# Готовим .env
cp .env.prod.example .env
nano .env
# - DOMAIN:            tranzitum.ru
# - ACME_EMAIL:        твой email для Let's Encrypt
# - POSTGRES_PASSWORD: openssl rand -base64 24
# - JWT_SECRET:        openssl rand -hex 32
# - SMTP_HOST:         smtp.yandex.ru (или другой SMTP)
# - SMTP_USER:         noreply@tranzitum.ru
# - SMTP_PASSWORD:     пароль приложения (id.yandex.ru → Пароли приложений)
# - MAIL_FROM:         Tranzitum <noreply@tranzitum.ru>
# - ADMIN_EMAIL:       свой email
# - ADMIN_PASSWORD:    придумай минимум 8 символов (можно удалить после seed)

# Каталог под бэкапы
mkdir -p backups

# Собрать образ и поднять postgres
docker compose build app
docker compose up -d postgres

# Применить миграции
docker compose run --rm app sh -c "cd packages/db && npx drizzle-kit migrate"

# Создать начального админа
docker compose run --rm app sh -c "cd packages/db && npx tsx src/seed.ts"

# Поднять всё (app + caddy + backup)
docker compose up -d

# Проверка
docker compose ps
docker compose logs -f app
```

Caddy увидит домен, за 15–30 сек выпустит сертификат. Открой `https://tranzitum.ru`.

После успешного seed можно убрать `ADMIN_PASSWORD` из `.env` — хеш уже в БД.

## 4. Регулярный деплой

Новый код идёт в ветку `main`. На сервере:

```bash
cd /opt/tranzitum
./scripts/deploy.sh
# → git fetch, checkout main, pull, build, migrate, restart
```

## 5. Операции с БД

Консоль:
```bash
cd /opt/tranzitum
docker compose exec postgres psql -U tranzitum tranzitum
```

Ручной дамп:
```bash
docker compose exec postgres pg_dump -U tranzitum -Fc tranzitum > backups/manual_$(date +%F).dump
```

Восстановление:
```bash
./scripts/backup-restore.sh backups/tranzitum_20260417_030000.dump
```

Скачать дамп на локалку:
```bash
scp root@<server-ip>:/opt/tranzitum/backups/tranzitum_*.dump ./
```

Авто-бэкап: сервис `backup` делает `pg_dump -Fc` раз в сутки в `./backups/tranzitum_YYYYMMDD_HHMMSS.dump`, хранит `BACKUP_KEEP_DAYS` дней.

## 6. Загруженные файлы

Volume `tranzitum_uploads` монтируется в `/app/uploads`. Бэкап:
```bash
docker run --rm \
  -v tranzitum_uploads:/src \
  -v /opt/tranzitum/backups:/dst \
  alpine tar czf /dst/uploads_$(date +%F).tar.gz -C /src .
```

## 7. Миграции

Локально:
```bash
pnpm db:generate
git add packages/db/migrations
git commit -m "migration: ..."
git push origin main       # → приедет на сервер через deploy.sh
```

На сервере миграции выполняет `deploy.sh` автоматически.

## 8. Мониторинг / диагностика

```bash
cd /opt/tranzitum

docker compose ps
docker compose logs -f app
docker compose logs -f caddy
docker stats --no-stream
```

## 9. Типичные проблемы

**`DATABASE_URL` не работает.** Хост в `DATABASE_URL` внутри compose — `postgres` (service-имя), не `localhost`.

**`POSTGRES_PASSWORD` менял в `.env`, авторизация всё равно не работает.** `POSTGRES_PASSWORD` применяется только при **первой** инициализации volume. Меняй пароль через SQL:
```bash
docker compose exec postgres psql -U tranzitum -c \
  "ALTER USER tranzitum WITH PASSWORD 'новый';"
```

**OOM при сборке.** Nuxt build прожорлив. На 1 ГБ VPS может падать. Лечение — swap или собрать образ локально и пушить через registry.

**Сертификат Let's Encrypt не выпускается.**
1. A-запись указывает на IP сервера (`dig +short tranzitum.ru`).
2. 80 и 443 открыты извне (`nmap -p 80,443 <server-ip>` с другой машины).
3. На 80/443 слушает Caddy, а не apache/nginx (`ss -tlnp | grep -E ':80|:443'`).
4. `ACME_EMAIL` в `.env` валидный.

**Сменить домен или email ACME.** Поменять в `.env` и `docker compose up -d caddy` — Caddy подхватит.
