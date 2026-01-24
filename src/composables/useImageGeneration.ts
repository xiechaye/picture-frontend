/**
 * 图片生成业务逻辑Hook
 */
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  generateImageUsingPost,
  optimizePromptUsingPost,
} from '@/api/imageGenerationController'
import { handleApiResponse, handleException } from '@/utils/errorHandler'
import { debug } from '@/utils/logger'
import { useDebounceFn } from './useDebounce'

/**
 * 图片生成业务逻辑Hook
 * 管理表单数据、生成状态、优化Prompt等功能
 *
 * @example
 * const { prompt, spaceId, generateImage, optimizePrompt } = useImageGeneration()
 */
export function useImageGeneration() {
  // 表单数据
  const prompt = ref('')
  const spaceId = ref<number>()

  // 可选参数
  const size = ref<string>('')
  const customNegativePrompt = ref<string>('')

  // 原始prompt（用于撤销优化）
  const originalPrompt = ref('')

  // 优化结果的附加信息
  const recommendedSize = ref<string | null>(null)
  const negativePrompt = ref<string | null>(null)

  // 生成结果
  const generatedImage = ref<API.ImageGenerationResponse>()

  // 加载状态
  const optimizing = ref(false)
  const generating = ref(false)

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    if (!prompt.value.trim()) {
      message.warning('请输入图片描述')
      return false
    }
    if (prompt.value.length < 5) {
      message.warning('图片描述至少需要5个字符')
      return false
    }
    return true
  }

  /**
   * 优化Prompt
   */
  const optimizePrompt = async () => {
    if (!prompt.value.trim()) {
      message.warning('请先输入图片描述')
      return
    }

    optimizing.value = true

    try {
      const res = await optimizePromptUsingPost({
        prompt: prompt.value,
      })

      if (handleApiResponse(res, { operation: '优化描述', showError: true })) {
        const data = res.data.data!

        if (data.success !== false) {
          // 优化成功
          originalPrompt.value = data.originalPrompt || prompt.value
          prompt.value = data.optimizedPrompt || prompt.value
          recommendedSize.value = data.recommendedSize || null
          negativePrompt.value = data.negativePrompt || null
          message.success('Prompt优化完成')
          debug('优化结果', data)
        } else {
          // 优化失败，使用回退值
          originalPrompt.value = data.originalPrompt || prompt.value
          prompt.value = data.optimizedPrompt || prompt.value
          recommendedSize.value = null
          negativePrompt.value = null
          message.warning(`优化失败：${data.errorMessage || '未知错误'}，已使用原始输入`)
          debug('优化失败', data)
        }
      }
    } catch (err) {
      handleException(err, { operation: '优化描述' })
    } finally {
      optimizing.value = false
    }
  }

  // 防抖优化（用户停止输入300ms后可手动调用）
  const debouncedOptimize = useDebounceFn(optimizePrompt, 300)

  /**
   * 撤销优化
   */
  const undoOptimize = () => {
    if (originalPrompt.value) {
      prompt.value = originalPrompt.value
      originalPrompt.value = ''
      recommendedSize.value = null
      negativePrompt.value = null
      message.success('已恢复原始描述')
    }
  }

  /**
   * 同步生成图片
   */
  const generateImageSync = async () => {
    if (!validateForm()) return

    generating.value = true
    generatedImage.value = undefined

    try {
      const res = await generateImageUsingPost({
        prompt: prompt.value,
        size: size.value || undefined,
        negativePrompt: customNegativePrompt.value || negativePrompt.value || undefined,
      })

      if (handleApiResponse(res, { operation: '生成图片', showError: true })) {
        generatedImage.value = res.data.data!
        message.success(
          `图片生成成功，耗时 ${(res.data.data!.totalTime / 1000).toFixed(1)}秒`
        )
        debug('生成结果', res.data.data)
      }
    } catch (err) {
      handleException(err, { operation: '生成图片' })
    } finally {
      generating.value = false
    }
  }

  /**
   * 生成图片（根据模式选择）
   */
  const generateImage = () => {
    generateImageSync()
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    prompt.value = ''
    originalPrompt.value = ''
    spaceId.value = undefined
    generatedImage.value = undefined
    size.value = ''
    customNegativePrompt.value = ''
    recommendedSize.value = null
    negativePrompt.value = null
  }

  // 是否可以撤销优化
  const canUndo = computed(() => !!originalPrompt.value)

  // 是否正在处理
  const isProcessing = computed(() => optimizing.value || generating.value)

  return {
    // 表单数据
    prompt,
    spaceId,

    // 可选参数
    size,
    customNegativePrompt,

    // 状态
    optimizing,
    generating,
    isProcessing,
    canUndo,

    // 生成结果
    generatedImage,

    // 优化结果的附加信息
    recommendedSize,
    negativePrompt,

    // 方法
    optimizePrompt,
    debouncedOptimize,
    undoOptimize,
    generateImage,
    generateImageSync,
    resetForm,
  }
}
