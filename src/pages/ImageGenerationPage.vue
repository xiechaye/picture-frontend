<template>
  <div id="imageGenerationPage">
    <h2 style="margin-bottom: 24px">图片AI创作</h2>

    <!-- 表单区域 -->
    <a-card class="form-card">
      <a-form layout="vertical">
        <!-- 空间选择 -->
        <a-form-item label="保存至空间" required>
          <a-select
            v-model:value="spaceId"
            placeholder="请选择空间"
            :loading="spacesLoading"
            :disabled="isProcessing"
            show-search
            :filter-option="filterSpaceOption"
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
            style="margin-top: 8px"
          >
            <template #action>
              <a-button size="small" type="primary" @click="goToCreateSpace">
                立即创建
              </a-button>
            </template>
          </a-alert>
        </a-form-item>

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
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="500"
            :disabled="isProcessing"
            allow-clear
          />

          <!-- 示例Prompt -->
          <div class="prompt-examples">
            <a-typography-text type="secondary">示例：</a-typography-text>
            <a-space wrap>
              <a-tag
                v-for="(example, index) in PROMPT_EXAMPLES"
                :key="index"
                color="blue"
                style="cursor: pointer"
                @click="prompt = example"
              >
                {{ example }}
              </a-tag>
            </a-space>
          </div>
        </a-form-item>

        <!-- 按钮组 -->
        <a-form-item>
          <a-space size="middle">
            <a-button
              type="default"
              :loading="optimizing"
              :disabled="!prompt || generating"
              @click="optimizePrompt"
            >
              <template #icon><BulbOutlined /></template>
              优化描述
            </a-button>

            <a-button v-if="canUndo" type="link" @click="undoOptimize">
              撤销优化
            </a-button>

            <a-button
              type="primary"
              :loading="generating"
              :disabled="optimizing"
              @click="generateImage"
            >
              <template #icon><PictureOutlined /></template>
              {{ generating ? '生成中...' : '生成图片' }}
            </a-button>

            <a-button v-if="generatedImage" @click="resetForm"> 重置 </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 同步生成结果展示 -->
    <a-card
      v-if="generatedImage"
      title="生成结果"
      class="result-card"
      style="margin-top: 24px"
    >
      <a-row :gutter="24">
        <!-- 图片预览 -->
        <a-col :span="12">
          <h4>生成的图片</h4>
          <a-image
            :src="generatedImage.imageUrl"
            :alt="prompt"
            :preview="{
              maskStyle: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
            }"
            style="width: 100%; border-radius: 8px"
          />

          <a-space style="margin-top: 16px">
            <a-button type="primary" @click="downloadImage">
              <template #icon><DownloadOutlined /></template>
              下载图片
            </a-button>
            <a-button type="primary" :loading="uploading" @click="saveToSpace">
              <template #icon><CloudUploadOutlined /></template>
              保存到空间
            </a-button>
            <a-button @click="viewInSpace"> 查看详情 </a-button>
          </a-space>
        </a-col>

        <!-- 图片信息 -->
        <a-col :span="12">
          <h4>生成信息</h4>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="优化后的描述">
              <a-typography-paragraph
                :copyable="{ text: generatedImage.optimizedPrompt }"
                style="margin: 0"
              >
                {{ generatedImage.optimizedPrompt }}
              </a-typography-paragraph>
            </a-descriptions-item>
            <a-descriptions-item label="生成耗时">
              {{ (generatedImage.totalTime / 1000).toFixed(1) }}秒
            </a-descriptions-item>
            <a-descriptions-item label="存储路径">
              {{ generatedImage.cosKey }}
            </a-descriptions-item>
          </a-descriptions>
        </a-col>
      </a-row>
    </a-card>
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

const router = useRouter()

// 使用业务逻辑Hook
const {
  prompt,
  spaceId,
  optimizing,
  generating,
  isProcessing,
  canUndo,
  generatedImage,
  optimizePrompt,
  undoOptimize,
  generateImage,
  resetForm,
} = useImageGeneration()

// 空间列表
const spaceList = ref<API.SpaceVO[]>([])
const spacesLoading = ref(false)

// 上传状态
const uploading = ref(false)

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
 * 查看空间详情
 */
const viewInSpace = () => {
  if (spaceId.value) {
    router.push(`/space/${spaceId.value}`)
  }
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

    // 调用上传 API
    const res = await uploadPictureByUrlUsingPost({
      fileUrl: generatedImage.value.imageUrl,
      spaceId: spaceId.value,
      picName: `AI生成-${Date.now()}`, // 默认名称，用户可以后续修改
    })

    debug('上传API响应:', res)

    if (
      handleApiResponse(res, { operation: '保存图片到空间', showError: true })
    ) {
      const pictureId = res.data.data?.id
      message.success('图片已保存到空间，正在跳转到编辑页面...')

      // 跳转到图片编辑页面
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
  max-width: 1200px;
  margin: 0 auto;
}

.form-card {
  background: #ffffff;
  border-radius: 8px;
}

.prompt-examples {
  margin-top: 12px;
}

.result-card {
  background: #ffffff;
  border-radius: 8px;
}

:deep(.ant-timeline-item-content) {
  font-size: 14px;
}
</style>
