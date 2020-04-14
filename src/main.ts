// Config
import 'module-alias/register';
require('dotenv').config();
import config from './config/default'; // TODO: Custom path process.env["NODE_CONFIG_DIR"] = __dirname + "/configDir/";
// Dependencies
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { raftOptions, tcpOptions } from './config/transportOptions';
import { RaftService } from './modules/chain/consensus/raft/raft.service';
import { ClientGrpc, ClientGrpcProxy } from '@nestjs/microservices';
import { RaftRequest } from './modules/chain/consensus/raft/raft.controller';
import { Observable } from 'rxjs';
// TODO: Use Nest Logger
// import { logger } from '@utils/logger';

interface IRaftService {
  leaderRequest(message: RaftRequest): Observable<any>;
}

(async () => {
  // logger.info('API server made by J. Diego Sierra');
  // logger.info('Current environment: ' + process.env.NODE_ENV || "development");
  const app = await NestFactory.create(AppModule);
  // TODO: Build from FactoryServices
  app.connectMicroservice(tcpOptions);
  app.connectMicroservice(raftOptions);
  await app.startAllMicroservicesAsync();
  // TODO: Bug with port. App overwrites TCPOptions
  await app.listen(config.server['PORT'], () => {
    console.log(`Application is running on: ${config.server['PORT']}`);
    const client: ClientGrpc = new ClientGrpcProxy({
        package: 'raft',
        protoPath: './src/transport-layers/rpc/raft.proto',
        url: 'localhost: 8000',
      });
    const raftClient: IRaftService = client.getService<IRaftService>('RaftService');
    const test = new RaftService(raftClient);
    test._sendHeartbeat();
  }
  );
}
)();
