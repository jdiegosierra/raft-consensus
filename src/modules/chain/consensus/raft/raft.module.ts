import { Module } from '@nestjs/common';
import { RaftController } from './raft.controller';
import { IRaftService, RaftService } from './raft.service';

const connectionFactory = {
  provide: 'RaftService',
  useFactory: () => {
    return new RaftService([['test', null]]);
  }
};

@Module({
  controllers: [RaftController],
  providers: [connectionFactory, IRaftService, Array]
})
export class RaftModule {}