export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

export const logger = {
  info: (message: string, meta: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.INFO, message, ...meta }));
  },
  warn: (message: string, meta: Record<string, unknown> = {}) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.WARN, message, ...meta }));
  },
  error: (message: string, meta: Record<string, unknown> = {}) => {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.ERROR, message, ...meta }));
  },
  debug: (message: string, meta: Record<string, unknown> = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: LogLevel.DEBUG, message, ...meta }));
    }
  },
};
