import { Injectable, Scope, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as moment from 'moment';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  logger: winston.Logger;

  constructor() {
    this.generate();
  }

  generate(options?: winston.LoggerOptions): winston.Logger {
    const myFormat = winston.format.printf(({ level, message, label}) => {
      return `[${level}] [${label}] ${moment().format('HH:mm:ss:SSS')} ${message}`;
    });
    if (options)
      this.logger = winston.createLogger(options);
    else
      this.logger = winston.createLogger({
        format: winston.format.combine(
          // winston.format.colorize({ all: true }),
          // winston.format.label({ label: 'right meow!' }),
          // winston.format.timestamp(),
          // winston.format.splat(),
          // winston.format.simple(),
          // ${timestamp} [${label}] ${level}: ${message}
          // winston.format.level
        ),
        transports: [
          new winston.transports.File({
            format: winston.format.combine(
              winston.format.label({ label: 'right meow!' }),
              winston.format.colorize(),
              myFormat
            ),
            level: 'debug',
            options: { flags: 'w' },
            filename: './logs/debug.log',
            handleExceptions: true,
            maxsize: 5242880, // 5MB
            maxFiles: 1
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.label({ label: 'right meow!' }),
              winston.format.colorize(),
              myFormat
            ),
            level: 'debug'
          })
        ],
        exitOnError: false
      });
    return this.logger;
  }

  setContext(context: string) {
    const myFormat = winston.format.printf(({ level, message, label}) => {
      return `[${level}] [${label}] ${moment().format('HH:mm:ss:SSS')} ${message}`;
    });
    this.logger.transports[0].format = winston.format.combine(
      winston.format.label({ label: context }),
      winston.format.colorize(),
      myFormat
    );
    this.logger.transports[1].format = winston.format.combine(
      winston.format.label({ label: context }),
      winston.format.colorize(),
      myFormat
    );
  }
}