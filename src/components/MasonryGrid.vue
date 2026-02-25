<template>
  <div class="masonry-grid" ref="gridRef">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="masonry-item"
      :class="{ 'vscroll-offscreen': virtualScroll && !visibleSet.has(index) }"
      :style="{ width: columnWidth + 'px' }"
    >
      <slot :item="item" :index="index"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Stores the top offset of each item after layout calculation
const itemTops = ref<number[]>([])
// Set of indices that should be visible (used by virtualScroll mode)
const visibleSet = ref(new Set<number>())

const VSCROLL_OVERSCAN = 400 // px above/below viewport to keep rendered

interface Props<T = unknown> {
  items: T[]
  columnWidth?: number
  gap?: number
  ssrColumns?: number
  virtualScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  columnWidth: 280,
  gap: 16,
  ssrColumns: 4,
  virtualScroll: false,
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
    const tops: number[] = []

    items.forEach((item) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      const left = shortestColumn * (actualColumnWidth + props.gap)
      const top = columnHeights[shortestColumn]

      item.style.position = 'absolute'
      item.style.left = `${left}px`
      item.style.top = `${top}px`
      item.style.width = `${actualColumnWidth}px`

      tops.push(top)
      columnHeights[shortestColumn] += item.offsetHeight + props.gap
    })

    gridRef.value.style.height = `${Math.max(...columnHeights)}px`
    itemTops.value = tops
    if (props.virtualScroll) updateVisibleSet()
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

const updateVisibleSet = () => {
  const scrollTop = window.scrollY
  const windowH = window.innerHeight
  const top = scrollTop - VSCROLL_OVERSCAN
  const bottom = scrollTop + windowH + VSCROLL_OVERSCAN
  const next = new Set<number>()
  itemTops.value.forEach((itemTop, i) => {
    if (itemTop + 400 >= top && itemTop <= bottom) next.add(i)
  })
  visibleSet.value = next
}

let scrollRafId = 0
const onScroll = () => {
  if (!props.virtualScroll) return
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = 0
    updateVisibleSet()
  })
}

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
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
  window.removeEventListener('scroll', onScroll)
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

.masonry-item.vscroll-offscreen {
  visibility: hidden;
  pointer-events: none;
}
</style>
