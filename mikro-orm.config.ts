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
    driverOptions: {
      connection: {
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      },
    },
    debug: true,
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: './dist/migrations',
      pathTs: './src/migrations',
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
