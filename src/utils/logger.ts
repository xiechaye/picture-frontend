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
 * （生产环境不输出日志）
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
    return false // 禁用所有日志
  }

  /**
   * 调试日志（开发环境）
   */
  debug(...args: unknown[]): void {
    // 禁用日志输出
  }

  /**
   * 信息日志
   */
  info(...args: unknown[]): void {
    // 禁用日志输出
  }

  /**
   * 警告日志
   */
  warn(...args: unknown[]): void {
    // 禁用日志输出
  }

  /**
   * 错误日志
   */
  error(...args: unknown[]): void {
    // 禁用日志输出
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
export const debug = (...args: unknown[]) => {
  // 禁用日志输出
}

export const info = (...args: unknown[]) => {
  // 禁用日志输出
}

export const warn = (...args: unknown[]) => {
  // 禁用日志输出
}

export const error = (...args: unknown[]) => {
  // 禁用日志输出
}

export default logger
