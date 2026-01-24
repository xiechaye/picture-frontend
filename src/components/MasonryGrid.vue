<template>
  <div class="masonry-grid" ref="gridRef">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="masonry-item"
      :style="{ width: columnWidth + 'px' }"
    >
      <slot :item="item" :index="index"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props<T = unknown> {
  items: T[]
  columnWidth?: number
  gap?: number
  ssrColumns?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  columnWidth: 280,
  gap: 16,
  ssrColumns: 4,
})

const gridRef = ref<HTMLElement | null>(null)

const updateLayout = () => {
  nextTick(() => {
    if (!gridRef.value) return

    const items = gridRef.value.querySelectorAll('.masonry-item') as NodeListOf<HTMLElement>
    const containerWidth = gridRef.value.clientWidth
    const columnCount = Math.max(1, Math.floor((containerWidth + props.gap) / (props.columnWidth + props.gap)))
    const actualColumnWidth = (containerWidth - (columnCount - 1) * props.gap) / columnCount

    const columnHeights = new Array(columnCount).fill(0)

    items.forEach((item) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      const left = shortestColumn * (actualColumnWidth + props.gap)
      const top = columnHeights[shortestColumn]

      item.style.position = 'absolute'
      item.style.left = `${left}px`
      item.style.top = `${top}px`
      item.style.width = `${actualColumnWidth}px`

      columnHeights[shortestColumn] += item.offsetHeight + props.gap
    })

    gridRef.value.style.height = `${Math.max(...columnHeights)}px`
  })
}

// 监听图片加载完成后重新计算布局
const observeImages = () => {
  if (!gridRef.value) return

  const images = gridRef.value.querySelectorAll('img')
  images.forEach((img) => {
    if (img.complete) return // 已加载完成的跳过

    img.addEventListener('load', updateLayout, { once: true })
    img.addEventListener('error', updateLayout, { once: true })
  })
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateLayout()
  observeImages()

  if (gridRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })
    resizeObserver.observe(gridRef.value)
  }

  window.addEventListener('resize', updateLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

watch(
  () => props.items,
  () => {
    updateLayout()
    nextTick(observeImages)
  },
  { deep: true }
)
</script>

<style scoped>
.masonry-grid {
  position: relative;
  width: 100%;
}

.masonry-item {
  position: absolute;
}
</style>
