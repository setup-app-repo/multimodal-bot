#!/bin/sh
set -e

echo "🚀 Starting Multimodal Bot..."

# Извлекаем параметры из DATABASE_URL для pg_isready
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^/:]*\)[/:].*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:@]*\)[:@].*/\1/p')

# Если порт не найден, используем порт по умолчанию для PostgreSQL
if [ -z "$DB_PORT" ]; then
  DB_PORT="5432"
fi

echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" >/dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping (trying $DB_HOST:$DB_PORT with user $DB_USER)"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Устанавливаем SSL режим для миграций на основе DATABASE_SSL
case "${DATABASE_SSL:-auto}" in
  "enabled")
    export PGSSLMODE="require"
    echo "🔒 SSL для миграций: ВКЛЮЧЕН (принудительно)"
    ;;
  "disabled") 
    export PGSSLMODE="disable"
    echo "🔓 SSL для миграций: ВЫКЛЮЧЕН (принудительно)"
    ;;
  "auto"|*)
    if [ "${NODE_ENV}" = "production" ]; then
      export PGSSLMODE="require"
      echo "🔒 SSL для миграций: ВКЛЮЧЕН (auto: production)"
    else
      export PGSSLMODE="prefer"
      echo "🔓 SSL для миграций: ПРЕДПОЧТИТЕЛЬНО (auto: development)"
    fi
    ;;
esac

# Дополнительная защита от ошибок SSL сертификатов (только для миграций)
if [ "${DATABASE_SSL}" = "enabled" ] || { [ "${DATABASE_SSL:-auto}" = "auto" ] && [ "${NODE_ENV}" = "production" ]; }; then
  echo "⚠️  Отключаем строгую проверку TLS сертификатов для миграций"
  export NODE_TLS_REJECT_UNAUTHORIZED=0
fi

echo "✅ PostgreSQL is ready!"

# Запускаем миграции
echo "🔄 Running database migrations..."
npm run migration:up

# Восстанавливаем строгую проверку TLS после миграций
if [ -n "${NODE_TLS_REJECT_UNAUTHORIZED}" ]; then
  unset NODE_TLS_REJECT_UNAUTHORIZED
  echo "✅ Строгая проверка TLS восстановлена"
fi


echo "✅ Migrations completed!"

# Запускаем основное приложение
echo "🎯 Starting application..."
exec "$@" 