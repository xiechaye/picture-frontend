<template>
  <div class="omni-search-bar">
    <a-input-search
      v-model:value="searchValue"
      :placeholder="placeholder"
      size="large"
      allow-clear
      @search="handleSearch"
    >
      <template #prefix>
        <SearchOutlined />
      </template>
      <template #addonBefore v-if="showAiMode">
        <a-switch
          v-model:checked="aiModeValue"
          checked-children="AI"
          un-checked-children="普通"
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
    <div v-if="showAiMode && aiModeValue" class="similarity-slider">
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
import { ref, watch } from 'vue'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons-vue'

interface Props {
  modelValue?: string
  placeholder?: string
  aiMode?: boolean
  similarity?: number
  filterCount?: number
  showAiMode?: boolean
  showFilter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索图片...',
  aiMode: false,
  similarity: 0.5,
  filterCount: 0,
  showAiMode: true,
  showFilter: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:aiMode': [value: boolean]
  'update:similarity': [value: number]
  search: [value: string]
  openFilter: []
}>()

const searchValue = ref(props.modelValue)
const aiModeValue = ref(props.aiMode)
const similarityValue = ref(props.similarity)

watch(
  () => props.modelValue,
  (val) => {
    searchValue.value = val
  }
)

watch(
  () => props.aiMode,
  (val) => {
    aiModeValue.value = val
  }
)

watch(
  () => props.similarity,
  (val) => {
    similarityValue.value = val
  }
)

watch(searchValue, (val) => {
  emit('update:modelValue', val)
})

watch(aiModeValue, (val) => {
  emit('update:aiMode', val)
})

watch(similarityValue, (val) => {
  emit('update:similarity', val)
})

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
