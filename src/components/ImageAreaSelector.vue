<template>
  <div class="image-area-selector-wrapper">
    <div
      ref="containerRef"
      class="image-area-selector"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- 原始图片 -->
      <img
        :src="imageUrl"
        :alt="alt"
        class="selector-image"
        ref="imageRef"
        @load="handleImageLoad"
        draggable="false"
      />

      <!-- 整体遮罩层：仅在拖拽选择时显示 -->
      <div
        v-show="isDragging"
        class="full-overlay"
        :style="overlayContainerStyle"
      ></div>

      <!-- 分区遮罩层：仅在拖拽时显示，挖空选中区域 -->
      <template v-if="isDragging && selection && overlayContainerStyle.width">
        <!-- 上方遮罩 -->
        <div class="overlay-mask top" :style="maskTopStyle"></div>

        <!-- 下方遮罩 -->
        <div class="overlay-mask bottom" :style="maskBottomStyle"></div>

        <!-- 左侧遮罩 -->
        <div class="overlay-mask left" :style="maskLeftStyle"></div>

        <!-- 右侧遮罩 -->
        <div class="overlay-mask right" :style="maskRightStyle"></div>
      </template>

      <!-- 选框：有选区时始终显示 -->
      <div
        v-if="selection && selection.width > 0 && selection.height > 0"
        class="selection-box"
        :style="selectionStyle"
      >
        <!-- 调整手柄 -->
        <div
          class="resize-handle top-left"
          @mousedown.stop="startResize('top-left', $event)"
        ></div>
        <div
          class="resize-handle top-right"
          @mousedown.stop="startResize('top-right', $event)"
        ></div>
        <div
          class="resize-handle bottom-left"
          @mousedown.stop="startResize('bottom-left', $event)"
        ></div>
        <div
          class="resize-handle bottom-right"
          @mousedown.stop="startResize('bottom-right', $event)"
        ></div>

        <!-- 坐标提示 -->
        <div class="selection-info">
          {{ selectionInfoText }}
        </div>
      </div>

      <!-- 提示文字 -->
      <div v-if="!selection" class="hint-text">点击并拖拽选择水印区域</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

interface Props {
  imageUrl: string
  alt?: string
  modelValue?: { x: number; y: number; width: number; height: number }
}

interface Emits {
  (e: 'update:modelValue', value: { x: number; y: number; width: number; height: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const imageRef = ref<HTMLImageElement>()
const containerRef = ref<HTMLDivElement>()

// 图片和容器尺寸
const imageSize = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })

// 选框状态
const isDragging = ref(false)
const isResizing = ref(false)
const resizeDirection = ref('')
const selection = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const startPos = ref({ x: 0, y: 0 })

const overlayContainerStyle = computed(() => {
  if (imageSize.value.width === 0) {
    return { width: '0px', height: '0px' }
  }
  return {
    width: `${imageSize.value.width}px`,
    height: `${imageSize.value.height}px`,
  }
})

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.width > 0 && newVal.height > 0 && imageSize.value.naturalWidth > 0) {
      // 将原始图片坐标转换为显示坐标
      const scaleX = imageSize.value.width / imageSize.value.naturalWidth
      const scaleY = imageSize.value.height / imageSize.value.naturalHeight
      selection.value = {
        x: (newVal.x || 0) / scaleX,
        y: (newVal.y || 0) / scaleY,
        width: newVal.width / scaleX,
        height: newVal.height / scaleY,
      }
    } else {
      selection.value = null
    }
  }
)

// 获取相对于容器的坐标
const getRelativeCoords = (event: MouseEvent) => {
  if (!containerRef.value) return { x: 0, y: 0 }
  const rect = containerRef.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

// 统一的鼠标按下处理
const handleMouseDown = (event: MouseEvent) => {
  if (isResizing.value) return // 如果正在调整大小，交给resize逻辑处理

  isDragging.value = true
  const coords = getRelativeCoords(event)
  startPos.value = coords
  selection.value = {
    x: coords.x,
    y: coords.y,
    width: 0,
    height: 0,
  }
}

// 统一的鼠标移动处理
const handleMouseMove = (event: MouseEvent) => {
  if (isResizing.value) {
    updateResize(event)
    return
  }
  if (!isDragging.value) return

  const coords = getRelativeCoords(event)
  const width = coords.x - startPos.value.x
  const height = coords.y - startPos.value.y

  // 计算选区（支持反向拖拽）
  const newSelection = {
    x: width > 0 ? startPos.value.x : coords.x,
    y: height > 0 ? startPos.value.y : coords.y,
    width: Math.abs(width),
    height: Math.abs(height),
  }

  // 边界限制
  if (containerRef.value) {
    const maxX = imageSize.value.width
    const maxY = imageSize.value.height

    if (newSelection.x < 0) newSelection.x = 0
    if (newSelection.y < 0) newSelection.y = 0
    if (newSelection.x + newSelection.width > maxX) {
      newSelection.width = maxX - newSelection.x
    }
    if (newSelection.y + newSelection.height > maxY) {
      newSelection.height = maxY - newSelection.y
    }
  }

  selection.value = newSelection
}

// 统一的鼠标松开处理
const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false

    // 检查选区是否有效
    if (selection.value && selection.value.width > 5 && selection.value.height > 5) {
      emitValue()
    } else {
      selection.value = null
      emit('update:modelValue', { x: 0, y: 0, width: 0, height: 0 })
    }
  }
  isResizing.value = false
}

// 开始调整大小
const startResize = (direction: string, event: MouseEvent) => {
  isResizing.value = true
  isDragging.value = true // 同时设置dragging状态以显示遮罩
  resizeDirection.value = direction
  startPos.value = { x: event.clientX, y: event.clientY }
}

// 更新调整大小
const updateResize = (event: MouseEvent) => {
  if (!selection.value || !containerRef.value) return

  const dx = event.clientX - startPos.value.x
  const dy = event.clientY - startPos.value.y

  const newSelection = { ...selection.value }

  switch (resizeDirection.value) {
    case 'bottom-right':
      newSelection.width += dx
      newSelection.height += dy
      break
    case 'bottom-left':
      newSelection.x += dx
      newSelection.width -= dx
      newSelection.height += dy
      break
    case 'top-right':
      newSelection.y += dy
      newSelection.width += dx
      newSelection.height -= dy
      break
    case 'top-left':
      newSelection.x += dx
      newSelection.y += dy
      newSelection.width -= dx
      newSelection.height -= dy
      break
  }

  // 最小尺寸限制
  if (newSelection.width < 10) newSelection.width = 10
  if (newSelection.height < 10) newSelection.height = 10

  // 边界检查
  const maxX = imageSize.value.width
  const maxY = imageSize.value.height

  if (newSelection.x < 0) newSelection.x = 0
  if (newSelection.y < 0) newSelection.y = 0
  if (newSelection.x + newSelection.width > maxX) {
    newSelection.width = maxX - newSelection.x
  }
  if (newSelection.y + newSelection.height > maxY) {
    newSelection.height = maxY - newSelection.y
  }

  selection.value = newSelection
  startPos.value = { x: event.clientX, y: event.clientY }

  // 实时发送值
  emitValue()
}

// 发送值变化
const emitValue = () => {
  if (!selection.value || imageSize.value.naturalWidth === 0) return

  // 计算相对于原始图片尺寸的坐标
  const scaleX = imageSize.value.naturalWidth / imageSize.value.width
  const scaleY = imageSize.value.naturalHeight / imageSize.value.height

  emit('update:modelValue', {
    x: Math.round(selection.value.x * scaleX),
    y: Math.round(selection.value.y * scaleY),
    width: Math.round(selection.value.width * scaleX),
    height: Math.round(selection.value.height * scaleY),
  })
}

// 图片加载完成
const handleImageLoad = () => {
  if (imageRef.value) {
    imageSize.value = {
      width: imageRef.value.clientWidth,
      height: imageRef.value.clientHeight,
      naturalWidth: imageRef.value.naturalWidth,
      naturalHeight: imageRef.value.naturalHeight,
    }
  }
}

// 选框样式
const selectionStyle = computed(() => {
  if (!selection.value) return {}
  return {
    left: `${selection.value.x}px`,
    top: `${selection.value.y}px`,
    width: `${selection.value.width}px`,
    height: `${selection.value.height}px`,
  }
})

// 遮罩层样式计算属性
const maskTopStyle = computed(() => {
  if (!selection.value) return {}
  return {
    height: `${Math.max(0, selection.value.y)}px`,
  }
})

const maskBottomStyle = computed(() => {
  if (!selection.value || !imageSize.value.width) return {}
  const bottom = imageSize.value.height - selection.value.y - selection.value.height
  return {
    height: `${Math.max(0, bottom)}px`,
    top: `${selection.value.y + selection.value.height}px`,
  }
})

const maskLeftStyle = computed(() => {
  if (!selection.value) return {}
  return {
    width: `${Math.max(0, selection.value.x)}px`,
    height: `${selection.value.height}px`,
    top: `${selection.value.y}px`,
  }
})

const maskRightStyle = computed(() => {
  if (!selection.value || !imageSize.value.width) return {}
  const right = imageSize.value.width - selection.value.x - selection.value.width
  return {
    width: `${Math.max(0, right)}px`,
    height: `${selection.value.height}px`,
    top: `${selection.value.y}px`,
    left: `${selection.value.x + selection.value.width}px`,
  }
})

// 选区信息文字
const selectionInfoText = computed(() => {
  if (!selection.value) return '0 × 0'
  return `${Math.round(selection.value.width)} × ${Math.round(selection.value.height)}`
})

// 清除选框
const clearSelection = () => {
  selection.value = null
  emit('update:modelValue', { x: 0, y: 0, width: 0, height: 0 })
}

defineExpose({
  clearSelection,
})

// 组件卸载时清理
onUnmounted(() => {
  // 不需要手动清理，因为没有添加全局监听器
})
</script>

<style scoped>
.image-area-selector-wrapper {
  width: 100%;
  text-align: center;
}

.image-area-selector {
  position: relative;
  display: inline-block;
  cursor: crosshair;
}

.selector-image {
  display: block;
  max-width: 100%;
  max-height: 400px;
  user-select: none;
  pointer-events: none;
}

/* 整体遮罩层 - 仅在拖拽时显示 */
.full-overlay {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 4;
}

.selection-box {
  position: absolute;
  border: 2px solid #1890ff;
  background: transparent;
  pointer-events: none;
  z-index: 10;
}

.overlay-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 5;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1890ff;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 20;
  pointer-events: auto;
}

.resize-handle.top-left {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.resize-handle.top-right {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.resize-handle.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.resize-handle.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

.selection-info {
  position: absolute;
  bottom: -28px;
  left: 0;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 15;
  pointer-events: none;
}

.hint-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  pointer-events: none;
  font-size: 14px;
  z-index: 20;
}
</style>
