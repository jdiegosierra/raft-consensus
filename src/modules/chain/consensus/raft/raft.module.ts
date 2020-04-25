import { Inject, Module } from '@nestjs/common';
import { RaftController } from './raft.controller';
import { IRaftService, RaftService } from './raft.service';
import config from './../../../../config/default';
import { ClientGrpc, ClientGrpcProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerService } from '../../../../shared/logger/logger.service';

const connectionFactory = {
  provide: 'RaftService',
  useFactory: () => {
    const rpcClients: Array<[string, IRaftService]> = [];
    config.raft.RAFT_CLIENTS.forEach(options =>
    {
      if (options.id !== process.env.GRPC_PORT_SERVER) {
        const client: ClientGrpc = new ClientGrpcProxy(options.options);
        const test = client.getService<IRaftService>('RaftService');
        rpcClients.push([options.id, test]);
      }
    });
    const loggerService = new LoggerService();
    loggerService.setContext('RAFT');
    const raft =  new RaftService(loggerService.logger, rpcClients);
    return raft;
  }
};

@Module({
  controllers: [RaftController],
  providers: [connectionFactory, IRaftService, Array]
})
export class RaftModule {}