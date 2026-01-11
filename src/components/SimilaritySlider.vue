<template>
  <div class="similarity-slider">
    <span class="slider-label">{{ label }}</span>
    <a-slider
      :value="modelValue"
      :min="config.min"
      :max="config.max"
      :step="config.step"
      :style="{ width: sliderWidth, display: 'inline-block', margin: '0 12px' }"
      @change="onSliderChange"
      @afterChange="onAfterChange"
    />
    <a-tag :color="tagColor">{{ tagLabel }}</a-tag>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThrottleFn } from '@/composables/useDebounce'
import {
  SIMILARITY_THRESHOLD,
  getSimilarityLabel,
  getSimilarityTagColor,
  DEBOUNCE,
} from '@/constants/search'

interface Props {
  modelValue: number
  label?: string
  sliderWidth?: string
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '匹配程度：',
  sliderWidth: '180px',
})

const emit = defineEmits<Emits>()

// 配置
const config = {
  min: SIMILARITY_THRESHOLD.MIN,
  max: SIMILARITY_THRESHOLD.MAX,
  step: SIMILARITY_THRESHOLD.STEP,
}

// 计算属性
const tagLabel = computed(() => getSimilarityLabel(props.modelValue))
const tagColor = computed(() => getSimilarityTagColor(props.modelValue))

// 使用节流优化滑块拖动时的更新频率
const throttledEmit = useThrottleFn((value: number) => {
  emit('update:modelValue', value)
}, DEBOUNCE.SLIDER_CHANGE_DELAY)

// 滑块变化时使用节流
const onSliderChange = (value: number) => {
  throttledEmit(value)
}

// 滑块停止拖动时立即更新
const onAfterChange = (value: number) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.similarity-slider {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.slider-label {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}
</style>
