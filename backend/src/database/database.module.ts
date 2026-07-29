import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'PG_CONNECTION',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const rawHost = configService.get<string>('DATABASE_HOST');
        const rawUser = configService.get<string>('DATABASE_USER');
        const rawDb = configService.get<string>('DATABASE_NAME');

        const isCloudEnv =
          !!process.env.K_SERVICE || process.env.NODE_ENV === 'production';
        const isLocalHost =
          !rawHost || rawHost === '127.0.0.1' || rawHost === 'localhost';

        const host = isCloudEnv || isLocalHost ? '34.31.112.238' : rawHost;
        const user =
          isCloudEnv || !rawUser || rawUser === 'pino_app'
            ? 'postgres'
            : rawUser;
        const password =
          isCloudEnv || !configService.get<string>('DATABASE_PASSWORD')
            ? 'Pino2CloudSQL2026!'
            : configService.get<string>('DATABASE_PASSWORD');
        const database =
          isCloudEnv || !rawDb || rawDb === 'sistema_de_inventario'
            ? 'studio-9680180520-dbbe0-db'
            : rawDb;

        const pool = new Pool({
          host,
          port: Number(configService.get<string>('DATABASE_PORT') || 5432),
          user,
          password,
          database,
          application_name:
            configService.get<string>('DATABASE_APP_NAME') || 'pino-backend',
          keepAlive: true,
          max: Number(configService.get<string>('DATABASE_POOL_MAX') || 20),
          idleTimeoutMillis: Number(
            configService.get<string>('DATABASE_IDLE_TIMEOUT_MS') || 30000,
          ),
          connectionTimeoutMillis: Number(
            configService.get<string>('DATABASE_CONNECTION_TIMEOUT_MS') || 10000,
          ),
          statement_timeout: Number(
            configService.get<string>('DATABASE_STATEMENT_TIMEOUT_MS') || 0,
          ),
          query_timeout: Number(
            configService.get<string>('DATABASE_QUERY_TIMEOUT_MS') || 0,
          ),
        });

        return pool;
      },
    },
    DatabaseService,
  ],
  exports: ['PG_CONNECTION', DatabaseService],
})
export class DatabaseModule {}
