import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { listPictureTagCategoryUsingGet } from '@/api/pictureController'
import { handleApiResponse, handleException } from '@/utils/errorHandler'

/**
 * 选项项类型
 */
export interface SelectOption {
  value: string
  label: string
}

/**
 * 标签和分类选项 Hook
 * @description 获取和管理图片的标签和分类选项
 */
export function useTagCategoryOptions() {
  // 原始列表
  const tagList = ref<string[]>([])
  const categoryList = ref<string[]>([])

  // 格式化为选择器选项
  const tagOptions = ref<SelectOption[]>([])
  const categoryOptions = ref<SelectOption[]>([])

  // 加载状态
  const optionsLoading = ref(false)

  /**
   * 获取标签和分类选项
   */
  const fetchTagCategoryOptions = async (): Promise<boolean> => {
    optionsLoading.value = true
    try {
      const res = await listPictureTagCategoryUsingGet()

      if (handleApiResponse(res, { operation: '获取标签分类列表' })) {
        const data = res.data.data

        // 设置原始列表
        tagList.value = data?.tagList ?? []
        categoryList.value = data?.categoryList ?? []

        // 转换为选择器选项格式
        tagOptions.value = tagList.value.map((tag) => ({
          value: tag,
          label: tag,
        }))

        categoryOptions.value = categoryList.value.map((category) => ({
          value: category,
          label: category,
        }))

        return true
      }

      return false
    } catch (error) {
      handleException(error, { operation: '获取标签分类列表' })
      return false
    } finally {
      optionsLoading.value = false
    }
  }

  /**
   * 自动加载选项
   * @param autoFetch 是否在挂载时自动获取
   */
  const initOptions = (autoFetch: boolean = true) => {
    if (autoFetch) {
      onMounted(() => {
        fetchTagCategoryOptions()
      })
    }
  }

  return {
    // 原始列表
    tagList,
    categoryList,
    // 选择器选项
    tagOptions,
    categoryOptions,
    // 状态
    optionsLoading,
    // 方法
    fetchTagCategoryOptions,
    initOptions,
  }
}
