import { computed, ref } from 'vue'
import { SIMILARITY_THRESHOLD, getSimilarityLabel, getSimilarityTagColor } from '@/constants/search'

/**
 * 相似度阈值管理 Hook
 * @description 管理语义搜索的相似度阈值状态和计算属性
 */
export function useSimilarityThreshold(initialValue?: number) {
  const similarityThreshold = ref<number>(initialValue ?? SIMILARITY_THRESHOLD.DEFAULT)

  // 计算相似度标签文字
  const similarityLabel = computed(() => {
    return getSimilarityLabel(similarityThreshold.value)
  })

  // 计算相似度标签颜色
  const similarityTagColor = computed(() => {
    return getSimilarityTagColor(similarityThreshold.value)
  })

  // 重置为默认值
  const resetThreshold = () => {
    similarityThreshold.value = SIMILARITY_THRESHOLD.DEFAULT
  }

  return {
    similarityThreshold,
    similarityLabel,
    similarityTagColor,
    resetThreshold,
    // 导出配置供模板使用
    config: {
      min: SIMILARITY_THRESHOLD.MIN,
      max: SIMILARITY_THRESHOLD.MAX,
      step: SIMILARITY_THRESHOLD.STEP,
    },
  }
}
