import { Module } from '@nestjs/common';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { ReturnsRepository } from './repositories/returns.repository';
import { ReturnRowMapper } from './mappers/return-row.mapper';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../common/events.module';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService, ReturnsRepository, ReturnRowMapper],
  exports: [ReturnsService],
})
export class ReturnsModule {}
