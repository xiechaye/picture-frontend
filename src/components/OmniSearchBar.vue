<template>
  <div class="omni-search-bar">
    <a-input-search
      v-model:value="searchValue"
      :placeholder="currentPlaceholder"
      size="large"
      allow-clear
      :disabled="searchModeValue === 'image'"
      @search="handleSearch"
    >
      <template #prefix>
        <SearchOutlined />
      </template>
      <template #addonBefore v-if="showAiMode">
        <a-segmented
          v-model:value="searchModeValue"
          :options="modeOptions"
          size="small"
        />
      </template>
      <template #addonAfter v-if="showFilter">
        <a-badge :count="filterCount" :offset="[-5, -5]">
          <a-button type="text" @click="emit('openFilter')">
            <FilterOutlined />
          </a-button>
        </a-badge>
      </template>
    </a-input-search>
    <div v-if="showAiMode && searchModeValue === 'semantic'" class="similarity-slider">
      <span>相似度阈值:</span>
      <a-slider
        v-model:value="similarityValue"
        :min="0"
        :max="1"
        :step="0.1"
        style="width: 200px; margin-left: 10px"
      />
      <span>{{ similarityValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons-vue'
import type { SearchMode } from '@/constants/search'

interface Props {
  modelValue?: string
  placeholder?: string
  searchMode?: SearchMode
  similarity?: number
  filterCount?: number
  showAiMode?: boolean
  showFilter?: boolean
  /** 可选：限制展示的搜索模式，默认全部 */
  modes?: SearchMode[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索图片...',
  searchMode: 'normal',
  similarity: 0.5,
  filterCount: 0,
  showAiMode: true,
  showFilter: true,
  modes: () => ['normal', 'semantic', 'image'] as SearchMode[],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:searchMode': [value: SearchMode]
  'update:similarity': [value: number]
  search: [value: string]
  openFilter: []
}>()

const searchValue = ref(props.modelValue)
const searchModeValue = ref<SearchMode>(props.searchMode)
const similarityValue = ref(props.similarity)

const ALL_MODE_OPTIONS = [
  { label: '普通', value: 'normal' },
  { label: '语义', value: 'semantic' },
  { label: '以图', value: 'image' },
] as const

const modeOptions = computed(() =>
  ALL_MODE_OPTIONS.filter((opt) => props.modes.includes(opt.value as SearchMode)),
)

const currentPlaceholder = computed(() => {
  if (searchModeValue.value === 'semantic') return '输入语义描述，如：雪中的宫殿'
  if (searchModeValue.value === 'image') return '以图搜图模式（从图片列表点击搜索按钮进入）'
  return props.placeholder
})

watch(
  () => props.modelValue,
  (val) => { searchValue.value = val },
)
watch(
  () => props.searchMode,
  (val) => { searchModeValue.value = val },
)
watch(
  () => props.similarity,
  (val) => { similarityValue.value = val },
)

watch(searchValue, (val) => { emit('update:modelValue', val) })
watch(searchModeValue, (val) => { emit('update:searchMode', val) })
watch(similarityValue, (val) => { emit('update:similarity', val) })

const handleSearch = (value: string) => {
  emit('search', value)
}
</script>

<style scoped>
.omni-search-bar {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

.omni-search-bar :deep(.ant-input-search-large .ant-input) {
  border-radius: 24px;
}

.omni-search-bar :deep(.ant-input-search-large .ant-input-search-button) {
  border-radius: 0 24px 24px 0;
}

.similarity-slider {
  display: flex;
  align-items: center;
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
</style>
