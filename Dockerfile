# ---------- base ----------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY app/package.json ./app/
COPY packages/db/package.json ./packages/db/
COPY layers/base/package.json ./layers/base/
COPY layers/broker/package.json ./layers/broker/
COPY layers/investor/package.json ./layers/investor/
COPY layers/admin/package.json ./layers/admin/
RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM base AS builder
COPY --from=deps /app ./
COPY . .
RUN pnpm build

# ---------- runner ----------
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# Nuxt build output
COPY --from=builder /app/app/.output ./.output

# DB package + migrations + seed (для выполнения миграций из контейнера)
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
