import winston from "winston";
import path from "path";

// Log levels (similar to Python logging)
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Get log level from environment
const getLogLevel = (): LogLevel => {
  const level = process.env.LOG_LEVEL;
  if (level === undefined) return LogLevel.INFO;
  
  const numLevel = parseInt(level);
  if (isNaN(numLevel) || numLevel < 0 || numLevel > 3) {
    return LogLevel.INFO;
  }
  
  return numLevel as LogLevel;
};

// Create logger instance
const createWinstonLogger = (): winston.Logger => {
  const logLevel = getLogLevel();
  const enableConsole = process.env.LOG_CONSOLE !== "false";
  const enableFile = process.env.LOG_FILE === "true";
  const logFilePath = process.env.LOG_FILE_PATH || "./logs/assistant.log";

  // Create transports array
  const transports: winston.transport[] = [];

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: LogLevel[logLevel].toLowerCase(),
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, category, ...meta }: any) => {
            const categoryStr = category ? `[${category}] ` : '';
            
            // Enhanced formatting for debug logs
            if (level.includes('debug') && Object.keys(meta).length > 0) {
              const metaStr = JSON.stringify(meta, null, 2);
              return `${timestamp} ${level} ${categoryStr}${message}\n${metaStr}`;
            } else {
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level} ${categoryStr}${message}${metaStr}`;
            }
          })
        )
      })
    );
  }

  // File transport
  if (enableFile) {
    // Ensure log directory exists
    const logDir = path.dirname(logFilePath);
    try {
      require('fs').mkdirSync(logDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    transports.push(
      new winston.transports.File({
        filename: logFilePath,
        level: LogLevel[logLevel].toLowerCase(),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }

  return winston.createLogger({
    level: LogLevel[logLevel].toLowerCase(),
    transports,
    // Don't exit on handled exceptions
    exitOnError: false
  });
};

// Create the logger instance
const logger = createWinstonLogger();

// Enhanced logger interface similar to Python logging
export class Logger {
  private logger: winston.Logger;
  private category?: string;

  constructor(category?: string) {
    this.logger = logger;
    this.category = category;
  }

  // Debug level - detailed information for diagnosing problems
  debug(message: string, meta?: any): void {
    this.logger.debug(message, { category: this.category, ...meta });
  }

  // Info level - general information about program execution
  info(message: string, meta?: any): void {
    this.logger.info(message, { category: this.category, ...meta });
  }

  // Warn level - something unexpected happened, but the program is still working
  warn(message: string, meta?: any): void {
    this.logger.warn(message, { category: this.category, ...meta });
  }

  // Error level - serious problem occurred, some function failed
  error(message: string, meta?: any): void {
    this.logger.error(message, { category: this.category, ...meta });
  }

  // Specialized logging methods for different components
  toolCall(toolName: string, args: any, result?: any, error?: any): void {
    if (error) {
      this.error(`Tool ${toolName} failed`, { toolName, args, error: error.message });
    } else {
      this.debug(`Tool ${toolName} completed`, { toolName, args, result });
    }
  }

  conversation(userMessage: string, assistantResponse?: string): void {
    this.info('User message', { message: userMessage });
    if (assistantResponse) {
      this.info('Assistant response', { response: assistantResponse });
    }
  }

  iteration(current: number, max: number): void {
    this.debug(`ReAct iteration ${current}/${max}`);
  }

  context(context: any): void {
    this.debug('Context state', { 
      iterations: context?.currentIteration,
      messageCount: context?.messages?.length,
      lastToolCalls: context?.lastToolCalls?.length || 0
    });
  }

  agent(action: string, meta?: any): void {
    this.info(`Agent: ${action}`, meta);
  }
}

// Create default logger instance
export const defaultLogger = new Logger();

// Create category-specific loggers
export const createCategoryLogger = (category: string): Logger => new Logger(category);

// Export the main logger instance
export { logger };
