/**
 * Structured logging utility for Travel Assistant
 * 
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context
 * - Environment-based configuration
 * - Production-ready error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  tripId?: string
  component?: string
  action?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private level: LogLevel
  private isDevelopment: boolean

  constructor() {
    // Set log level based on environment
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.level = this.isDevelopment ? 'debug' : 'warn'
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log errors with optional Error object
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } : context

    this.log('error', message, errorContext)
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
    }

    // In production, send to external logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService(logEntry)
    }

    // Always log to console in development
    this.logToConsole(level, message, context)
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.level)
    const logLevelIndex = levels.indexOf(level)
    
    return logLevelIndex >= currentLevelIndex
  }

  /**
   * Log to browser console with appropriate method
   */
  private logToConsole(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    const consoleMethod = level === 'debug' ? 'log' : level
    
    if (context) {
      console[consoleMethod](prefix, message, context)
    } else {
      console[consoleMethod](prefix, message)
    }
  }

  /**
   * Send logs to external logging service (e.g., Sentry, LogRocket)
   * This is a placeholder for production logging integration
   */
  private sendToLoggingService(logEntry: LogEntry): void {
    // TODO: Integrate with external logging service
    // Examples:
    // - Sentry.captureMessage(logEntry.message, { level: logEntry.level, extra: logEntry.context })
    // - LogRocket.log(logEntry)
    // - Custom logging endpoint: fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) })
    
    // For now, still log to console in production for critical errors
    if (logEntry.level === 'error') {
      console.error(logEntry.message, logEntry.context)
    }
  }

  /**
   * Create a child logger with preset context
   * Useful for component-specific logging
   */
  createContext(contextDefaults: LogContext): ContextLogger {
    return new ContextLogger(this, contextDefaults)
  }
}

/**
 * Context Logger - Logger with preset context
 */
class ContextLogger {
  constructor(
    private logger: Logger,
    private contextDefaults: LogContext
  ) {}

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { ...this.contextDefaults, ...context })
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, { ...this.contextDefaults, ...context })
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { ...this.contextDefaults, ...context })
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, error, { ...this.contextDefaults, ...context })
  }
}

// Export singleton logger instance
export const logger = new Logger()

// Export types for use in other files
export type { LogLevel, LogContext }
