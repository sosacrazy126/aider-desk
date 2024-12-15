import winston from 'winston';
import { LOGS_DIR } from './constants';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({
      filename: `${LOGS_DIR}/error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `${LOGS_DIR}/combined.log`,
    }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

export default logger;
