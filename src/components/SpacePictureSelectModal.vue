<template>
  <a-modal
    :open="internalVisible"
    title="从空间选择图片"
    width="80%"
    :footer="null"
    @cancel="handleCancel"
  >
    <!-- 空间选择器 + 上传按钮 -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="12">
        <a-select
          v-model:value="selectedSpaceId"
          placeholder="选择空间"
          style="width: 100%"
          @change="handleSpaceChange"
        >
          <a-select-option v-for="space in spaceList" :key="space.id" :value="space.id">
            {{ space.spaceName }}
          </a-select-option>
        </a-select>
      </a-col>
      <a-col :span="12">
        <a-space style="width: 100%">
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索图片"
            allow-clear
            @search="handleSearch"
            style="flex: 1"
          />
          <a-upload
            :custom-request="handleUpload"
            :show-upload-list="false"
            accept="image/*"
          >
            <a-button type="primary" :loading="uploading">
              <UploadOutlined />
              上传
            </a-button>
          </a-upload>
        </a-space>
      </a-col>
    </a-row>

    <!-- 图片网格 -->
    <a-spin :spinning="loading">
      <div v-if="pictureList.length > 0" class="picture-grid">
        <div
          v-for="picture in pictureList"
          :key="picture.id"
          class="picture-item"
          :class="{ 'is-selected': tempSelectedPicture?.id === picture.id }"
          @click="handlePictureClick(picture)"
        >
          <img :src="picture.thumbnailUrl || picture.url" :alt="picture.name" />
          <div class="picture-name">{{ picture.name }}</div>
          <div v-if="tempSelectedPicture?.id === picture.id" class="selected-badge">
            <CheckOutlined />
          </div>
        </div>
      </div>
      <a-empty v-else description="暂无图片" />

      <!-- 分页 -->
      <div v-if="total > 0" style="margin-top: 16px; text-align: right">
        <a-pagination
          v-model:current="current"
          v-model:pageSize="pageSize"
          :total="total"
          show-size-changer
          @change="handlePageChange"
        />
      </div>
    </a-spin>

    <!-- 底部按钮 -->
    <div style="margin-top: 24px; text-align: right">
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" :disabled="!tempSelectedPicture" @click="handleConfirm">
          确定
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { listPictureVoByPageUsingPost, uploadPictureUsingPost } from '@/api/pictureController'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { SPACE_TYPE_ENUM } from '@/constants/space'
import { CheckOutlined, UploadOutlined } from '@ant-design/icons-vue'

interface Props {
  visible?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', picture: API.PictureVO): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const spaceStore = useSpaceStore()

// 状态
const spaceList = ref<API.SpaceVO[]>([])
const selectedSpaceId = ref<string>()
const pictureList = ref<API.PictureVO[]>([])
const tempSelectedPicture = ref<API.PictureVO | null>(null)
const searchText = ref('')
const loading = ref(false)
const uploading = ref(false)
const current = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 内部可见状态
const internalVisible = ref(false)

// 同步外部 visible
watch(
  () => props.visible,
  (val) => {
    internalVisible.value = val
    if (val) {
      loadSpaceList()
    }
  }
)

watch(internalVisible, (val) => {
  emit('update:visible', val)
})

// 加载空间列表
const loadSpaceList = async () => {
  await spaceStore.fetchSpaceList()
  spaceList.value = spaceStore.spaceList
  if (spaceList.value.length > 0 && !selectedSpaceId.value) {
    // 优先选择私有空间
    const privateSpace = spaceList.value.find(
      (s) => s.spaceType === SPACE_TYPE_ENUM.PRIVATE
    )
    selectedSpaceId.value = privateSpace?.id || spaceList.value[0].id
    loadPictureList()
  }
}

// 加载图片列表
const loadPictureList = async () => {
  if (!selectedSpaceId.value) return

  loading.value = true
  try {
    const res = await listPictureVoByPageUsingPost({
      spaceId: selectedSpaceId.value,
      searchText: searchText.value || undefined,
      current: current.value,
      pageSize: pageSize.value,
    })

    if (res.data.code === 0 && res.data.data) {
      pictureList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

// 空间切换
const handleSpaceChange = () => {
  current.value = 1
  tempSelectedPicture.value = null
  loadPictureList()
}

// 搜索
const handleSearch = () => {
  current.value = 1
  loadPictureList()
}

// 分页变化
const handlePageChange = () => {
  loadPictureList()
}

// 点击图片
const handlePictureClick = (picture: API.PictureVO) => {
  tempSelectedPicture.value = picture
}

// 确认选择
const handleConfirm = () => {
  if (tempSelectedPicture.value) {
    emit('select', tempSelectedPicture.value)
    internalVisible.value = false
  }
}

// 取消
const handleCancel = () => {
  internalVisible.value = false
}

// 处理上传
const handleUpload = async (options: { file: File }) => {
  const { file } = options

  if (!selectedSpaceId.value) {
    message.warning('请先选择空间')
    return
  }

  uploading.value = true
  try {
    const res = await uploadPictureUsingPost(
      {
        spaceId: selectedSpaceId.value,
        picName: file.name,
      },
      {},
      file
    )

    if (res.data.code === 0 && res.data.data) {
      message.success('上传成功')
      // 刷新图片列表并选中新上传的图片
      current.value = 1
      await loadPictureList()
      // 选中新上传的图片
      tempSelectedPicture.value = res.data.data
    } else {
      message.error('上传失败：' + res.data.message)
    }
  } catch (err) {
    message.error('上传失败：' + (err instanceof Error ? err.message : String(err)))
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  if (props.visible) {
    loadSpaceList()
  }
})
</script>

<style scoped>
.picture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
  padding: 4px;
}

.picture-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: #f5f5f5;
}

.picture-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.picture-item.is-selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.picture-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.picture-name {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #fff;
}

.selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
</style>
