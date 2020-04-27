// Config
import { getAddress } from './modules/chain/transactions/transaction.service';

require('dotenv').config();
import config from './config/default'; // TODO: Custom path process.env["NODE_CONFIG_DIR"] = __dirname + "/configDir/";
// Dependencies
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { raftOptions } from './config/transportOptions';
import { LoggerService } from './shared/logger/logger.service';

// (async () => {
//   // console.log(config)
//   const app = await NestFactory.create(AppModule, {
//     logger: false
//   });
//   // TODO: Build from FactoryServices
//   // app.connectMicroservice(tcpOptions);
//   app.connectMicroservice(raftOptions);
//   await app.startAllMicroservicesAsync();
//   // TODO: Bug with port. App overwrites TCPOptions
//   await app.listen(config.server['PORT'], () => {
//     // logger.setContext('App');
//     const loggerService = new LoggerService();
//     loggerService.setContext('App');
//     loggerService.logger.info('API server made by J. Diego Sierra');
//     loggerService.logger.info('Current environment: ' + (process.env.NODE_ENV || "development"));
//     loggerService.logger.info(`Application is running on: ${config.server['PORT']}`);
//     loggerService.logger.info('RPC Server running on: ' + process.env.GRPC_PORT_SERVER);
//   });
// })();

(async () => {
  const test = getAddress();
})();
