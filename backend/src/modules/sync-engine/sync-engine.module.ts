import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../database/database.module';
import { SyncEngineController } from './sync-engine.controller';
import { OutboxWorker } from './outbox.worker';
import { InboxService } from './inbox.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SyncEngineController],
  providers: [OutboxWorker, InboxService],
  exports: [OutboxWorker, InboxService],
})
export class SyncEngineModule {}
