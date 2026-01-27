import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 图片选择状态管理 Store
 * 用于管理批量编辑时跨页选中的图片状态
 */
export const usePictureSelectionStore = defineStore('pictureSelection', () => {
  // 选中的图片ID集合，使用 Set 实现 O(1) 查找和删除
  // 兼容 number 和 string 类型（PictureVO.id 类型为 number | string）
  const selectedPictureIds = ref<Set<number | string>>(new Set())

  /**
   * 切换单个图片的选中状态
   * @param pictureId 图片ID（支持 number 和 string）
   */
  function togglePicture(pictureId: number | string) {
    if (pictureId === undefined || pictureId === null) {
      return
    }
    if (selectedPictureIds.value.has(pictureId)) {
      selectedPictureIds.value.delete(pictureId)
    } else {
      selectedPictureIds.value.add(pictureId)
    }
  }

  /**
   * 检查图片是否被选中
   * @param pictureId 图片ID（支持 number 和 string）
   * @returns 是否选中
   */
  function isSelected(pictureId: number | string): boolean {
    if (pictureId === undefined || pictureId === null) {
      return false
    }
    return selectedPictureIds.value.has(pictureId)
  }

  /**
   * 清空所有选中状态
   */
  function clearSelection() {
    selectedPictureIds.value.clear()
  }

  /**
   * 移除指定的图片ID（用于图片删除后清理无效ID）
   * @param ids 要移除的图片ID数组
   */
  function removeIds(ids: (number | string)[]) {
    ids.forEach((id) => {
      if (id !== undefined && id !== null) {
        selectedPictureIds.value.delete(id)
      }
    })
  }

  /**
   * 获取所有选中的图片ID数组
   * @returns 选中ID数组
   */
  function getSelectedIds(): (number | string)[] {
    return Array.from(selectedPictureIds.value)
  }

  /**
   * 选中的图片数量（computed）
   */
  const selectedCount = computed(() => selectedPictureIds.value.size)

  return {
    selectedPictureIds,
    togglePicture,
    isSelected,
    clearSelection,
    removeIds,
    getSelectedIds,
    selectedCount,
  }
})
