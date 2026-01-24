import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  listPictureVoByPageUsingPost,
  searchPictureBySemantic,
  searchPictureByColorUsingPost,
} from '@/api/pictureController'
import { PAGINATION, SEMANTIC_SEARCH } from '@/constants/search'
import type { SearchMode } from '@/constants/search'
import { handleApiResponse, handleException } from '@/utils/errorHandler'

/**
 * 图片搜索参数接口
 */
export interface PictureSearchParams extends Omit<API.PictureQueryRequest, 'spaceId'> {
  spaceId?: number | string
}

/**
 * 语义搜索参数接口
 */
export interface SemanticSearchParams {
  searchText: string
  spaceId?: number | string
  topK?: number
  similarityThreshold: number
}

/**
 * 图片搜索 Hook
 * @description 封装普通搜索、语义搜索和颜色搜索的逻辑
 */
export function usePictureSearch(spaceId?: number | string) {
  // 数据状态
  const dataList = ref<API.PictureVO[]>([])
  const total = ref(0)
  const loading = ref(false)

  // 搜索参数
  const searchParams = ref<PictureSearchParams>({
    current: PAGINATION.DEFAULT_CURRENT,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    sortField: PAGINATION.DEFAULT_SORT_FIELD,
    sortOrder: PAGINATION.DEFAULT_SORT_ORDER,
  })

  /**
   * 普通搜索 - 获取图片列表
   */
  const fetchPictureList = async (
    additionalParams?: Partial<PictureSearchParams>,
  ): Promise<boolean> => {
    loading.value = true
    try {
      const params: PictureSearchParams = {
        ...searchParams.value,
        ...additionalParams,
      }

      // 如果有 spaceId，添加到参数中
      if (spaceId !== undefined) {
        params.spaceId = spaceId
      }

      const res = await listPictureVoByPageUsingPost(params as API.PictureQueryRequest)

      if (handleApiResponse(res, { operation: '获取图片列表' })) {
        dataList.value = res.data.data?.records ?? []
        total.value = res.data.data?.total ?? 0
        return true
      }

      return false
    } catch (error) {
      handleException(error, { operation: '获取图片列表' })
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * AI语义搜索
   */
  const fetchSemanticSearch = async (params: SemanticSearchParams): Promise<boolean> => {
    const { searchText, similarityThreshold, topK } = params

    if (!searchText?.trim()) {
      message.warning('请输入语义搜索内容')
      return false
    }

    loading.value = true
    try {
      const res = await searchPictureBySemantic({
        searchText: searchText.trim(),
        spaceId: (params.spaceId ?? spaceId) as number | undefined,
        topK: topK ?? SEMANTIC_SEARCH.DEFAULT_TOP_K,
        similarityThreshold,
      })

      if (handleApiResponse(res, { operation: 'AI 语义搜索' })) {
        dataList.value = res.data.data ?? []
        total.value = res.data.data?.length ?? 0
        return true
      }

      return false
    } catch (error) {
      handleException(error, { operation: 'AI 语义搜索' })
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 按颜色搜索
   */
  const fetchColorSearch = async (
    color: string,
    targetSpaceId?: number | string,
  ): Promise<boolean> => {
    loading.value = true
    try {
      const res = await searchPictureByColorUsingPost({
        picColor: color,
        spaceId: (targetSpaceId ?? spaceId) as number | undefined,
      })

      if (handleApiResponse(res, { operation: '颜色搜索' })) {
        const data = res.data.data ?? []
        dataList.value = data
        total.value = data.length
        return true
      }

      return false
    } catch (error) {
      handleException(error, { operation: '颜色搜索' })
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 统一搜索入口
   */
  const doSearch = async (
    mode: SearchMode,
    options?: {
      searchText?: string
      similarityThreshold?: number
      additionalParams?: Partial<PictureSearchParams>
    },
  ) => {
    // 重置到第一页
    searchParams.value.current = PAGINATION.DEFAULT_CURRENT

    if (mode === 'semantic') {
      if (!options?.searchText) {
        message.warning('请输入语义搜索内容')
        return false
      }
      return fetchSemanticSearch({
        searchText: options.searchText,
        similarityThreshold: options.similarityThreshold ?? 0.5,
        topK: searchParams.value.pageSize,
      })
    } else {
      return fetchPictureList(options?.additionalParams)
    }
  }

  /**
   * 分页变化处理
   */
  const onPageChange = (page: number, pageSize: number) => {
    searchParams.value.current = page
    searchParams.value.pageSize = pageSize
    fetchPictureList()
  }

  /**
   * 更新搜索参数
   */
  const updateSearchParams = (newParams: Partial<PictureSearchParams>) => {
    searchParams.value = {
      ...searchParams.value,
      ...newParams,
      current: PAGINATION.DEFAULT_CURRENT, // 更新参数时重置页码
    }
  }

  /**
   * 重置搜索状态
   */
  const resetSearch = () => {
    searchParams.value = {
      current: PAGINATION.DEFAULT_CURRENT,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      sortField: PAGINATION.DEFAULT_SORT_FIELD,
      sortOrder: PAGINATION.DEFAULT_SORT_ORDER,
    }
    dataList.value = []
    total.value = 0
  }

  return {
    // 状态
    dataList,
    total,
    loading,
    searchParams,
    // 方法
    fetchPictureList,
    fetchSemanticSearch,
    fetchColorSearch,
    doSearch,
    onPageChange,
    updateSearchParams,
    resetSearch,
  }
}
