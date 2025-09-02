import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver, defineConfig } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

export function createMikroOrmConfig(config: ConfigService): Options<PostgreSqlDriver> {
  const databaseUrl = config.get<string>('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const connectionFromUrl = (urlString: string) => {
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

  const connection = connectionFromUrl(databaseUrl);

  return {
    ...connection,
    driver: PostgreSqlDriver,
    debug: true,
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: './migrations',
    },
  };
}

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

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const defaultConfig = defineConfig({
  ...parseConnectionFromUrl(process.env.DATABASE_URL),
  debug: true,
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './migrations',
  },
});

export default defaultConfig;
