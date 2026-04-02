import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  segmentPictureUsingPost,
  removeWatermarkUsingPost,
  enhancePictureUsingPost,
  getEditTaskUsingGet,
} from '@/api/pictureController'
import { EDIT_TASK_STATUS_ENUM } from '@/constants/picture'

export function useAIPictureEdit() {
  // 选中的图片
  const selectedPicture = ref<API.PictureVO | null>(null)

  // 当前选中的编辑功能
  const activeEditType = ref<string>('segment')

  // 各编辑功能的参数
  const segmentType = ref<'human' | 'object'>('human')
  const useWatermarkArea = ref(false)
  const watermarkArea = ref<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const enhanceType = ref<'quality' | 'denoise' | 'sharpen'>('quality')

  // 任务相关
  const taskId = ref<string>('')
  const taskStatus = ref<string>(EDIT_TASK_STATUS_ENUM.PROCESSING)
  const resultUrl = ref<string>('')
  const errorMessage = ref<string>('')

  // 加载状态
  const loading = ref(false)
  const polling = ref(false)

  // 轮询定时器
  let pollingTimer: number | undefined

  /**
   * 选择图片
   */
  const selectPicture = (picture: API.PictureVO) => {
    selectedPicture.value = picture
    // 重置任务状态
    resetTask()
  }

  /**
   * 创建编辑任务
   */
  const createEditTask = async () => {
    if (!selectedPicture.value?.id) {
      message.warning('请先选择图片')
      return false
    }

    loading.value = true
    resetTask()

    try {
      let res

      switch (activeEditType.value) {
        case 'segment':
          res = await segmentPictureUsingPost({
            pictureId: selectedPicture.value.id,
            type: segmentType.value,
          })
          break
        case 'removeWatermark':
          res = await removeWatermarkUsingPost({
            pictureId: selectedPicture.value.id,
            watermarkArea: useWatermarkArea.value ? watermarkArea.value : undefined,
          })
          break
        case 'enhance':
          res = await enhancePictureUsingPost({
            pictureId: selectedPicture.value.id,
            enhanceType: enhanceType.value,
          })
          break
        default:
          message.error('未知的编辑类型')
          return false
      }

      if (res.data.code === 0 && res.data.data) {
        const data = res.data.data
        taskId.value = data.taskId || ''
        taskStatus.value = data.status || EDIT_TASK_STATUS_ENUM.PROCESSING
        message.success('任务创建成功，正在处理...')
        // 开启轮询
        startPolling()
        return true
      } else {
        message.error('创建任务失败：' + res.data.message)
        return false
      }
    } catch (err) {
      message.error('创建任务失败：' + (err instanceof Error ? err.message : String(err)))
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始轮询任务状态
   */
  const startPolling = () => {
    if (!taskId.value || polling.value) {
      return
    }

    polling.value = true
    pollingTimer = window.setInterval(async () => {
      try {
        const res = await getEditTaskUsingGet({ taskId: taskId.value })

        if (res.data.code === 0 && res.data.data) {
          const data = res.data.data
          taskStatus.value = data.status || EDIT_TASK_STATUS_ENUM.PROCESSING

          if (data.status === EDIT_TASK_STATUS_ENUM.SUCCESS) {
            resultUrl.value = data.resultUrl || ''
            message.success('处理完成！')
            clearPolling()
          } else if (data.status === EDIT_TASK_STATUS_ENUM.FAILED) {
            errorMessage.value = data.errorMessage || '处理失败'
            message.error('处理失败：' + errorMessage.value)
            clearPolling()
          }
        }
      } catch (err) {
        // 静默处理轮询错误，继续轮询
      }
    }, 3000) // 每3秒轮询一次
  }

  /**
   * 清除轮询
   */
  const clearPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = undefined
    }
    polling.value = false
  }

  /**
   * 重置任务状态
   */
  const resetTask = () => {
    clearPolling()
    taskId.value = ''
    taskStatus.value = ''
    resultUrl.value = ''
    errorMessage.value = ''
  }

  /**
   * 切换编辑类型
   */
  const switchEditType = (type: string) => {
    activeEditType.value = type
    resetTask()
  }

  // 计算属性
  const isProcessing = computed(() => taskStatus.value === EDIT_TASK_STATUS_ENUM.PROCESSING)
  const isCompleted = computed(() => taskStatus.value === EDIT_TASK_STATUS_ENUM.SUCCESS)
  const isFailed = computed(() => taskStatus.value === EDIT_TASK_STATUS_ENUM.FAILED)

  return {
    // 状态
    selectedPicture,
    activeEditType,
    segmentType,
    useWatermarkArea,
    watermarkArea,
    enhanceType,
    taskId,
    taskStatus,
    resultUrl,
    errorMessage,
    loading,
    polling,

    // 计算属性
    isProcessing,
    isCompleted,
    isFailed,

    // 方法
    selectPicture,
    createEditTask,
    switchEditType,
    resetTask,
    clearPolling,
  }
}
