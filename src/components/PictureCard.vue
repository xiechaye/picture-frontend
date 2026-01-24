<template>
  <div class="picture-card" @click="emit('click', picture)">
    <div class="picture-image-wrapper">
      <img
        :src="picture.thumbnailUrl || picture.url"
        :alt="picture.name"
        class="picture-image"
        loading="lazy"
      />
      <div v-if="showOp" class="picture-actions">
        <a-space>
          <a-button
            type="text"
            size="small"
            @click="(e: MouseEvent) => emit('share', picture, e)"
          >
            <ShareAltOutlined />
          </a-button>
          <a-button
            type="text"
            size="small"
            @click="(e: MouseEvent) => emit('search', picture, e)"
          >
            <SearchOutlined />
          </a-button>
          <a-button
            v-if="canEdit"
            type="text"
            size="small"
            @click="(e: MouseEvent) => emit('edit', picture, e)"
          >
            <EditOutlined />
          </a-button>
          <a-popconfirm
            v-if="canDelete"
            title="确定删除此图片吗？"
            @confirm="(e: MouseEvent) => emit('delete', picture, e)"
          >
            <a-button type="text" size="small" danger @click.stop>
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
import {
  ShareAltOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

interface Props {
  picture: API.PictureVO
  showOp?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

withDefaults(defineProps<Props>(), {
  showOp: false,
  canEdit: false,
  canDelete: false,
})

const emit = defineEmits<{
  click: [picture: API.PictureVO]
  share: [picture: API.PictureVO, e: MouseEvent]
  search: [picture: API.PictureVO, e: MouseEvent]
  edit: [picture: API.PictureVO, e: MouseEvent]
  delete: [picture: API.PictureVO, e: MouseEvent]
}>()
</script>

<style scoped>
.picture-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.picture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.picture-image-wrapper {
  position: relative;
  overflow: hidden;
}

.picture-image {
  width: 100%;
  display: block;
  object-fit: cover;
  min-height: 100px;
}

.picture-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 24px 8px 8px;
  opacity: 0;
  transition: opacity 200ms ease;
}

.picture-card:hover .picture-actions {
  opacity: 1;
}

.picture-actions :deep(.ant-btn) {
  color: #fff;
}

.picture-actions :deep(.ant-btn:hover) {
  color: #40a9ff;
}

.picture-info {
  padding: 12px;
}

.picture-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
