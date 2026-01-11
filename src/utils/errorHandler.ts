import { message } from 'ant-design-vue'

/**
 * API 响应结果
 */
export interface ApiResponse<T = unknown> {
  code?: number
  data?: T
  message?: string
}

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  /** 操作名称（用于显示在错误消息中） */
  operation?: string
  /** 是否显示错误提示 */
  showError?: boolean
  /** 自定义错误消息 */
  customMessage?: string
}

/**
 * 统一处理 API 响应
 * @param response API 响应对象
 * @param options 错误处理选项
 * @returns 操作是否成功
 */
export function handleApiResponse<T>(
  response: { data: ApiResponse<T> },
  options: ErrorHandlerOptions = {},
): boolean {
  const { operation = '操作', showError = true, customMessage } = options
  const { code, message: apiMessage } = response.data

  if (code === 0) {
    return true
  }

  if (showError) {
    const errorMsg = customMessage || `${operation}失败${apiMessage ? `：${apiMessage}` : ''}`
    message.error(errorMsg)
  }

  return false
}

/**
 * 统一处理异常错误
 * @param error 错误对象
 * @param options 错误处理选项
 */
export function handleException(error: unknown, options: ErrorHandlerOptions = {}): void {
  const { operation = '操作', showError = true, customMessage } = options

  if (!showError) return

  const errorMessage = error instanceof Error ? error.message : '未知错误'
  const displayMessage = customMessage || `${operation}失败：${errorMessage}`

  message.error(displayMessage)
}

/**
 * 提取错误消息
 * @param error 错误对象
 * @returns 错误消息字符串
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '未知错误'
}
