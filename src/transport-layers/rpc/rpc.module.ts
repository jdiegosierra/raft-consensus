import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { raftOptions } from '../../config/transportOptions';
import { RaftModule } from '../../modules/chain/consensus/raft/raft.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RAFT_PACKAGE',
        ...raftOptions,
      },
    ]),
    // ClientsModule.register([
    //   {
    //     name: 'HERO_PACKAGE',
    //     ...heroOptions,
    //   },
    // ]),
    RaftModule
  ]
})
export class RpcModule {}
