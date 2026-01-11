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
import { debug, error as logError } from '@/utils/logger'
import { useDebounceFn } from './useDebounce'
import request from '@/request'

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

  // 原始prompt（用于撤销优化）
  const originalPrompt = ref('')

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
    if (!spaceId.value) {
      message.warning('请选择空间')
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
        // 保存原始prompt
        originalPrompt.value = data.originalPrompt
        // 更新prompt
        prompt.value = data.optimizedPrompt
        message.success('Prompt优化完成')
        debug('优化结果', data)
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
        spaceId: spaceId.value!,
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
  }

  // 是否可以撤销优化
  const canUndo = computed(() => !!originalPrompt.value)

  // 是否正在处理
  const isProcessing = computed(() => optimizing.value || generating.value)

  return {
    // 表单数据
    prompt,
    spaceId,

    // 状态
    optimizing,
    generating,
    isProcessing,
    canUndo,

    // 生成结果
    generatedImage,

    // 方法
    optimizePrompt,
    debouncedOptimize,
    undoOptimize,
    generateImage,
    generateImageSync,
    resetForm,
  }
}
