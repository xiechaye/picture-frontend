<template>
  <a-button
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    class="gradient-button"
    :class="{ 'gradient-bg': gradient }"
    v-bind="$attrs"
  >
    <slot></slot>
  </a-button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
  size?: 'large' | 'middle' | 'small'
  loading?: boolean
  disabled?: boolean
  gradient?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'middle',
  loading: false,
  disabled: false,
  gradient: true,
})
</script>

<style scoped>
.gradient-button.gradient-bg {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border: none;
}

.gradient-button.gradient-bg:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
}

.gradient-button.gradient-bg:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}
</style>
