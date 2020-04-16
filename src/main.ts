// Config
import 'module-alias/register';
require('dotenv').config();
import config from './config/default'; // TODO: Custom path process.env["NODE_CONFIG_DIR"] = __dirname + "/configDir/";
// Dependencies
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { raftOptions } from './config/transportOptions';
// TODO: Use Nest Logger
// import { logger } from '@utils/logger';

(async () => {
  // logger.info('API server made by J. Diego Sierra');
  // logger.info('Current environment: ' + process.env.NODE_ENV || "development");
  const app = await NestFactory.create(AppModule);
  // TODO: Build from FactoryServices
  // app.connectMicroservice(tcpOptions);
  app.connectMicroservice(raftOptions);
  await app.startAllMicroservicesAsync();
  // TODO: Bug with port. App overwrites TCPOptions
  await app.listen(config.server['PORT'], () => {
    console.log(`Application is running on: ${config.server['PORT']}`);
  });
})();
