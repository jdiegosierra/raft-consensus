import * as winston from 'winston';
import * as moment from 'moment';

console.log("winstron es: " + winston);
const myFormat = winston.format.printf(({ level, message, label}) => {
  return `[${level}] [${label}] ${moment().format('HH:mm:ss:SSS')} ${message}`;
});

export const logger = winston.createLogger({
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
      level: 'silly'
    })
  ],
  exitOnError: false
});

// const logger = createLogger({
//   format: combine(
//     label({ label: red('My Label') }),
//     timestamp()
//   ),
//   transports: [
//     new transports.Console({
//       format: combine(
//         colorize(),
//         myFormat
//       ),
//       level: 'silly' }),
//     new transports.File({ format: myFormat, filename: path.resolve(logDir, 'info.log'), level: 'info' }),
//     new transports.File({ format: myFormat, filename: path.resolve(logDir, 'error.log'), level: 'error' })
//   ]
// })
