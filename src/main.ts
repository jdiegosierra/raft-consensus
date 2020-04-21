// Config
import * as winston from 'winston';

require('dotenv').config();
import config from './config/default'; // TODO: Custom path process.env["NODE_CONFIG_DIR"] = __dirname + "/configDir/";
// Dependencies
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { raftOptions } from './config/transportOptions';
import { LoggerService } from './shared/logger/logger.service';
// import { logger } from './utils/logger';
import * as moment from 'moment';

(async () => {
  // console.log(config)
  const app = await NestFactory.create(AppModule, {
    logger: false
  });
  const loggerService = new LoggerService();
  // app.useLogger(loggerService.logger);
  // TODO: Build from FactoryServices
  // app.connectMicroservice(tcpOptions);
  app.connectMicroservice(raftOptions);
  await app.startAllMicroservicesAsync();
  // TODO: Bug with port. App overwrites TCPOptions
  await app.listen(config.server['PORT'], () => {
    // logger.setContext('App');
    const myFormat = winston.format.printf(({ level, message, label}) => {
      return `[${level}] [${label}] ${moment().format('HH:mm:ss:SSS')} ${message}`;
    });
    loggerService.setContext('App');
    loggerService.logger.info('API server made by J. Diego Sierra');
    loggerService.logger.info('Current environment: ' + (process.env.NODE_ENV || "development"));
    loggerService.logger.info(`Application is running on: ${config.server['PORT']}`);
  });
})();
