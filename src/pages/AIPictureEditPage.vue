<template>
  <div id="aiPictureEditPage">
    <div class="split-layout">
      <!-- 左侧 40%: 控制面板 -->
      <div class="left-panel">
        <GlassCard radius="24px" padding="28px">
          <h2 class="panel-title">
            <BgColorsOutlined class="title-icon" />
            AI 图片编辑
          </h2>

          <!-- 图片选择区域 -->
          <a-divider>选择图片</a-divider>
          <a-button block @click="showSpacePictureModal = true">
            <FolderOpenOutlined />
            从空间选择或上传图片
          </a-button>

          <!-- 已选择的图片预览 -->
          <div v-if="selectedPicture" class="selected-preview">
            <img :src="selectedPicture.url" :alt="selectedPicture.name" />
            <a-typography-text :ellipsis="{ tooltip: selectedPicture.name }" :content="selectedPicture.name" />
          </div>

          <!-- 编辑功能选项卡 -->
          <a-divider>编辑功能</a-divider>
          <a-tabs v-model:activeKey="activeEditType" @change="handleTabChange">
            <!-- 智能抠图 -->
            <a-tab-pane key="segment" tab="智能抠图">
              <a-form layout="vertical">
                <a-form-item label="抠图类型">
                  <a-radio-group v-model:value="segmentType" button-style="solid">
                    <a-radio-button value="human">人像抠图</a-radio-button>
                    <a-radio-button value="object">物体抠图</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <!-- 去除水印 -->
            <a-tab-pane key="removeWatermark" tab="去除水印">
              <a-form layout="vertical">
                <a-form-item>
                  <template #label>
                    <span>水印区域（可选）</span>
                    <a-tooltip title="勾选后在下方图片上框选水印区域">
                      <QuestionCircleOutlined style="margin-left: 4px; color: #999;" />
                    </a-tooltip>
                  </template>
                  <a-checkbox v-model:checked="useWatermarkArea">
                    手动指定水印区域
                  </a-checkbox>

                  <!-- 框选区域 -->
                  <div v-if="useWatermarkArea" class="watermark-selection-area">
                    <ImageAreaSelector
                      v-if="selectedPicture"
                      ref="areaSelectorRef"
                      :imageUrl="selectedPicture?.url || ''"
                      :alt="selectedPicture?.name || ''"
                      v-model="watermarkArea"
                    />
                    <a-empty
                      v-else
                      description="请先选择图片"
                      style="margin: 20px 0;"
                    />

                    <!-- 坐标显示（只读）-->
                    <a-row :gutter="8" style="margin-top: 12px;">
                      <a-col :span="6">
                        <a-input-number
                          :value="watermarkArea?.x"
                          placeholder="X"
                          :min="0"
                          style="width: 100%"
                          disabled
                        />
                      </a-col>
                      <a-col :span="6">
                        <a-input-number
                          :value="watermarkArea?.y"
                          placeholder="Y"
                          :min="0"
                          style="width: 100%"
                          disabled
                        />
                      </a-col>
                      <a-col :span="6">
                        <a-input-number
                          :value="watermarkArea?.width"
                          placeholder="宽"
                          :min="1"
                          style="width: 100%"
                          disabled
                        />
                      </a-col>
                      <a-col :span="6">
                        <a-input-number
                          :value="watermarkArea?.height"
                          placeholder="高"
                          :min="1"
                          style="width: 100%"
                          disabled
                        />
                      </a-col>
                    </a-row>

                    <a-button size="small" style="margin-top: 8px;" @click="clearWatermarkSelection">
                      清除选框
                    </a-button>
                  </div>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <!-- 图片增强 -->
            <a-tab-pane key="enhance" tab="图片增强">
              <a-form layout="vertical">
                <a-form-item label="增强类型">
                  <a-radio-group v-model:value="enhanceType" button-style="solid">
                    <a-radio-button value="quality">质量提升</a-radio-button>
                    <a-radio-button value="denoise">降噪</a-radio-button>
                    <a-radio-button value="sharpen">锐化</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>

          <!-- 操作按钮 -->
          <a-form-item style="margin-top: 24px; margin-bottom: 0">
            <GradientButton
              block
              size="large"
              :loading="loading"
              :disabled="!selectedPicture"
              @click="handleStartEdit"
            >
              <ToolOutlined />
              {{ loading ? '处理中...' : '开始编辑' }}
            </GradientButton>
          </a-form-item>
        </GlassCard>
      </div>

      <!-- 右侧 60%: 预览区域 -->
      <div class="right-panel">
        <div class="preview-area">
          <!-- 空状态 -->
          <div v-if="!selectedPicture" class="empty-state">
            <div class="empty-icon">
              <PictureOutlined />
            </div>
            <h3>请先选择图片</h3>
            <p>从空间选择或上传一张图片开始AI编辑</p>
          </div>

          <!-- 预览状态 -->
          <template v-else>
            <!-- 处理中 -->
            <div v-if="isProcessing" class="processing-state">
              <a-spin size="large">
                <template #indicator>
                  <LoadingOutlined style="font-size: 48px" spin />
                </template>
              </a-spin>
              <h3>AI 正在处理中...</h3>
              <p>请耐心等待，不要关闭页面</p>
              <a-progress
                :percent="processingProgress"
                :format="formatProgress"
                :stroke-color="{ '0%': '#2E7D32', '100%': '#43A047' }"
                status="active"
              />
            </div>

            <!-- 处理失败 -->
            <div v-else-if="isFailed" class="failed-state">
              <CloseCircleOutlined class="status-icon" style="color: #ff4d4f" />
              <h3>处理失败</h3>
              <p>{{ errorMessage }}</p>
              <a-space>
                <a-button type="primary" @click="resetTask">重试</a-button>
                <a-button @click="selectedPicture = null">选择其他图片</a-button>
              </a-space>
            </div>

            <!-- 处理成功 - 结果展示 -->
            <div v-else-if="isCompleted" class="result-display">
              <a-tabs v-model:activeKey="previewMode">
                <a-tab-pane key="compare" tab="对比">
                  <div class="compare-container">
                    <div class="compare-item">
                      <h4>原始图片</h4>
                      <img :src="selectedPicture.url" />
                    </div>
                    <div class="compare-divider">
                      <SwapOutlined />
                    </div>
                    <div class="compare-item">
                      <h4>编辑结果</h4>
                      <img :src="resultUrl" />
                    </div>
                  </div>
                </a-tab-pane>
                <a-tab-pane key="result" tab="结果">
                  <div class="result-container">
                    <a-image :src="resultUrl" />
                  </div>
                </a-tab-pane>
              </a-tabs>

              <!-- 操作按钮 -->
              <div class="result-actions">
                <a-space size="middle">
                  <a-button size="large" @click="downloadResult">
                    <DownloadOutlined />
                    下载结果
                  </a-button>
                  <GradientButton size="large" :loading="uploading" @click="saveToSpace">
                    <CloudUploadOutlined />
                    保存到空间
                  </GradientButton>
                  <a-button size="large" @click="resetTask">
                    <RedoOutlined />
                    重新编辑
                  </a-button>
                </a-space>
              </div>
            </div>

            <!-- 未开始 -->
            <div v-else class="preview-state">
              <h3>图片预览</h3>
              <div class="preview-image">
                <a-image :src="selectedPicture.url" :alt="selectedPicture.name" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 空间图片选择弹窗 -->
    <SpacePictureSelectModal
      v-model:visible="showSpacePictureModal"
      @select="handlePictureSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  BgColorsOutlined,
  FolderOpenOutlined,
  ToolOutlined,
  PictureOutlined,
  DownloadOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  RedoOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue'
import { useAIPictureEdit } from '@/composables/useAIPictureEdit'
import { uploadPictureByUrlUsingPost } from '@/api/pictureController'
import { useSpaceStore } from '@/stores/useSpaceStore'
import GlassCard from '@/components/GlassCard.vue'
import GradientButton from '@/components/GradientButton.vue'
import SpacePictureSelectModal from '@/components/SpacePictureSelectModal.vue'
import ImageAreaSelector from '@/components/ImageAreaSelector.vue'

// 使用业务逻辑Hook
const {
  selectedPicture,
  activeEditType,
  segmentType,
  useWatermarkArea,
  watermarkArea,
  enhanceType,
  taskStatus,
  resultUrl,
  errorMessage,
  loading,
  isProcessing,
  isCompleted,
  isFailed,
  createEditTask,
  switchEditType,
  resetTask,
  clearPolling,
  selectPicture,
} = useAIPictureEdit()

const spaceStore = useSpaceStore()

// 状态
const showSpacePictureModal = ref(false)
const uploading = ref(false)
const previewMode = ref('compare')
const processingProgress = ref(0)
const areaSelectorRef = ref()

// 模拟进度条动画
let progressTimer: number | undefined
const startProgressAnimation = () => {
  processingProgress.value = 0
  progressTimer = window.setInterval(() => {
    if (processingProgress.value < 90) {
      processingProgress.value += Math.random() * 10
    }
  }, 1000)
}

const stopProgressAnimation = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = undefined
  }
  processingProgress.value = 100
}

// 进度条格式化函数 - 保留两位小数
const formatProgress = (percent: number) => {
  return `${percent.toFixed(2)}%`
}

// 监听任务状态
watch(taskStatus, (newStatus) => {
  if (newStatus === 'PROCESSING') {
    startProgressAnimation()
  } else {
    stopProgressAnimation()
  }
})

// 处理Tab切换
const handleTabChange = (key: string) => {
  switchEditType(key)
}

// 清除水印选框
const clearWatermarkSelection = () => {
  watermarkArea.value = { x: 0, y: 0, width: 0, height: 0 }
  areaSelectorRef.value?.clearSelection()
}

// 处理图片选择
const handlePictureSelect = (picture: API.PictureVO) => {
  selectPicture(picture)
  showSpacePictureModal.value = false
}

// 开始编辑
const handleStartEdit = async () => {
  await createEditTask()
}

// 下载结果
const downloadResult = () => {
  if (!resultUrl.value) return

  const link = document.createElement('a')
  link.href = resultUrl.value
  link.download = `ai_edited_${Date.now()}.png`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  message.success('开始下载')
}

// 保存到空间
const saveToSpace = async () => {
  if (!resultUrl.value) return

  uploading.value = true
  try {
    // 获取默认空间
    if (spaceStore.spaceList.length === 0) {
      await spaceStore.fetchSpaceList()
    }
    const defaultSpaceId = spaceStore.spaceList[0]?.id

    if (!defaultSpaceId) {
      message.warning('您还没有创建空间，请先创建一个空间')
      return
    }

    const res = await uploadPictureByUrlUsingPost({
      fileUrl: resultUrl.value,
      spaceId: defaultSpaceId,
      picName: `AI编辑-${Date.now()}`,
    })

    if (res.data.code === 0) {
      message.success('已保存到空间')
    } else {
      message.error('保存失败：' + res.data.message)
    }
  } catch {
    message.error('保存失败')
  } finally {
    uploading.value = false
  }
}

// 组件卸载时清理轮询
onUnmounted(() => {
  clearPolling()
  stopProgressAnimation()
})
</script>

<style scoped>
#aiPictureEditPage {
  height: calc(100vh - 64px - 60px);
  padding: 0;
}

.split-layout {
  display: flex;
  gap: 24px;
  height: 100%;
}

.left-panel {
  flex: 0 0 40%;
  max-width: 500px;
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: #2E7D32;
}

.selected-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.selected-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.watermark-area-inputs {
  margin-top: 8px;
}

.watermark-selection-area {
  margin-top: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.color-picker-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 50px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.preview-area {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.empty-state,
.processing-state,
.failed-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-icon :deep(.anticon) {
  font-size: 36px;
  color: #9ca3af;
}

.status-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.preview-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.preview-state h3 {
  margin-bottom: 16px;
}

.preview-image {
  border-radius: 16px;
  overflow: hidden;
  max-width: 100%;
}

.compare-container {
  display: flex;
  gap: 16px;
  align-items: center;
}

.compare-item {
  flex: 1;
  text-align: center;
}

.compare-item h4 {
  margin-bottom: 8px;
}

.compare-item img {
  width: 100%;
  border-radius: 12px;
  max-height: 400px;
  object-fit: contain;
}

.compare-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 24px;
}

.result-container {
  text-align: center;
}

.result-container img {
  max-width: 100%;
  border-radius: 12px;
  max-height: 500px;
}

.result-actions {
  margin-top: 24px;
  text-align: center;
}

/* 响应式 */
@media (max-width: 992px) {
  .split-layout {
    flex-direction: column;
    height: auto;
  }

  .left-panel {
    flex: none;
    max-width: none;
  }

  .compare-container {
    flex-direction: column;
  }
}
</style>
