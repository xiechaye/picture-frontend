import { onMounted, onUnmounted, ref, Ref } from 'vue'

/**
 * 图片懒加载 Hook
 * @param imageRefs 图片元素引用数组
 * @param threshold 触发加载的阈值（0-1）
 * @returns isIntersecting 状态映射
 */
export function useLazyLoad(threshold = 0.1) {
  const observer = ref<IntersectionObserver | null>(null)
  const loadedImages = ref<Set<string>>(new Set())

  /**
   * 初始化 Intersection Observer
   */
  const initObserver = (callback?: (entry: IntersectionObserverEntry) => void) => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src

            if (src && !loadedImages.value.has(src)) {
              img.src = src
              loadedImages.value.add(src)
              observer.value?.unobserve(img)
              callback?.(entry)
            }
          }
        })
      },
      {
        threshold,
        rootMargin: '50px', // 提前50px开始加载
      }
    )
  }

  /**
   * 观察图片元素
   */
  const observe = (element: Element) => {
    observer.value?.observe(element)
  }

  /**
   * 取消观察图片元素
   */
  const unobserve = (element: Element) => {
    observer.value?.unobserve(element)
  }

  /**
   * 清理 observer
   */
  const cleanup = () => {
    observer.value?.disconnect()
    observer.value = null
    loadedImages.value.clear()
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    initObserver,
    observe,
    unobserve,
    cleanup,
    loadedImages,
  }
}

/**
 * 防抖 Hook
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: number | null = null

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      callback(...args)
      timer = null
    }, delay)
  }
}

/**
 * 节流 Hook
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      callback(...args)
      lastTime = now
    }
  }
}

/**
 * 无限滚动 Hook
 * @param loadMore 加载更多数据的回调
 * @param options 配置选项
 */
export function useInfiniteScroll(
  loadMore: () => Promise<void> | void,
  options: {
    threshold?: number
    root?: Element | null
    enabled?: Ref<boolean>
  } = {}
) {
  const { threshold = 0.1, root = null, enabled = ref(true) } = options
  const observer = ref<IntersectionObserver | null>(null)
  const loading = ref(false)

  const initObserver = (target: Element) => {
    if (!enabled.value || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    observer.value = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && enabled.value && !loading.value) {
          loading.value = true
          try {
            await loadMore()
          } finally {
            loading.value = false
          }
        }
      },
      {
        threshold,
        root,
      }
    )

    observer.value.observe(target)
  }

  const cleanup = () => {
    observer.value?.disconnect()
    observer.value = null
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    initObserver,
    cleanup,
    loading,
  }
}
