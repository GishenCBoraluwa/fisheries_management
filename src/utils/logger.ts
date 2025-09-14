interface LogData {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${level}] ${timestamp} - ${message}`;
    
    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  info(message: string, data?: LogData): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  warn(message: string, data?: LogData): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }
}

export const logger = new Logger();