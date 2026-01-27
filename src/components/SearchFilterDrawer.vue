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
      <!-- 按颜色搜图 -->
      <a-form-item v-if="showColorPicker" label="按颜色搜图">
        <div class="color-picker-wrapper">
          <ColorPicker
            v-model:pureColor="localFilters.picColor"
            format="hex"
            shape="circle"
            :disable-alpha="true"
          />
          <a-button
            v-if="localFilters.picColor"
            type="link"
            size="small"
            @click="clearColor"
          >
            清除颜色
          </a-button>
        </div>
        <div v-if="localFilters.picColor" class="color-preview">
          <span>已选颜色：</span>
          <span
            class="color-block"
            :style="{ backgroundColor: localFilters.picColor }"
          ></span>
          <span>{{ localFilters.picColor }}</span>
        </div>
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
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'

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
  showColorPicker?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  filters: () => ({}),
  categoryList: () => [],
  tagList: () => [],
  showColorPicker: false,
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
  picColor: undefined,
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
  localFilters.picColor = undefined
  emit('update:filters', { ...localFilters })
  emit('reset')
}

// 清除颜色选择
const clearColor = () => {
  localFilters.picColor = undefined
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

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.color-block {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}
</style>
