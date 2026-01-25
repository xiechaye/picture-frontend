import request from '@/request'

/**
 * 获取随机提示词
 */
export async function getRandomPromptsUsingGet(params: { count?: number }) {
  return request<API.BaseResponse<API.SamplePromptVO[]>>('/api/prompt/random', {
    method: 'GET',
    params,
  })
}
