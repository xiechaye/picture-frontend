import { createLogger } from './logger'

const logger = createLogger({ prefix: 'WebSocket' })

/**
 * WebSocket 连接状态
 */
enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
}

/**
 * WebSocket 配置接口
 */
interface WebSocketConfig {
  heartbeatInterval?: number // 心跳间隔（毫秒）
  reconnectInterval?: number // 重连间隔（毫秒）
  maxReconnectAttempts?: number // 最大重连次数
  reconnectBackoff?: number // 重连退避系数
}

export default class PictureEditWebSocket {
  private pictureId: number
  private socket: WebSocket | null
  private eventHandlers: Map<string, Array<(data?: unknown) => void>>
  private status: WebSocketStatus
  private heartbeatTimer: number | null
  private reconnectTimer: number | null
  private reconnectAttempts: number
  private config: Required<WebSocketConfig>
  private manualClose: boolean // 是否手动关闭

  constructor(pictureId: number, config: WebSocketConfig = {}) {
    this.pictureId = pictureId
    this.socket = null
    this.eventHandlers = new Map()
    this.status = WebSocketStatus.DISCONNECTED
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.manualClose = false

    // 默认配置
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000, // 30秒
      reconnectInterval: config.reconnectInterval || 1000, // 1秒
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      reconnectBackoff: config.reconnectBackoff || 2, // 指数退避系数
    }
  }

  /**
   * 初始化 WebSocket 连接
   */
  connect() {
    if (this.status === WebSocketStatus.CONNECTED || this.status === WebSocketStatus.CONNECTING) {
      return
    }

    this.status = WebSocketStatus.CONNECTING
    this.manualClose = false

    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8123"
    const url = `${WS_BASE_URL}/api/ws/picture/edit?pictureId=${this.pictureId}`

    try {
      this.socket = new WebSocket(url)
      this.socket.binaryType = 'blob'

      this.socket.onopen = () => {
        this.status = WebSocketStatus.CONNECTED
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.triggerEvent('open')
      }

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const type = message.type
          this.triggerEvent(type, message)
        } catch (error) {
          this.triggerEvent('error', { type: 'parse_error', error })
        }
      }

      this.socket.onclose = (event) => {
        this.status = WebSocketStatus.DISCONNECTED
        this.stopHeartbeat()
        this.triggerEvent('close', event)

        // 非手动关闭且未超过重连次数，自动重连
        if (!this.manualClose && this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.socket.onerror = (error) => {
        this.triggerEvent('error', error)
      }
    } catch (error) {
      this.status = WebSocketStatus.DISCONNECTED
      this.triggerEvent('error', { type: 'connect_error', error })
    }
  }

  /**
   * 关闭 WebSocket 连接
   */
  disconnect() {
    this.manualClose = true
    this.status = WebSocketStatus.DISCONNECTING

    this.stopHeartbeat()
    this.stopReconnect()

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    // 清理所有事件监听器
    this.eventHandlers.clear()
    this.status = WebSocketStatus.DISCONNECTED
  }

  /**
   * 发送消息到后端
   */
  sendMessage(message: object) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
      return true
    }
    return false
  }

  /**
   * 添加自定义事件监听
   */
  on(type: string, handler: (data?: unknown) => void) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, [])
    }
    this.eventHandlers.get(type)!.push(handler)
  }

  /**
   * 移除事件监听
   */
  off(type: string, handler?: (data?: unknown) => void) {
    if (!handler) {
      this.eventHandlers.delete(type)
      return
    }

    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  private triggerEvent(type: string, data?: unknown) {
    const handlers = this.eventHandlers.get(type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          logger.error(`Error in event handler for ${type}:`, error)
        }
      })
    }
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      this.sendMessage({ type: 'ping' })
    }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect() {
    this.stopReconnect()
    this.status = WebSocketStatus.RECONNECTING

    // 指数退避算法
    const delay =
      this.config.reconnectInterval * Math.pow(this.config.reconnectBackoff, this.reconnectAttempts)

    this.reconnectAttempts++
    this.triggerEvent('reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
    })

    this.reconnectTimer = window.setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * 停止重连
   */
  private stopReconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 获取当前连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.status === WebSocketStatus.CONNECTED && this.socket?.readyState === WebSocket.OPEN
  }
}
