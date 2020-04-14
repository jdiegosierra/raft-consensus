import { Module } from '@nestjs/common';
import { RaftController } from './raft.controller';
import { IRaftService, RaftService } from './raft.service';


@Module({
  controllers: [RaftController],
  providers: [RaftService, IRaftService]
})
export class RaftModule {}