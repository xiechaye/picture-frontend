import request from '@/request'

/**
 * 获取提示词分类列表
 */
export async function getPromptCategoriesUsingGet() {
  return request<API.BaseResponse<string[]>>('/api/prompt/category/list', {
    method: 'GET',
  })
}

/**
 * 获取随机提示词
 */
export async function getRandomPromptsUsingGet(params: { count?: number }) {
  return request<API.BaseResponse<API.SamplePromptVO[]>>('/api/prompt/random', {
    method: 'GET',
    params,
  })
}

/**
 * 新增提示词
 */
export async function addPromptUsingPost(body: API.SamplePromptAddRequest) {
  return request<API.BaseResponse<number>>('/api/prompt/admin/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/**
 * 更新提示词
 */
export async function updatePromptUsingPost(body: API.SamplePromptUpdateRequest) {
  return request<API.BaseResponse<boolean>>('/api/prompt/admin/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/**
 * 删除提示词
 */
export async function deletePromptUsingPost(body: { id: number }) {
  return request<API.BaseResponse<boolean>>('/api/prompt/admin/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/**
 * 分页查询列表
 */
export async function listPromptByPageUsingPost(body: API.SamplePromptQueryRequest) {
  return request<API.BaseResponse<API.Page<API.SamplePrompt>>>('/api/prompt/admin/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/**
 * 根据ID获取详情
 */
export async function getPromptByIdUsingGet(params: { id: number }) {
  return request<API.BaseResponse<API.SamplePrompt>>('/api/prompt/admin/get', {
    method: 'GET',
    params,
  })
}
