// import winston from 'winston';
// import moment from 'moment';
//
// const myFormat = winston.format.printf(({ level, message}) => {
//   return `[${level}] ${moment().format('YYYY-MM-DD HH:mm:ss:SSS')} ${message}`;
// });
//
// export const logger = winston.createLogger({
//   format: winston.format.combine(
//     winston.format.colorize(),
//     // winston.format.label({ label: 'right meow!' }),
//     // winston.format.timestamp(),
//     // winston.format.splat(),
//     // winston.format.simple(),
//     myFormat
//     // ${timestamp} [${label}] ${level}: ${message}
//     // winston.format.level
//   ),
//   transports: [
//     new winston.transports.File({
//       level: 'debug',
//       filename: './logs/debug.log',
//       handleExceptions: true,
//       maxsize: 5242880, // 5MB
//       maxFiles: 1
//     }),
//     new winston.transports.Console({
//       level: 'silly'
//     })
//   ],
//   exitOnError: false
// });
