<template>
  <div class="picture-list">
    <div v-if="loading" class="picture-skeleton-grid" aria-label="图片加载中">
      <div v-for="item in skeletonItems" :key="item" class="skeleton-card">
        <div class="skeleton-image" :style="{ height: `${180 + (item % 4) * 36}px` }" />
        <div class="skeleton-line" />
      </div>
    </div>

    <a-empty v-else-if="dataList.length === 0" description="暂无图片" />

    <MasonryGrid v-else :items="dataList" :column-width="280" :gap="16" :ssr-columns="4">
      <template #default="{ item: picture }">
        <PictureCard
          :picture="picture as API.PictureVO"
          :can-edit="canEdit"
          :can-delete="canDelete"
          :show-op="showOp"
          :is-selection-mode="isSelectionMode"
          @click="doClickPicture"
          @share="doShare"
          @search="doSearch"
          @edit="doEdit"
          @delete="doDelete"
          @check-change="handleSelectionChange"
        />
      </template>
    </MasonryGrid>

    <ShareModal ref="shareModalRef" title="分享图片" :link="shareLink" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import MasonryGrid from '@/components/MasonryGrid.vue'
import PictureCard from '@/components/PictureCard.vue'
import ShareModal from '@/components/ShareModal.vue'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOp?: boolean
  canEdit?: boolean
  canDelete?: boolean
  isSelectionMode?: boolean
  onReload?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  canEdit: false,
  canDelete: false,
  isSelectionMode: false,
})

const emit = defineEmits<{
  selectionChange: [picture: API.PictureVO]
}>()

const router = useRouter()
const skeletonItems = Array.from({ length: 8 }, (_, index) => index + 1)

/**
 * 处理图片选择变化
 * @param picture 图片对象
 */
const handleSelectionChange = (picture: API.PictureVO) => {
  emit('selectionChange', picture)
}

// 跳转至图片详情页
const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  })
}

// 搜索
const doSearch = (picture: API.PictureVO, e: MouseEvent) => {
  e.stopPropagation()
  window.open(`/?mode=image&pictureId=${picture.id}`)
}

// 编辑
const doEdit = (picture: API.PictureVO, e: MouseEvent) => {
  e.stopPropagation()
  router.push({
    path: '/add_picture',
    query: {
      id: picture.id,
      spaceId: picture.spaceId,
    },
  })
}

// 删除数据
const doDelete = async (picture: API.PictureVO, e: MouseEvent) => {
  e.stopPropagation()
  const id = picture.id
  if (!id) {
    return
  }
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    props.onReload?.()
  } else {
    message.error('删除失败')
  }
}

// ----- 分享操作 ----
const shareModalRef = ref()
const shareLink = ref<string>('')

const doShare = (picture: API.PictureVO, e: MouseEvent) => {
  e.stopPropagation()
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.id ?? ''}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
}
</script>

<style scoped>
.picture-list {
  min-height: 200px;
}

.picture-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.skeleton-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-card);
}

.skeleton-image,
.skeleton-line {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, #f3f4f6 20%, #e5e7eb 50%, #f3f4f6 80%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
}

.skeleton-line {
  height: 16px;
  margin-top: var(--spacing-sm);
  width: 70%;
}

.picture-list :deep(.ant-empty) {
  padding: 60px 0;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
