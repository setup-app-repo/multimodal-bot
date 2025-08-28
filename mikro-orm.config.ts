import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';


export function createMikroOrmConfig(config: ConfigService): Options<PostgreSqlDriver> {
  return {
    dbName: config.get<string>('DB_NAME') || 'multimodal_bot',
    user: config.get<string>('DB_USER') || 'user',
    password: config.get<string>('DB_PASSWORD') || 'user',
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
