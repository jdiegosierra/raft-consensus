import { Module } from '@nestjs/common';
import { RaftController } from './raft.controller';
import { IRaftService, RaftService } from './raft.service';
import config from './../../../../config/default';
import { ClientGrpc, ClientGrpcProxy, ClientsModule, Transport } from '@nestjs/microservices';

const connectionFactory = {
  provide: 'RaftService',
  useFactory: () => {
    const rpcClients: Array<[string, IRaftService]> = [];
    config.raft.RAFT_CLIENTS.forEach((options, index) =>
    {
      const client: ClientGrpc = new ClientGrpcProxy(options);
      rpcClients.push([index.toString(), client.getService<IRaftService>('RaftService')]);
    });
    return new RaftService(rpcClients);
  }
};

@Module({
  controllers: [RaftController],
  providers: [connectionFactory, IRaftService, Array]
})
export class RaftModule {}