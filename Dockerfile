# Dockerfile для NestJS Telegram Bot
FROM node:20-alpine AS dependencies

# Устанавливаем зависимости системы
RUN apk add --no-cache libc6-compat

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Настраиваем авторизацию для GitHub Packages
ARG GITHUB_TOKEN
RUN if [ ! -z "$GITHUB_TOKEN" ]; then \
      echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc && \
      echo "@setup-app-repo:registry=https://npm.pkg.github.com" >> .npmrc; \
    fi

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Удаляем .npmrc для безопасности
RUN rm -f .npmrc

# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и устанавливаем все зависимости (включая dev)
COPY package.json package-lock.json ./

# Настраиваем авторизацию для GitHub Packages
ARG GITHUB_TOKEN
RUN if [ ! -z "$GITHUB_TOKEN" ]; then \
      echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc && \
      echo "@setup-app-repo:registry=https://npm.pkg.github.com" >> .npmrc; \
    fi

RUN npm ci

# Удаляем .npmrc для безопасности
RUN rm -f .npmrc

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Продакшн образ
FROM node:20-alpine AS runner

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app

# Устанавливаем зависимости системы
RUN apk add --no-cache curl ffmpeg postgresql-client

# Копируем production зависимости
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Копируем собранное приложение
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Копируем файлы переводов
COPY --from=builder --chown=nestjs:nodejs /app/src/i18n/locales ./dist/locales

# Копируем package.json для метаданных
COPY --chown=nestjs:nodejs package.json ./

# Создаем директорию для логов с правильными правами
RUN mkdir -p /app/logs && chown nestjs:nodejs /app/logs

# Копируем entrypoint скрипт
COPY --chown=root:root docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Фикс прав и возможных CRLF переносов строк
RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh \
  && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

# Используем entrypoint для запуска миграций
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Переключаемся на непривилегированного пользователя
USER nestjs

# Запускаем приложение
CMD ["node", "dist/main.js"] 