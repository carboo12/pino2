import { Controller, Get, Inject } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Pool } from 'pg';

const version = (() => {
  try {
    return readFileSync(join(__dirname, '../../../../VERSION'), 'utf-8').trim();
  } catch {
    try {
      return readFileSync('/opt/apps/pino2/backend/VERSION', 'utf-8').trim();
    } catch {
      return 'dev';
    }
  }
})();

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject('PG_CONNECTION') private readonly pool: Pool) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check — verifica API y conexión a DB' })
  async check() {
    const start = Date.now();
    let dbStatus = 'ok';
    try {
      await this.pool.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }
    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: dbStatus,
      responseTimeMs: Date.now() - start,
    };
  }
}
