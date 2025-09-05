import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver, defineConfig } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

// Общая утилита: парсинг DATABASE_URL
const parseConnectionFromUrl = (urlString: string) => {
  const url = new URL(urlString);
  const dbName = url.pathname.replace(/^\//, '');
  return {
    dbName,
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
  } as const;
};

// Общая утилита: определение режима SSL из окружения
const isSslEnabledFromEnv = (): boolean => {
  return (
    process.env.DATABASE_SSL === 'enabled' ||
    (process.env.DATABASE_SSL !== 'disabled' && process.env.NODE_ENV === 'production')
  );
};

// Общая сборка опций MikroORM
const buildOptions = (databaseUrl: string, sslEnabled: boolean) => {
  const connection = parseConnectionFromUrl(databaseUrl);
  return {
    ...connection,
    driver: PostgreSqlDriver,
    forceUtcTimezone: true,
    driverOptions: {
      connection: {
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? {
              rejectUnauthorized: false,
            }
            : false,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20,
        min: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
      },
    },
    debug: true,
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: './dist/migrations',
      pathTs: './migrations',
    },
  } satisfies Options<PostgreSqlDriver>;
};

// Фабрика для Nest (используется в AppModule)
export function createMikroOrmConfig(config: ConfigService): Options<PostgreSqlDriver> {
  const databaseUrl = config.get<string>('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  return buildOptions(databaseUrl, isSslEnabledFromEnv());
}

// Default экспорт для CLI MikroORM
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig(buildOptions(process.env.DATABASE_URL, isSslEnabledFromEnv()));
