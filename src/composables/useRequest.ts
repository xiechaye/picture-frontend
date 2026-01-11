import { ref, Ref } from 'vue'
import { handleApiResponse, handleException, ErrorHandlerOptions } from '@/utils/errorHandler'

/**
 * API 请求状态
 */
export interface UseRequestState<T> {
  loading: Ref<boolean>
  data: Ref<T | undefined>
  error: Ref<Error | undefined>
}

/**
 * API 请求选项
 */
export interface UseRequestOptions<T> extends ErrorHandlerOptions {
  /** 初始数据 */
  initialData?: T
  /** 是否立即执行 */
  immediate?: boolean
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 完成回调（无论成功失败） */
  onFinally?: () => void
}

/**
 * 统一的 API 请求 Hook
 * 自动处理 loading 状态、错误处理和数据管理
 *
 * @example
 * const { data, loading, error, execute } = useRequest(
 *   () => getUserList({ page: 1 }),
 *   { operation: '获取用户列表' }
 * )
 */
export function useRequest<T>(
  requestFn: () => Promise<{ data: { code: number; data?: T; message?: string } }>,
  options: UseRequestOptions<T> = {}
) {
  const {
    initialData,
    immediate = false,
    operation = '请求',
    showError = true,
    onSuccess,
    onError,
    onFinally,
  } = options

  const loading = ref(false)
  const data = ref<T | undefined>(initialData)
  const error = ref<Error | undefined>()

  /**
   * 执行请求
   */
  const execute = async (): Promise<T | undefined> => {
    loading.value = true
    error.value = undefined

    try {
      const res = await requestFn()

      if (handleApiResponse(res, { operation, showError })) {
        data.value = res.data.data
        onSuccess?.(res.data.data!)
        return res.data.data
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      handleException(err, { operation, showError })
      onError?.(error.value)
    } finally {
      loading.value = false
      onFinally?.()
    }

    return undefined
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    loading,
    data,
    error,
    execute,
  }
}

/**
 * 分页请求 Hook
 * 专门用于分页列表数据
 */
export function usePaginationRequest<T>(
  requestFn: (params: any) => Promise<{
    data: { code: number; data?: { records: T[]; total: number }; message?: string }
  }>,
  options: UseRequestOptions<{ records: T[]; total: number }> & {
    defaultParams?: any
  } = {}
) {
  const { defaultParams = {}, ...restOptions } = options

  const params = ref({
    current: 1,
    pageSize: 10,
    ...defaultParams,
  })

  const { loading, data, error, execute } = useRequest(
    () => requestFn(params.value),
    restOptions
  )

  const records = ref<T[]>([])
  const total = ref(0)

  /**
   * 刷新数据
   */
  const refresh = async () => {
    const result = await execute()
    if (result) {
      records.value = result.records ?? []
      total.value = result.total ?? 0
    }
  }

  /**
   * 改变页码
   */
  const changePage = async (page: number, pageSize?: number) => {
    params.value.current = page
    if (pageSize) {
      params.value.pageSize = pageSize
    }
    await refresh()
  }

  /**
   * 搜索（重置到第一页）
   */
  const search = async (searchParams: any) => {
    params.value = {
      ...params.value,
      ...searchParams,
      current: 1,
    }
    await refresh()
  }

  /**
   * 重置参数
   */
  const reset = async () => {
    params.value = {
      current: 1,
      pageSize: 10,
      ...defaultParams,
    }
    await refresh()
  }

  return {
    loading,
    data,
    error,
    records,
    total,
    params,
    refresh,
    changePage,
    search,
    reset,
  }
}

/**
 * 表单提交 Hook
 * 专门用于表单提交操作
 */
export function useFormSubmit<T, R = any>(
  submitFn: (data: T) => Promise<{ data: { code: number; data?: R; message?: string } }>,
  options: UseRequestOptions<R> & {
    onSubmitSuccess?: (result: R) => void
  } = {}
) {
  const { onSubmitSuccess, ...restOptions } = options
  const submitting = ref(false)
  const submitError = ref<Error | undefined>()

  /**
   * 提交表单
   */
  const submit = async (formData: T): Promise<R | undefined> => {
    submitting.value = true
    submitError.value = undefined

    try {
      const res = await submitFn(formData)

      if (handleApiResponse(res, restOptions)) {
        onSubmitSuccess?.(res.data.data!)
        return res.data.data
      }
    } catch (err) {
      submitError.value = err instanceof Error ? err : new Error(String(err))
      handleException(err, restOptions)
    } finally {
      submitting.value = false
    }

    return undefined
  }

  return {
    submitting,
    submitError,
    submit,
  }
}
