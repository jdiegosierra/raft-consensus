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
      const client: ClientGrpc = new ClientGrpcProxy(options.options);
      rpcClients.push([options.id, client.getService<IRaftService>('RaftService')]);
    });
    const loggerService = new LoggerService();
    loggerService.setContext('RAFT');
    const raft =  new RaftService(loggerService.logger, rpcClients);
    raft.start();
    return raft;
  }
};

@Module({
  controllers: [RaftController],
  providers: [connectionFactory, IRaftService, Array]
})
export class RaftModule {}