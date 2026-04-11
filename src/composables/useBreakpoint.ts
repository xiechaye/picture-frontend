import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 响应式断点检测
 * @param breakpoint 断点值（像素），默认 768px
 * @returns { isMobile } 是否为移动端视口
 */
export function useBreakpoint(breakpoint = 768) {
  const isMobile = ref(false)

  const update = () => {
    isMobile.value = window.innerWidth < breakpoint
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return {
    isMobile,
  }
}
