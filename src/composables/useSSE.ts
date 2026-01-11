/**
 * SSE (Server-Sent Events) 流式处理通用Hook
 */
import { ref, onUnmounted } from 'vue'
import { error as logError } from '@/utils/logger'

export interface UseSSEOptions {
  /** 接收到消息时的回调 */
  onMessage?: (data: string) => void
  /** 发生错误时的回调 */
  onError?: (error: Event) => void
  /** 连接建立时的回调 */
  onOpen?: () => void
  /** 完成时的回调 */
  onComplete?: () => void
}

/**
 * SSE流式处理通用Hook
 * 封装EventSource的连接、断开、消息接收逻辑
 *
 * @example
 * const { messages, isConnected, connect, disconnect } = useSSE()
 * connect(url, {
 *   onMessage: (data) => console.log(data),
 *   onComplete: () => console.log('完成')
 * })
 */
export function useSSE() {
  const messages = ref<string[]>([])
  const isConnected = ref(false)
  const isLoading = ref(false)
  let eventSource: EventSource | null = null

  /**
   * 连接SSE
   * @param url SSE地址
   * @param options 回调配置
   */
  const connect = (url: string, options: UseSSEOptions = {}) => {
    // 关闭之前的连接
    disconnect()

    isLoading.value = true
    messages.value = []

    try {
      eventSource = new EventSource(url, { withCredentials: true })

      eventSource.onopen = () => {
        isConnected.value = true
        isLoading.value = false
        options.onOpen?.()
      }

      eventSource.onmessage = (event) => {
        const data = event.data
        messages.value.push(data)
        options.onMessage?.(data)

        // 检查是否完成（根据后端约定判断）
        // 如果消息包含"完成"、"成功"或"失败"等关键词，则认为流式传输结束
        if (
          data.includes('上传完成') ||
          data.includes('生成失败') ||
          data.includes('完成')
        ) {
          disconnect()
          options.onComplete?.()
        }
      }

      eventSource.onerror = (err) => {
        logError('SSE连接错误', err)
        isConnected.value = false
        isLoading.value = false
        options.onError?.(err)
        disconnect()
      }
    } catch (err) {
      logError('SSE连接失败', err)
      isLoading.value = false
      options.onError?.(err as Event)
    }
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isConnected.value = false
    isLoading.value = false
  }

  /**
   * 清空消息
   */
  const clearMessages = () => {
    messages.value = []
  }

  // 组件卸载时自动断开
  onUnmounted(() => {
    disconnect()
  })

  return {
    messages,
    isConnected,
    isLoading,
    connect,
    disconnect,
    clearMessages,
  }
}
