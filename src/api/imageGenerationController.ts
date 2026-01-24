/**
 * 图片生成相关API
 */
import request from '@/request'

/**
 * 同步生成图像
 * POST /api/image-generation/generate
 *
 * @param body 生成请求参数
 * @param options axios配置选项
 * @returns Promise<BaseResponse<ImageGenerationResponse>>
 */
export async function generateImageUsingPost(
  body: API.GenerateImageRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseImageGenerationResponse_>(
    '/api/image-generation/generate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 60000, // 60秒超时，因为图片生成可能需要较长时间
      ...(options || {}),
    }
  )
}

/**
 * 优化Prompt
 * POST /api/image-generation/optimize-prompt
 *
 * @param body 优化请求参数
 * @param options axios配置选项
 * @returns Promise<BaseResponse<OptimizePromptResponse>>
 */
export async function optimizePromptUsingPost(
  body: API.OptimizePromptRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseOptimizePromptResponse_>(
    '/api/image-generation/optimize-prompt',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 30000, // 30秒超时，AI优化提示词需要较长时间
      ...(options || {}),
    }
  )
}
