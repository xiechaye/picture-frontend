<template>
  <div class="glass-card" :style="cardStyle">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  padding?: string
  borderRadius?: string
  background?: string
}

const props = withDefaults(defineProps<Props>(), {
  padding: '24px',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.8)',
})

const cardStyle = computed(() => ({
  padding: props.padding,
  borderRadius: props.borderRadius,
  background: props.background,
}))
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
