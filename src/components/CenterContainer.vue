<template>
  <div
    class="center-container"
    :class="{ 'vertical-center': verticalCenter }"
    :style="{ maxWidth: maxWidth }"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  maxWidth?: string
  verticalCenter?: boolean
}

withDefaults(defineProps<Props>(), {
  maxWidth: '800px',
  verticalCenter: true,
})
</script>

<style scoped>
.center-container {
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}

.center-container.vertical-center {
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
