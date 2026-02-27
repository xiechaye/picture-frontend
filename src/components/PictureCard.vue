<template>
  <div class="picture-card" :class="{ 'is-selected': isSelected }" @click="handleCardClick">
    <!-- 右上角选中图标 -->
    <div v-if="isSelectionMode && isSelected" class="selection-badge">
      <CheckCircleOutlined />
    </div>
    <div class="picture-image-wrapper" :class="{ 'is-loaded': imgLoaded }">
      <img
        :src="picture.thumbnailUrl || picture.url"
        :alt="picture.name"
        class="picture-image"
        :class="{ 'img-loaded': imgLoaded }"
        loading="lazy"
        @load="imgLoaded = true"
      />
      <div v-if="showOp" class="picture-actions">
        <a-space>
          <a-button
            type="text"
            size="small"
            aria-label="分享图片"
            @click="(e: MouseEvent) => emit('share', picture, e)"
          >
            <ShareAltOutlined />
          </a-button>
          <a-button
            type="text"
            size="small"
            aria-label="以图搜图"
            @click="(e: MouseEvent) => emit('search', picture, e)"
          >
            <SearchOutlined />
          </a-button>
          <a-button
            v-if="canEdit"
            type="text"
            size="small"
            aria-label="编辑图片"
            @click="(e: MouseEvent) => emit('edit', picture, e)"
          >
            <EditOutlined />
          </a-button>
          <a-popconfirm
            v-if="canDelete"
            title="确定删除此图片吗？"
            @confirm="(e: MouseEvent) => emit('delete', picture, e)"
          >
            <a-button type="text" size="small" danger aria-label="删除图片" @click.stop>
              <DeleteOutlined />
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>
    </div>
    <div class="picture-info">
      <div class="picture-name" :title="picture.name">{{ picture.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ShareAltOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue'
import { usePictureSelectionStore } from '@/stores/usePictureSelectionStore.ts'

interface Props {
  picture: API.PictureVO
  showOp?: boolean
  canEdit?: boolean
  canDelete?: boolean
  isSelectionMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showOp: false,
  canEdit: false,
  canDelete: false,
  isSelectionMode: false,
})

const pictureSelectionStore = usePictureSelectionStore()

const imgLoaded = ref(false)

// 检查图片是否被选中
const isSelected = computed(() => {
  return (
    props.picture.id !== undefined &&
    props.picture.id !== null &&
    pictureSelectionStore.isSelected(props.picture.id)
  )
})

const emit = defineEmits<{
  click: [picture: API.PictureVO]
  share: [picture: API.PictureVO, e: MouseEvent]
  search: [picture: API.PictureVO, e: MouseEvent]
  edit: [picture: API.PictureVO, e: MouseEvent]
  delete: [picture: API.PictureVO, e: MouseEvent]
  checkChange: [picture: API.PictureVO]
}>()

/**
 * 处理卡片点击事件
 * 选择模式下：选中/取消选中图片
 * 普通模式下：跳转到图片详情
 */
const handleCardClick = () => {
  if (props.isSelectionMode) {
    // 选择模式：发出选中变化事件
    emit('checkChange', props.picture)
  } else {
    // 普通模式：跳转详情
    emit('click', props.picture)
  }
}
</script>

<style scoped>
.picture-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-card);
  position: relative;
}

/* 选中状态样式 */
.picture-card.is-selected {
  box-shadow:
    0 0 0 2px var(--color-primary),
    var(--shadow-card);
}

.picture-card.is-selected .picture-image {
  opacity: 0.8;
}

.picture-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.picture-card.is-selected:hover {
  box-shadow:
    0 0 0 2px var(--color-primary),
    var(--shadow-card-hover);
}

/* 右上角选中图标样式 */
.selection-badge {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  z-index: 10;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-full);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: badge-in 0.2s ease-out;
}

@keyframes badge-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.selection-badge svg {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

.picture-image-wrapper {
  position: relative;
  overflow: hidden;
  background: #f3f4f6;
}

.picture-image-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f3f4f6 20%, #e5e7eb 50%, #f3f4f6 80%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
}

.picture-image-wrapper.is-loaded::before {
  display: none;
}

.picture-image {
  width: 100%;
  display: block;
  object-fit: cover;
  min-height: 100px;
  opacity: 0;
  transition: opacity var(--transition-slow);
}

.picture-image.img-loaded {
  opacity: 1;
}

.picture-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: var(--spacing-lg) var(--spacing-xs) var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.picture-card:hover .picture-actions {
  opacity: 1;
}

.picture-actions :deep(.ant-btn) {
  color: var(--color-text-white);
}

.picture-actions :deep(.ant-btn:hover) {
  color: #40a9ff;
}

.picture-info {
  padding: var(--spacing-sm);
}

.picture-name {
  font-size: 14px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
