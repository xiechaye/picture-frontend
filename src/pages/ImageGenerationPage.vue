<template>
  <div id="imageGenerationPage">
    <div class="split-layout">
      <!-- 左侧 40%: 表单区域 -->
      <div class="left-panel">
        <GlassCard radius="24px" padding="28px">
          <h2 class="panel-title">
            <BulbOutlined class="title-icon" />
            AI 图片创作
          </h2>

          <a-form layout="vertical">
            <!-- 图片描述 -->
            <a-form-item required>
              <template #label>
                <span>图片描述</span>
                <a-typography-text type="secondary" style="margin-left: 8px">
                  ({{ prompt.length }}/500)
                </a-typography-text>
              </template>

              <a-textarea
                v-model:value="prompt"
                placeholder="描述你想生成的图片，例如：夕阳下的海滩，金色沙滩，平静的海浪..."
                :auto-size="{ minRows: 6, maxRows: 10 }"
                :maxlength="500"
                :disabled="isProcessing"
                allow-clear
                class="prompt-textarea"
              />

              <!-- 示例Prompt -->
              <div class="prompt-examples">
                <a-typography-text type="secondary">示例：</a-typography-text>
                <div class="example-tags">
                  <a-tag
                    v-for="(example, index) in PROMPT_EXAMPLES"
                    :key="index"
                    class="example-tag"
                    @click="prompt = example"
                  >
                    {{ example }}
                  </a-tag>
                </div>
              </div>
            </a-form-item>

            <!-- 高级选项（可折叠） -->
            <a-collapse
              v-model:activeKey="advancedOptionsVisible"
              :bordered="false"
              expand-icon-position="end"
              class="advanced-options"
            >
              <a-collapse-panel key="1" header="高级选项">
                <!-- 图片尺寸 -->
                <a-form-item label="图片尺寸">
                  <a-select
                    v-model:value="size"
                    placeholder="默认尺寸（1024x1024）"
                    :disabled="isProcessing"
                    allow-clear
                  >
                    <a-select-option value="1024,1024">1024 × 1024（正方形）</a-select-option>
                    <a-select-option value="1024,768">1024 × 768（横向）</a-select-option>
                    <a-select-option value="768,1024">768 × 1024（纵向）</a-select-option>
                    <a-select-option value="1280,720">1280 × 720（宽屏）</a-select-option>
                  </a-select>
                  <a-typography-text v-if="recommendedSize" type="secondary" style="margin-top: 4px; display: block;">
                    推荐尺寸：{{ recommendedSize }}
                  </a-typography-text>
                </a-form-item>

                <!-- 负面提示词 -->
                <a-form-item label="负面提示词" style="margin-bottom: 0">
                  <a-textarea
                    v-model:value="customNegativePrompt"
                    placeholder="描述不希望出现的内容，例如：blurry, low quality, distorted..."
                    :auto-size="{ minRows: 2, maxRows: 4 }"
                    :disabled="isProcessing"
                    allow-clear
                  />
                  <a-typography-text v-if="negativePrompt && !customNegativePrompt" type="secondary" style="margin-top: 4px; display: block;">
                    推荐：{{ negativePrompt }}
                  </a-typography-text>
                </a-form-item>
              </a-collapse-panel>
            </a-collapse>

            <!-- 空间选择（保存时使用） -->
            <a-form-item label="保存至空间">
              <a-select
                v-model:value="spaceId"
                placeholder="请选择空间（保存时需要）"
                :loading="spacesLoading"
                :disabled="isProcessing"
                show-search
                :filter-option="filterSpaceOption"
                size="large"
              >
                <a-select-option
                  v-for="space in spaceList"
                  :key="space.id"
                  :value="space.id"
                >
                  {{ space.spaceName }}（{{ SPACE_TYPE_MAP[space.spaceType ?? 0] }}）
                </a-select-option>
              </a-select>

              <!-- 空间为空时的提示 -->
              <a-alert
                v-if="!spacesLoading && spaceList.length === 0"
                message="您还没有创建空间"
                description="请先创建一个空间，用于保存生成的图片。"
                type="warning"
                show-icon
                style="margin-top: 12px"
              >
                <template #action>
                  <a-button size="small" type="primary" @click="goToCreateSpace">
                    立即创建
                  </a-button>
                </template>
              </a-alert>
            </a-form-item>

            <!-- 按钮组 -->
            <a-form-item style="margin-bottom: 0">
              <a-space direction="vertical" style="width: 100%" :size="12">
                <a-button
                  block
                  size="large"
                  :loading="optimizing"
                  :disabled="!prompt || generating"
                  @click="optimizePrompt"
                >
                  <template #icon><BulbOutlined /></template>
                  优化描述
                </a-button>

                <a-button
                  v-if="canUndo"
                  type="link"
                  block
                  @click="undoOptimize"
                >
                  撤销优化
                </a-button>

                <GradientButton
                  block
                  size="large"
                  :loading="generating"
                  :disabled="optimizing || !prompt"
                  @click="generateImage"
                >
                  <PictureOutlined />
                  {{ generating ? '生成中...' : '生成图片' }}
                </GradientButton>
              </a-space>
            </a-form-item>
          </a-form>
        </GlassCard>
      </div>

      <!-- 右侧 60%: 画布展示区域 -->
      <div class="right-panel">
        <div class="canvas-area">
          <!-- 空状态 -->
          <div v-if="!generatedImage" class="empty-state">
            <div class="empty-icon">
              <PictureOutlined />
            </div>
            <h3>开始创作</h3>
            <p>输入描述并点击生成按钮，AI 将为您创作独特的图片</p>
          </div>

          <!-- 生成结果 -->
          <div v-else class="result-display">
            <div class="image-container">
              <a-image
                :src="generatedImage.imageUrl"
                :alt="prompt"
                :preview="{
                  maskStyle: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
                }"
                class="generated-image"
              />
            </div>

            <!-- 生成信息 -->
            <div class="result-info">
              <div class="info-item">
                <span class="info-label">优化后的描述</span>
                <a-typography-paragraph
                  :copyable="{ text: generatedImage.optimizedPrompt }"
                  class="info-value"
                >
                  {{ generatedImage.optimizedPrompt }}
                </a-typography-paragraph>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">生成耗时</span>
                  <span class="info-value">
                    {{ (generatedImage.totalTime / 1000).toFixed(1) }}秒
                  </span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="result-actions">
              <a-button size="large" @click="downloadImage">
                <template #icon><DownloadOutlined /></template>
                下载图片
              </a-button>
              <GradientButton size="large" :loading="uploading" @click="saveToSpace">
                <CloudUploadOutlined />
                保存到空间
              </GradientButton>
              <a-button size="large" @click="resetForm">
                重新生成
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  BulbOutlined,
  PictureOutlined,
  DownloadOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons-vue'
import { useImageGeneration } from '@/composables/useImageGeneration'
import { listMySpaceUsingGet } from '@/api/spaceController'
import { uploadPictureByUrlUsingPost } from '@/api/pictureController'
import { handleApiResponse, handleException } from '@/utils/errorHandler'
import { PROMPT_EXAMPLES } from '@/constants/imageGeneration'
import { SPACE_TYPE_MAP } from '@/constants/space'
import { useRouter } from 'vue-router'
import { debug } from '@/utils/logger'
import GlassCard from '@/components/GlassCard.vue'
import GradientButton from '@/components/GradientButton.vue'

const router = useRouter()

// 使用业务逻辑Hook
const {
  prompt,
  spaceId,
  size,
  customNegativePrompt,
  optimizing,
  generating,
  isProcessing,
  canUndo,
  generatedImage,
  recommendedSize,
  negativePrompt,
  optimizePrompt,
  undoOptimize,
  generateImage,
  resetForm,
} = useImageGeneration()

// 空间列表
const spaceList = ref<API.SpaceVO[]>([])
const spacesLoading = ref(false)
const uploading = ref(false)

// 高级选项折叠面板状态
const advancedOptionsVisible = ref<string[]>([])

/**
 * 加载空间列表
 */
const loadSpaces = async () => {
  spacesLoading.value = true
  try {
    debug('开始加载空间列表...')
    const res = await listMySpaceUsingGet()

    debug('空间列表API响应:', res)

    if (
      handleApiResponse(res, { operation: '加载空间列表', showError: true })
    ) {
      spaceList.value = res.data.data || []
      debug(`加载到 ${spaceList.value.length} 个空间`)

      // 默认选择第一个空间
      if (spaceList.value.length > 0 && !spaceId.value) {
        spaceId.value = spaceList.value[0].id
        debug(`默认选中空间: ${spaceList.value[0].spaceName}`)
      } else if (spaceList.value.length === 0) {
        message.warning('您还没有创建空间，请先创建一个空间')
      }
    }
  } catch (err) {
    handleException(err, { operation: '加载空间列表' })
  } finally {
    spacesLoading.value = false
  }
}

/**
 * 空间搜索过滤
 */
const filterSpaceOption = (input: string, option: any) => {
  return option.children[0].children
    .toLowerCase()
    .includes(input.toLowerCase())
}

/**
 * 下载图片
 */
const downloadImage = () => {
  if (!generatedImage.value) return

  const link = document.createElement('a')
  link.href = generatedImage.value.imageUrl
  link.download = `ai_generated_${Date.now()}.png`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  message.success('开始下载图片')
}

/**
 * 前往创建空间页面
 */
const goToCreateSpace = () => {
  router.push('/add_space')
}

/**
 * 保存图片到空间
 */
const saveToSpace = async () => {
  if (!generatedImage.value) {
    message.warning('没有可保存的图片')
    return
  }

  if (!spaceId.value) {
    message.warning('请先选择空间')
    return
  }

  uploading.value = true

  try {
    debug('开始上传生成的图片到空间', {
      imageUrl: generatedImage.value.imageUrl,
      spaceId: spaceId.value,
    })

    const res = await uploadPictureByUrlUsingPost({
      fileUrl: generatedImage.value.imageUrl,
      spaceId: spaceId.value,
      picName: `AI生成-${Date.now()}`,
    })

    debug('上传API响应:', res)

    if (
      handleApiResponse(res, { operation: '保存图片到空间', showError: true })
    ) {
      const pictureId = res.data.data?.id
      message.success('图片已保存到空间，正在跳转到编辑页面...')

      setTimeout(() => {
        router.push({
          path: '/add_picture',
          query: {
            id: pictureId,
            spaceId: spaceId.value,
          },
        })
      }, 500)
    }
  } catch (err) {
    handleException(err, { operation: '保存图片到空间' })
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadSpaces()
})
</script>

<style scoped>
#imageGenerationPage {
  height: calc(100vh - 64px - 60px - 48px);
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
  color: #6366f1;
}

.prompt-textarea :deep(textarea) {
  border-radius: 12px;
  font-size: 14px;
}

.prompt-examples {
  margin-top: 12px;
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.example-tag {
  cursor: pointer;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  transition: all 200ms ease;
}

.example-tag:hover {
  background: #059669;
  border-color: #059669;
  color: white;
}

.advanced-options {
  margin-bottom: 16px;
  background: transparent;
}

.advanced-options :deep(.ant-collapse-item) {
  border: none;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 0;
}

.advanced-options :deep(.ant-collapse-header) {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  border-radius: 12px;
}

.advanced-options :deep(.ant-collapse-content) {
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.advanced-options :deep(.ant-collapse-content-box) {
  padding: 16px;
}

.canvas-area {
  width: 100%;
  max-width: 700px;
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
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

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #111827;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-container {
  border-radius: 16px;
  overflow: hidden;
}

.generated-image {
  width: 100%;
  border-radius: 16px;
}

.result-info {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #111827;
  margin: 0;
}

.info-row {
  display: flex;
  gap: 24px;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
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

  .right-panel {
    min-height: 400px;
  }
}
</style>
