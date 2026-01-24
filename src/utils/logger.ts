/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * 日志配置接口
 */
interface LoggerConfig {
  level: LogLevel
  prefix?: string
  enableTimestamp?: boolean
  enableStackTrace?: boolean
}

/**
 * 日志工具类
 */
class Logger {
  private config: LoggerConfig

  constructor(config?: Partial<LoggerConfig>) {
    const isDev = import.meta.env.MODE === 'development'

    this.config = {
      level: isDev ? LogLevel.DEBUG : LogLevel.INFO,
      prefix: '',
      enableTimestamp: true,
      enableStackTrace: false,
      ...config,
    }
  }

  /**
   * 获取格式化的时间戳
   */
  private getTimestamp(): string {
    if (!this.config.enableTimestamp) return ''
    const now = new Date()
    return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}]`
  }

  /**
   * 格式化日志消息
   */
  private format(level: string, ...args: unknown[]): unknown[] {
    const parts: unknown[] = []

    if (this.config.enableTimestamp) {
      parts.push(this.getTimestamp())
    }

    parts.push(`[${level}]`)

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`)
    }

    return [...parts, ...args]
  }

  /**
   * 检查是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level
  }

  /**
   * 调试日志（开发环境）
   */
  debug(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.format('DEBUG', ...args))
    }
  }

  /**
   * 信息日志
   */
  info(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(...this.format('INFO', ...args))
    }
  }

  /**
   * 警告日志
   */
  warn(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(...this.format('WARN', ...args))
    }
  }

  /**
   * 错误日志
   */
  error(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(...this.format('ERROR', ...args))

      // 如果启用堆栈跟踪，输出错误堆栈
      if (this.config.enableStackTrace) {
        const error = args.find((arg) => arg instanceof Error)
        if (error) {
          console.error(error.stack)
        }
      }
    }
  }

  /**
   * 创建子日志实例（带前缀）
   */
  createChild(prefix: string): Logger {
    const childPrefix = this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix
    return new Logger({
      ...this.config,
      prefix: childPrefix,
    })
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }
}

// 导出默认实例
export const logger = new Logger()

// 导出创建自定义日志实例的工厂函数
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config)
}

// 导出常用的日志方法（便捷使用）
export const debug = (...args: unknown[]) => logger.debug(...args)
export const info = (...args: unknown[]) => logger.info(...args)
export const warn = (...args: unknown[]) => logger.warn(...args)
export const error = (...args: unknown[]) => logger.error(...args)

export default logger
