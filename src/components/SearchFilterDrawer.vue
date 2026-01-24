<template>
  <a-drawer
    v-model:open="drawerVisible"
    title="高级筛选"
    placement="right"
    :width="360"
    @close="handleClose"
  >
    <a-form layout="vertical">
      <a-form-item label="分类">
        <a-select
          v-model:value="localFilters.category"
          placeholder="请选择分类"
          allow-clear
          :options="categoryOptions"
        />
      </a-form-item>
      <a-form-item label="标签">
        <a-select
          v-model:value="localFilters.tags"
          mode="multiple"
          placeholder="请选择标签"
          allow-clear
          :options="tagOptions"
        />
      </a-form-item>
      <a-form-item label="日期范围">
        <a-range-picker
          v-model:value="localFilters.dateRange"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="图片宽度">
        <a-input-number
          v-model:value="localFilters.picWidth"
          placeholder="宽度"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="图片高度">
        <a-input-number
          v-model:value="localFilters.picHeight"
          placeholder="高度"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="图片格式">
        <a-input
          v-model:value="localFilters.picFormat"
          placeholder="如: jpg, png"
          allow-clear
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="handleApply">应用</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Dayjs } from 'dayjs'

export interface FilterValues {
  category?: string
  tags?: string[]
  dateRange?: [Dayjs, Dayjs] | null
  picWidth?: number
  picHeight?: number
  picFormat?: string
  picColor?: string
}

interface Props {
  open?: boolean
  filters?: FilterValues
  categoryList?: string[]
  tagList?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  filters: () => ({}),
  categoryList: () => [],
  tagList: () => [],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:filters': [value: FilterValues]
  apply: [value: FilterValues]
  reset: []
}>()

const drawerVisible = ref(props.open)
const localFilters = reactive<FilterValues>({
  category: undefined,
  tags: [],
  dateRange: null,
  picWidth: undefined,
  picHeight: undefined,
  picFormat: undefined,
})

// 计算分类选项
const categoryOptions = computed(() =>
  props.categoryList.map((item) => ({ value: item, label: item }))
)

// 计算标签选项
const tagOptions = computed(() =>
  props.tagList.map((item) => ({ value: item, label: item }))
)

watch(
  () => props.open,
  (val) => {
    drawerVisible.value = val
  }
)

watch(
  () => props.filters,
  (val) => {
    if (val) {
      Object.assign(localFilters, val)
    }
  },
  { immediate: true, deep: true }
)

watch(drawerVisible, (val) => {
  emit('update:open', val)
})

const handleClose = () => {
  drawerVisible.value = false
}

const handleReset = () => {
  localFilters.category = undefined
  localFilters.tags = []
  localFilters.dateRange = null
  localFilters.picWidth = undefined
  localFilters.picHeight = undefined
  localFilters.picFormat = undefined
  emit('update:filters', { ...localFilters })
  emit('reset')
}

const handleApply = () => {
  emit('update:filters', { ...localFilters })
  emit('apply', { ...localFilters })
  drawerVisible.value = false
}
</script>

<style scoped>
:deep(.ant-drawer-footer) {
  display: flex;
  justify-content: flex-end;
}
</style>
