/**
 * 图片生成模块的类型定义
 */

/**
 * 图片生成请求参数
 */
export interface GenerateImageRequest {
  prompt: string      // 图像描述，必填
  spaceId: number     // 空间ID，必填
}

/**
 * 图片生成响应
 */
export interface ImageGenerationResponse {
  imageUrl: string           // 生成的图像URL
  cosKey: string             // COS存储路径
  optimizedPrompt: string    // AI优化后的prompt
  totalTime: number          // 总耗时（毫秒）
  spaceId: number            // 空间ID
}

/**
 * Prompt优化请求
 */
export interface OptimizePromptRequest {
  prompt: string      // 原始图像描述，必填
}

/**
 * Prompt优化响应
 */
export interface OptimizePromptResponse {
  originalPrompt: string     // 用户输入的原始描述
  optimizedPrompt: string    // AI优化后的详细描述
}

/**
 * SSE消息类型
 */
export interface SSEMessage {
  data: string
  timestamp: number
}

/**
 * 生成模式
 */
export enum GenerationMode {
  STREAM = 'stream',   // 流式生成
  SYNC = 'sync'        // 同步生成
}
