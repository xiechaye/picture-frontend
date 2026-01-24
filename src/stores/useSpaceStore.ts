import { ref } from 'vue'
import { defineStore } from 'pinia'
import { listMySpaceUsingGet } from '@/api/spaceController'

/**
 * 存储用户空间列表的状态
 */
export const useSpaceStore = defineStore('space', () => {
  // 空间列表
  const spaceList = ref<API.SpaceVO[]>([])

  // 加载状态
  const loading = ref(false)

  // 是否已加载过
  const loaded = ref(false)

  /**
   * 获取空间列表
   * @param forceRefresh 是否强制刷新
   */
  async function fetchSpaceList(forceRefresh = false) {
    // 如果已加载且不强制刷新，直接返回
    if (loaded.value && !forceRefresh) {
      return spaceList.value
    }

    loading.value = true
    try {
      const res = await listMySpaceUsingGet()
      if (res.data.code === 0 && res.data.data) {
        spaceList.value = res.data.data || []
        loaded.value = true
      }
      return spaceList.value
    } catch (err) {
      console.error('获取空间列表失败', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加空间到列表（用于动态添加加入的空间）
   * @param space 空间信息
   */
  function addSpace(space: API.SpaceVO) {
    // 检查是否已存在
    const exists = spaceList.value.some(s => s.id === space.id)
    if (!exists) {
      spaceList.value.push(space)
    }
  }

  /**
   * 清空缓存（用于登出等场景）
   */
  function clearCache() {
    spaceList.value = []
    loaded.value = false
  }

  /**
   * 根据 ID 查找空间
   * @param id 空间 ID（支持 number 或 string 类型）
   */
  function findSpaceById(id: number | string) {
    return spaceList.value.find(space => String(space.id) === String(id))
  }

  return {
    spaceList,
    loading,
    loaded,
    fetchSpaceList,
    addSpace,
    clearCache,
    findSpaceById,
  }
})
