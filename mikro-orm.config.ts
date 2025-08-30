import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver, defineConfig } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

export function createMikroOrmConfig(config: ConfigService): Options<PostgreSqlDriver> {
  return {
    dbName: config.get<string>('DB_NAME'),
    user: config.get<string>('DB_USER'),
    password: config.get<string>('DB_PASSWORD'),
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

const defaultConfig = defineConfig({
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  debug: true,
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './migrations',
  },
});

export default defaultConfig;
